import type { NextRequest } from "next/server";

import { getWorkspace } from "@/lib/auth/session";
import { uuidSchema } from "@/lib/menus/validation";
import { getQrCode, renderQrPng } from "@/lib/qr/service";

function fileName(label: string, extension: string): string {
  const base = label
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `qr-${base || "code"}.${extension}`;
}

/**
 * GET /api/qr-codes/<id>/download?format=svg|png
 * Members of the property can download its QR codes. SVG is the stored
 * artwork (best for print); PNG is rendered from the same URL and color.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/qr-codes/[id]/download">) {
  const { id } = await ctx.params;
  const { activeProperty } = await getWorkspace();
  if (!activeProperty || !uuidSchema.safeParse(id).success) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const qr = await getQrCode(activeProperty.id, id);
  if (!qr) return Response.json({ error: "Not found" }, { status: 404 });

  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const headers = {
    "Content-Disposition": `attachment; filename="${fileName(qr.label, format)}"`,
    "Cache-Control": "private, no-store",
  };

  if (format === "svg") {
    return new Response(qr.svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  }

  const png = await renderQrPng(qr.targetUrl, qr.color);
  return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
}
