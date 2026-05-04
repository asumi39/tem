"use client";

import { useState, useTransition, useEffect } from "react";

type WritingAnswerEditorProps = {
  answerId: string;
  initialText: string;
  minWords?: number | null;
  maxWords?: number | null;
  onSave: (text: string) => Promise<void>;
  onDraftChange?: (text: string, dirty: boolean) => void;
  controlledText?: string;
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function WritingAnswerEditor({
  answerId,
  initialText,
  minWords,
  maxWords,
  onSave,
  onDraftChange,
  controlledText
}: WritingAnswerEditorProps) {
  const isControlled = controlledText !== undefined;

  const [uncontrolledText, setUncontrolledText] = useState(controlledText ?? initialText);
  const [savedText, setSavedText] = useState(controlledText ?? initialText);
  const [status, setStatus] = useState("Ready to write");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const text = isControlled ? controlledText : uncontrolledText;
  const dirty = text !== savedText;
  const words = countWords(text);

  const currentDirty = text !== savedText;

  useEffect(() => {
    if (isControlled && onDraftChange) {
      onDraftChange(text, currentDirty);
    }
  }, [text, currentDirty, isControlled, onDraftChange]);

  function handleChange(newText: string) {
    if (isControlled) {
      return;
    }
    setUncontrolledText(newText);
    setStatus("Editing draft");
  }

  function saveDraft() {
    setError(null);
    setStatus("Saving draft…");
    startTransition(async () => {
      try {
        await onSave(text);
        setSavedText(text);
        setStatus("Saved just now");
      } catch {
        setError("Draft could not be saved. Please try again before submitting.");
        setStatus("Save failed");
      }
    });
  }

  return (
    <section className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-4 shadow-[0_24px_80px_rgba(42,31,20,0.09)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">Answer sheet</p>
          <label htmlFor={`answer-${answerId}`} className="mt-2 block text-2xl font-black tracking-[-0.03em] text-[color:var(--tem-ink)]">
            Final writing answer
          </label>
        </div>
        <div className="rounded-full border border-[color:var(--tem-border)] px-4 py-2 text-sm text-[color:var(--tem-muted)]" aria-live="polite">
          {dirty ? "Unsaved changes" : status}
        </div>
      </div>
      <textarea
        id={`answer-${answerId}`}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        className="mt-5 min-h-[420px] w-full resize-y rounded-[1.5rem] border border-[color:var(--tem-border)] bg-[#fffdf8] p-5 text-lg leading-8 text-[color:var(--tem-ink)] outline-none transition focus:border-[color:var(--tem-vermilion)] focus:ring-4 focus:ring-[color:var(--tem-vermilion)]/10"
        placeholder="Compose your TEM-4 response here."
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm text-[color:var(--tem-muted)]">
          <span className="rounded-full bg-[color:var(--tem-sand)] px-3 py-1">{words} words</span>
          {minWords ? <span className="rounded-full bg-[color:var(--tem-sand)] px-3 py-1">Min {minWords}</span> : null}
          {maxWords ? <span className="rounded-full bg-[color:var(--tem-sand)] px-3 py-1">Max {maxWords}</span> : null}
        </div>
        <button
          type="button"
          onClick={saveDraft}
          disabled={isPending || !dirty}
          className="rounded-full bg-[color:var(--tem-ink)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--tem-paper)] transition hover:-translate-y-0.5 hover:bg-[color:var(--tem-vermilion)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPending ? "Saving…" : "Save draft"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-[color:var(--tem-vermilion)]">{error}</p> : null}
    </section>
  );
}
