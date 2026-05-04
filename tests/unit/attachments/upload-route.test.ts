import { afterEach, describe, expect, it, vi } from "vitest";

const createStudentAttachmentMock = vi.fn();
const getCurrentUserMock = vi.fn();

vi.mock("../../../src/attachments/attachment.service", () => ({
  createStudentAttachment: createStudentAttachmentMock
}));

vi.mock("../../../src/attachments/storage", () => ({
  createLocalObjectStorage: () => ({
    putObject: vi.fn(),
    getSignedReadUrl: vi.fn()
  })
}));

vi.mock("../../../src/auth/current-user", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/auth/current-user")>();
  return {
    ...actual,
    getCurrentUser: getCurrentUserMock
  };
});

vi.mock("../../../src/db/prisma", () => ({
  prisma: {}
}));

const uploadRoute = await import("../../../app/api/files/upload/route");
const { maxUploadBytes } = await import("../../../src/attachments/attachment.schemas");

function createMultipartRequest(file: Blob, answerId = "answer-1", headers?: HeadersInit) {
  const request = new Request("http://localhost/api/files/upload", {
    method: "POST",
    headers
  });
  vi.spyOn(request, "formData").mockResolvedValue({
    get: (key: string) => {
      if (key === "answerId") {
        return answerId;
      }
      if (key === "file") {
        return file;
      }
      return null;
    }
  } as FormData);

  return request;
}

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
}

function jpegBytes() {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
}

describe("file upload route validation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects oversized Content-Length before parsing multipart form data", async () => {
    const request = new Request("http://localhost/api/files/upload", {
      method: "POST",
      body: "not parsed",
      headers: { "Content-Length": String(maxUploadBytes + 1024 * 1024 + 1) }
    });
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await uploadRoute.POST(request);

    expect(response.status).toBe(413);
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(createStudentAttachmentMock).not.toHaveBeenCalled();
  });

  it("rejects oversized file.size before reading file bytes", async () => {
    const file = {
      name: "large.png",
      type: "image/png",
      size: maxUploadBytes + 1,
      arrayBuffer: vi.fn().mockResolvedValue(pngBytes().buffer)
    };

    const request = new Request("http://localhost/api/files/upload", { method: "POST" });
    vi.spyOn(request, "formData").mockResolvedValue({
      get: (key: string) => {
        if (key === "answerId") {
          return "answer-1";
        }
        if (key === "file") {
          return file;
        }
        return null;
      }
    } as FormData);

    const response = await uploadRoute.POST(request);

    expect(response.status).toBe(413);
    expect(file.arrayBuffer).not.toHaveBeenCalled();
    expect(createStudentAttachmentMock).not.toHaveBeenCalled();
  });

  it("rejects MIME spoofing when declared type does not match magic bytes", async () => {
    const file = new File([jpegBytes()], "spoof.png", { type: "image/png" });

    const response = await uploadRoute.POST(createMultipartRequest(file));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/content|mime|type/i) });
    expect(createStudentAttachmentMock).not.toHaveBeenCalled();
  });

  it("accepts matching declared MIME type and magic bytes", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "student-1", email: "student@example.com", role: "STUDENT" });
    createStudentAttachmentMock.mockResolvedValue({ id: "attachment-1" });
    const file = new File([pngBytes()], "essay.png", { type: "image/png" });

    const response = await uploadRoute.POST(createMultipartRequest(file));

    expect(response.status).toBe(201);
    expect(createStudentAttachmentMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { id: "student-1", email: "student@example.com", role: "STUDENT" },
      expect.objectContaining({ contentType: "image/png", body: Buffer.from(pngBytes()) })
    );
  });
});
