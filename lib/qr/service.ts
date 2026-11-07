import "server-only";

import { randomBytes } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";
import QRCode from "qrcode";

import { cached, cacheKeys, invalidate, TTL } from "@/lib/cache";
import { db } from "@/lib/db";
import { menus, qrCodes, type QrCode } from "@/lib/db/schema";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string } })?.cause ?? error;
  return (cause as { code?: string })?.code === UNIQUE_VIOLATION;
}

/** 10 URL-safe characters (60 bits): short to scan, impossible to guess. */
function newCode(): string {
  return randomBytes(8).toString("base64url").slice(0, 10);
}

/**
 * Medium error correction survives smudges and table wear. A 4-module quiet
 * zone is what scanners expect; the light color stays white for contrast.
 */
function qrOptions(color: string) {
  return { errorCorrectionLevel: "M" as const, margin: 4, color: { dark: color, light: "#ffffff" } };
}

export function renderQrSvg(url: string, color: string): Promise<string> {
  return QRCode.toString(url, { ...qrOptions(color), type: "svg" });
}

/** A print-ready PNG. 1024px prints sharply up to roughly 8 cm at 300 dpi. */
export function renderQrPng(url: string, color: string, width = 1024): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...qrOptions(color), type: "png", width });
}

export type QrCodeWithMenu = QrCode & { menu: { name: string; slug: string; isActive: boolean } };

/** Every QR code for the property, newest first, with the menu it opens. */
export async function listQrCodesForProperty(propertyId: string): Promise<QrCodeWithMenu[]> {
  const rows = await db
    .select({
      qr: qrCodes,
      menu: { name: menus.name, slug: menus.slug, isActive: menus.isActive },
    })
    .from(qrCodes)
    .innerJoin(menus, eq(menus.id, qrCodes.menuId))
    .where(eq(qrCodes.propertyId, propertyId))
    .orderBy(desc(qrCodes.createdAt), desc(qrCodes.id));
  return rows.map(({ qr, menu }) => ({ ...qr, menu }));
}

/** A QR code, only if it belongs to the property. */
export async function getQrCode(propertyId: string, qrId: string): Promise<QrCode | null> {
  const [row] = await db
    .select()
    .from(qrCodes)
    .where(and(eq(qrCodes.id, qrId), eq(qrCodes.propertyId, propertyId)))
    .limit(1);
  return row ?? null;
}

/** Generates the code, renders it, and stores both. */
export async function createQrCode(input: {
  propertyId: string;
  menuId: string;
  createdBy: string;
  label: string;
  color: string;
  siteUrl: string;
}): Promise<QrCode> {
  for (let attempt = 0; ; attempt++) {
    const code = newCode();
    const targetUrl = `${input.siteUrl}/q/${code}`;
    const svg = await renderQrSvg(targetUrl, input.color);
    try {
      const [row] = await db
        .insert(qrCodes)
        .values({
          propertyId: input.propertyId,
          menuId: input.menuId,
          createdBy: input.createdBy,
          label: input.label,
          color: input.color,
          code,
          targetUrl,
          svg,
        })
        .returning();
      // The menu list shows how many QR codes each menu has.
      await invalidate(cacheKeys.menuList(input.propertyId));
      return row;
    } catch (error) {
      if (attempt < 2 && isUniqueViolation(error)) continue;
      throw error;
    }
  }
}

export async function deleteQrCode(propertyId: string, qrId: string): Promise<boolean> {
  const rows = await db
    .delete(qrCodes)
    .where(and(eq(qrCodes.id, qrId), eq(qrCodes.propertyId, propertyId)))
    .returning({ id: qrCodes.id, code: qrCodes.code });
  if (rows.length === 0) return false;
  await invalidate(cacheKeys.qrTarget(rows[0].code), cacheKeys.menuList(propertyId));
  return true;
}

/**
 * The slug of the menu a printed code opens, or null for an unknown code.
 * Cached: a code never changes menus, and slugs never change. Unknown codes
 * are cached briefly so a misprinted or deleted code can't hammer the database.
 */
export async function getQrTarget(code: string): Promise<string | null> {
  return cached(cacheKeys.qrTarget(code), { ttl: TTL.day, nullTtl: TTL.minute }, async () => {
    const [row] = await db
      .select({ slug: menus.slug })
      .from(qrCodes)
      .innerJoin(menus, eq(menus.id, qrCodes.menuId))
      .where(eq(qrCodes.code, code))
      .limit(1);
    return row?.slug ?? null;
  });
}

/** Counts a scan. Run it after the redirect has gone out. */
export async function countScan(code: string): Promise<void> {
  await db
    .update(qrCodes)
    .set({ scanCount: sql`${qrCodes.scanCount} + 1`, lastScannedAt: new Date() })
    .where(eq(qrCodes.code, code));
}
