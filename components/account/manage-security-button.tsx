"use client";

import { useClerk } from "@clerk/nextjs";
import { ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Opens Clerk's account modal: email addresses, password, connected accounts, sessions. */
export function ManageSecurityButton() {
  const { openUserProfile } = useClerk();

  return (
    <Button variant="outline" onClick={() => openUserProfile()}>
      <ShieldCheckIcon data-icon="inline-start" />
      Manage sign-in & security
    </Button>
  );
}
