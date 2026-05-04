import { ZodError } from "zod";
import { createStudentAttachment } from "@/src/attachments/attachment.service";
import { allowedMimeTypes, maxUploadBytes, type AllowedMimeType } from "@/src/attachments/attachment.schemas";
import { createLocalObjectStorage } from "@/src/attachments/storage";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { createDemoAttachment, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

const maxMultipartRequestBytes = maxUploadBytes + 10 * 10 * 10 * 10 * 10 * 10;

type UploadFileLike = { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };

function isUploadFile(value: unknown): value is UploadFileLike {
  return typeof value === "object" && value !== null && "name" in value && typeof value.name === "string" && "type" in value && typeof value.type === "string" && "size" in value && typeof value.size === "number" && "arrayBuffer" in value && typeof value.arrayBuffer === "function";
}

function uploadError(message: string, status: number) { return studentJson({ error: message }, { status }); }

function hasOversizedContentLength(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  return Number.isFinite(Number(contentLength)) && Number(contentLength) > maxMultipartRequestBytes;
}

function sniffImageMimeType(bytes: Buffer): AllowedMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function isAllowedMimeType(contentType: string): contentType is AllowedMimeType { return allowedMimeTypes.includes(contentType as AllowedMimeType); }

export async function POST(request: Request) {
  if (hasOversizedContentLength(request)) return uploadError("Upload request is too large", 413);

  let answerId: string;
  let file: UploadFileLike;
  try {
    const formData = await request.formData();
    const aid = formData.get("answerId");
    const f = formData.get("file");
    if (typeof aid !== "string" || !isUploadFile(f)) return studentJson({ error: "answerId and file are required" }, { status: 400 });
    answerId = aid;
    file = f;
  } catch { return studentJson({ error: "Invalid form data" }, { status: 400 }); }

  if (file.size > maxUploadBytes) return uploadError("File is too large", 413);
  if (!isAllowedMimeType(file.type)) return uploadError("Unsupported image MIME type", 400);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > maxUploadBytes) return uploadError("File is too large", 413);
    const sniffedContentType = sniffImageMimeType(buffer);
    if (!sniffedContentType || sniffedContentType !== file.type) return uploadError("File content does not match declared MIME type", 400);

    const currentUser = await getCurrentUser();
    const attachment = await createStudentAttachment(prisma, createLocalObjectStorage(), currentUser, { answerId, fileName: file.name, contentType: file.type, body: buffer });
    return studentJson({ attachment }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return studentJson({ error: "Invalid upload", issues: error.issues }, { status: 400 });
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      return studentJson(createDemoAttachment(currentUser, { answerId, filename: file.name, contentType: file.type }), { status: 201 });
    }
    return studentErrorResponse(error);
  }
}