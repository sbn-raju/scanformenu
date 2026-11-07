import { auth, currentUser } from "@clerk/nextjs/server";

import { upsertUserFromClerk } from "@/lib/users/service";

/**
 * POST /api/users/sync
 * Saves the signed-in Clerk user to the database (create or update).
 * Called by the sign-in and sign-up screens once the session is active.
 */
export async function POST() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await upsertUserFromClerk(clerkUser);
  return Response.json({ user });
}
