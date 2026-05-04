import type { PrismaClient } from "@prisma/client";

import { assertStudentUser, type CurrentUser } from "../auth/current-user";
import { StudentResourceNotFoundError } from "../shared/student-errors";
import { ocrConfirmationSchema, ocrJobCreateSchema } from "./ocr.schemas";

type OwnedAnswerForOcr = {
  id: string;
  examAttempt: {
    studentId?: string;
    status: string;
  };
};

export async function createOcrJob(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  input: unknown
) {
  assertStudentUser(currentUser);
  const data = ocrJobCreateSchema.parse(input);

  const answer = (await prisma.answer.findFirst({
    where: {
      id: data.answerId,
      examAttempt: { studentId: currentUser.id, status: "IN_PROGRESS" }
    },
    select: {
      id: true,
      examAttempt: { select: { studentId: true, status: true } }
    }
  })) as OwnedAnswerForOcr | null;

  if (!answer || answer.examAttempt.status !== "IN_PROGRESS") {
    throw new StudentResourceNotFoundError("Answer not found");
  }

  const attachment = await prisma.attachment.findFirst({
    where: {
      id: data.attachmentId,
      answerId: data.answerId,
      answer: { examAttempt: { studentId: currentUser.id, status: "IN_PROGRESS" } }
    }
  });

  if (!attachment) {
    throw new StudentResourceNotFoundError("Attachment not found");
  }

  return prisma.ocrJob.create({
    data: {
      answerId: data.answerId,
      attachmentId: data.attachmentId,
      status: "PENDING",
      provider: "mock"
    }
  });
}

export async function getStudentOcrJob(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  jobId: string
) {
  assertStudentUser(currentUser);

  const job = await prisma.ocrJob.findFirst({
    where: {
      id: jobId,
      answer: { examAttempt: { studentId: currentUser.id } }
    }
  });

  if (!job) {
    throw new StudentResourceNotFoundError("OCR job not found");
  }

  return job;
}

export async function confirmAnswerOcrText(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  input: { answerId: string; text: string }
) {
  assertStudentUser(currentUser);
  const data = ocrConfirmationSchema.parse({ text: input.text });

  const answer = (await prisma.answer.findFirst({
    where: {
      id: input.answerId,
      examAttempt: { studentId: currentUser.id }
    },
    select: {
      id: true,
      examAttempt: { select: { studentId: true, status: true } }
    }
  })) as OwnedAnswerForOcr | null;

  if (!answer || answer.examAttempt.status !== "IN_PROGRESS") {
    throw new StudentResourceNotFoundError("Answer not found");
  }

  const updateResult = await prisma.answer.updateMany({
    where: {
      id: input.answerId,
      examAttempt: { studentId: currentUser.id, status: "IN_PROGRESS" }
    },
    data: {
      finalText: data.text,
      inputMethod: "OCR_IMAGE",
      isSubmitted: false
    }
  });

  if (updateResult.count !== 1) {
    throw new StudentResourceNotFoundError("Answer not found");
  }

  return {
    ...answer,
    finalText: data.text,
    inputMethod: "OCR_IMAGE",
    isSubmitted: false
  };
}
