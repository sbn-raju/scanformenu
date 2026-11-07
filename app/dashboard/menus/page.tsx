import { BookOpenIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { CreateMenuButton } from "@/components/menus/menu-actions";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { requireWorkspace } from "@/lib/auth/session";
import { canManageMenus } from "@/lib/menus/constants";
import { listMenusForProperty } from "@/lib/menus/service";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Menus" };

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export default async function MenusPage() {
  const { activeProperty: property } = await requireWorkspace();
  const canEdit = canManageMenus(property.role);
  const menus = await listMenusForProperty(property.id);

  const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: property.timezone });

  return (
    <>
      <PageHeader
        title="Menus"
        description={
          menus.length > 0
            ? `${plural(menus.length, "menu", "menus")} at ${property.name}.`
            : `Build the menus guests see when they scan a QR code at ${property.name}.`
        }
        actions={canEdit && menus.length > 0 ? <CreateMenuButton /> : undefined}
      />

      {menus.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No menus yet</EmptyTitle>
            <EmptyDescription>
              {canEdit
                ? "Create a menu — a special, breakfast, or your full à la carte — then add categories, sub-categories and items."
                : "Owners and managers can create menus here."}
            </EmptyDescription>
          </EmptyHeader>
          {canEdit && (
            <EmptyContent>
              <CreateMenuButton label="Create your first menu" />
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {menus.map((menu) => (
            <li key={menu.id}>
              <Link
                href={routes.menu(menu.id)}
                className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">{menu.name}</span>
                    {menu.description && (
                      <span className="line-clamp-2 text-sm text-muted-foreground">{menu.description}</span>
                    )}
                  </div>
                  <Badge variant={menu.isActive ? "default" : "outline"}>
                    {menu.isActive ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {plural(menu.categoryCount, "category", "categories")} ·{" "}
                    {plural(menu.itemCount, "item", "items")} · {plural(menu.qrCodeCount, "QR code", "QR codes")}
                  </span>
                  <span className="ml-auto hidden sm:inline">Updated {dateFormat.format(menu.updatedAt)}</span>
                  <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
