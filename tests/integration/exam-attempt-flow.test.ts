import { describe, expect, it } from "vitest";

import { prepareStartAttemptData, prepareSubmitAttemptData } from "../../src/exam-attempts/attempt.service";
import { prepareAnswerUpsertData } from "../../src/answers/answer.service";

describe("exam attempt flow helpers", () => {
  it("prepares start, answer save, and submit data without a database", () => {
    const startedAt = new Date("2026-04-30T09:00:00.000Z");
    const submittedAt = new Date("2026-04-30T09:30:10.000Z");

    const startData = prepareStartAttemptData({
      studentId: "student-1",
      examTemplateId: "exam-1",
      startedAt,
      snapshots: {
        examTemplateSnapshot: { id: "exam-1", title: "Writing Practice MVP" },
        questionSnapshot: [{ id: "q-1", order: 1, points: 100 }],
        standardAnswerSnapshot: { "q-1": "Standard answer" },
        explanationSnapshot: { "q-1": "Explanation" }
      }
    });

    expect(startData.status).toBe("IN_PROGRESS");
    expect(startData.examTemplateSnapshot).toMatchObject({ title: "Writing Practice MVP" });

    const answerData = prepareAnswerUpsertData({
      examAttemptId: "attempt-1",
      questionId: "q-1",
      inputMethod: "MANUAL",
      manualText: "My confirmed writing answer.",
      finalText: "My confirmed writing answer."
    });

    expect(answerData).toMatchObject({
      examAttemptId: "attempt-1",
      questionId: "q-1",
      isSubmitted: false
    });

    const submitData = prepareSubmitAttemptData({
      startedAt,
      submittedAt
    });

    expect(submitData).toEqual({
      status: "SUBMITTED",
      submittedAt,
      durationSeconds: 1810
    });
  });
});
