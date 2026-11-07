import "server-only";

import { headers } from "next/headers";

/**
 * The app's public origin, e.g. https://scanformenu.com — what printed QR codes
 * point at. Set NEXT_PUBLIC_APP_URL in production so codes never encode a
 * preview or localhost address; otherwise it's taken from the current request.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
