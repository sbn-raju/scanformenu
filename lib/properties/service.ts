import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { cached, cacheKeys, invalidate, TTL } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  menus,
  properties,
  propertyMembers,
  qrCodes,
  type MemberRole,
  type Property,
} from "@/lib/db/schema";
import { invalidatePropertyMenus } from "@/lib/menus/service";
import type {
  CreatePropertyInput,
  PropertyDetailsInput,
  RegionalSettingsInput,
} from "@/lib/properties/validation";

export type PropertyWithRole = Property & { role: MemberRole };

const UNIQUE_VIOLATION = "23505";

function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "property"}-${suffix}`;
}

function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string } })?.cause ?? error;
  return (cause as { code?: string })?.code === UNIQUE_VIOLATION;
}

/** All properties the user belongs to, oldest first. Read on every dashboard request. */
export async function listPropertiesForUser(userId: string): Promise<PropertyWithRole[]> {
  return cached(cacheKeys.userProperties(userId), { ttl: TTL.hour }, async () => {
    const rows = await db
      .select({ property: properties, role: propertyMembers.role })
      .from(propertyMembers)
      .innerJoin(properties, eq(properties.id, propertyMembers.propertyId))
      .where(eq(propertyMembers.userId, userId))
      .orderBy(asc(properties.createdAt));

    return rows.map(({ property, role }) => ({ ...property, role }));
  });
}

async function memberIds(propertyId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: propertyMembers.userId })
    .from(propertyMembers)
    .where(eq(propertyMembers.propertyId, propertyId));
  return rows.map((row) => row.userId);
}

/** Every member's cached property list includes this property. */
async function invalidateMembers(userIds: string[]): Promise<void> {
  await invalidate(...userIds.map((userId) => cacheKeys.userProperties(userId)));
}

export async function getMemberRole(userId: string, propertyId: string): Promise<MemberRole | null> {
  const [row] = await db
    .select({ role: propertyMembers.role })
    .from(propertyMembers)
    .where(and(eq(propertyMembers.userId, userId), eq(propertyMembers.propertyId, propertyId)))
    .limit(1);
  return row?.role ?? null;
}

/** Creates the property and makes the user its owner, atomically. */
export async function createPropertyForOwner(
  userId: string,
  input: CreatePropertyInput,
): Promise<Property> {
  // The random slug suffix makes collisions very unlikely; retry just in case.
  for (let attempt = 0; ; attempt++) {
    try {
      const created = await db.transaction(async (tx) => {
        const [property] = await tx
          .insert(properties)
          .values({ ...input, slug: slugify(input.name) })
          .returning();

        await tx.insert(propertyMembers).values({ propertyId: property.id, userId, role: "owner" });
        return property;
      });
      await invalidateMembers([userId]);
      return created;
    } catch (error) {
      if (attempt < 2 && isUniqueViolation(error)) continue;
      throw error;
    }
  }
}

export async function updatePropertyDetails(
  propertyId: string,
  input: PropertyDetailsInput | RegionalSettingsInput,
): Promise<void> {
  await db.update(properties).set(input).where(eq(properties.id, propertyId));
  // Guest menus show the property's name, contact details and currency.
  await Promise.all([invalidateMembers(await memberIds(propertyId)), invalidatePropertyMenus(propertyId)]);
}

export async function deleteProperty(propertyId: string): Promise<void> {
  // Memberships, menus and QR codes go with it (ON DELETE CASCADE), so collect
  // what to evict first.
  const [members, menuRows, codeRows] = await Promise.all([
    memberIds(propertyId),
    db.select({ id: menus.id, slug: menus.slug }).from(menus).where(eq(menus.propertyId, propertyId)),
    db.select({ code: qrCodes.code }).from(qrCodes).where(eq(qrCodes.propertyId, propertyId)),
  ]);

  await db.delete(properties).where(eq(properties.id, propertyId));

  await Promise.all([
    invalidateMembers(members),
    invalidate(
      cacheKeys.menuList(propertyId),
      cacheKeys.mediaList(propertyId),
      ...menuRows.flatMap((row) => [cacheKeys.menuTree(row.id), cacheKeys.publicMenu(row.slug)]),
      ...codeRows.map((row) => cacheKeys.qrTarget(row.code)),
    ),
  ]);
}
