import type { StudentQuestionView } from "@/src/student-api/types";

type QuestionRendererProps = {
  question: StudentQuestionView;
};

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function numberValue(value: unknown, key: string) {
  const record = recordValue(value);
  const nested = record?.[key];
  return typeof nested === "number" ? nested : null;
}

export function QuestionRenderer({ question }: QuestionRendererProps) {
  const minWords = numberValue(question.renderConfig, "minWords");
  const maxWords = numberValue(question.renderConfig, "maxWords");

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-7 shadow-[0_24px_80px_rgba(42,31,20,0.09)]">
      <div className="absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full border border-[color:var(--tem-vermilion)]/25" />
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--tem-muted)]">
        <span>Question {question.order ?? 1}</span>
        <span className="h-1 w-1 rounded-full bg-[color:var(--tem-vermilion)]" />
        <span>{question.points ?? 100} points</span>
      </div>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] text-[color:var(--tem-ink)] sm:text-5xl">
        {question.title ?? "Writing prompt"}
      </h1>
      <p className="mt-6 whitespace-pre-wrap text-xl leading-9 text-[color:var(--tem-ink)]/85">{question.prompt}</p>
      {minWords || maxWords ? (
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-[color:var(--tem-muted)]">
          {minWords ? <span className="rounded-full bg-[color:var(--tem-sand)] px-4 py-2">Minimum {minWords} words</span> : null}
          {maxWords ? <span className="rounded-full bg-[color:var(--tem-sand)] px-4 py-2">Target ceiling {maxWords} words</span> : null}
        </div>
      ) : null}
    </article>
  );
}
