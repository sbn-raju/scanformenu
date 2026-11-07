"use client";

import { Image, ImageKitProvider } from "@imagekit/next";
import { CopyIcon, ExternalLinkIcon, ImagesIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";

import { UploadMediaDialog } from "@/components/media/upload-media-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { deleteMediaAction } from "@/lib/media/actions";
import { formatBytes } from "@/lib/media/format";

/** A media asset as the library renders it. Dates are pre-formatted on the server. */
export type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  filePath: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  uploadedAt: string;
  uploadedAtLabel: string;
  uploaderName: string | null;
};

const GRID_SIZES = "(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw";

function DeleteMediaButton({ item, onDeleted }: { item: MediaItem; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteMediaAction(item.id);
      toast.add({ title: result.message, type: result.status === "success" ? "success" : "error" });
      if (result.status === "success") onDeleted();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{item.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The image is removed from your library and from storage. Anywhere it&apos;s used will
            stop showing it. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
            {pending && <Spinner data-icon="inline-start" />}
            Delete image
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MediaDetailsDialog({
  item,
  canEdit,
  onClose,
}: {
  item: MediaItem | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.add({ title: "Image URL copied", type: "success" });
    } catch {
      toast.add({ title: "Couldn't copy the URL", type: "error" });
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>{item.title}</DialogTitle>
              {item.description && <DialogDescription>{item.description}</DialogDescription>}
            </DialogHeader>

            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
              <Image
                src={item.filePath}
                alt={item.description ?? item.title}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-contain"
              />
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Uploaded by</dt>
              <dd>{item.uploaderName ?? "Deleted user"}</dd>
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd>
                <time dateTime={item.uploadedAt}>{item.uploadedAtLabel}</time>
              </dd>
              {item.width && item.height && (
                <>
                  <dt className="text-muted-foreground">Dimensions</dt>
                  <dd>
                    {item.width} × {item.height} px
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">File</dt>
              <dd className="truncate">
                {item.fileName} · {formatBytes(item.sizeBytes)} ·{" "}
                {item.mimeType.replace("image/", "").toUpperCase()}
              </dd>
            </dl>

            <DialogFooter>
              {canEdit && <DeleteMediaButton item={item} onDeleted={onClose} />}
              <div className="flex gap-2 sm:ml-auto">
                <Button variant="outline" onClick={() => copyUrl(item.url)}>
                  <CopyIcon data-icon="inline-start" />
                  Copy URL
                </Button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  Open original
                </a>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MediaLibrary({
  items,
  urlEndpoint,
  canEdit,
}: {
  items: MediaItem[];
  urlEndpoint: string;
  canEdit: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  if (items.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImagesIcon />
          </EmptyMedia>
          <EmptyTitle>No images yet</EmptyTitle>
          <EmptyDescription>
            {canEdit
              ? "Upload photos of your dishes, venue and branding to use across your menus."
              : "Owners and managers can upload images here."}
          </EmptyDescription>
        </EmptyHeader>
        {canEdit && (
          <EmptyContent>
            <UploadMediaDialog triggerLabel="Upload your first image" />
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="group flex w-full flex-col overflow-hidden rounded-xl border bg-card text-left outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="relative aspect-4/3 bg-muted">
                <Image
                  src={item.filePath}
                  alt={item.title}
                  fill
                  sizes={GRID_SIZES}
                  className="object-cover transition-transform group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="truncate text-sm font-medium">{item.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.uploaderName ?? "Deleted user"} ·{" "}
                  <time dateTime={item.uploadedAt}>{item.uploadedAtLabel}</time>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <MediaDetailsDialog item={selected} canEdit={canEdit} onClose={() => setSelectedId(null)} />
    </ImageKitProvider>
  );
}
