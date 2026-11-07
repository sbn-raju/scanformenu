import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { cacheKeys, invalidate } from "@/lib/cache";
import { db } from "@/lib/db";
import { propertyMembers, users, type MemberRole } from "@/lib/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TeamMember = {
  userId: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: MemberRole;
  joinedAt: Date;
};

/** Everyone with access to the property: owners first, then managers, then staff. */
export async function listMembers(propertyId: string): Promise<TeamMember[]> {
  return db
    .select({
      userId: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      imageUrl: users.imageUrl,
      role: propertyMembers.role,
      joinedAt: propertyMembers.createdAt,
    })
    .from(propertyMembers)
    .innerJoin(users, eq(users.id, propertyMembers.userId))
    .where(eq(propertyMembers.propertyId, propertyId))
    .orderBy(
      sql`case ${propertyMembers.role} when 'owner' then 0 when 'manager' then 1 else 2 end`,
      asc(propertyMembers.createdAt),
    );
}

export type AddMemberResult =
  | { status: "added"; userId: string }
  | { status: "no_account" }
  | { status: "already_member" };

/** Adds an existing ScanForMenu user to the property. `email` must be lowercased. */
export async function addMemberByEmail(
  propertyId: string,
  email: string,
  role: MemberRole,
): Promise<AddMemberResult> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (!user) return { status: "no_account" };

  const inserted = await db
    .insert(propertyMembers)
    .values({ propertyId, userId: user.id, role })
    .onConflictDoNothing()
    .returning({ userId: propertyMembers.userId });
  if (inserted.length === 0) return { status: "already_member" };

  // Their cached property list (and the roles in it) is now out of date.
  await invalidate(cacheKeys.userProperties(user.id));
  return { status: "added", userId: user.id };
}

export type MemberChangeResult = "ok" | "not_found" | "last_owner";

/**
 * Locks the property's owner rows for the rest of the transaction, so two
 * owners demoting or removing each other at the same time can't leave the
 * property with none.
 */
async function lockOwners(tx: Tx, propertyId: string): Promise<string[]> {
  const rows = await tx
    .select({ userId: propertyMembers.userId })
    .from(propertyMembers)
    .where(and(eq(propertyMembers.propertyId, propertyId), eq(propertyMembers.role, "owner")))
    .for("update");
  return rows.map((row) => row.userId);
}

function memberWhere(propertyId: string, userId: string) {
  return and(eq(propertyMembers.propertyId, propertyId), eq(propertyMembers.userId, userId));
}

export async function updateMemberRole(
  propertyId: string,
  userId: string,
  role: MemberRole,
): Promise<MemberChangeResult> {
  const result = await db.transaction(async (tx): Promise<MemberChangeResult> => {
    const owners = await lockOwners(tx, propertyId);
    if (role !== "owner" && owners.length === 1 && owners[0] === userId) return "last_owner";

    const updated = await tx
      .update(propertyMembers)
      .set({ role })
      .where(memberWhere(propertyId, userId))
      .returning({ userId: propertyMembers.userId });
    return updated.length > 0 ? "ok" : "not_found";
  });

  if (result === "ok") await invalidate(cacheKeys.userProperties(userId));
  return result;
}

/** Removes a member, or lets a member leave. The last owner can't be removed. */
export async function removeMember(propertyId: string, userId: string): Promise<MemberChangeResult> {
  const result = await db.transaction(async (tx): Promise<MemberChangeResult> => {
    const owners = await lockOwners(tx, propertyId);
    if (owners.length === 1 && owners[0] === userId) return "last_owner";

    const deleted = await tx
      .delete(propertyMembers)
      .where(memberWhere(propertyId, userId))
      .returning({ userId: propertyMembers.userId });
    return deleted.length > 0 ? "ok" : "not_found";
  });

  if (result === "ok") await invalidate(cacheKeys.userProperties(userId));
  return result;
}
