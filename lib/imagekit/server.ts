import "server-only";

import ImageKit, { NotFoundError } from "@imagekit/nodejs";

/** How long a signed upload stays valid. ImageKit allows at most one hour. */
const UPLOAD_AUTH_TTL_SECONDS = 10 * 60;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. Add your ImageKit credentials to .env (see .env.example).`);
  }
  return value;
}

/** Public values: safe to send to the browser. */
export function getImageKitPublicConfig() {
  return {
    publicKey: requireEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY),
    urlEndpoint: requireEnv(
      "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT",
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    ),
  };
}

// Created on first use, so builds and pages that never touch ImageKit don't need the keys.
const globalForImageKit = globalThis as unknown as { imagekit?: ImageKit };

/** The ImageKit API client. Holds the private key: server code only. */
export function getImageKit(): ImageKit {
  globalForImageKit.imagekit ??= new ImageKit({
    privateKey: requireEnv("IMAGEKIT_PRIVATE_KEY", process.env.IMAGEKIT_PRIVATE_KEY),
  });
  return globalForImageKit.imagekit;
}

/**
 * One-time params that let the browser upload straight to ImageKit without
 * ever seeing the private key. Each call gets a fresh token (ImageKit rejects
 * reused tokens).
 */
export function createUploadAuthParams() {
  const expire = Math.floor(Date.now() / 1000) + UPLOAD_AUTH_TTL_SECONDS;
  // The SDK's `expire` argument is an absolute Unix timestamp.
  return getImageKit().helper.getAuthenticationParameters(undefined, expire);
}

/** The file as ImageKit stores it, or null if it doesn't exist. */
export async function getImageKitFile(fileId: string) {
  try {
    return await getImageKit().files.get(fileId);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

/** Deletes a file. Already-gone files count as deleted. */
export async function deleteImageKitFile(fileId: string): Promise<void> {
  try {
    await getImageKit().files.delete(fileId);
  } catch (error) {
    if (error instanceof NotFoundError) return;
    throw error;
  }
}

/** Deletes a folder and everything in it. Already-gone folders count as deleted. */
export async function deleteImageKitFolder(folderPath: string): Promise<void> {
  try {
    await getImageKit().folders.delete({ folderPath });
  } catch (error) {
    if (error instanceof NotFoundError) return;
    throw error;
  }
}
