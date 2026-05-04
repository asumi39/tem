import { z } from "zod";

import { jsonObjectSchema } from "../shared/json.schemas";

const orderedQuestionSchema = z.object({
  questionId: z.string().trim().min(1),
  order: z.number().int().positive(),
  points: z.number().int().positive()
});

export const examTemplateCreateSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    durationMinutes: z.number().int().positive().optional(),
    visibilityConfig: jsonObjectSchema.optional(),
    createdById: z.string().trim().min(1).optional(),
    questions: z.array(orderedQuestionSchema).min(1)
  })
  .superRefine((value, context) => {
    const orders = new Set<number>();
    const questionIds = new Set<string>();

    for (const question of value.questions) {
      if (orders.has(question.order)) {
        context.addIssue({
          code: "custom",
          path: ["questions"],
          message: "question order values must be unique"
        });
      }
      orders.add(question.order);

      if (questionIds.has(question.questionId)) {
        context.addIssue({
          code: "custom",
          path: ["questions"],
          message: "questionIds must be unique within an exam template"
        });
      }
      questionIds.add(question.questionId);
    }
  });

export type ExamTemplateCreateInput = z.infer<typeof examTemplateCreateSchema>;
export type ExamTemplateQuestionInput = z.infer<typeof orderedQuestionSchema>;
