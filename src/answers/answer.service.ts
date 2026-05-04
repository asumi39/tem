import type { Prisma, PrismaClient } from "@prisma/client";

import { answerUpsertSchema, type AnswerUpsertInput } from "./answer.schemas";

export function prepareAnswerUpsertData(input: unknown) {
  const data: AnswerUpsertInput = answerUpsertSchema.parse(input);

  return {
    examAttemptId: data.examAttemptId,
    questionId: data.questionId,
    inputMethod: data.inputMethod,
    manualText: data.manualText,
    ocrText: data.ocrText,
    finalText: data.finalText,
    metadata: data.metadata,
    isSubmitted: data.isSubmitted ?? false,
    submittedAt: data.submittedAt
  };
}

function toAnswerUncheckedData(
  data: ReturnType<typeof prepareAnswerUpsertData>
): Prisma.AnswerUncheckedCreateInput & Prisma.AnswerUncheckedUpdateInput {
  return {
    ...data,
    metadata: data.metadata as Prisma.InputJsonValue | undefined
  };
}

export async function saveAnswer(prisma: PrismaClient, input: unknown) {
  const data = toAnswerUncheckedData(prepareAnswerUpsertData(input));

  return prisma.answer.upsert({
    where: {
      examAttemptId_questionId: {
        examAttemptId: data.examAttemptId,
        questionId: data.questionId
      }
    },
    update: data,
    create: data
  });
}
