import { z } from "zod";
import { ALLOWED_MIME_TYPES } from "../utils/objectKey";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export const presignUploadSchema = z.object({
  slug: z.string().trim().min(1, "Event slug is required"),
  mimeType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]], {
    message: "Unsupported file type",
  }),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, "File is too large (max 15MB)"),
});

export const confirmUploadSchema = z.object({
  slug: z.string().trim().min(1, "Event slug is required"),
  objectKey: z.string().trim().min(1, "objectKey is required"),
  mimeType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]], {
    message: "Unsupported file type",
  }),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, "File is too large (max 15MB)"),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export { MAX_UPLOAD_BYTES };
