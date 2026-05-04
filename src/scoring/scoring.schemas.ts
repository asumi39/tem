import { z } from "zod";

const scoringCriterionOutputSchema = z
  .object({
    name: z.string().trim().min(1),
    score: z.number().min(0),
    maxScore: z.number().positive(),
    feedback: z.string().trim().min(1)
  })
  .superRefine((criterion, context) => {
    if (criterion.score > criterion.maxScore) {
      context.addIssue({
        code: "custom",
        path: ["score"],
        message: "criterion score cannot exceed criterion maxScore"
      });
    }
  });

export const scoringOutputSchema = z
  .object({
    score: z.number().min(0),
    maxScore: z.number().positive(),
    summary: z.string().trim().min(1),
    criteria: z.array(scoringCriterionOutputSchema).min(1),
    suggestions: z.array(z.string().trim().min(1))
  })
  .superRefine((output, context) => {
    if (output.score > output.maxScore) {
      context.addIssue({
        code: "custom",
        path: ["score"],
        message: "score cannot exceed maxScore"
      });
    }
  });

export type ScoringOutput = z.infer<typeof scoringOutputSchema>;

export function validateScoringOutput(input: unknown): ScoringOutput {
  return scoringOutputSchema.parse(input);
}
