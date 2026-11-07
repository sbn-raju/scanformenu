"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AFTER_AUTH_URL, routes } from "@/lib/routes";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}

/**
 * Starts the Google OAuth flow. Works for both new and existing users:
 * Clerk turns the sign-in into a sign-up when the account doesn't exist yet.
 */
export function GoogleButton() {
  const { signIn } = useSignIn();
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleClick() {
    setIsRedirecting(true);
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: routes.ssoCallback,
      redirectUrl: AFTER_AUTH_URL,
    });
    if (error) setIsRedirecting(false);
  }

  return (
    <Button type="button" variant="outline" size="lg" onClick={handleClick} disabled={isRedirecting}>
      <GoogleIcon />
      {isRedirecting ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
