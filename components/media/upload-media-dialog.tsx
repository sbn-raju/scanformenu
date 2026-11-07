"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { ImageUpIcon, UploadIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition, type DragEvent } from "react";

import { TextareaField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { saveUploadedMediaAction } from "@/lib/media/actions";
import {
  isAcceptedMediaType,
  MEDIA_ACCEPTED_LABEL,
  MEDIA_ACCEPTED_TYPES,
  MEDIA_DESCRIPTION_MAX,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_SIZE_LABEL,
  MEDIA_TITLE_MAX,
  type MediaUploadAuth,
} from "@/lib/media/constants";
import { formatBytes } from "@/lib/media/format";
import { mediaDetailsSchema } from "@/lib/media/validation";

type FieldErrors = Record<string, string[] | undefined>;

/** "summer_menu-cover.jpg" → "Summer menu cover" */
function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (base.charAt(0).toUpperCase() + base.slice(1)).slice(0, MEDIA_TITLE_MAX);
}

function checkFile(file: File): string | null {
  if (!isAcceptedMediaType(file.type)) return `Choose a ${MEDIA_ACCEPTED_LABEL} image.`;
  if (file.size > MEDIA_MAX_BYTES) return `Images must be ${MEDIA_MAX_SIZE_LABEL} or smaller.`;
  return null;
}

async function fetchUploadAuth(): Promise<MediaUploadAuth> {
  const response = await fetch("/api/media/upload-auth", { cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    throw new Error(body?.error ?? "We couldn't start the upload. Please try again.");
  }
  return body as MediaUploadAuth;
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof ImageKitInvalidRequestError) return error.message || "ImageKit rejected this file.";
  if (error instanceof ImageKitUploadNetworkError) return "Network error — check your connection and try again.";
  if (error instanceof ImageKitServerError) return "ImageKit is having trouble right now. Please try again.";
  if (error instanceof Error && error.message) return error.message;
  return "Upload failed. Please try again.";
}

export function UploadMediaDialog({ triggerLabel = "Upload image" }: { triggerLabel?: string }) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ file: File; previewUrl: string } | null>(null);
  const file = selected?.file ?? null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  // Local preview URL for the chosen file, released whenever it's replaced.
  const previewRef = useRef<string | null>(null);
  function setFile(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next ? URL.createObjectURL(next) : null;
    setSelected(next && previewRef.current ? { file: next, previewUrl: previewRef.current } : null);
  }
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function reset() {
    abortRef.current?.abort();
    abortRef.current = null;
    setFile(null);
    setTitle("");
    setDescription("");
    setFieldErrors({});
    setFormError(null);
    setProgress(null);
  }

  function chooseFile(next: File | undefined) {
    if (!next) return;
    const problem = checkFile(next);
    setFieldErrors((errors) => ({ ...errors, file: problem ? [problem] : undefined }));
    if (problem) return;
    setFile(next);
    setFormError(null);
    if (!title.trim()) setTitle(titleFromFileName(next.name));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (!pending) chooseFile(event.dataTransfer.files?.[0]);
  }

  function submit() {
    setFormError(null);
    const errors: FieldErrors = {};
    if (!file) errors.file = ["Choose an image to upload."];
    const details = mediaDetailsSchema.safeParse({ title, description });
    if (!details.success) {
      for (const issue of details.error.issues) {
        (errors[String(issue.path[0])] ??= []).push(issue.message);
      }
    }
    setFieldErrors(errors);
    if (!file || !details.success) return;

    startTransition(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setProgress(0);

      // 1. Upload straight from the browser to ImageKit, signed by our server.
      let fileId: string;
      try {
        const { publicKey, token, expire, signature, folder } = await fetchUploadAuth();
        const result = await upload({
          file,
          fileName: file.name,
          folder,
          useUniqueFileName: true,
          // ImageKit refuses oversized files before storing them; the server re-checks everything.
          checks: `"file.size" < "${MEDIA_MAX_BYTES / (1024 * 1024)}mb"`,
          publicKey,
          token,
          expire,
          signature,
          abortSignal: controller.signal,
          onProgress: (event) => {
            if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
          },
        });
        if (!result.fileId) throw new Error("ImageKit didn't return a file ID.");
        fileId = result.fileId;
      } catch (error) {
        setProgress(null);
        if (!(error instanceof ImageKitAbortError)) setFormError(uploadErrorMessage(error));
        return;
      } finally {
        abortRef.current = null;
      }

      // 2. Have the server verify the file and add it to the library.
      const result = await saveUploadedMediaAction({ fileId, title, description });
      if (result.status === "success") {
        toast.add({ title: result.message ?? "Image uploaded.", type: "success" });
        reset();
        setOpen(false);
      } else {
        setProgress(null);
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.message ?? "We couldn't save your image.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Closing mid-upload cancels it.
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <UploadIcon data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Upload image</DialogTitle>
            <DialogDescription>
              {MEDIA_ACCEPTED_LABEL}, up to {MEDIA_MAX_SIZE_LABEL}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {selected ? (
              <div className="relative overflow-hidden rounded-lg border bg-muted">
                {/* A local blob preview: next/image can't optimize blob: URLs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.previewUrl} alt="" className="mx-auto max-h-56 object-contain" />
                <div className="flex items-center justify-between gap-2 border-t bg-background px-3 py-2 text-xs">
                  <span className="truncate">{selected.file.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    {formatBytes(selected.file.size)}
                    {!pending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Remove file"
                        onClick={() => setFile(null)}
                      >
                        <XIcon />
                      </Button>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <label
                htmlFor={inputId}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors hover:bg-muted/50",
                  dragging && "border-primary bg-muted/50",
                  fieldErrors.file && "border-destructive",
                )}
              >
                <ImageUpIcon className="size-8 text-muted-foreground" />
                <span className="font-medium">Drop an image here, or click to browse</span>
                <span className="text-xs text-muted-foreground">
                  {MEDIA_ACCEPTED_LABEL} · max {MEDIA_MAX_SIZE_LABEL}
                </span>
              </label>
            )}
            <input
              id={inputId}
              type="file"
              accept={MEDIA_ACCEPTED_TYPES.join(",")}
              className="sr-only"
              disabled={pending}
              onChange={(event) => {
                chooseFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <FieldError errors={fieldErrors.file?.map((message) => ({ message }))} />
          </div>

          <TextField
            name="title"
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MEDIA_TITLE_MAX}
            placeholder="e.g. Margherita pizza"
            disabled={pending}
            errors={fieldErrors.title}
          />
          <TextareaField
            name="description"
            label="Description"
            optional
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={MEDIA_DESCRIPTION_MAX}
            rows={3}
            placeholder="What's in this image, or where it will be used"
            disabled={pending}
            errors={fieldErrors.description}
          />

          {progress !== null && (
            <Progress value={progress} aria-label="Upload progress">
              <span className="text-xs text-muted-foreground">
                {progress < 100 ? `Uploading… ${progress}%` : "Saving to your library…"}
              </span>
            </Progress>
          )}
          {formError && <FieldError>{formError}</FieldError>}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending || !file}>
              {pending && <Spinner data-icon="inline-start" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
