import { connection } from "next/server";
import { startStudentAttempt } from "./actions";

import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { listVisibleWritingExams } from "@/src/exam-templates/student-exam.service";
import { isDemoStudentFallbackEnabled, listDemoVisibleWritingExams } from "@/src/student-demo/demo-store";
import type { StudentExamSummaryView } from "@/src/student-api/types";

async function getExams(): Promise<{ exams: StudentExamSummaryView[]; usingDemoFallback: boolean }> {
  try {
    const currentUser = await getCurrentUser();
    const exams = await listVisibleWritingExams(prisma, currentUser) as unknown as StudentExamSummaryView[];

    return { exams, usingDemoFallback: false };
  } catch (error) {
    if (!isDemoStudentFallbackEnabled()) {
      throw error;
    }

    return { ...listDemoVisibleWritingExams(), usingDemoFallback: true } as unknown as { exams: StudentExamSummaryView[]; usingDemoFallback: boolean };
  }
}

export default async function StudentExamsPage() {
  await connection();
  const { exams, usingDemoFallback } = await getExams();

  return (
    <div className="grid gap-8">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[color:var(--tem-ink)] p-8 text-[color:var(--tem-paper)] shadow-[0_30px_100px_rgba(42,31,20,0.22)] sm:p-12">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[color:var(--tem-gold)]/30" />
        <div className="absolute bottom-8 right-12 hidden h-24 w-24 rotate-12 border border-[color:var(--tem-vermilion)]/50 sm:block" />
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--tem-gold)]">Student writing MVP</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-[-0.06em] sm:text-7xl">Practice ledger</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--tem-paper)]/74">
          Choose a visible exam, write manually, and submit into an immutable archive. OCR and AI scoring stay outside this milestone.
        </p>
        {usingDemoFallback ? (
          <p className="mt-5 max-w-2xl rounded-2xl border border-[color:var(--tem-gold)]/30 bg-white/8 p-4 text-sm text-[color:var(--tem-paper)]/78">
            Development demo data is active because the database is unavailable or unseeded. This fallback is disabled in production and does not add auth behavior.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {exams.map((exam) => (
          <article key={exam.id} className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-6 shadow-[0_22px_70px_rgba(42,31,20,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[color:var(--tem-sand)] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--tem-muted)]">
                {exam.questionCount} question{exam.questionCount === 1 ? "" : "s"}
              </span>
              <span className="text-sm font-semibold text-[color:var(--tem-muted)]">
                {exam.durationMinutes ? `${exam.durationMinutes} minutes` : "No time limit"}
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[color:var(--tem-ink)]">{exam.title}</h2>
            <p className="mt-3 min-h-16 leading-7 text-[color:var(--tem-muted)]">{exam.description}</p>
            <form action={startStudentAttempt} className="mt-6">
              <input type="hidden" name="examTemplateId" value={exam.id} />
              <button className="w-full rounded-full bg-[color:var(--tem-ink)] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-[color:var(--tem-paper)] transition hover:-translate-y-0.5 hover:bg-[color:var(--tem-vermilion)]">
                Start writing attempt
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
