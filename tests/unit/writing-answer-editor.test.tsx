import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    refresh: routerRefresh
  })
}));

import { WritingAnswerEditor } from "@/components/writing/WritingAnswerEditor";
import { AttemptWorkspace } from "@/components/exam/AttemptWorkspace";
import { SubmitExamDialog } from "@/components/exam/SubmitExamDialog";

describe("WritingAnswerEditor", () => {
  it("saves the current draft and shows a visible saved state", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <WritingAnswerEditor
        answerId="answer-1"
        initialText=""
        minWords={20}
        maxWords={250}
        onSave={onSave}
      />
    );

    await user.type(screen.getByLabelText(/Final writing answer/i), "A focused manual answer for TEM writing practice.");
    await user.click(screen.getByRole("button", { name: /Save draft/i }));

    expect(onSave).toHaveBeenCalledWith("A focused manual answer for TEM writing practice.");
    expect(screen.getAllByText(/Saved just now/i).length).toBeGreaterThan(0);
  });
});

describe("AttemptWorkspace", () => {
  it("saves the current unsaved editor text before submitting", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;

    try {
      render(
        <AttemptWorkspace
          attemptId="attempt-1"
          answerId="answer-1"
          initialText=""
          minWords={20}
          maxWords={250}
          startedAt="2026-04-30T10:00:00.000Z"
          durationMinutes={45}
        />
      );

      await user.type(screen.getByLabelText(/Final writing answer/i), "Unsaved final text");
      await user.click(screen.getByRole("button", { name: /Submit attempt/i }));
      await user.click(screen.getByRole("button", { name: /Archive and submit/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenNthCalledWith(
          1,
          "/api/student/exam-attempts/attempt-1/answers/answer-1",
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ text: "Unsaved final text" })
          })
        );
      });
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/student/exam-attempts/attempt-1/submit",
        expect.objectContaining({ method: "POST" })
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("uploads an answer image, shows editable OCR text, and confirms it as the final answer", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attachment: { id: "attachment-1" } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: { id: "job-1" } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          job: {
            id: "job-1",
            status: "SUCCEEDED",
            text: "Recognized OCR draft text.",
            confidence: 0.92
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ answer: { id: "answer-1", finalText: "Edited OCR final text." } })
      });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;

    try {
      render(
        <AttemptWorkspace
          attemptId="attempt-1"
          answerId="answer-1"
          initialText=""
          minWords={20}
          maxWords={250}
          startedAt="2026-04-30T10:00:00.000Z"
          durationMinutes={45}
        />
      );

      const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "answer.png", { type: "image/png" });
      await user.upload(screen.getByLabelText(/Upload answer image/i), file);
      await user.click(screen.getByRole("button", { name: /Start OCR/i }));

      const ocrEditor = await screen.findByLabelText(/Review OCR text/i);
      expect(ocrEditor).toHaveValue("Recognized OCR draft text.");
      expect(screen.getByText(/Confidence 92%/i)).toBeInTheDocument();

      await user.clear(ocrEditor);
      await user.type(ocrEditor, "Edited OCR final text.");
      await user.click(screen.getByRole("button", { name: /Use OCR text/i }));

      expect(screen.getByLabelText(/Final writing answer/i)).toHaveValue("Edited OCR final text.");
      expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/files/upload", expect.objectContaining({ method: "POST" }));
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/ocr/jobs",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answerId: "answer-1", attachmentId: "attachment-1" })
        })
      );
      expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/ocr/jobs/job-1");
      expect(fetchMock).toHaveBeenNthCalledWith(
        4,
        "/api/answers/answer-1/ocr-confirmation",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Edited OCR final text." })
        })
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("SubmitExamDialog", () => {
  it("opens accessibly, closes with Escape, and restores focus", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<SubmitExamDialog onSubmit={onSubmit} />);

    const opener = screen.getByRole("button", { name: /Submit attempt/i });
    opener.focus();
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", { name: /Submit and archive this attempt/i });
    expect(dialog).toHaveAttribute("aria-describedby");
    expect(screen.getByRole("button", { name: /Keep editing/i })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("keeps keyboard focus inside the open dialog", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<SubmitExamDialog onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /Submit attempt/i }));

    const keepEditing = screen.getByRole("button", { name: /Keep editing/i });
    const archive = screen.getByRole("button", { name: /Archive and submit/i });

    expect(keepEditing).toHaveFocus();
    await user.tab();
    expect(archive).toHaveFocus();
    await user.tab();
    expect(keepEditing).toHaveFocus();
    await user.tab({ shift: true });
    expect(archive).toHaveFocus();
  });

  it("announces submission errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("network"));

    render(<SubmitExamDialog onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /Submit attempt/i }));
    await user.click(screen.getByRole("button", { name: /Archive and submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Submission failed/i);
  });
});

