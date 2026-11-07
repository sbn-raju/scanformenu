"use client";

import { Image, ImageKitProvider } from "@imagekit/next";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  FolderPlusIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/menus/confirm-dialog";
import { DietaryMark } from "@/components/menus/dietary-mark";
import { FormDialog } from "@/components/menus/form-dialog";
import {
  ItemFields,
  SectionFields,
  type ImageOption,
  type ItemDefaults,
  type SectionDefaults,
} from "@/components/menus/menu-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import type { FormState } from "@/lib/forms";
import {
  createCategoryAction,
  createItemAction,
  createSubcategoryAction,
  deleteCategoryAction,
  deleteItemAction,
  deleteSubcategoryAction,
  moveCategoryAction,
  moveItemAction,
  moveSubcategoryAction,
  setItemAvailabilityAction,
  updateCategoryAction,
  updateItemAction,
  updateSubcategoryAction,
} from "@/lib/menus/actions";
import { formatPrice, type DietaryType } from "@/lib/menus/constants";
import { cn } from "@/lib/utils";

// ─── Data passed from the server ──────────────────────────────────────────

export type BuilderItem = ItemDefaults & {
  id: string;
  dietary: DietaryType | null;
  image: { filePath: string; title: string } | null;
};
export type BuilderSubcategory = SectionDefaults & { id: string; items: BuilderItem[] };
export type BuilderCategory = SectionDefaults & { id: string; subcategories: BuilderSubcategory[] };

// ─── Which dialog is open ─────────────────────────────────────────────────

type DialogState =
  | { type: "category"; category?: BuilderCategory }
  | { type: "subcategory"; categoryId: string; subcategory?: BuilderSubcategory }
  | { type: "item"; subcategoryId: string; item?: BuilderItem }
  | { type: "delete"; title: string; description: string; run: () => Promise<FormState> };

type Ctx = {
  canEdit: boolean;
  currency: string;
  open: (dialog: DialogState) => void;
  move: (run: () => Promise<FormState>) => void;
};

// ─── Small pieces ─────────────────────────────────────────────────────────

