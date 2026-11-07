import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { CreateQrCodeButton, QrCodeGrid, type QrCodeCard } from "@/components/qr/qr-codes";
import { requireWorkspace } from "@/lib/auth/session";
import { canManageMenus } from "@/lib/menus/constants";
import { listMenusForProperty } from "@/lib/menus/service";
import { listQrCodesForProperty } from "@/lib/qr/service";

export const metadata: Metadata = { title: "QR codes" };

export default async function QrCodesPage({ searchParams }: PageProps<"/dashboard/qr-codes">) {
  const { activeProperty: property } = await requireWorkspace();
  const canEdit = canManageMenus(property.role);
  const [menus, codes, query] = await Promise.all([
    listMenusForProperty(property.id),
    listQrCodesForProperty(property.id),
    searchParams,
  ]);

  const menuOptions = menus.map((m) => ({ value: m.id, label: m.isActive ? m.name : `${m.name} (hidden)` }));
  // ?menu=<id> (from a menu's page) filters the list and pre-selects that menu.
  const requested = typeof query.menu === "string" ? query.menu : undefined;
  const filterMenu = menus.find((m) => m.id === requested);

  const dateFormat = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: property.timezone,
  });

  const cards: QrCodeCard[] = codes
    .filter((qr) => !filterMenu || qr.menuId === filterMenu.id)
    .map((qr) => ({
      id: qr.id,
      label: qr.label,
      svg: qr.svg,
      targetUrl: qr.targetUrl,
      scanCount: qr.scanCount,
      lastScannedLabel: qr.lastScannedAt ? dateFormat.format(qr.lastScannedAt) : null,
      createdLabel: dateFormat.format(qr.createdAt),
      menu: { id: qr.menuId, name: qr.menu.name, isActive: qr.menu.isActive },
    }));

  const totalScans = cards.reduce((sum, qr) => sum + qr.scanCount, 0);

  return (
    <>
      <PageHeader
        title={filterMenu ? `QR codes · ${filterMenu.name}` : "QR codes"}
        description={
          cards.length > 0
            ? `${cards.length} ${cards.length === 1 ? "code" : "codes"} · ${totalScans.toLocaleString()} ${totalScans === 1 ? "scan" : "scans"} in total.`
            : "Printable codes that open your menus."
        }
        actions={
          canEdit && cards.length > 0 ? (
            <CreateQrCodeButton menus={menuOptions} defaultMenuId={filterMenu?.id} />
          ) : undefined
        }
      />
      <QrCodeGrid
        key={`${property.id}:${filterMenu?.id ?? "all"}`}
        codes={cards}
        menus={menuOptions}
        canEdit={canEdit}
        defaultMenuId={filterMenu?.id}
      />
    </>
  );
}
