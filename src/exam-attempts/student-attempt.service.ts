import type { Prisma, PrismaClient } from "@prisma/client";

import { assertStudentUser, type CurrentUser } from "../auth/current-user";
import { buildAttemptSnapshots } from "./archive.service";
import { prepareSubmitAttemptData } from "./attempt.service";
import { getVisibleWritingExamTemplateForAttempt } from "../exam-templates/student-exam.service";
import { StudentResourceNotFoundError } from "../shared/student-errors";
import { toJsonSafeObject, type JsonValue } from "../shared/json.schemas";

const attemptInclude = {
  answers: { orderBy: { createdAt: "asc" as const } },
  scoringResults: { orderBy: { createdAt: "asc" as const } }
};

type StudentAttempt = {
  id: string;
  studentId: string;
  examTemplateId: string;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  durationSeconds: number | null;
  totalScore: number | null;
  maxScore: number | null;
  examTemplateSnapshot: unknown;
  questionSnapshot: unknown;
  standardAnswerSnapshot?: unknown;
  explanationSnapshot?: unknown;
  answers?: unknown[];
  scoringResults?: unknown[];
};

function asJsonObject(value: unknown): Record<string, JsonValue> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return toJsonSafeObject(value as Record<string, unknown>);
  }

  return {};
}

function asJsonObjectArray(value: unknown): Record<string, JsonValue>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asJsonObject(item));
}

function byRecentActivity(left: StudentAttempt, right: StudentAttempt): number {
  const leftTime = (left.submittedAt ?? left.startedAt).getTime();
  const rightTime = (right.submittedAt ?? right.startedAt).getTime();

  return rightTime - leftTime;
}

export function redactAttemptSolutionsForInProgress<T extends { status: string }>(
  attempt: T
): T {
  if (attempt.status !== "IN_PROGRESS") {
    return attempt;
  }

  const redacted = { ...attempt } as T & {
    standardAnswerSnapshot?: unknown;
    explanationSnapshot?: unknown;
  };
  delete redacted.standardAnswerSnapshot;
  delete redacted.explanationSnapshot;

  return redacted as T;
}

async function runInTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>
) {
  return prisma.$transaction(async (tx) => callback(tx as PrismaClient));
}

export async function createStudentWritingAttempt(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  input: { examTemplateId: string; startedAt?: Date }
) {
  assertStudentUser(currentUser);

  const template = await getVisibleWritingExamTemplateForAttempt(
    prisma,
    input.examTemplateId
  );
  const snapshots = buildAttemptSnapshots(template);
  const startedAt = input.startedAt ?? new Date();

  const attempt = await prisma.examAttempt.create({
    data: {
      studentId: currentUser.id,
      examTemplateId: input.examTemplateId,
      status: "IN_PROGRESS",
      startedAt,
      examTemplateSnapshot:
        snapshots.examTemplateSnapshot as Prisma.InputJsonValue,
      questionSnapshot: snapshots.questionSnapshot as Prisma.InputJsonValue,
      standardAnswerSnapshot:
        snapshots.standardAnswerSnapshot as Prisma.InputJsonValue,
      explanationSnapshot: snapshots.explanationSnapshot as Prisma.InputJsonValue,
      answers: {
        create: snapshots.questionSnapshot.map((question) => ({
          questionId: String(question.id),
          inputMethod: "MANUAL" as const,
          manualText: null,
          finalText: null,
          isSubmitted: false
        }))
      }
    },
    include: attemptInclude
  });

  return redactAttemptSolutionsForInProgress(attempt);
}

export async function getStudentAttempt(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  attemptId: string
) {
  assertStudentUser(currentUser);

  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: currentUser.id },
    include: attemptInclude
  });

  if (!attempt) {
    throw new StudentResourceNotFoundError("Exam attempt not found");
  }

  return redactAttemptSolutionsForInProgress(attempt);
}

export async function submitStudentAttempt(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  input: { attemptId: string; submittedAt?: Date }
) {
  assertStudentUser(currentUser);

  return runInTransaction(prisma, async (tx) => {
    const attempt = (await tx.examAttempt.findFirst({
      where: {
        id: input.attemptId,
        studentId: currentUser.id,
        status: "IN_PROGRESS"
      },
      include: attemptInclude
    })) as StudentAttempt | null;

    if (!attempt) {
      throw new Error("Only in-progress attempts can be submitted");
    }

    const submitData = prepareSubmitAttemptData(
      { startedAt: attempt.startedAt, submittedAt: input.submittedAt },
      attempt.startedAt
    );

    await tx.answer.updateMany({
      where: { examAttemptId: input.attemptId },
      data: {
        isSubmitted: true,
        submittedAt: submitData.submittedAt
      }
    });

    return tx.examAttempt.update({
      where: { id: input.attemptId, status: "IN_PROGRESS" },
      data: submitData,
      include: attemptInclude
    });
  });
}


export async function getStudentAttemptResult(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  attemptId: string
) {
  assertStudentUser(currentUser);

  const attempt = (await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: currentUser.id },
    include: attemptInclude
  })) as StudentAttempt | null;

  if (!attempt) {
    throw new StudentResourceNotFoundError("Exam attempt not found");
  }

  if (attempt.status === "IN_PROGRESS") {
    throw new Error("Attempt results are only available after submission");
  }

  const standardAnswers = asJsonObject(attempt.standardAnswerSnapshot);
  const explanations = asJsonObject(attempt.explanationSnapshot);

  return {
    id: attempt.id,
    examTemplateId: attempt.examTemplateId,
    status: attempt.status,
    scoreStatus: attempt.totalScore === null ? "SUBMITTED" : "SCORED",
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    durationSeconds: attempt.durationSeconds,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    examTemplate: asJsonObject(attempt.examTemplateSnapshot),
    questions: asJsonObjectArray(attempt.questionSnapshot).map((question) => ({
      ...question,
      standardAnswer: standardAnswers[String(question.id)] ?? null,
      explanation: explanations[String(question.id)] ?? null
    })),
    answers: attempt.answers ?? [],
    scoringResults: attempt.scoringResults ?? []
  };
}

export function sortAttemptsByRecentActivity<T extends StudentAttempt>(
  attempts: T[]
): T[] {
  return [...attempts].sort(byRecentActivity);
}
