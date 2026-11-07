import { auth } from "@clerk/nextjs/server";

import { getUserByClerkId } from "@/lib/users/service";

/**
 * GET /api/users/me
 * Returns the signed-in user's database record.
 */
export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    return Response.json({ error: "User not found. Call POST /api/users/sync first." }, { status: 404 });
  }

  return Response.json({ user });
}
