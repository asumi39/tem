import type { PrismaClient } from "@prisma/client";

import { assertStudentUser, type CurrentUser } from "../auth/current-user";
import { sortAttemptsByRecentActivity } from "../exam-attempts/student-attempt.service";
import { toJsonSafeObject } from "../shared/json.schemas";

type HistoryAttempt = {
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
  standardAnswerSnapshot: unknown;
  explanationSnapshot: unknown;
};

function snapshotTitle(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = toJsonSafeObject(value as Record<string, unknown>);
  return typeof snapshot.title === "string" ? snapshot.title : null;
}

export async function listStudentAttemptHistory(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  options: { take?: number } = {}
) {
  assertStudentUser(currentUser);

  const attempts = (await prisma.examAttempt.findMany({
    where: { studentId: currentUser.id },
    orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    take: options.take ?? 50
  })) as HistoryAttempt[];

  return sortAttemptsByRecentActivity(attempts).map((attempt) => ({
    id: attempt.id,
    examTemplateId: attempt.examTemplateId,
    examTitle: snapshotTitle(attempt.examTemplateSnapshot),
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    durationSeconds: attempt.durationSeconds,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore
  }));
}
