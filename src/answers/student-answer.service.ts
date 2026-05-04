import type { PrismaClient } from "@prisma/client";

import { assertStudentUser, type CurrentUser } from "../auth/current-user";
import { StudentResourceNotFoundError } from "../shared/student-errors";

type OwnedAnswer = {
  id: string;
  examAttemptId: string;
  questionId: string;
  inputMethod?: string;
  manualText?: string | null;
  ocrText?: string | null;
  finalText?: string | null;
  isSubmitted?: boolean;
  submittedAt?: Date | null;
  examAttempt: {
    status: string;
  };
};

export async function saveStudentAnswerText(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  input: { attemptId: string; answerId: string; text: string }
) {
  assertStudentUser(currentUser);

  const answer = (await prisma.answer.findFirst({
    where: {
      id: input.answerId,
      examAttemptId: input.attemptId,
      examAttempt: { studentId: currentUser.id }
    },
    select: {
      id: true,
      examAttemptId: true,
      questionId: true,
      inputMethod: true,
      manualText: true,
      ocrText: true,
      finalText: true,
      isSubmitted: true,
      submittedAt: true,
      examAttempt: { select: { status: true } }
    }
  })) as OwnedAnswer | null;

  if (!answer || answer.examAttempt.status !== "IN_PROGRESS") {
    throw new StudentResourceNotFoundError("Answer not found");
  }

  const data = {
    inputMethod: "MANUAL" as const,
    manualText: input.text,
    finalText: input.text,
    isSubmitted: false
  };
  const updateResult = await prisma.answer.updateMany({
    where: {
      id: input.answerId,
      examAttemptId: input.attemptId,
      examAttempt: { studentId: currentUser.id, status: "IN_PROGRESS" }
    },
    data
  });

  if (updateResult.count !== 1) {
    throw new StudentResourceNotFoundError("Answer not found");
  }

  return {
    ...answer,
    ...data
  };
}
