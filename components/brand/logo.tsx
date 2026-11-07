import { QrCodeIcon } from "lucide-react";
import Link from "next/link";

import { routes } from "@/lib/routes";

export function Logo({ href = routes.home }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <QrCodeIcon className="size-4" />
      </span>
      ScanForMenu
    </Link>
  );
}
