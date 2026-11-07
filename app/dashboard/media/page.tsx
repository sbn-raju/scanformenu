import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { MediaLibrary, type MediaItem } from "@/components/media/media-library";
import { UploadMediaDialog } from "@/components/media/upload-media-dialog";
import { requireWorkspace } from "@/lib/auth/session";
import { getImageKitPublicConfig } from "@/lib/imagekit/server";
import { canManageMedia } from "@/lib/media/constants";
import { listMediaForProperty } from "@/lib/media/service";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  const { activeProperty: property } = await requireWorkspace();
  const canEdit = canManageMedia(property.role);
  const assets = await listMediaForProperty(property.id);
  const { urlEndpoint } = getImageKitPublicConfig();

  // Format on the server in the property's time zone, so it matches on every device.
  const dateFormat = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: property.timezone,
  });

  const items: MediaItem[] = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    description: asset.description,
    filePath: asset.filePath,
    url: asset.url,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    uploadedAt: asset.uploadedAt.toISOString(),
    uploadedAtLabel: dateFormat.format(asset.uploadedAt),
    uploaderName: asset.uploader?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Media library"
        description={
          items.length > 0
            ? `${items.length} ${items.length === 1 ? "image" : "images"} for ${property.name}.`
            : `Images for ${property.name}'s menus and pages.`
        }
        actions={canEdit && items.length > 0 ? <UploadMediaDialog /> : undefined}
      />
      {/* key: reset the open image when switching property */}
      <MediaLibrary key={property.id} items={items} urlEndpoint={urlEndpoint} canEdit={canEdit} />
    </>
  );
}
