import { auth } from "@clerk/nextjs/server";

import { getWorkspace } from "@/lib/auth/session";
import { createUploadAuthParams, getImageKitPublicConfig } from "@/lib/imagekit/server";
import { canManageMedia, mediaFolderForProperty, type MediaUploadAuth } from "@/lib/media/constants";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * GET /api/media/upload-auth
 * Signs a single direct-to-ImageKit upload into the active property's folder.
 * Call it right before each upload: the token is single-use and short-lived.
 */
export async function GET() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const { activeProperty } = await getWorkspace();
  if (!activeProperty || !canManageMedia(activeProperty.role)) {
    return Response.json(
      { error: "Only owners and managers can upload media." },
      { status: 403, headers: NO_STORE },
    );
  }

  try {
    const body: MediaUploadAuth = {
      ...createUploadAuthParams(),
      publicKey: getImageKitPublicConfig().publicKey,
      folder: mediaFolderForProperty(activeProperty.id),
    };
    return Response.json(body, { headers: NO_STORE });
  } catch (error) {
    console.error("upload-auth failed", error);
    return Response.json(
      { error: "Uploads aren't configured yet." },
      { status: 500, headers: NO_STORE },
    );
  }
}
