import { z } from "zod";

import { jsonObjectSchema } from "../shared/json.schemas";

const snapshotsSchema = z.object({
  examTemplateSnapshot: jsonObjectSchema,
  questionSnapshot: z.array(jsonObjectSchema),
  standardAnswerSnapshot: jsonObjectSchema.optional(),
  explanationSnapshot: jsonObjectSchema.optional()
});

export const startAttemptSchema = z.object({
  studentId: z.string().trim().min(1),
  examTemplateId: z.string().trim().min(1),
  startedAt: z.date().optional(),
  snapshots: snapshotsSchema
});

export const submitAttemptSchema = z.object({
  startedAt: z.date(),
  submittedAt: z.date().optional()
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
