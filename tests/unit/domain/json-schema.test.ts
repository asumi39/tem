import { describe, expect, it } from "vitest";

import { answerUpsertSchema } from "../../../src/answers/answer.schemas";
import { startAttemptSchema } from "../../../src/exam-attempts/attempt.schemas";
import { examTemplateCreateSchema } from "../../../src/exam-templates/exam-template.schemas";
import { questionCreateSchema } from "../../../src/questions/question.schemas";

describe("persisted JSON field validation", () => {
  it("rejects non-JSON values in question JSON fields", () => {
    expect(() =>
      questionCreateSchema.parse({
        type: "WRITING_SUMMARY",
        title: "Bad JSON Question",
        prompt: "Write a summary.",
        renderConfig: { normalize: () => "not json" }
      })
    ).toThrow();
  });

  it("rejects nested undefined in persisted JSON boundaries", () => {
    expect(() =>
      examTemplateCreateSchema.parse({
        title: "Bad Visibility Config",
        visibilityConfig: { afterSubmit: undefined },
        questions: [{ questionId: "q-1", order: 1, points: 100 }]
      })
    ).toThrow();

    expect(() =>
      answerUpsertSchema.parse({
        examAttemptId: "attempt-1",
        questionId: "q-1",
        metadata: { ocr: { provider: undefined } }
      })
    ).toThrow();

    expect(() =>
      startAttemptSchema.parse({
        studentId: "student-1",
        examTemplateId: "exam-1",
        snapshots: {
          examTemplateSnapshot: { id: "exam-1" },
          questionSnapshot: [{ id: "q-1", renderConfig: { minWords: undefined } }]
        }
      })
    ).toThrow();
  });
});
