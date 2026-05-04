import { describe, expect, it, vi } from "vitest";

import { createStudentAttachment } from "../../src/attachments/attachment.service";
import { maxUploadBytes } from "../../src/attachments/attachment.schemas";
import { createOcrJob, getStudentOcrJob, confirmAnswerOcrText } from "../../src/ocr/ocr.service";
import { processOcrJob } from "../../src/workers/process-ocr-job";
import { MockOcrProvider } from "../../src/ocr/providers/mock-ocr-provider";
import type { ObjectStorage } from "../../src/attachments/storage";

const student = { id: "student-1", email: "student@example.com", role: "STUDENT" as const };
const otherStudent = { id: "student-2", email: "other@example.com", role: "STUDENT" as const };

function createPrismaForOcrFlow() {
  const answer = {
    id: "answer-1",
    examAttemptId: "attempt-1",
    questionId: "q-writing",
    inputMethod: "MANUAL",
    manualText: null,
    ocrText: null,
    finalText: null,
    isSubmitted: false,
    submittedAt: null,
    examAttempt: { id: "attempt-1", studentId: student.id, status: "IN_PROGRESS" }
  };
  const attachment = {
    id: "attachment-1",
    answerId: answer.id,
    objectKey: "students/student-1/answers/answer-1/attachments/generated.png",
    fileName: "original.png",
    contentType: "image/png",
    byteSize: 12,
    checksum: null,
    metadata: null,
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    answer
  };
  const ocrJob = {
    id: "ocr-job-1",
    answerId: answer.id,
    attachmentId: attachment.id,
    status: "PENDING",
    provider: null,
    modelName: null,
    modelVersion: null,
    inputSummary: null,
    outputText: null,
    confidence: null,
    outputPayload: null,
    errorMessage: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2026-04-30T10:01:00.000Z"),
    updatedAt: new Date("2026-04-30T10:01:00.000Z"),
    answer,
    attachment
  };

    const prisma = {
      answer: {
        findFirst: vi.fn().mockResolvedValue(answer),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      attachment: {
        create: vi.fn().mockResolvedValue(attachment),
        findFirst: vi.fn().mockResolvedValue(attachment)
      },
      ocrJob: {
        create: vi.fn().mockResolvedValue(ocrJob),
        findFirst: vi.fn().mockResolvedValue(ocrJob),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...ocrJob, ...data })),
        updateMany: vi.fn().mockImplementation(({ data }) => {
          Object.assign(ocrJob, data);
          return Promise.resolve({ count: 1 });
        })
      },
      $transaction: vi.fn(async (callback) => callback(prisma))
    };

  return { prisma, answer, attachment, ocrJob };
}

