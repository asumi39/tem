import { describe, expect, it } from "vitest";

import { validateExamTemplateCreateInput } from "../../../src/exam-templates/exam-template.service";

describe("exam template validation", () => {
  it("accepts ordered questions with positive points", () => {
    const template = validateExamTemplateCreateInput({
      title: "Writing Practice MVP",
      durationMinutes: 45,
      questions: [
        { questionId: "q-1", order: 1, points: 100 }
      ]
    });

    expect(template.questions).toEqual([{ questionId: "q-1", order: 1, points: 100 }]);
  });

  it("rejects duplicate question orders", () => {
    expect(() =>
      validateExamTemplateCreateInput({
        title: "Duplicate Order Exam",
        questions: [
          { questionId: "q-1", order: 1, points: 50 },
          { questionId: "q-2", order: 1, points: 50 }
        ]
      })
    ).toThrow(/question order values must be unique/i);
  });

  it("rejects non-positive question points", () => {
    expect(() =>
      validateExamTemplateCreateInput({
        title: "Zero Point Exam",
        questions: [
          { questionId: "q-1", order: 1, points: 0 }
        ]
      })
    ).toThrow(/points/i);
  });
});
