import QRCode from "qrcode";

import { cn } from "@/lib/utils";

/** A real, scannable QR code rendered once at build time. */
export async function QrArt({ value, color = "#000000", className }: { value: string; color?: string; className?: string }) {
  "use cache";
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: color, light: "#ffffff00" },
  });
  return (
    <div
      role="img"
      aria-label="Example QR code"
      className={cn("[&>svg]:block [&>svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
