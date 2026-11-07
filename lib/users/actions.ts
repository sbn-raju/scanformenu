"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";

import { getCurrentUser, WORKSPACE_TAG } from "@/lib/auth/session";
import { formValues, validationError, type FormState } from "@/lib/forms";
import { setPreference, type NotificationPreferenceKey } from "@/lib/users/preferences";
import { upsertUserFromClerk } from "@/lib/users/service";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, { error: "First name is required" }).max(64),
  lastName: z
    .string()
    .trim()
    .max(64)
    .transform((value) => value || null),
});

/** Updates the name in Clerk (the source of truth), then mirrors it to our users table. */
export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const values = formValues(formData);

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.updateUser(user.clerkId, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName ?? "",
    });
    await upsertUserFromClerk(clerkUser);
  } catch (error) {
    if (isClerkAPIResponseError(error)) {
      return { status: "error", message: error.errors[0]?.longMessage ?? error.message, values };
    }
    console.error("updateProfileAction failed", error);
    return { status: "error", message: "We couldn't update your profile. Please try again.", values };
  }

  updateTag(WORKSPACE_TAG);
  refresh();
  return { status: "success", message: "Profile updated.", values };
}

const PREFERENCE_KEYS: readonly NotificationPreferenceKey[] = [
  "emailProductUpdates",
  "emailWeeklySummary",
  "emailSecurityAlerts",
];

export async function updatePreferenceAction(
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<{ ok: boolean }> {
  if (!PREFERENCE_KEYS.includes(key) || typeof value !== "boolean") return { ok: false };

  const user = await getCurrentUser();
  try {
    await setPreference(user.id, key, value);
    return { ok: true };
  } catch (error) {
    console.error("updatePreferenceAction failed", error);
    return { ok: false };
  }
}
