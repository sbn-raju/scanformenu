import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { MenuHeaderActions } from "@/components/menus/menu-actions";
import { MenuBuilder, type BuilderCategory } from "@/components/menus/menu-builder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireWorkspace } from "@/lib/auth/session";
import { getImageKitPublicConfig } from "@/lib/imagekit/server";
import { listMediaForProperty } from "@/lib/media/service";
import { canManageMenus } from "@/lib/menus/constants";
import { getMenu, getMenuTree } from "@/lib/menus/service";
import { uuidSchema } from "@/lib/menus/validation";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Edit menu" };

export default async function MenuBuilderPage({ params }: PageProps<"/dashboard/menus/[menuId]">) {
  const { menuId } = await params;
  const { activeProperty: property } = await requireWorkspace();
  if (!uuidSchema.safeParse(menuId).success) notFound();

  const menu = await getMenu(property.id, menuId);
  // Also covers switching property while on another property's menu.
  if (!menu) notFound();

  const canEdit = canManageMenus(property.role);
  const [tree, media] = await Promise.all([
    getMenuTree(menu.id),
    canEdit ? listMediaForProperty(property.id) : Promise.resolve([]),
  ]);
  const { urlEndpoint } = getImageKitPublicConfig();

  // Only what the client needs.
  const categories: BuilderCategory[] = tree.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    subcategories: category.subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      items: sub.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        dietary: item.dietary,
        imageId: item.imageId,
        image: item.image,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
      })),
    })),
  }));

  const itemCount = categories.reduce(
    (sum, c) => sum + c.subcategories.reduce((s, sub) => s + sub.items.length, 0),
    0,
  );

  return (
    <>
      <Link
        href={routes.menus}
        className="-mb-3 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All menus
      </Link>
      <PageHeader
        title={menu.name}
        description={
          menu.description ??
          `${categories.length} ${categories.length === 1 ? "category" : "categories"} · ${itemCount} ${itemCount === 1 ? "item" : "items"}`
        }
        actions={
          <MenuHeaderActions
            canEdit={canEdit}
            menu={{
              id: menu.id,
              slug: menu.slug,
              name: menu.name,
              description: menu.description,
              isActive: menu.isActive,
            }}
          />
        }
      />
      {!canEdit && (
        <Alert>
          <AlertDescription>
            You have view-only access. Ask the property owner or a manager to make changes.
          </AlertDescription>
        </Alert>
      )}
      <MenuBuilder
        key={menu.id}
        menuId={menu.id}
        categories={categories}
        currency={property.currency}
        canEdit={canEdit}
        images={media.map((m) => ({ value: m.id, label: m.title }))}
        urlEndpoint={urlEndpoint}
      />
    </>
  );
}
