"use client";

import { useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <Button variant="outline" onClick={() => signOut({ redirectUrl: routes.signIn })}>
      Sign out
    </Button>
  );
}
