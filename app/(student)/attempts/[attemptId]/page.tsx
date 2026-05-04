import { connection } from "next/server";

import { QuestionRenderer } from "@/components/exam/QuestionRenderer";
import { AttemptWorkspace } from "@/components/exam/AttemptWorkspace";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { getStudentAttempt } from "@/src/exam-attempts/student-attempt.service";
import { getDemoStudentAttempt, isDemoStudentFallbackEnabled } from "@/src/student-demo/demo-store";
import type { StudentAnswerView, StudentAttemptView, StudentQuestionView } from "@/src/student-api/types";

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asQuestions(value: unknown): StudentQuestionView[] {
  return Array.isArray(value) ? value as StudentQuestionView[] : [];
}

function asAnswers(value: unknown): StudentAnswerView[] {
  return Array.isArray(value) ? value as StudentAnswerView[] : [];
}

function numberValue(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : null;
}

async function loadAttempt(attemptId: string): Promise<{ attempt: StudentAttemptView; usingDemoFallback: boolean }> {
  const currentUser = await getCurrentUser();

  try {
    const attempt = await getStudentAttempt(prisma, currentUser, attemptId) as unknown as StudentAttemptView;

    return { attempt, usingDemoFallback: false };
  } catch (error) {
    if (!isDemoStudentFallbackEnabled()) {
      throw error;
    }

    return { ...getDemoStudentAttempt(currentUser, attemptId), usingDemoFallback: true } as unknown as {
      attempt: StudentAttemptView;
      usingDemoFallback: boolean;
    };
  }
}

export default async function StudentAttemptPage({ params }: AttemptPageProps) {
  await connection();
  const { attemptId } = await params;
  const { attempt, usingDemoFallback } = await loadAttempt(attemptId);
  const questions = asQuestions(attempt.questionSnapshot);
  const question = questions[0];
  const answers = asAnswers(attempt.answers);
  const answer = question
    ? answers.find((candidate) => candidate.questionId === question.id) ?? answers[0]
    : answers[0];

  if (!question || !answer) {
    return (
      <section className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-8">
        <h1 className="text-3xl font-black tracking-[-0.04em]">Attempt unavailable</h1>
        <p className="mt-3 text-[color:var(--tem-muted)]">This attempt has no writable question snapshot.</p>
      </section>
    );
  }

  const examSnapshot = asRecord(attempt.examTemplateSnapshot);
  const durationMinutes = numberValue(examSnapshot, "durationMinutes");
  const minWords = numberValue(asRecord(question.renderConfig), "minWords");
  const maxWords = numberValue(asRecord(question.renderConfig), "maxWords");
  const answerView = answer as StudentAnswerView;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-5">
        {usingDemoFallback ? (
          <p className="rounded-2xl border border-[color:var(--tem-gold)]/40 bg-[color:var(--tem-paper)] p-4 text-sm text-[color:var(--tem-muted)]">
            Development demo attempt is active because the database path is unavailable.
          </p>
        ) : null}
        <QuestionRenderer question={question} />
        <AttemptWorkspace
          attemptId={attempt.id}
          answerId={answerView.id}
          initialText={answerView.finalText ?? answerView.manualText ?? ""}
          minWords={minWords}
          maxWords={maxWords}
          startedAt={attempt.startedAt}
          durationMinutes={durationMinutes}
        />
      </div>
      <aside className="lg:sticky lg:top-5 lg:self-start">
        <section className="rounded-[1.75rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)]/85 p-5 shadow-[0_22px_60px_rgba(42,31,20,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-muted)]">Archive note</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--tem-muted)]">Your submitted answer, prompt snapshot, and elapsed duration are preserved when you archive the attempt.</p>
        </section>
      </aside>
    </div>
  );
}
