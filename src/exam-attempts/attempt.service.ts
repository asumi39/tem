import type { Prisma, PrismaClient } from "@prisma/client";

import { buildAttemptSnapshots, calculateDurationSeconds } from "./archive.service";
import {
  startAttemptSchema,
  submitAttemptSchema,
  type StartAttemptInput,
  type SubmitAttemptInput
} from "./attempt.schemas";

export function prepareStartAttemptData(input: unknown) {
  const data: StartAttemptInput = startAttemptSchema.parse(input);

  return {
    studentId: data.studentId,
    examTemplateId: data.examTemplateId,
    status: "IN_PROGRESS" as const,
    startedAt: data.startedAt ?? new Date(),
    examTemplateSnapshot: data.snapshots.examTemplateSnapshot,
    questionSnapshot: data.snapshots.questionSnapshot,
    standardAnswerSnapshot: data.snapshots.standardAnswerSnapshot ?? {},
    explanationSnapshot: data.snapshots.explanationSnapshot ?? {}
  };
}

function toExamAttemptCreateData(
  data: ReturnType<typeof prepareStartAttemptData>
): Prisma.ExamAttemptUncheckedCreateInput {
  return {
    ...data,
    examTemplateSnapshot: data.examTemplateSnapshot as Prisma.InputJsonValue,
    questionSnapshot: data.questionSnapshot as Prisma.InputJsonValue,
    standardAnswerSnapshot: data.standardAnswerSnapshot as Prisma.InputJsonValue,
    explanationSnapshot: data.explanationSnapshot as Prisma.InputJsonValue
  };
}

export function prepareSubmitAttemptData(
  input: unknown,
  persistedStartedAt?: Date
) {
  const data: SubmitAttemptInput = submitAttemptSchema.parse(input);
  const submittedAt = data.submittedAt ?? new Date();
  const startedAt = persistedStartedAt ?? data.startedAt;

  return {
    status: "SUBMITTED" as const,
    submittedAt,
    durationSeconds: calculateDurationSeconds(startedAt, submittedAt)
  };
}

export async function startExamAttempt(
  prisma: PrismaClient,
  input: { studentId: string; examTemplateId: string; startedAt?: Date }
) {
  const template = await prisma.examTemplate.findUniqueOrThrow({
    where: { id: input.examTemplateId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: true }
      }
    }
  });

  return prisma.examAttempt.create({
    data: toExamAttemptCreateData(
      prepareStartAttemptData({
        ...input,
        snapshots: buildAttemptSnapshots(template)
      })
    )
  });
}

export async function submitExamAttempt(
  prisma: PrismaClient,
  input: { attemptId: string; submittedAt?: Date }
) {
  const attempt = await prisma.examAttempt.findUniqueOrThrow({
    where: { id: input.attemptId },
    select: { status: true, startedAt: true }
  });

  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("Only in-progress attempts can be submitted");
  }

  return prisma.examAttempt.update({
    where: { id: input.attemptId, status: "IN_PROGRESS" },
    data: prepareSubmitAttemptData(
      { startedAt: attempt.startedAt, submittedAt: input.submittedAt },
      attempt.startedAt
    )
  });
}
