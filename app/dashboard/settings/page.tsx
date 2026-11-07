import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { DeletePropertyDialog } from "@/components/settings/delete-property-dialog";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { RegionalSettingsForm } from "@/components/settings/regional-settings-form";
import { ThemeSettings } from "@/components/settings/theme-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireWorkspace } from "@/lib/auth/session";
import { getPreferences } from "@/lib/users/preferences";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, activeProperty: property } = await requireWorkspace();
  const preferences = await getPreferences(user.id);
  const canEdit = property.role === "owner" || property.role === "manager";
  const isOwner = property.role === "owner";

  return (
    <>
      <PageHeader title="Settings" description="Manage your preferences and property settings." />

      <Tabs defaultValue="general" className="gap-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isOwner && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how the dashboard looks on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSettings />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional</CardTitle>
              <CardDescription>
                Currency and time zone for {property.name}.
                {!canEdit && " Only owners and managers can change these."}
              </CardDescription>
            </CardHeader>
            <RegionalSettingsForm
              key={property.id}
              currency={property.currency}
              timezone={property.timezone}
              disabled={!canEdit}
            />
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Email notifications</CardTitle>
              <CardDescription>Sent to {user.email}.</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Delete property</CardTitle>
                <CardDescription>
                  Permanently delete {property.name}, its menus and QR codes, and remove all members.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <DeletePropertyDialog propertyName={property.name} />
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
