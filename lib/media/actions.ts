"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getWorkspace } from "@/lib/auth/session";
import { validationError, type FormState } from "@/lib/forms";
import { deleteImageKitFile, getImageKitFile } from "@/lib/imagekit/server";
import {
  canManageMedia,
  isAcceptedMediaType,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_SIZE_LABEL,
  mediaFolderForProperty,
} from "@/lib/media/constants";
import {
  createMediaAsset,
  deleteMediaAsset,
  getMediaAsset,
  isImageKitFileSaved,
} from "@/lib/media/service";
import { saveMediaSchema, type SaveMediaInput } from "@/lib/media/validation";
import { routes } from "@/lib/routes";

/** The user and property, if their role allows changing the media library. */
async function requireMediaEditor() {
  const { user, activeProperty } = await getWorkspace();
  if (!activeProperty) redirect(routes.onboarding);
  if (!canManageMedia(activeProperty.role)) return null;
  return { user, property: activeProperty };
}

function isInFolder(filePath: string | undefined, folder: string): filePath is string {
  return typeof filePath === "string" && filePath.startsWith(`${folder}/`);
}

/**
 * Removes a file the browser uploaded that we're not going to keep — but only
 * if it sits in this property's folder and no library entry points at it.
 */
async function discardUpload(fileId: string, folder: string): Promise<void> {
  try {
    const file = await getImageKitFile(fileId);
    if (!file || !isInFolder(file.filePath, folder)) return;
    if (await isImageKitFileSaved(fileId)) return;
    await deleteImageKitFile(fileId);
  } catch (error) {
    console.error("discardUpload failed", error);
  }
}

/**
 * Step 2 of an upload: the browser has sent the file to ImageKit and now asks
 * us to add it to the library. Nothing the browser says about the file is
 * trusted — we read it back from ImageKit and check where it landed, its type
 * and its size before saving.
 */
export async function saveUploadedMediaAction(input: SaveMediaInput): Promise<FormState> {
  const editor = await requireMediaEditor();
  if (!editor) return { status: "error", message: "Only owners and managers can upload media." };
  const { user, property } = editor;
  const folder = mediaFolderForProperty(property.id);

  const parsed = saveMediaSchema.safeParse(input);
  if (!parsed.success) {
    const fileId = typeof input?.fileId === "string" ? input.fileId.trim() : "";
    if (/^[A-Za-z0-9_-]{1,64}$/.test(fileId)) await discardUpload(fileId, folder);
    return validationError(parsed.error, {});
  }
  const { fileId, title, description } = parsed.data;

  try {
    const file = await getImageKitFile(fileId);
    if (!file) return { status: "error", message: "We couldn't find that upload. Please try again." };

    // Uploads signed for one property can't be claimed by another.
    if (!isInFolder(file.filePath, folder) || !file.url) {
      return { status: "error", message: "That upload doesn't belong to this property." };
    }

    const problem =
      file.fileType !== "image" || !file.mime || !isAcceptedMediaType(file.mime)
        ? "That file type isn't supported."
        : (file.size ?? Infinity) > MEDIA_MAX_BYTES
          ? `Images must be ${MEDIA_MAX_SIZE_LABEL} or smaller.`
          : null;
    if (problem) {
      await discardUpload(fileId, folder);
      return { status: "error", message: problem };
    }

    if (await isImageKitFileSaved(fileId)) {
      return { status: "error", message: "This image is already in your library." };
    }

    await createMediaAsset({
      propertyId: property.id,
      uploadedBy: user.id,
      title,
      description,
      imagekitFileId: fileId,
      filePath: file.filePath,
      url: file.url,
      fileName: file.name ?? file.filePath.split("/").pop() ?? "image",
      mimeType: file.mime!,
      sizeBytes: file.size ?? 0,
      width: file.width ?? null,
      height: file.height ?? null,
    });
  } catch (error) {
    console.error("saveUploadedMediaAction failed", error);
    await discardUpload(fileId, folder);
    return { status: "error", message: "We couldn't save your image. Please try again." };
  }

  refresh();
  return { status: "success", message: "Image added to your media library." };
}

/** Deletes the image from ImageKit first, then from the library. */
export async function deleteMediaAction(mediaId: string): Promise<FormState> {
  const editor = await requireMediaEditor();
  if (!editor) return { status: "error", message: "Only owners and managers can delete media." };

  if (typeof mediaId !== "string" || !/^[0-9a-f-]{36}$/i.test(mediaId)) {
    return { status: "error", message: "That image doesn't exist." };
  }

  try {
    const asset = await getMediaAsset(editor.property.id, mediaId);
    if (!asset) return { status: "error", message: "That image doesn't exist." };

    await deleteImageKitFile(asset.imagekitFileId);
    await deleteMediaAsset(editor.property.id, asset.id);
  } catch (error) {
    console.error("deleteMediaAction failed", error);
    return { status: "error", message: "We couldn't delete this image. Please try again." };
  }

  refresh();
  return { status: "success", message: "Image deleted." };
}
