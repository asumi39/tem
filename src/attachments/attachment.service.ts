import type { PrismaClient } from "@prisma/client";

import { assertStudentUser, type CurrentUser } from "../auth/current-user";
import { StudentResourceNotFoundError } from "../shared/student-errors";
import {
  generateAttachmentStorageKey,
  validateUploadFile,
  type AllowedMimeType
} from "./attachment.schemas";
import type { ObjectStorage } from "./storage";

type OwnedAnswerForAttachment = {
  id: string;
  examAttempt: {
    studentId?: string;
    status: string;
  };
};

export async function createStudentAttachment(
  prisma: PrismaClient,
  storage: ObjectStorage,
  currentUser: CurrentUser,
  input: { answerId: string; fileName: string; contentType: string; body: Buffer }
) {
  assertStudentUser(currentUser);

  const validated = validateUploadFile({
    originalFileName: input.fileName,
    contentType: input.contentType,
    byteSize: input.body.byteLength
  });

  const answer = (await prisma.answer.findFirst({
    where: {
      id: input.answerId,
      examAttempt: { studentId: currentUser.id, status: "IN_PROGRESS" }
    },
    select: {
      id: true,
      examAttempt: { select: { studentId: true, status: true } }
    }
  })) as OwnedAnswerForAttachment | null;

  if (!answer || answer.examAttempt.status !== "IN_PROGRESS") {
    throw new StudentResourceNotFoundError("Answer not found");
  }

  const objectKey = generateAttachmentStorageKey({
    studentId: currentUser.id,
    answerId: input.answerId,
    contentType: validated.contentType as AllowedMimeType,
    originalFileName: validated.originalFileName
  });

  await storage.putObject({
    key: objectKey,
    body: input.body,
    contentType: validated.contentType
  });

  return prisma.attachment.create({
    data: {
      answerId: input.answerId,
      objectKey,
      fileName: validated.originalFileName,
      contentType: validated.contentType,
      byteSize: validated.byteSize
    }
  });
}
