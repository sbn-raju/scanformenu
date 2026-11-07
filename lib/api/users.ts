import type { User } from "@/lib/db/schema";

/** A user as returned over JSON (dates become ISO strings). */
export type ApiUser = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body.error ?? `Request failed with status ${response.status}`, response.status);
  }

  return body as T;
}

/** Saves the signed-in Clerk user to the database. */
export async function syncUser(): Promise<ApiUser> {
  const { user } = await request<{ user: ApiUser }>("/api/users/sync", { method: "POST" });
  return user;
}

/** Fetches the signed-in user's database record. */
export async function getCurrentUser(): Promise<ApiUser> {
  const { user } = await request<{ user: ApiUser }>("/api/users/me");
  return user;
}
