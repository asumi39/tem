import type { Prisma, PrismaClient } from "@prisma/client";

import type { OcrProvider } from "../ocr/providers/mock-ocr-provider";

type OcrJobForProcessing = {
  id: string;
  answerId: string;
  attachmentId: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  attachment: {
    id: string;
    objectKey: string;
    contentType: string;
  } | null;
};

export async function processOcrJob(
  prisma: PrismaClient,
  provider: OcrProvider,
  jobId: string
) {
  const job = (await prisma.ocrJob.findFirst({
    where: { id: jobId },
    include: { attachment: true, answer: { include: { examAttempt: true } } }
  })) as OcrJobForProcessing | null;

  if (!job || !job.attachment || !job.attachmentId) {
    throw new Error("OCR job not found");
  }

  const claimed = await prisma.ocrJob.updateMany({
    where: { id: jobId, status: "PENDING" },
    data: { status: "PROCESSING", startedAt: new Date() }
  });

  if (claimed.count !== 1) {
    throw new Error("OCR job could not be claimed from pending status");
  }

  try {
    const output = await provider.recognize({
      attachmentId: job.attachment.id,
      objectKey: job.attachment.objectKey,
      contentType: job.attachment.contentType
    });

    await prisma.answer.updateMany({
      where: {
        id: job.answerId,
        examAttempt: { status: "IN_PROGRESS" }
      },
      data: { ocrText: output.text }
    });

    await prisma.ocrJob.updateMany({
      where: { id: jobId, status: "PROCESSING" },
      data: {
        status: "SUCCEEDED",
        provider: output.provider,
        modelName: output.modelName,
        modelVersion: output.modelVersion,
        outputText: output.text,
        confidence: output.confidence,
        outputPayload: {
          text: output.text,
          confidence: output.confidence,
          provider: output.provider,
          modelName: output.modelName,
          modelVersion: output.modelVersion
        } satisfies Prisma.InputJsonObject,
        completedAt: new Date()
      }
    });

    return prisma.ocrJob.findFirst({ where: { id: jobId } });
  } catch (error) {
    await prisma.ocrJob.updateMany({
      where: { id: jobId, status: "PROCESSING" },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "OCR processing failed",
        completedAt: new Date()
      }
    });

    return prisma.ocrJob.findFirst({ where: { id: jobId } });
  }
}