function RowMenu({
  label,
  isFirst,
  isLast,
  onEdit,
  onMove,
  onDelete,
  extra,
}: {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
  extra?: { label: string; icon: React.ReactNode; onClick: () => void };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${label}`} />}>
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          {extra && (
            <DropdownMenuItem onClick={extra.onClick}>
              {extra.icon}
              {extra.label}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled={isFirst} onClick={() => onMove("up")}>
            <ArrowUpIcon />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isLast} onClick={() => onMove("down")}>
            <ArrowDownIcon />
            Move down
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Items ────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  subcategoryId,
  isFirst,
  isLast,
  ctx,
}: {
  item: BuilderItem;
  subcategoryId: string;
  isFirst: boolean;
  isLast: boolean;
  ctx: Ctx;
}) {
  const [available, setAvailable] = useOptimistic(item.isAvailable);
  const [, startTransition] = useTransition();

  function toggleAvailable(next: boolean) {
    startTransition(async () => {
      setAvailable(next);
      const result = await setItemAvailabilityAction(item.id, next);
      if (result.status === "error") toast.add({ title: result.message, type: "error" });
    });
  }

  return (
    <li className={cn("flex items-start gap-3 py-3", !available && "opacity-60")}>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
        {item.image ? (
          <Image src={item.image.filePath} alt={item.image.title} fill sizes="56px" className="object-cover" />
        ) : (
          <UtensilsCrossedIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <DietaryMark dietary={item.dietary} />
          <span className="font-medium">{item.name}</span>
          {item.isFeatured && (
            <Badge variant="secondary">
              <StarIcon data-icon="inline-start" />
              Featured
            </Badge>
          )}
          {!available && <Badge variant="outline">Unavailable</Badge>}
        </div>
        {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="font-medium tabular-nums">{formatPrice(item.price, ctx.currency)}</span>
        {ctx.canEdit && (
          <>
            <Switch
              size="sm"
              checked={available}
              onCheckedChange={toggleAvailable}
              aria-label={`${item.name} available`}
            />
            <RowMenu
              label={item.name}
              isFirst={isFirst}
              isLast={isLast}
              onEdit={() => ctx.open({ type: "item", subcategoryId, item })}
              onMove={(direction) => ctx.move(() => moveItemAction(item.id, direction))}
              onDelete={() =>
                ctx.open({
                  type: "delete",
                  title: `Delete “${item.name}”?`,
                  description: "The item is removed from this menu. This can't be undone.",
                  run: () => deleteItemAction(item.id),
                })
              }
            />
          </>
        )}
      </div>
    </li>
  );
}

// ─── Sub-categories ───────────────────────────────────────────────────────

function SubcategorySection({
  subcategory,
  categoryId,
  isFirst,
  isLast,
  ctx,
}: {
  subcategory: BuilderSubcategory;
  categoryId: string;
  isFirst: boolean;
  isLast: boolean;
  ctx: Ctx;
}) {
  const addItem = () => ctx.open({ type: "item", subcategoryId: subcategory.id });
  const count = subcategory.items.length;

  return (
    <section className="rounded-lg border">
      <header className="flex items-start gap-2 border-b bg-muted/40 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="flex items-center gap-2 font-medium">
            {subcategory.name}
            <span className="text-xs font-normal text-muted-foreground">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </h3>
          {subcategory.description && (
            <p className="text-sm text-muted-foreground">{subcategory.description}</p>
          )}
        </div>
        {ctx.canEdit && (
          <RowMenu
            label={subcategory.name}
            isFirst={isFirst}
            isLast={isLast}
            onEdit={() => ctx.open({ type: "subcategory", categoryId, subcategory })}
            onMove={(direction) => ctx.move(() => moveSubcategoryAction(subcategory.id, direction))}
            extra={{ label: "Add item", icon: <PlusIcon />, onClick: addItem }}
            onDelete={() =>
              ctx.open({
                type: "delete",
                title: `Delete “${subcategory.name}”?`,
                description:
                  count > 0
                    ? `This also deletes its ${count} ${count === 1 ? "item" : "items"}. This can't be undone.`
                    : "This can't be undone.",
                run: () => deleteSubcategoryAction(subcategory.id),
              })
            }
          />
        )}
      </header>

      <div className="px-4">
        {count > 0 ? (
          <ul className="divide-y">
            {subcategory.items.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                subcategoryId={subcategory.id}
                isFirst={index === 0}
                isLast={index === count - 1}
                ctx={ctx}
              />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No items yet.</p>
        )}
        {ctx.canEdit && (
          <div className="border-t py-2">
            <Button variant="ghost" size="sm" onClick={addItem}>
              <PlusIcon data-icon="inline-start" />
              Add item
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────

function CategoryCard({
  category,
  isFirst,
  isLast,
  ctx,
}: {
  category: BuilderCategory;
  isFirst: boolean;
  isLast: boolean;
  ctx: Ctx;
}) {
  const addSubcategory = () => ctx.open({ type: "subcategory", categoryId: category.id });
  const subCount = category.subcategories.length;
  const itemCount = category.subcategories.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{category.name}</CardTitle>
        <CardDescription>
          {category.description ?? `${subCount} sub-categories · ${itemCount} items`}
        </CardDescription>
        {ctx.canEdit && (
          <CardAction>
            <RowMenu
              label={category.name}
              isFirst={isFirst}
              isLast={isLast}
              onEdit={() => ctx.open({ type: "category", category })}
              onMove={(direction) => ctx.move(() => moveCategoryAction(category.id, direction))}
              extra={{ label: "Add sub-category", icon: <FolderPlusIcon />, onClick: addSubcategory }}
              onDelete={() =>
                ctx.open({
                  type: "delete",
                  title: `Delete “${category.name}”?`,
                  description:
                    subCount > 0
                      ? `This also deletes ${subCount} ${subCount === 1 ? "sub-category" : "sub-categories"} and ${itemCount} ${itemCount === 1 ? "item" : "items"}. This can't be undone.`
                      : "This can't be undone.",
                  run: () => deleteCategoryAction(category.id),
                })
              }
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {category.subcategories.map((subcategory, index) => (
          <SubcategorySection
            key={subcategory.id}
            subcategory={subcategory}
            categoryId={category.id}
            isFirst={index === 0}
            isLast={index === subCount - 1}
            ctx={ctx}
          />
        ))}
        {subCount === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Add a sub-category (e.g. “Hot coffee”) to start adding items.
          </p>
        )}
        {ctx.canEdit && (
          <div>
            <Button variant="outline" size="sm" onClick={addSubcategory}>
              <FolderPlusIcon data-icon="inline-start" />
              Add sub-category
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── The builder ──────────────────────────────────────────────────────────

export function MenuBuilder({
  menuId,
  categories,
  currency,
  canEdit,
  images,
  urlEndpoint,
}: {
  menuId: string;
  categories: BuilderCategory[];
  currency: string;
  canEdit: boolean;
  images: ImageOption[];
  urlEndpoint: string;
}) {
  // Keep the last dialog's content while it animates closed.
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const ctx: Ctx = {
    canEdit,
    currency,
    open: (next) => {
      setDialog(next);
      setOpen(true);
    },
    move: (run) =>
      startTransition(async () => {
        const result = await run();
        if (result.status === "error") toast.add({ title: result.message, type: "error" });
      }),
  };

  const addCategory = () => ctx.open({ type: "category" });

  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      {categories.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayersIcon />
            </EmptyMedia>
            <EmptyTitle>Start with a category</EmptyTitle>
            <EmptyDescription>
              Menus are organised as categories (Beverages) → sub-categories (Hot coffee) → items
              (Cappuccino).
            </EmptyDescription>
          </EmptyHeader>
          {canEdit && (
            <EmptyContent>
              <Button onClick={addCategory}>
                <PlusIcon data-icon="inline-start" />
                Add your first category
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              isFirst={index === 0}
              isLast={index === categories.length - 1}
              ctx={ctx}
            />
          ))}
          {canEdit && (
            <Button variant="outline" className="self-start" onClick={addCategory}>
              <PlusIcon data-icon="inline-start" />
              Add category
            </Button>
          )}
        </div>
      )}

      {dialog?.type === "category" && (
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          title={dialog.category ? "Edit category" : "New category"}
          description="Top-level sections of your menu, like Beverages or Mains."
          action={dialog.category ? updateCategoryAction : createCategoryAction}
          hidden={dialog.category ? { id: dialog.category.id } : { menuId }}
          submitLabel={dialog.category ? "Save" : "Add category"}
        >
          {(helpers) => <SectionFields kind="category" helpers={helpers} defaults={dialog.category} />}
        </FormDialog>
      )}

      {dialog?.type === "subcategory" && (
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          title={dialog.subcategory ? "Edit sub-category" : "New sub-category"}
          description="Groups items inside a category, like Hot coffee inside Beverages."
          action={dialog.subcategory ? updateSubcategoryAction : createSubcategoryAction}
          hidden={dialog.subcategory ? { id: dialog.subcategory.id } : { categoryId: dialog.categoryId }}
          submitLabel={dialog.subcategory ? "Save" : "Add sub-category"}
        >
          {(helpers) => <SectionFields kind="subcategory" helpers={helpers} defaults={dialog.subcategory} />}
        </FormDialog>
      )}

      {dialog?.type === "item" && (
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          className="sm:max-w-xl"
          title={dialog.item ? "Edit item" : "New item"}
          action={dialog.item ? updateItemAction : createItemAction}
          hidden={dialog.item ? { id: dialog.item.id } : { subcategoryId: dialog.subcategoryId }}
          submitLabel={dialog.item ? "Save" : "Add item"}
        >
          {(helpers) => (
            <ItemFields helpers={helpers} defaults={dialog.item} currency={currency} images={images} />
          )}
        </FormDialog>
      )}

      {dialog?.type === "delete" && (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={dialog.title}
          description={dialog.description}
          onConfirm={dialog.run}
        />
      )}
    </ImageKitProvider>
  );
}
