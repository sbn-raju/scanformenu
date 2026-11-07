import type { Metadata } from "next";

import { ManageSecurityButton } from "@/components/account/manage-security-button";
import { ProfileForm } from "@/components/account/profile-form";
import { UserAvatar } from "@/components/account/user-avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { PROPERTY_TYPE_ICONS } from "@/components/property/property-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireWorkspace } from "@/lib/auth/session";
import { MEMBER_ROLE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/properties/constants";

export const metadata: Metadata = { title: "Account" };

const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

export default async function AccountPage() {
  const { user, properties, activeProperty } = await requireWorkspace();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.email;

  return (
    <>
      <PageHeader title="Account" description="Your personal details and sign-in settings." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear across ScanForMenu.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={{ name, email: user.email, imageUrl: user.imageUrl }} className="size-16" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-medium">{name}</span>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
          <Separator />
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate">{user.email}</dd>
            <dt className="text-muted-foreground">Username</dt>
            <dd>{user.username ? `@${user.username}` : "—"}</dd>
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{user.createdAt.toLocaleDateString(undefined, dateFormat)}</dd>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{user.updatedAt.toLocaleDateString(undefined, dateFormat)}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Update the name shown on your account.</CardDescription>
        </CardHeader>
        <ProfileForm firstName={user.firstName} lastName={user.lastName} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-in & security</CardTitle>
          <CardDescription>
            Change your email or password, connect Google, and sign out of other devices.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <ManageSecurityButton />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your properties</CardTitle>
          <CardDescription>Properties you belong to and your role in each.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {properties.map((property) => {
              const Icon = PROPERTY_TYPE_ICONS[property.type];
              return (
                <li key={property.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{property.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {PROPERTY_TYPE_LABELS[property.type]} · {property.city}, {property.country}
                    </span>
                  </div>
                  {property.id === activeProperty.id && <Badge variant="secondary">Current</Badge>}
                  <Badge variant="outline">{MEMBER_ROLE_LABELS[property.role]}</Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
