import { z } from "zod";

import { jsonObjectSchema, jsonValueSchema, toJsonSafeObject, type JsonValue } from "../shared/json.schemas";
import { questionTypeSchema } from "../questions/question.schemas";

const nullableJsonValueSchema = jsonValueSchema.optional().nullable();
const nullableJsonObjectSchema = jsonObjectSchema.optional().nullable();

const snapshotQuestionSchema = z.object({
  id: z.string().trim().min(1),
  type: questionTypeSchema,
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  standardAnswer: nullableJsonValueSchema,
  explanation: nullableJsonValueSchema,
  resources: nullableJsonValueSchema,
  renderConfig: nullableJsonObjectSchema,
  gradingConfig: nullableJsonObjectSchema
});

export const archiveExamTemplateSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  visibilityConfig: nullableJsonObjectSchema,
  questions: z.array(
    z.object({
      order: z.number().int().positive(),
      points: z.number().int().positive(),
      question: snapshotQuestionSchema
    })
  )
});

export type ArchiveExamTemplate = z.infer<typeof archiveExamTemplateSchema>;

export interface AttemptSnapshots {
  examTemplateSnapshot: Record<string, JsonValue>;
  questionSnapshot: Record<string, JsonValue>[];
  standardAnswerSnapshot: Record<string, JsonValue>;
  explanationSnapshot: Record<string, JsonValue>;
}

export function buildAttemptSnapshots(input: unknown): AttemptSnapshots {
  const template = archiveExamTemplateSchema.parse(input);
  const orderedQuestions = [...template.questions].sort(
    (left, right) => left.order - right.order
  );

  return {
    examTemplateSnapshot: toJsonSafeObject({
      id: template.id,
      title: template.title,
      description: template.description,
      durationMinutes: template.durationMinutes,
      visibilityConfig: template.visibilityConfig
    }),
    questionSnapshot: orderedQuestions.map(({ order, points, question }) =>
      toJsonSafeObject({
        id: question.id,
        type: question.type,
        title: question.title,
        prompt: question.prompt,
        order,
        points,
        resources: question.resources,
        renderConfig: question.renderConfig,
        gradingConfig: question.gradingConfig
      })
    ),
    standardAnswerSnapshot: toJsonSafeObject(
      Object.fromEntries(
        orderedQuestions.map(({ question }) => [question.id, question.standardAnswer])
      )
    ),
    explanationSnapshot: toJsonSafeObject(
      Object.fromEntries(
        orderedQuestions.map(({ question }) => [question.id, question.explanation])
      )
    )
  };
}

export function calculateDurationSeconds(
  startedAt: Date,
  submittedAt: Date
): number {
  const durationMilliseconds = submittedAt.getTime() - startedAt.getTime();

  if (durationMilliseconds < 0) {
    throw new Error("submittedAt must be after startedAt");
  }

  return Math.ceil(durationMilliseconds / 1000);
}
