import { connection } from "next/server";
import Link from "next/link";

import { formatDuration, stringifySnapshot } from "@/src/student-api/format";
import type { StudentAnswerView, StudentAttemptResultView } from "@/src/student-api/types";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { getStudentAttemptResult } from "@/src/exam-attempts/student-attempt.service";
import { getDemoStudentAttemptResult, isDemoStudentFallbackEnabled } from "@/src/student-demo/demo-store";

type ResultPageProps = {
  params: Promise<{ attemptId: string }>;
};

async function loadResult(attemptId: string): Promise<{ result: StudentAttemptResultView; usingDemoFallback: boolean }> {
  const currentUser = await getCurrentUser();

  try {
    const result = await getStudentAttemptResult(prisma, currentUser, attemptId) as unknown as StudentAttemptResultView;

    return { result, usingDemoFallback: false };
  } catch (error) {
    if (!isDemoStudentFallbackEnabled()) {
      throw error;
    }

    return { ...getDemoStudentAttemptResult(currentUser, attemptId), usingDemoFallback: true } as unknown as {
      result: StudentAttemptResultView;
      usingDemoFallback: boolean;
    };
  }
}

function scoreText(result: StudentAttemptResultView) {
  if (result.totalScore == null) {
    return "Score pending";
  }

  return `${result.totalScore}/${result.maxScore ?? "—"}`;
}

export default async function StudentAttemptResultPage({ params }: ResultPageProps) {
  await connection();
  const { attemptId } = await params;
  const { result, usingDemoFallback } = await loadResult(attemptId);
  const question = result.questions[0];
  const answer = question
    ? result.answers.find((candidate: StudentAnswerView) => candidate.questionId === question.id) ?? result.answers[0]
    : result.answers[0];

  return (
    <div className="grid gap-6">
      <section className="rounded-[2.5rem] bg-[color:var(--tem-ink)] p-8 text-[color:var(--tem-paper)] shadow-[0_30px_100px_rgba(42,31,20,0.22)] sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--tem-gold)]">Archived result</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-5xl font-black tracking-[-0.06em] sm:text-6xl">
              <span className="block text-2xl font-bold tracking-[-0.03em] text-[color:var(--tem-gold)]">Archived result</span>
              {String(result.examTemplate?.title ?? "Writing attempt")}
            </h1>
            <p className="mt-4 max-w-2xl text-[color:var(--tem-paper)]/72">
              This page reads from the attempt snapshots saved at submission time, not mutable live question text.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--tem-gold)]/35 bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--tem-paper)]/60">Score status</p>
            <p className="mt-1 text-3xl font-black text-[color:var(--tem-gold)]">{scoreText(result)}</p>
            <p className="mt-2 text-sm text-[color:var(--tem-paper)]/60">Duration {formatDuration(result.durationSeconds)}</p>
          </div>
        </div>
        {usingDemoFallback ? <p className="mt-4 text-sm text-[color:var(--tem-paper)]/62">Development demo data is active.</p> : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-6 shadow-[0_22px_70px_rgba(42,31,20,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">Submitted text</p>
          <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-[color:var(--tem-ink)]">{answer?.finalText ?? answer?.manualText ?? "No submitted text."}</p>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-6 shadow-[0_22px_70px_rgba(42,31,20,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">Prompt snapshot</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[color:var(--tem-ink)]">{question?.title ?? "Question"}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-[color:var(--tem-muted)]">{question?.prompt}</p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-6 shadow-[0_22px_70px_rgba(42,31,20,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">Standard answer snapshot</p>
          <p className="mt-4 whitespace-pre-wrap leading-8 text-[color:var(--tem-ink)]">{stringifySnapshot(question?.standardAnswer)}</p>
        </article>
        <article className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-6 shadow-[0_22px_70px_rgba(42,31,20,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">Explanation snapshot</p>
          <p className="mt-4 whitespace-pre-wrap leading-8 text-[color:var(--tem-ink)]">{stringifySnapshot(question?.explanation)}</p>
        </article>
      </section>

      <div className="flex justify-end">
        <Link href="/history" className="rounded-full bg-[color:var(--tem-ink)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--tem-paper)] transition hover:bg-[color:var(--tem-vermilion)]">
          History
        </Link>
      </div>
    </div>
  );
}
