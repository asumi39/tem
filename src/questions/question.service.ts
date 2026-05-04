import type { Prisma, PrismaClient } from "@prisma/client";

import {
  questionCreateSchema,
  questionUpdateSchema,
  type QuestionCreateInput,
  type QuestionUpdateInput
} from "./question.schemas";

export function validateQuestionCreateInput(input: unknown): QuestionCreateInput {
  return questionCreateSchema.parse(input);
}

export function validateQuestionUpdateInput(input: unknown): QuestionUpdateInput {
  return questionUpdateSchema.parse(input);
}

function toQuestionCreateData(
  data: QuestionCreateInput
): Prisma.QuestionUncheckedCreateInput {
  return data as Prisma.QuestionUncheckedCreateInput;
}

function toQuestionUpdateData(
  data: QuestionUpdateInput
): Prisma.QuestionUncheckedUpdateInput {
  return data as Prisma.QuestionUncheckedUpdateInput;
}

export async function createQuestion(prisma: PrismaClient, input: unknown) {
  return prisma.question.create({
    data: toQuestionCreateData(validateQuestionCreateInput(input))
  });
}

export async function updateQuestion(
  prisma: PrismaClient,
  questionId: string,
  input: unknown
) {
  return prisma.question.update({
    where: { id: questionId },
    data: toQuestionUpdateData(validateQuestionUpdateInput(input))
  });
}
