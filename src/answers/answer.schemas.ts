import { z } from "zod";

import { jsonObjectSchema } from "../shared/json.schemas";

export const inputMethodSchema = z.enum(["MANUAL", "OCR_IMAGE", "FILE_IMPORT"]);

export const answerUpsertSchema = z.object({
  examAttemptId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  inputMethod: inputMethodSchema.default("MANUAL"),
  manualText: z.string().optional(),
  ocrText: z.string().optional(),
  finalText: z.string().optional(),
  metadata: jsonObjectSchema.optional(),
  isSubmitted: z.boolean().optional(),
  submittedAt: z.date().optional()
});

export type AnswerUpsertInput = z.infer<typeof answerUpsertSchema>;
