import Link from "next/link";

import { formatDateTime, formatDuration } from "@/src/student-api/format";
import type { StudentHistoryItemView } from "@/src/student-api/types";

type AttemptHistoryListProps = {
  attempts: StudentHistoryItemView[];
};

function scoreLabel(attempt: StudentHistoryItemView) {
  if (attempt.totalScore == null) {
    return "Score pending";
  }

  return `${attempt.totalScore}/${attempt.maxScore ?? "—"}`;
}

export function AttemptHistoryList({ attempts }: AttemptHistoryListProps) {
  if (attempts.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-10 text-center">
        <h2 className="text-2xl font-black tracking-[-0.03em] text-[color:var(--tem-ink)]">No archived attempts yet</h2>
        <p className="mt-3 text-[color:var(--tem-muted)]">Start a writing exam to build your practice ledger.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      {attempts.map((attempt) => (
        <Link
          key={attempt.id}
          href={attempt.status === "IN_PROGRESS" ? `/attempts/${attempt.id}` : `/attempts/${attempt.id}/result`}
          className="group grid gap-4 rounded-[1.75rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-5 shadow-[0_18px_60px_rgba(42,31,20,0.07)] transition hover:-translate-y-0.5 hover:border-[color:var(--tem-vermilion)] sm:grid-cols-[1fr_auto]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--tem-muted)]">{attempt.status.replaceAll("_", " ")}</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[color:var(--tem-ink)]">
              {attempt.examTitle ?? "Archived writing attempt"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--tem-muted)]">
              Submitted {formatDateTime(attempt.submittedAt)} · Duration {formatDuration(attempt.durationSeconds)}
            </p>
          </div>
          <div className="self-center rounded-full bg-[color:var(--tem-sand)] px-4 py-2 text-sm font-bold text-[color:var(--tem-ink)] group-hover:bg-[color:var(--tem-gold)]">
            {scoreLabel(attempt)}
          </div>
        </Link>
      ))}
    </div>
  );
}
