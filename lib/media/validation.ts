import { z } from "zod";

import { MEDIA_DESCRIPTION_MAX, MEDIA_TITLE_MAX } from "@/lib/media/constants";

/** Title and description the uploader enters. Shared by the upload form and the server. */
export const mediaDetailsSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, { error: "Title is required" })
    .max(MEDIA_TITLE_MAX, { error: `Must be ${MEDIA_TITLE_MAX} characters or fewer` }),
  description: z
    .string()
    .trim()
    .max(MEDIA_DESCRIPTION_MAX, { error: `Must be ${MEDIA_DESCRIPTION_MAX} characters or fewer` })
    .optional()
    .transform((value) => value || null),
});

/** What the browser sends after the file has reached ImageKit. */
export const saveMediaSchema = mediaDetailsSchema.extend({
  fileId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,64}$/, { error: "Invalid upload reference" }),
});

export type MediaDetailsInput = z.infer<typeof mediaDetailsSchema>;
export type SaveMediaInput = z.input<typeof saveMediaSchema>;
