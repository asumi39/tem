import { z } from "zod";

import { jsonObjectSchema, jsonValueSchema } from "../shared/json.schemas";
import { questionTypes } from "./question-types";

export const questionTypeSchema = z.enum(questionTypes);

export const questionCreateSchema = z.object({
  type: questionTypeSchema,
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  standardAnswer: jsonValueSchema.optional(),
  explanation: jsonValueSchema.optional(),
  scoringConfig: jsonObjectSchema.optional(),
  resources: jsonValueSchema.optional(),
  renderConfig: jsonObjectSchema.optional(),
  gradingConfig: jsonObjectSchema.optional(),
  createdById: z.string().trim().min(1).optional()
});

export const questionUpdateSchema = questionCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "question update must include at least one field" }
);

export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
