"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOutIcon, SettingsIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

import { UserAvatar, type SessionUser } from "@/components/account/user-avatar";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { routes } from "@/lib/routes";

/** Name + email block used in menu triggers and labels. */
export function UserIdentity({ user }: { user: SessionUser }) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium text-foreground">{user.name}</span>
      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
    </div>
  );
}

/** Items shared by the sidebar footer menu and the header avatar menu. */
export function UserMenuItems({ user }: { user: SessionUser }) {
  const { signOut } = useClerk();

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="flex items-center gap-2 py-1.5">
          <UserAvatar user={user} className="size-8 rounded-lg" />
          <UserIdentity user={user} />
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link href={routes.account} />}>
          <UserRoundIcon />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={routes.settings} />}>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: routes.signIn })}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}
