import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  AddMemberButton,
  LeavePropertyButton,
  TeamMemberList,
  type TeamMemberRow,
} from "@/components/team/team-members";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth/session";
import { canManageTeam } from "@/lib/properties/constants";
import { listMembers } from "@/lib/team/service";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const { user, activeProperty: property } = await requireWorkspace();
  const members = await listMembers(property.id);
  const canManage = canManageTeam(property.role);

  const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: property.timezone });
  const rows: TeamMemberRow[] = members.map((member) => ({
    userId: member.userId,
    name: [member.firstName, member.lastName].filter(Boolean).join(" ") || member.username || member.email,
    email: member.email,
    imageUrl: member.imageUrl,
    role: member.role,
    joinedLabel: dateFormat.format(member.joinedAt),
    isYou: member.userId === user.id,
  }));

  const ownerCount = rows.filter((row) => row.role === "owner").length;
  const isSoleOwner = property.role === "owner" && ownerCount === 1;

  return (
    <>
      <PageHeader
        title="Team"
        description={
          canManage
            ? `${rows.length} ${rows.length === 1 ? "member has" : "members have"} access to ${property.name}.`
            : `People with access to ${property.name}. Only owners can add or remove members.`
        }
        actions={canManage ? <AddMemberButton /> : undefined}
      />

      <TeamMemberList key={property.id} members={rows} canManage={canManage} />

      <Card>
        <CardHeader>
          <CardTitle>Leave property</CardTitle>
          <CardDescription>
            {isSoleOwner
              ? "You're the only owner, so you can't leave. Make another member an owner first, or delete the property in Settings."
              : `Remove your own access to ${property.name}.`}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <LeavePropertyButton propertyName={property.name} disabled={isSoleOwner} />
        </CardFooter>
      </Card>
    </>
  );
}
