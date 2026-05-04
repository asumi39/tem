"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDuration } from "@/src/student-api/format";

type ExamTimerProps = {
  startedAt: string | Date;
  durationMinutes?: number | null;
  showTimer: boolean;
};

export function ExamTimer({ startedAt, durationMinutes, showTimer }: ExamTimerProps) {
  const startTime = useMemo(() => new Date(startedAt).getTime(), [startedAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!showTimer) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [showTimer]);

  if (!showTimer) {
    return (
      <section className="rounded-[1.75rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)]/85 p-5 shadow-[0_22px_60px_rgba(42,31,20,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-muted)]">Timer hidden</p>
        <p className="mt-2 text-sm text-[color:var(--tem-muted)]">Your attempt is still timed in the archive.</p>
      </section>
    );
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
  const limitSeconds = durationMinutes ? durationMinutes * 60 : null;
  const remainingSeconds = limitSeconds == null ? null : Math.max(0, limitSeconds - elapsedSeconds);
  const progress = limitSeconds == null ? 0 : Math.min(100, (elapsedSeconds / limitSeconds) * 100);

  return (
    <section className="rounded-[1.75rem] border border-[color:var(--tem-ink)] bg-[color:var(--tem-ink)] p-5 text-[color:var(--tem-paper)] shadow-[0_28px_80px_rgba(42,31,20,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-gold)]">Chronometer</p>
        <span className="rounded-full border border-[color:var(--tem-gold)]/40 px-3 py-1 text-xs text-[color:var(--tem-paper)]/75">
          {durationMinutes ? `${durationMinutes} min limit` : "Untimed template"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div data-testid="elapsed-time" className="rounded-2xl bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--tem-paper)]/60">Elapsed</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-3xl">{formatDuration(elapsedSeconds)}</p>
        </div>
        <div data-testid="remaining-time" className="rounded-2xl bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--tem-paper)]/60">Remaining</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-3xl">
            {remainingSeconds == null ? "No limit" : formatDuration(remainingSeconds)}
          </p>
        </div>
      </div>
      {limitSeconds != null ? (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12" aria-hidden="true">
          <div className="h-full rounded-full bg-[color:var(--tem-gold)]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </section>
  );
}
