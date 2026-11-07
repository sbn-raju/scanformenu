import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";

export type NotificationPreferences = {
  emailProductUpdates: boolean;
  emailWeeklySummary: boolean;
  emailSecurityAlerts: boolean;
};

export type NotificationPreferenceKey = keyof NotificationPreferences;

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailProductUpdates: true,
  emailWeeklySummary: true,
  emailSecurityAlerts: true,
};

export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const [row] = await db
    .select({
      emailProductUpdates: userPreferences.emailProductUpdates,
      emailWeeklySummary: userPreferences.emailWeeklySummary,
      emailSecurityAlerts: userPreferences.emailSecurityAlerts,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return row ?? DEFAULT_PREFERENCES;
}

export async function setPreference(
  userId: string,
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<void> {
  await db
    .insert(userPreferences)
    .values({ userId, [key]: value })
    .onConflictDoUpdate({ target: userPreferences.userId, set: { [key]: value, updatedAt: new Date() } });
}
