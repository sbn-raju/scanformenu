import { after, NextResponse, type NextRequest } from "next/server";

import { countScan, getQrTarget } from "@/lib/qr/service";
import { routes } from "@/lib/routes";

/**
 * Where every printed QR code points. Counts the scan, then sends the guest to
 * the menu. Going through here (rather than encoding the menu URL directly)
 * keeps printed codes valid and lets us count scans.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/q/[code]">) {
  const { code } = await ctx.params;

  if (!/^[A-Za-z0-9_-]{10}$/.test(code)) {
    return new Response("This QR code isn't valid.", { status: 404 });
  }

  let slug: string | null;
  try {
    slug = await getQrTarget(code);
  } catch (error) {
    console.error("QR scan failed", error);
    return new Response("Something went wrong. Please scan again.", { status: 500 });
  }

  if (!slug) {
    return new Response("This QR code is no longer in use. Please ask a member of staff for the menu.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Count the scan once the guest is on their way, so the redirect never waits on it.
  after(async () => {
    try {
      await countScan(code);
    } catch (error) {
      console.error("Counting QR scan failed", code, error);
    }
  });

  // The menu page shows a friendly message when the menu is switched off.
  const response = NextResponse.redirect(new URL(routes.publicMenu(slug), request.url), 302);
  // Never cache in the browser or CDN: every scan should reach us so it's counted.
  response.headers.set("Cache-Control", "no-store");
  return response;
}
