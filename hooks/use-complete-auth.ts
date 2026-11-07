"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { SetActiveNavigate } from "@clerk/nextjs/types";

import { syncUser } from "@/lib/api/users";
import { AFTER_AUTH_URL } from "@/lib/routes";

type Finalize = (params: { navigate: SetActiveNavigate }) => Promise<{ error: unknown }>;

/**
 * Runs once a Clerk session is active: saves the user to our database,
 * then navigates into the app. Returns an error message, or null on success.
 */
export function useFinishAuth() {
  const router = useRouter();

  return useCallback(
    async (destination: string = AFTER_AUTH_URL): Promise<string | null> => {
      try {
        await syncUser();
      } catch {
        return "You're signed in, but we couldn't save your profile. Please try again.";
      }

      // Decorated URLs (Safari ITP) can be absolute and need a full navigation.
      if (destination.startsWith("http")) {
        window.location.href = destination;
      } else {
        router.push(destination);
      }
      return null;
    },
    [router],
  );
}

/**
 * Finishes a password sign-in or sign-up: activates the Clerk session, then
 * syncs the user and navigates into the app.
 */
export function useCompleteAuth() {
  const finishAuth = useFinishAuth();

  return useCallback(
    async (finalize: Finalize): Promise<string | null> => {
      let destination: string = AFTER_AUTH_URL;

      // Capture the decorated URL and navigate ourselves once the session is active.
      const { error } = await finalize({
        navigate: ({ decorateUrl }) => {
          destination = decorateUrl(AFTER_AUTH_URL);
        },
      });
      if (error) return "We couldn't start your session. Please try again.";

      return finishAuth(destination);
    },
    [finishAuth],
  );
}