describe("M3 upload and OCR service flow", () => {
  it("valid upload stores the object and creates an owned attachment", async () => {
    const { prisma, attachment } = createPrismaForOcrFlow();
    const storage: ObjectStorage = {
      putObject: vi.fn().mockResolvedValue(undefined),
      getSignedReadUrl: vi.fn().mockResolvedValue("signed-url")
    };

    const created = await createStudentAttachment(prisma as never, storage, student, {
      answerId: "answer-1",
      fileName: "../../student-photo.png",
      contentType: "image/png",
      body: Buffer.from("image-bytes")
    });

    expect(created).toEqual(attachment);
    expect(storage.putObject).toHaveBeenCalledWith({
      key: expect.stringMatching(/^students\/student-1\/answers\/answer-1\/attachments\/[a-f0-9-]+\.png$/),
      body: Buffer.from("image-bytes"),
      contentType: "image/png"
    });
    expect(prisma.attachment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerId: "answer-1",
        contentType: "image/png",
        byteSize: Buffer.byteLength("image-bytes"),
        fileName: "../../student-photo.png",
        objectKey: expect.not.stringContaining("student-photo")
      })
    });
  });

  it("invalid MIME and oversized uploads fail before object storage writes", async () => {
    const { prisma } = createPrismaForOcrFlow();
    const storage: ObjectStorage = {
      putObject: vi.fn().mockResolvedValue(undefined),
      getSignedReadUrl: vi.fn().mockResolvedValue("signed-url")
    };

    await expect(
      createStudentAttachment(prisma as never, storage, student, {
        answerId: "answer-1",
        fileName: "essay.pdf",
        contentType: "application/pdf",
        body: Buffer.from("not image")
      })
    ).rejects.toThrow(/mime|content type|image/i);

    await expect(
      createStudentAttachment(prisma as never, storage, student, {
        answerId: "answer-1",
        fileName: "large.png",
        contentType: "image/png",
        body: Buffer.alloc(maxUploadBytes + 1)
      })
    ).rejects.toThrow(/8 MB|too large|size/i);

    expect(storage.putObject).not.toHaveBeenCalled();
    expect(prisma.attachment.create).not.toHaveBeenCalled();
  });

  it("creates an OCR job for an owned answer attachment", async () => {
    const { prisma } = createPrismaForOcrFlow();

    const job = await createOcrJob(prisma as never, student, {
      answerId: "answer-1",
      attachmentId: "attachment-1"
    });

    expect(job).toMatchObject({ id: "ocr-job-1", status: "PENDING" });
    expect(prisma.ocrJob.create).toHaveBeenCalledWith({
      data: {
        answerId: "answer-1",
        attachmentId: "attachment-1",
        status: "PENDING",
        provider: "mock"
      }
    });
  });

  it("processing a job updates OCR job output and answer OCR text", async () => {
    const { prisma } = createPrismaForOcrFlow();

    const processed = await processOcrJob(prisma as never, new MockOcrProvider(), "ocr-job-1");

    expect(processed).toMatchObject({
      status: "SUCCEEDED",
      outputText: "This is recognized mock OCR text for the writing answer.",
      confidence: 0.92
    });
    expect(prisma.ocrJob.updateMany).toHaveBeenCalledWith({
      where: { id: "ocr-job-1", status: "PENDING" },
      data: expect.objectContaining({ status: "PROCESSING", startedAt: expect.any(Date) })
    });
    expect(prisma.answer.updateMany).toHaveBeenCalledWith({
      where: {
        id: "answer-1",
        examAttempt: { status: "IN_PROGRESS" }
      },
      data: { ocrText: "This is recognized mock OCR text for the writing answer." }
    });
    expect(prisma.ocrJob.updateMany).toHaveBeenLastCalledWith({
      where: { id: "ocr-job-1", status: "PROCESSING" },
      data: expect.objectContaining({
        status: "SUCCEEDED",
        outputText: "This is recognized mock OCR text for the writing answer.",
        confidence: 0.92,
        completedAt: expect.any(Date)
      })
    });
  });

  it("does not process a job that is no longer pending when claimed", async () => {
    const { prisma, ocrJob } = createPrismaForOcrFlow();
    prisma.ocrJob.findFirst = vi.fn().mockResolvedValue({ ...ocrJob, status: "PROCESSING" });
    prisma.ocrJob.updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const provider = new MockOcrProvider();
    const recognizeSpy = vi.spyOn(provider, "recognize");

    await expect(processOcrJob(prisma as never, provider, "ocr-job-1")).rejects.toThrow(/pending|claim/i);

    expect(prisma.ocrJob.updateMany).toHaveBeenCalledWith({
      where: { id: "ocr-job-1", status: "PENDING" },
      data: { status: "PROCESSING", startedAt: expect.any(Date) }
    });
    expect(recognizeSpy).not.toHaveBeenCalled();
    expect(prisma.answer.updateMany).not.toHaveBeenCalled();
    expect(prisma.ocrJob.update).not.toHaveBeenCalled();
  });

  it("confirmation updates final answer text and input method for the owning in-progress answer", async () => {
    const { prisma } = createPrismaForOcrFlow();

    const confirmed = await confirmAnswerOcrText(prisma as never, student, {
      answerId: "answer-1",
      text: "Student edited OCR text."
    });

    expect(confirmed).toMatchObject({ finalText: "Student edited OCR text.", inputMethod: "OCR_IMAGE" });
    expect(prisma.answer.updateMany).toHaveBeenCalledWith({
      where: {
        id: "answer-1",
        examAttempt: { studentId: student.id, status: "IN_PROGRESS" }
      },
      data: {
        finalText: "Student edited OCR text.",
        inputMethod: "OCR_IMAGE",
        isSubmitted: false
      }
    });
  });

  it("prevents other students from reading OCR jobs", async () => {
    const { prisma } = createPrismaForOcrFlow();
    prisma.ocrJob.findFirst = vi.fn().mockResolvedValue(null);

    await expect(getStudentOcrJob(prisma as never, otherStudent, "ocr-job-1")).rejects.toThrow(/not found/i);

    expect(prisma.ocrJob.findFirst).toHaveBeenCalledWith({
      where: {
        id: "ocr-job-1",
        answer: { examAttempt: { studentId: otherStudent.id } }
      }
    });
  });

  it("prevents OCR confirmation after the attempt is submitted", async () => {
    const { prisma, answer } = createPrismaForOcrFlow();
    prisma.answer.findFirst = vi.fn().mockResolvedValue({
      ...answer,
      examAttempt: { id: "attempt-1", studentId: student.id, status: "SUBMITTED" }
    });

    await expect(
      confirmAnswerOcrText(prisma as never, student, {
        answerId: "answer-1",
        text: "Late edited OCR text."
      })
    ).rejects.toThrow(/not found|progress|submitted/i);

    expect(prisma.answer.updateMany).not.toHaveBeenCalled();
  });
});
