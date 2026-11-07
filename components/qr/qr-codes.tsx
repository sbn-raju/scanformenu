"use client";

import {
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  PlusIcon,
  QrCodeIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SelectField, TextField } from "@/components/forms/fields";
import { ConfirmDialog } from "@/components/menus/confirm-dialog";
import { FormDialog } from "@/components/menus/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { toast } from "@/components/ui/toast";
import { QR_COLORS, QR_LABEL_MAX } from "@/lib/menus/constants";
import { createQrCodeAction, deleteQrCodeAction } from "@/lib/qr/actions";
import { routes } from "@/lib/routes";

export type QrMenuOption = { value: string; label: string };

export type QrCodeCard = {
  id: string;
  label: string;
  svg: string;
  targetUrl: string;
  scanCount: number;
  lastScannedLabel: string | null;
  createdLabel: string;
  menu: { id: string; name: string; isActive: boolean };
};

const colorOptions = QR_COLORS.map(({ value, label }) => ({ value, label }));

export function CreateQrCodeButton({
  menus,
  defaultMenuId,
  label = "New QR code",
}: {
  menus: QrMenuOption[];
  defaultMenuId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={menus.length === 0}>
        <PlusIcon data-icon="inline-start" />
        {label}
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="New QR code"
        description="Guests scan it to open the menu. Make one per table or location to see where scans come from."
        action={createQrCodeAction}
        submitLabel="Generate QR code"
      >
        {({ errors, value }) => (
          <>
            <SelectField
              name="menuId"
              label="Menu"
              placeholder="Choose a menu"
              options={menus}
              defaultValue={value("menuId", defaultMenuId ?? (menus.length === 1 ? menus[0].value : "")) || null}
              errors={errors.menuId}
            />
            <TextField
              name="label"
              label="Label"
              placeholder="e.g. Table 12, Entrance, Rooftop"
              maxLength={QR_LABEL_MAX}
              defaultValue={value("label")}
              errors={errors.label}
              description="Only you see this — it helps you tell printed codes apart."
              autoFocus
            />
            <SelectField
              name="color"
              label="Color"
              options={colorOptions}
              defaultValue={value("color", "#000000")}
              errors={errors.color}
            />
          </>
        )}
      </FormDialog>
    </>
  );
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function QrCard({ qr, canEdit, onDelete }: { qr: QrCodeCard; canEdit: boolean; onDelete: () => void }) {
  const download = (format: "svg" | "png") => `/api/qr-codes/${qr.id}/download?format=${format}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(qr.targetUrl);
      toast.add({ title: "Link copied", type: "success" });
    } catch {
      toast.add({ title: "Couldn't copy the link", type: "error" });
    }
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-center border-b bg-white p-4">
        {/* Stored SVG rendered as an image (not injected as markup). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUrl(qr.svg)} alt={`QR code: ${qr.label}`} className="aspect-square w-full max-w-48" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium">{qr.label}</span>
            <Link
              href={routes.menu(qr.menu.id)}
              className="truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {qr.menu.name}
            </Link>
          </div>
          {!qr.menu.isActive && <Badge variant="outline">Menu hidden</Badge>}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${qr.label}`} />}>
              <EllipsisVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={copyLink}>
                  <CopyIcon />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem render={<a href={qr.targetUrl} target="_blank" rel="noreferrer" />}>
                  <ExternalLinkIcon />
                  Test scan
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Scans</dt>
          <dd className="tabular-nums">{qr.scanCount.toLocaleString()}</dd>
          <dt className="text-muted-foreground">Last scan</dt>
          <dd>{qr.lastScannedLabel ?? "Never"}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{qr.createdLabel}</dd>
        </dl>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <a href={download("png")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <DownloadIcon data-icon="inline-start" />
            PNG
          </a>
          <a href={download("svg")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <DownloadIcon data-icon="inline-start" />
            SVG
          </a>
        </div>
      </div>
    </li>
  );
}

export function QrCodeGrid({
  codes,
  menus,
  canEdit,
  defaultMenuId,
}: {
  codes: QrCodeCard[];
  menus: QrMenuOption[];
  canEdit: boolean;
  defaultMenuId?: string;
}) {
  const [deleting, setDeleting] = useState<QrCodeCard | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (codes.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <QrCodeIcon />
          </EmptyMedia>
          <EmptyTitle>No QR codes yet</EmptyTitle>
          <EmptyDescription>
            {menus.length === 0
              ? "Create a menu first, then generate QR codes for your tables."
              : canEdit
                ? "Generate a QR code for a menu, then download it to print on table tents, stickers or flyers."
                : "Owners and managers can generate QR codes here."}
          </EmptyDescription>
        </EmptyHeader>
        {canEdit && (
          <EmptyContent>
            {menus.length === 0 ? (
              <Link href={routes.menus} className={buttonVariants()}>
                Go to menus
              </Link>
            ) : (
              <CreateQrCodeButton menus={menus} defaultMenuId={defaultMenuId} label="Generate your first QR code" />
            )}
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {codes.map((qr) => (
          <QrCard
            key={qr.id}
            qr={qr}
            canEdit={canEdit}
            onDelete={() => {
              setDeleting(qr);
              setConfirmOpen(true);
            }}
          />
        ))}
      </ul>
      {deleting && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`Delete “${deleting.label}”?`}
          description="Printed copies of this code will stop working. The menu itself isn't affected."
          onConfirm={() => deleteQrCodeAction(deleting.id)}
        />
      )}
    </>
  );
}
