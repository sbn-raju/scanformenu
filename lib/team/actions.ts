"use server";

import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACTIVE_PROPERTY_COOKIE, getWorkspace, WORKSPACE_TAG } from "@/lib/auth/session";
import { formValues, validationError, type FormState } from "@/lib/forms";
import { canManageTeam, MEMBER_ROLE_LABELS } from "@/lib/properties/constants";
import { routes } from "@/lib/routes";
import { addMemberByEmail, removeMember, updateMemberRole } from "@/lib/team/service";
import { addMemberSchema, changeMemberRoleSchema } from "@/lib/team/validation";

const LAST_OWNER_MESSAGE =
  "A property needs at least one owner. Make another member an owner first.";

/** The signed-in owner and their active property, or null for other roles. */
async function requireTeamManager() {
  const { user, activeProperty } = await getWorkspace();
  if (!activeProperty) redirect(routes.onboarding);
  if (!canManageTeam(activeProperty.role)) return null;
  return { user, property: activeProperty };
}

export async function addMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const manager = await requireTeamManager();
  if (!manager) return { status: "error", message: "Only owners can add team members.", values };

  const parsed = addMemberSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);
  const { email, role } = parsed.data;

  try {
    const result = await addMemberByEmail(manager.property.id, email, role);
    if (result.status === "no_account") {
      return {
        status: "error",
        fieldErrors: {
          email: ["No ScanForMenu account uses this email. Ask them to sign up first, then add them."],
        },
        values,
      };
    }
    if (result.status === "already_member") {
      return {
        status: "error",
        fieldErrors: { email: ["This person is already a member. Change their role from the list instead."] },
        values,
      };
    }
  } catch (error) {
    console.error("addMemberAction failed", error);
    return { status: "error", message: "We couldn't add this member. Please try again.", values };
  }

  refresh();
  return { status: "success", message: `${email} added as ${MEMBER_ROLE_LABELS[role].toLowerCase()}.` };
}

export async function changeMemberRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const manager = await requireTeamManager();
  if (!manager) return { status: "error", message: "Only owners can change roles.", values };

  const parsed = changeMemberRoleSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);
  const { userId, role } = parsed.data;

  // Owners can't demote themselves here by accident; another owner has to do it.
  if (userId === manager.user.id) {
    return { status: "error", message: "You can't change your own role. Ask another owner.", values };
  }

  try {
    const result = await updateMemberRole(manager.property.id, userId, role);
    if (result === "not_found") return { status: "error", message: "That member has left the property.", values };
    if (result === "last_owner") return { status: "error", message: LAST_OWNER_MESSAGE, values };
  } catch (error) {
    console.error("changeMemberRoleAction failed", error);
    return { status: "error", message: "We couldn't change the role. Please try again.", values };
  }

  refresh();
  return { status: "success", message: `Role changed to ${MEMBER_ROLE_LABELS[role].toLowerCase()}.` };
}

export async function removeMemberAction(userId: string): Promise<FormState> {
  const manager = await requireTeamManager();
  if (!manager) return { status: "error", message: "Only owners can remove team members." };
  if (!changeMemberRoleSchema.shape.userId.safeParse(userId).success) {
    return { status: "error", message: "That member doesn't exist." };
  }
  if (userId === manager.user.id) {
    return { status: "error", message: "To remove yourself, use Leave property." };
  }

  try {
    const result = await removeMember(manager.property.id, userId);
    if (result === "not_found") return { status: "error", message: "That member has already left." };
    if (result === "last_owner") return { status: "error", message: LAST_OWNER_MESSAGE };
  } catch (error) {
    console.error("removeMemberAction failed", error);
    return { status: "error", message: "We couldn't remove this member. Please try again." };
  }

  refresh();
  return { status: "success", message: "Member removed. They no longer have access." };
}

/** Any member can leave a property, except its last owner. */
export async function leavePropertyAction(): Promise<FormState> {
  const { user, activeProperty } = await getWorkspace();
  if (!activeProperty) redirect(routes.onboarding);

  try {
    const result = await removeMember(activeProperty.id, user.id);
    if (result === "last_owner") {
      return {
        status: "error",
        message: "You're the only owner. Make another member an owner first, or delete the property.",
      };
    }
  } catch (error) {
    console.error("leavePropertyAction failed", error);
    return { status: "error", message: "We couldn't remove you from this property. Please try again." };
  }

  (await cookies()).delete(ACTIVE_PROPERTY_COOKIE);
  updateTag(WORKSPACE_TAG);
  // The dashboard falls back to another property, or onboarding if none are left.
  redirect(routes.dashboard);
}
