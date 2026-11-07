"use server";

import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { ACTIVE_PROPERTY_COOKIE, getCurrentUser, getWorkspace, WORKSPACE_TAG } from "@/lib/auth/session";
import type { MemberRole } from "@/lib/db/schema";
import { formValues, validationError, type FormState } from "@/lib/forms";
import { deleteImageKitFolder } from "@/lib/imagekit/server";
import { mediaFolderForProperty } from "@/lib/media/constants";
import {
  createPropertyForOwner,
  deleteProperty,
  getMemberRole,
  updatePropertyDetails,
} from "@/lib/properties/service";
import {
  createPropertySchema,
  propertyDetailsSchema,
  regionalSettingsSchema,
} from "@/lib/properties/validation";
import { routes } from "@/lib/routes";

const EDITOR_ROLES: readonly MemberRole[] = ["owner", "manager"];

async function setActivePropertyCookie(propertyId: string) {
  (await cookies()).set(ACTIVE_PROPERTY_COOKIE, propertyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** The property the user is working in, if their role allows the change. */
async function requireActivePropertyRole(roles: readonly MemberRole[]) {
  const { activeProperty } = await getWorkspace();
  if (!activeProperty) redirect(routes.onboarding);
  if (!roles.includes(activeProperty.role)) return null;
  return activeProperty;
}

export async function createPropertyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const values = formValues(formData);

  const parsed = createPropertySchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  let propertyId: string;
  try {
    ({ id: propertyId } = await createPropertyForOwner(user.id, parsed.data));
  } catch (error) {
    console.error("createPropertyAction failed", error);
    return { status: "error", message: "We couldn't create your property. Please try again.", values };
  }

  await setActivePropertyCookie(propertyId);
  updateTag(WORKSPACE_TAG);
  redirect(routes.dashboard);
}

export async function updatePropertyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const property = await requireActivePropertyRole(EDITOR_ROLES);
  if (!property) {
    return { status: "error", message: "Only owners and managers can edit this property.", values };
  }

  const parsed = propertyDetailsSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    await updatePropertyDetails(property.id, parsed.data);
  } catch (error) {
    console.error("updatePropertyAction failed", error);
    return { status: "error", message: "We couldn't save your changes. Please try again.", values };
  }

  updateTag(WORKSPACE_TAG);
  refresh();
  return { status: "success", message: "Property details saved.", values };
}

export async function updateRegionalSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const property = await requireActivePropertyRole(EDITOR_ROLES);
  if (!property) {
    return { status: "error", message: "Only owners and managers can change these settings.", values };
  }

  const parsed = regionalSettingsSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    await updatePropertyDetails(property.id, parsed.data);
  } catch (error) {
    console.error("updateRegionalSettingsAction failed", error);
    return { status: "error", message: "We couldn't save your settings. Please try again.", values };
  }

  updateTag(WORKSPACE_TAG);
  refresh();
  return { status: "success", message: "Regional settings saved.", values };
}

export async function deletePropertyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const property = await requireActivePropertyRole(["owner"]);
  if (!property) return { status: "error", message: "Only the owner can delete this property." };

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== property.name) {
    return {
      status: "error",
      fieldErrors: { confirmation: [`Type "${property.name}" exactly to confirm.`] },
    };
  }

  try {
    await deleteProperty(property.id);
  } catch (error) {
    console.error("deletePropertyAction failed", error);
    return { status: "error", message: "We couldn't delete this property. Please try again." };
  }

  // Media rows went with the property (ON DELETE CASCADE); remove the files from
  // ImageKit too, after the response so a slow API call doesn't hold up the redirect.
  after(async () => {
    try {
      await deleteImageKitFolder(mediaFolderForProperty(property.id));
    } catch (error) {
      console.error("Failed to delete ImageKit folder for property", property.id, error);
    }
  });

  (await cookies()).delete(ACTIVE_PROPERTY_COOKIE);
  updateTag(WORKSPACE_TAG);
  // The dashboard falls back to another property, or onboarding if none are left.
  redirect(routes.dashboard);
}

/** Switches the property the dashboard shows. Re-renders the current page. */
export async function switchPropertyAction(propertyId: string): Promise<void> {
  const user = await getCurrentUser();
  const role = await getMemberRole(user.id, propertyId);
  if (!role) throw new Error("You don't have access to that property.");

  await setActivePropertyCookie(propertyId);
  updateTag(WORKSPACE_TAG);
}
