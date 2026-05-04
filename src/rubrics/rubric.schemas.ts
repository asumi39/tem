import { z } from "zod";

import { questionTypeSchema } from "../questions/question.schemas";

export const rubricCriterionSchema = z.object({
  name: z.string().trim().min(1),
  maxScore: z.number().positive(),
  description: z.string().trim().min(1).optional()
});

export const rubricSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    questionType: questionTypeSchema.optional(),
    maxScore: z.number().positive(),
    criteria: z.array(rubricCriterionSchema).min(1),
    createdById: z.string().trim().min(1).optional()
  })
  .superRefine((rubric, context) => {
    const criteriaMaxScore = rubric.criteria.reduce(
      (sum, criterion) => sum + criterion.maxScore,
      0
    );

    if (Math.abs(criteriaMaxScore - rubric.maxScore) > Number.EPSILON) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "criteria max scores must sum to rubric maxScore"
      });
    }
  });

export type RubricInput = z.infer<typeof rubricSchema>;
