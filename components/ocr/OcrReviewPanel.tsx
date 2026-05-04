"use client";

import { useState, useTransition } from "react";

type OcrReviewPanelProps = {
  answerId: string;
  jobId: string | null;
  initialText: string;
  confidence?: number | null;
  status?: string | null;
  onConfirmed: (text: string) => Promise<void> | void;
};

function confidenceLabel(confidence?: number | null) {
  if (typeof confidence !== "number") {
    return null;
  }

  return `Confidence ${Math.round(confidence * 100)}%`;
}

export function OcrReviewPanel({
  answerId,
  jobId,
  initialText,
  confidence,
  status,
  onConfirmed
}: OcrReviewPanelProps) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!jobId && !initialText) {
    return null;
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/answers/${answerId}/ocr-confirmation`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });

        if (!response.ok) {
          throw new Error("OCR confirmation failed");
        }

        await response.json();
        await onConfirmed(text);
      } catch {
        setError("OCR text could not be confirmed. Please try again.");
      }
    });
  }

  const confidenceText = confidenceLabel(confidence);

  return (
    <section className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-4 shadow-[0_24px_80px_rgba(42,31,20,0.08)] sm:p-6">
      <div className="flex flex-nowrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">OCR review</p>
          <label htmlFor={`ocr-review-${answerId}`} className="mt-2 block text-2xl font-black tracking-[-0.03em] text-[color:var(--tem-ink)]">
            Review OCR text
          </label>
        </div>
        <div className="flex flex-nowrap gap-2 text-sm text-[color:var(--tem-muted)]" aria-live="polite">
          {status ? <span className="rounded-full bg-[color:var(--tem-sand)] px-3 py-1">{status}</span> : null}
          {confidenceText ? <span className="rounded-full bg-[color:var(--tem-sand)] px-3 py-1">{confidenceText}</span> : null}
        </div>
      </div>
      <textarea
        id={`ocr-review-${answerId}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="mt-5 min-h-[220px] w-full resize-y rounded-[1.5rem] border border-[color:var(--tem-border)] bg-[#fffdf8] p-5 text-lg leading-8 text-[color:var(--tem-ink)] outline-none transition focus:border-[color:var(--tem-vermilion)] focus:ring-4 focus:ring-[color:var(--tem-vermilion)]/10"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={confirm}
          disabled={isPending || text.trim().length === 0}
          className="rounded-full bg-[color:var(--tem-ink)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--tem-paper)] transition hover:-translate-y-0.5 hover:bg-[color:var(--tem-vermilion)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPending ? "Confirming…" : "Use OCR text"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm font-semibold text-[color:var(--tem-vermilion)]">{error}</p> : null}
    </section>
  );
}
