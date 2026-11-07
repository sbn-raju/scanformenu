import type { MemberRole } from "@/lib/properties/constants";

/** Largest image the media library accepts. Enforced in the browser and re-checked on the server. */
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_SIZE_LABEL = "10 MB";

/** Raster formats only: SVG can carry scripts, so it isn't accepted. */
export const MEDIA_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;
export const MEDIA_ACCEPTED_LABEL = "JPG, PNG, WebP, AVIF or GIF";

export const MEDIA_TITLE_MAX = 120;
export const MEDIA_DESCRIPTION_MAX = 1000;

/** Who can upload and delete media. Every member can view it. */
export const MEDIA_EDITOR_ROLES: readonly MemberRole[] = ["owner", "manager"];

export function canManageMedia(role: MemberRole): boolean {
  return MEDIA_EDITOR_ROLES.includes(role);
}

export function isAcceptedMediaType(type: string): boolean {
  return (MEDIA_ACCEPTED_TYPES as readonly string[]).includes(type);
}

/**
 * Each property's uploads go into their own ImageKit folder. The server
 * signs uploads for this folder and rejects files that land anywhere else.
 */
export function mediaFolderForProperty(propertyId: string): string {
  return `/scanformenu/properties/${propertyId}`;
}

/** Upload auth params handed to the browser by GET /api/media/upload-auth. */
export type MediaUploadAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  folder: string;
};
