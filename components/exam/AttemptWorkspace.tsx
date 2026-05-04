"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { WritingAnswerEditor } from "@/components/writing/WritingAnswerEditor";
import { SubmitExamDialog } from "@/components/exam/SubmitExamDialog";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { ImageUploadInput } from "@/components/upload/ImageUploadInput";
import { OcrReviewPanel } from "@/components/ocr/OcrReviewPanel";

type OcrJobView = {
  id: string;
  status?: string | null;
  text?: string | null;
  confidence?: number | null;
};

type AttemptWorkspaceProps = {
  attemptId: string;
  answerId: string;
  initialText: string;
  minWords?: number | null;
  maxWords?: number | null;
  startedAt: string | Date;
  durationMinutes?: number | null;
};

export function AttemptWorkspace({
  attemptId,
  answerId,
  initialText,
  minWords,
  maxWords,
  startedAt,
  durationMinutes
}: AttemptWorkspaceProps) {
  const router = useRouter();
  const [draftText, setDraftText] = useState(initialText);
  const [confirmedText, setConfirmedText] = useState(initialText);
  const [draftDirty, setDraftDirty] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [ocrJob, setOcrJob] = useState<OcrJobView | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  async function saveAnswer(text: string) {
    const response = await fetch(`/api/student/exam-attempts/${attemptId}/answers/${answerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error("Unable to save answer");
    }
  }

  async function submitAttempt() {
    if (draftDirty) {
      await saveAnswer(draftText);
      setDraftDirty(false);
    }

    const response = await fetch(`/api/student/exam-attempts/${attemptId}/submit`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Unable to submit attempt");
    }

    router.push(`/attempts/${attemptId}/result`);
    router.refresh();
  }

  async function startOcr(attachmentId: string) {
    setOcrError(null);
    const createResponse = await fetch("/api/ocr/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, attachmentId })
    });

    if (!createResponse.ok) {
      setOcrError("OCR could not be started. Please try another image.");
      return;
    }

    const createPayload = await createResponse.json() as { job?: OcrJobView };
    if (!createPayload.job?.id) {
      setOcrError("OCR job response was incomplete.");
      return;
    }

    const jobResponse = await fetch(`/api/ocr/jobs/${createPayload.job.id}`);
    if (!jobResponse.ok) {
      setOcrError("OCR result could not be loaded. Please try again.");
      return;
    }

    const jobPayload = await jobResponse.json() as { job?: OcrJobView };
    setOcrJob(jobPayload.job ?? createPayload.job);
  }

  const handleDraftChange = useCallback((text: string, dirty: boolean) => {
    setDraftText(text);
    setDraftDirty(dirty);
  }, []);

  const handleOcrConfirmed = useCallback((text: string) => {
    setDraftText(text);
    setConfirmedText(text);
    setDraftDirty(false);
  }, []);

  return (
    <div className="grid gap-5">
      <section className="rounded-[1.75rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)]/85 p-4 shadow-[0_22px_60px_rgba(42,31,20,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-muted)]">Attempt time</p>
            <p className="mt-1 text-sm text-[color:var(--tem-muted)]">Hide the clock when you need a calmer writing surface.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTimer((value) => !value)}
            aria-pressed={!showTimer}
            className="rounded-full border border-[color:var(--tem-border)] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--tem-ink)] transition hover:bg-[color:var(--tem-sand)]"
          >
            {showTimer ? "Hide timer" : "Show timer"}
          </button>
        </div>
        <div className="mt-4">
          <ExamTimer startedAt={startedAt} durationMinutes={durationMinutes} showTimer={showTimer} />
        </div>
      </section>
      <ImageUploadInput answerId={answerId} onUploaded={startOcr} />
      {ocrError ? <p role="alert" className="text-sm font-semibold text-[color:var(--tem-vermilion)]">{ocrError}</p> : null}
      <OcrReviewPanel
        key={ocrJob?.id ?? "no-job"}
        answerId={answerId}
        jobId={ocrJob?.id ?? null}
        initialText={ocrJob?.text ?? ""}
        confidence={ocrJob?.confidence}
        status={ocrJob?.status}
        onConfirmed={handleOcrConfirmed}
      />
      <WritingAnswerEditor
        answerId={answerId}
        initialText={initialText}
        controlledText={confirmedText || undefined}
        minWords={minWords}
        maxWords={maxWords}
        onSave={saveAnswer}
        onDraftChange={handleDraftChange}
      />
      <div className="flex justify-end">
        <SubmitExamDialog onSubmit={submitAttempt} />
      </div>
    </div>
  );
}
