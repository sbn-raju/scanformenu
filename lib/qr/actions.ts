"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getWorkspace } from "@/lib/auth/session";
import { formValues, validationError, type FormState } from "@/lib/forms";
import { canManageMenus } from "@/lib/menus/constants";
import { getMenu } from "@/lib/menus/service";
import { qrCodeSchema, uuidSchema } from "@/lib/menus/validation";
import { createQrCode, deleteQrCode } from "@/lib/qr/service";
import { routes } from "@/lib/routes";
import { getSiteUrl } from "@/lib/site-url";

async function requireQrEditor() {
  const { user, activeProperty } = await getWorkspace();
  if (!activeProperty) redirect(routes.onboarding);
  if (!canManageMenus(activeProperty.role)) return null;
  return { user, property: activeProperty };
}

export async function createQrCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireQrEditor();
  if (!editor) return { status: "error", message: "Only owners and managers can create QR codes.", values };

  const parsed = qrCodeSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);
  const { menuId, label, color } = parsed.data;

  try {
    if (!(await getMenu(editor.property.id, menuId))) {
      return { status: "error", fieldErrors: { menuId: ["Choose one of your menus"] }, values };
    }
    await createQrCode({
      propertyId: editor.property.id,
      menuId,
      createdBy: editor.user.id,
      label,
      color,
      siteUrl: await getSiteUrl(),
    });
  } catch (error) {
    console.error("createQrCodeAction failed", error);
    return { status: "error", message: "We couldn't generate the QR code. Please try again.", values };
  }

  refresh();
  return { status: "success", message: `QR code “${label}” created.` };
}

export async function deleteQrCodeAction(qrId: string): Promise<FormState> {
  const editor = await requireQrEditor();
  if (!editor) return { status: "error", message: "Only owners and managers can delete QR codes." };
  if (!uuidSchema.safeParse(qrId).success) return { status: "error", message: "That QR code doesn't exist." };

  try {
    if (!(await deleteQrCode(editor.property.id, qrId))) {
      return { status: "error", message: "That QR code doesn't exist." };
    }
  } catch (error) {
    console.error("deleteQrCodeAction failed", error);
    return { status: "error", message: "We couldn't delete the QR code. Please try again." };
  }

  refresh();
  return { status: "success", message: "QR code deleted. Printed copies will stop working." };
}
