"use client";

import {
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
  QrCodeIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/menus/confirm-dialog";
import { FormDialog } from "@/components/menus/form-dialog";
import { MenuFields, type MenuDefaults } from "@/components/menus/menu-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { createMenuAction, deleteMenuAction, setMenuActiveAction, updateMenuAction } from "@/lib/menus/actions";
import { routes } from "@/lib/routes";

export function CreateMenuButton({ label = "New menu" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        {label}
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="New menu"
        description="Give it a name — you'll add categories and items next."
        action={createMenuAction}
        submitLabel="Create menu"
      >
        {(helpers) => <MenuFields helpers={helpers} />}
      </FormDialog>
    </>
  );
}

type MenuRef = MenuDefaults & { id: string; slug: string };

/** Live toggle, preview link and the overflow menu on the menu builder page. */
export function MenuHeaderActions({ menu, canEdit }: { menu: MenuRef; canEdit: boolean }) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [isActive, setIsActive] = useOptimistic(menu.isActive);
  const [, startTransition] = useTransition();

  function toggleActive(next: boolean) {
    startTransition(async () => {
      setIsActive(next);
      const result = await setMenuActiveAction(menu.id, next);
      toast.add({ title: result.message, type: result.status === "success" ? "success" : "error" });
    });
  }

  return (
    <>
      {canEdit && (
        <div className="flex items-center gap-2 rounded-lg border px-3">
          <Switch id="menu-live" checked={isActive} onCheckedChange={toggleActive} />
          <Label htmlFor="menu-live" className="text-sm">
            {isActive ? "Live" : "Hidden"}
          </Label>
        </div>
      )}
      <a
        href={routes.publicMenu(menu.slug)}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "outline" })}
      >
        <ExternalLinkIcon data-icon="inline-start" />
        Preview
      </a>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="More menu actions" />}>
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setDialog("edit")}>
                <PencilIcon />
                Edit details
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`${routes.qrCodes}?menu=${menu.id}`} />}>
                <QrCodeIcon />
                QR codes
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                <Trash2Icon />
                Delete menu
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <FormDialog
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
        title="Edit menu"
        action={updateMenuAction}
        hidden={{ id: menu.id }}
        submitLabel="Save"
      >
        {(helpers) => <MenuFields helpers={helpers} defaults={{ ...menu, isActive }} />}
      </FormDialog>

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        title={`Delete “${menu.name}”?`}
        description="This deletes every category, sub-category and item in it, and its QR codes stop working. This can't be undone."
        confirmLabel="Delete menu"
        onConfirm={() => deleteMenuAction(menu.id)}
      />
    </>
  );
}
