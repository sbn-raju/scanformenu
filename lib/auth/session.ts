import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import type { User } from "@/lib/db/schema";
import { listPropertiesForUser, type PropertyWithRole } from "@/lib/properties/service";
import { routes } from "@/lib/routes";
import { getUserByClerkId, upsertUserFromClerk } from "@/lib/users/service";

/** Remembers which property the user is working in, when they have several. */
export const ACTIVE_PROPERTY_COOKIE = "active_property";

/** Tags the rendered workspace; actions that change it call `updateTag(WORKSPACE_TAG)`. */
export const WORKSPACE_TAG = "workspace";

/**
 * The signed-in user's database row. Redirects to sign-in when signed out,
 * and creates the row if the post-login sync never ran.
 */
export const getCurrentUser = cache(async (): Promise<User> => {
  // Clerk reads the clock while resolving the session, which Next.js forbids
  // during prerendering. Waiting for the request keeps all of this request-time.
  await connection();
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) redirect(routes.signIn);

  const existing = await getUserByClerkId(userId);
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) redirect(routes.signIn);
  return upsertUserFromClerk(clerkUser);
});

export type Workspace = {
  user: User;
  properties: PropertyWithRole[];
  activeProperty: PropertyWithRole | null;
};

/** The user, every property they belong to, and the one they're working in. */
export const getWorkspace = cache(async (): Promise<Workspace> => {
  const user = await getCurrentUser();
  const userProperties = await listPropertiesForUser(user.id);
  const activeId = (await cookies()).get(ACTIVE_PROPERTY_COOKIE)?.value;

  const activeProperty =
    userProperties.find((property) => property.id === activeId) ?? userProperties[0] ?? null;

  return { user, properties: userProperties, activeProperty };
});

/**
 * Like getWorkspace, but sends users without a property to onboarding.
 * For Server Components only; Server Actions and Route Handlers call
 * getWorkspace directly.
 *
 * Not wrapped in `use cache: private`: the session read calls `connection()`,
 * which Next.js prohibits inside cache scopes. The Redis cache behind
 * getWorkspace keeps this lookup fast instead.
 */
export async function requireWorkspace(): Promise<Workspace & { activeProperty: PropertyWithRole }> {
  const workspace = await getWorkspace();
  if (!workspace.activeProperty) redirect(routes.onboarding);
  return { ...workspace, activeProperty: workspace.activeProperty };
}
