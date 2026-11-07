"use client";

import { HandleSSOCallback, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { useFinishAuth } from "@/hooks/use-complete-auth";
import { AFTER_AUTH_URL, routes } from "@/lib/routes";

/** Completes the Google redirect, then syncs the user and enters the app. */
export function SsoCallback() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const finishAuth = useFinishAuth();

  const [destination, setDestination] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clerk calls navigateToApp just before activating the session, so wait
  // until we're actually signed in before calling our authenticated API.
  useEffect(() => {
    if (isSignedIn && destination) finishAuth(destination).then(setError);
  }, [isSignedIn, destination, finishAuth]);

  if (error) {
    return (
      <div className="grid gap-4">
        <FormError message={error} />
        <Link href={routes.dashboard} className="text-sm underline underline-offset-4">
          Continue to dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-center text-sm text-muted-foreground">Signing you in…</p>
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => setDestination(decorateUrl(AFTER_AUTH_URL))}
        navigateToSignIn={() => router.push(routes.signIn)}
        navigateToSignUp={() => router.push(routes.signUpContinue)}
      />
    </>
  );
}
