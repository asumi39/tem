import type { Prisma, PrismaClient } from "@prisma/client";

import {
  examTemplateCreateSchema,
  type ExamTemplateCreateInput
} from "./exam-template.schemas";

export function validateExamTemplateCreateInput(
  input: unknown
): ExamTemplateCreateInput {
  return examTemplateCreateSchema.parse(input);
}

export function toExamTemplateCreateData(
  input: ExamTemplateCreateInput
): Prisma.ExamTemplateUncheckedCreateInput {
  return {
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    visibilityConfig: input.visibilityConfig as Prisma.InputJsonValue | undefined,
    createdById: input.createdById,
    questions: {
      create: input.questions.map((question) => ({
        questionId: question.questionId,
        order: question.order,
        points: question.points
      }))
    }
  };
}

export async function createExamTemplate(prisma: PrismaClient, input: unknown) {
  const data = toExamTemplateCreateData(validateExamTemplateCreateInput(input));

  return prisma.examTemplate.create({
    data,
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: true }
      }
    }
  });
}
