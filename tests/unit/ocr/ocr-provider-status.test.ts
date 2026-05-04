import { describe, expect, it } from "vitest";

import { MockOcrProvider } from "../../../src/ocr/providers/mock-ocr-provider";
import { assertOcrStatusTransition, ocrJobCreateSchema } from "../../../src/ocr/ocr.schemas";

describe("OCR provider and status helpers", () => {
  it("returns deterministic mock OCR text and confidence", async () => {
    const provider = new MockOcrProvider();

    const output = await provider.recognize({
      attachmentId: "attachment-1",
      objectKey: "students/student-1/answers/answer-1/attachments/file.png",
      contentType: "image/png"
    });

    expect(output).toEqual({
      text: "This is recognized mock OCR text for the writing answer.",
      confidence: 0.92,
      provider: "mock",
      modelName: "mock-ocr",
      modelVersion: "1.0"
    });
  });

  it("allows only expected OCR job transitions", () => {
    expect(assertOcrStatusTransition("PENDING", "PROCESSING")).toBeUndefined();
    expect(assertOcrStatusTransition("PROCESSING", "SUCCEEDED")).toBeUndefined();
    expect(assertOcrStatusTransition("PROCESSING", "FAILED")).toBeUndefined();

    expect(() => assertOcrStatusTransition("PENDING", "SUCCEEDED")).toThrow(/transition/i);
    expect(() => assertOcrStatusTransition("SUCCEEDED", "PROCESSING")).toThrow(/transition/i);
  });

  it("validates OCR job creation input", () => {
    expect(
      ocrJobCreateSchema.parse({ answerId: "answer-1", attachmentId: "attachment-1" })
    ).toEqual({ answerId: "answer-1", attachmentId: "attachment-1" });

    expect(() => ocrJobCreateSchema.parse({ answerId: "", attachmentId: "attachment-1" })).toThrow();
  });
});
