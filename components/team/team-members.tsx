"use client";

import { EllipsisVerticalIcon, LogOutIcon, UserCogIcon, UserMinusIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";

import { UserAvatar } from "@/components/account/user-avatar";
import { SelectField, TextField } from "@/components/forms/fields";
import { ConfirmDialog } from "@/components/menus/confirm-dialog";
import { FormDialog } from "@/components/menus/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MEMBER_ROLE_DESCRIPTIONS,
  MEMBER_ROLE_LABELS,
  MEMBER_ROLES,
  type MemberRole,
} from "@/lib/properties/constants";
import { addMemberAction, changeMemberRoleAction, leavePropertyAction, removeMemberAction } from "@/lib/team/actions";

export type TeamMemberRow = {
  userId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: MemberRole;
  joinedLabel: string;
  isYou: boolean;
};

const roleOptions = MEMBER_ROLES.map((role) => ({ value: role, label: MEMBER_ROLE_LABELS[role] }));

function RoleHelp() {
  return (
    <dl className="grid gap-1.5 rounded-lg bg-muted/50 p-3 text-xs">
      {MEMBER_ROLES.map((role) => (
        <div key={role} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="shrink-0 font-medium sm:w-16">{MEMBER_ROLE_LABELS[role]}</dt>
          <dd className="text-muted-foreground">{MEMBER_ROLE_DESCRIPTIONS[role]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AddMemberButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlusIcon data-icon="inline-start" />
        Add member
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Add a team member"
        description="They need a ScanForMenu account first. Ask them to sign up, then add them with the email they used."
        action={addMemberAction}
        submitLabel="Add member"
      >
        {({ errors, value }) => (
          <>
            <TextField
              name="email"
              label="Email"
              type="email"
              placeholder="name@example.com"
              autoComplete="off"
              defaultValue={value("email")}
              errors={errors.email}
              autoFocus
            />
            <SelectField
              name="role"
              label="Role"
              options={roleOptions}
              defaultValue={value("role", "manager")}
              errors={errors.role}
            />
            <RoleHelp />
          </>
        )}
      </FormDialog>
    </>
  );
}

function MemberRow({
  member,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: TeamMemberRow;
  canManage: boolean;
  onChangeRole: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <UserAvatar user={member} className="size-9" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{member.name}</span>
          {member.isYou && <Badge variant="outline">You</Badge>}
        </div>
        <span className="truncate text-sm text-muted-foreground">{member.email}</span>
      </div>
      <div className="hidden flex-col items-end gap-0.5 text-xs text-muted-foreground sm:flex">
        <span>Joined {member.joinedLabel}</span>
      </div>
      <Badge variant={member.role === "owner" ? "default" : "secondary"}>{MEMBER_ROLE_LABELS[member.role]}</Badge>
      {canManage && !member.isYou ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`} />}
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onChangeRole}>
                <UserCogIcon />
                Change role
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                <UserMinusIcon />
                Remove from team
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        canManage && <span className="size-7" aria-hidden />
      )}
    </li>
  );
}

export function TeamMemberList({ members, canManage }: { members: TeamMemberRow[]; canManage: boolean }) {
  const [editing, setEditing] = useState<TeamMemberRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMemberRow | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <>
      <ul className="divide-y rounded-xl border bg-card">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            canManage={canManage}
            onChangeRole={() => {
              setEditing(member);
              setEditOpen(true);
            }}
            onRemove={() => {
              setRemoving(member);
              setRemoveOpen(true);
            }}
          />
        ))}
      </ul>

      {editing && (
        <FormDialog
          key={editing.userId}
          open={editOpen}
          onOpenChange={setEditOpen}
          title={`Change ${editing.name}'s role`}
          description="The change applies the next time they open the dashboard."
          action={changeMemberRoleAction}
          submitLabel="Save role"
          hidden={{ userId: editing.userId }}
        >
          {({ errors, value }) => (
            <>
              <SelectField
                name="role"
                label="Role"
                options={roleOptions}
                defaultValue={value("role", editing.role)}
                errors={errors.role}
              />
              <RoleHelp />
            </>
          )}
        </FormDialog>
      )}

      {removing && (
        <ConfirmDialog
          open={removeOpen}
          onOpenChange={setRemoveOpen}
          title={`Remove ${removing.name}?`}
          description="They'll lose access to this property right away. Their account and anything they created stay in place."
          confirmLabel="Remove"
          onConfirm={() => removeMemberAction(removing.userId)}
        />
      )}
    </>
  );
}

export function LeavePropertyButton({ propertyName, disabled }: { propertyName: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={disabled}>
        <LogOutIcon data-icon="inline-start" />
        Leave property
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Leave ${propertyName}?`}
        description="You'll lose access to this property. An owner can add you back later."
        confirmLabel="Leave"
        onConfirm={leavePropertyAction}
      />
    </>
  );
}
