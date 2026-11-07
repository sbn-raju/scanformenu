import "server-only";

import type { User as ClerkUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { cached, cacheKeys, prime, TTL } from "@/lib/cache";
import { db } from "@/lib/db";
import { users, type NewUser, type User } from "@/lib/db/schema";

function toUserRecord(clerkUser: ClerkUser): NewUser {
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${clerkUser.id} has no email address.`);
  }

  return {
    clerkId: clerkUser.id,
    email,
    username: clerkUser.username,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  };
}

/** Insert the Clerk user, or refresh their profile fields if they already exist. */
export async function upsertUserFromClerk(clerkUser: ClerkUser): Promise<User> {
  const record = toUserRecord(clerkUser);

  const [user] = await db
    .insert(users)
    .values(record)
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: record.email,
        username: record.username,
        firstName: record.firstName,
        lastName: record.lastName,
        imageUrl: record.imageUrl,
        updatedAt: new Date(),
      },
    })
    .returning();

  await prime(cacheKeys.user(user.clerkId), user, TTL.hour);
  return user;
}

/**
 * Looked up on every signed-in request, so it's cached. Upserts refresh the
 * entry; a missing user isn't cached, since the sync creates them moments later.
 */
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  return cached(cacheKeys.user(clerkId), { ttl: TTL.hour }, async () => {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    return user ?? null;
  });
}
