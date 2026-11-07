import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { cached, cacheKeys, invalidate, TTL } from "@/lib/cache";
import { db } from "@/lib/db";
import { mediaAssets, users, type MediaAsset, type NewMediaAsset } from "@/lib/db/schema";
import { invalidatePropertyMenus } from "@/lib/menus/service";

export type MediaAssetWithUploader = MediaAsset & {
  uploader: { name: string; email: string } | null;
};

function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string;
}): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.email;
}

/** Every image in the property's library, newest first, with who uploaded it. */
export async function listMediaForProperty(propertyId: string): Promise<MediaAssetWithUploader[]> {
  return cached(cacheKeys.mediaList(propertyId), { ttl: TTL.tenMinutes }, () =>
    loadMediaForProperty(propertyId),
  );
}

async function loadMediaForProperty(propertyId: string): Promise<MediaAssetWithUploader[]> {
  const rows = await db
    .select({
      asset: mediaAssets,
      uploader: {
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        email: users.email,
      },
    })
    .from(mediaAssets)
    .leftJoin(users, eq(users.id, mediaAssets.uploadedBy))
    .where(eq(mediaAssets.propertyId, propertyId))
    .orderBy(desc(mediaAssets.uploadedAt), desc(mediaAssets.id));

  return rows.map(({ asset, uploader }) => ({
    ...asset,
    uploader: uploader ? { name: displayName(uploader), email: uploader.email } : null,
  }));
}

/** A media asset, only if it belongs to the given property. */
export async function getMediaAsset(propertyId: string, mediaId: string): Promise<MediaAsset | null> {
  const [row] = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.propertyId, propertyId)))
    .limit(1);
  return row ?? null;
}

export async function isImageKitFileSaved(imagekitFileId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(eq(mediaAssets.imagekitFileId, imagekitFileId))
    .limit(1);
  return Boolean(row);
}

export async function createMediaAsset(input: NewMediaAsset): Promise<MediaAsset> {
  const [row] = await db.insert(mediaAssets).values(input).returning();
  await invalidate(cacheKeys.mediaList(input.propertyId));
  return row;
}

export async function deleteMediaAsset(propertyId: string, mediaId: string): Promise<void> {
  await db
    .delete(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.propertyId, propertyId)));
  // Items using the image lose it (ON DELETE SET NULL), so their menus change too.
  await Promise.all([invalidate(cacheKeys.mediaList(propertyId)), invalidatePropertyMenus(propertyId)]);
}
