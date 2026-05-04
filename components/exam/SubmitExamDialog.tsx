"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type SubmitExamDialogProps = {
  disabled?: boolean;
  onSubmit: () => Promise<void>;
};

export function SubmitExamDialog({ disabled, onSubmit }: SubmitExamDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const firstFocusable = cancelButtonRef.current;
      const lastFocusable = submitButtonRef.current;

      if (!firstFocusable || !lastFocusable) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      openButtonRef.current?.focus();
    }
  }, [open]);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit();
      } catch {
        setError("Submission failed. Save your draft and try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        ref={openButtonRef}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={disabled}
        className="rounded-full bg-[color:var(--tem-vermilion)] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(180,62,35,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Submit attempt
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[color:var(--tem-ink)]/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-dialog-title"
            aria-describedby="submit-dialog-description"
            className="max-w-lg rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-7 shadow-[0_30px_100px_rgba(42,31,20,0.28)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">Archive checkpoint</p>
            <h2 id="submit-dialog-title" className="mt-3 text-3xl font-black tracking-[-0.04em] text-[color:var(--tem-ink)]">
              Submit and archive this attempt?
            </h2>
            <p id="submit-dialog-description" className="mt-4 leading-7 text-[color:var(--tem-muted)]">
              This attempt will be archived with your submitted answer, duration, prompt snapshot, standard-answer snapshot, and explanation snapshot. You cannot edit it after submission.
            </p>
            {error ? <p role="alert" className="mt-4 text-sm font-semibold text-[color:var(--tem-vermilion)]">{error}</p> : null}
            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-full border border-[color:var(--tem-border)] px-5 py-3 text-sm font-bold text-[color:var(--tem-ink)] transition hover:bg-[color:var(--tem-sand)] disabled:opacity-50"
              >
                Keep editing
              </button>
              <button
                ref={submitButtonRef}
                type="button"
                onClick={submit}
                disabled={isPending}
                className="rounded-full bg-[color:var(--tem-ink)] px-5 py-3 text-sm font-bold text-[color:var(--tem-paper)] transition hover:bg-[color:var(--tem-vermilion)] disabled:opacity-50"
              >
                {isPending ? "Archiving…" : "Archive and submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
