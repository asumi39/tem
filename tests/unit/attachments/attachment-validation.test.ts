import { describe, expect, it } from "vitest";

import {
  allowedMimeTypes,
  maxUploadBytes,
  validateUploadFile,
  generateAttachmentStorageKey
} from "../../../src/attachments/attachment.schemas";

describe("attachment upload validation", () => {
  it("accepts supported image MIME types up to 8 MB", () => {
    expect(allowedMimeTypes).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(maxUploadBytes).toBe(8 * 1024 * 1024);

    expect(
      validateUploadFile({
        contentType: "image/png",
        byteSize: maxUploadBytes,
        originalFileName: "photo.png"
      })
    ).toEqual({ contentType: "image/png", byteSize: maxUploadBytes, originalFileName: "photo.png" });
  });

  it("rejects non-image MIME types", () => {
    expect(() =>
      validateUploadFile({
        contentType: "application/pdf",
        byteSize: 1024,
        originalFileName: "essay.pdf"
      })
    ).toThrow(/mime|content type|image/i);
  });

  it("rejects files larger than 8 MB", () => {
    expect(() =>
      validateUploadFile({
        contentType: "image/jpeg",
        byteSize: maxUploadBytes + 1,
        originalFileName: "large.jpg"
      })
    ).toThrow(/8 MB|too large|size/i);
  });

  it("generates storage keys without trusting the original filename", () => {
    const key = generateAttachmentStorageKey({
      studentId: "student-1",
      answerId: "answer-1",
      contentType: "image/webp",
      originalFileName: "../../evil.png"
    });

    expect(key).toMatch(/^students\/student-1\/answers\/answer-1\/attachments\/[a-f0-9-]+\.webp$/);
    expect(key).not.toContain("evil");
    expect(key).not.toContain("..");
  });
});
