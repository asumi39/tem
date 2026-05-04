import { randomUUID } from "node:crypto";

import { z } from "zod";

export const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxUploadBytes = 8 * 1024 * 1024;

export const uploadFileSchema = z.object({
  contentType: z.enum(allowedMimeTypes, {
    error: "Unsupported image MIME type"
  }),
  byteSize: z.number().int().nonnegative().max(maxUploadBytes, "File is too large. Maximum upload size is 8 MB."),
  originalFileName: z.string().min(1).max(255)
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type AllowedMimeType = (typeof allowedMimeTypes)[number];

export function validateUploadFile(input: unknown): UploadFileInput {
  return uploadFileSchema.parse(input);
}

function extensionForContentType(contentType: AllowedMimeType): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function safePathPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function generateAttachmentStorageKey(input: {
  studentId: string;
  answerId: string;
  contentType: AllowedMimeType;
  originalFileName?: string;
}): string {
  const extension = extensionForContentType(input.contentType);

  return [
    "students",
    safePathPart(input.studentId),
    "answers",
    safePathPart(input.answerId),
    "attachments",
    `${randomUUID()}.${extension}`
  ].join("/");
}
