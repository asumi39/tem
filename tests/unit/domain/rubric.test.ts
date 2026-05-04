import { describe, expect, it } from "vitest";

import { validateRubric } from "../../../src/rubrics/rubric.service";

describe("rubric validation", () => {
  it("accepts rubric criteria when max scores sum to the rubric maxScore", () => {
    const rubric = validateRubric({
      title: "TEM-4 Writing Mock Rubric",
      maxScore: 100,
      criteria: [
        { name: "Content", maxScore: 40, description: "Task fulfillment" },
        { name: "Organization", maxScore: 20, description: "Structure" },
        { name: "Language", maxScore: 40, description: "Accuracy and range" }
      ]
    });

    expect(rubric.criteria.map((criterion) => criterion.name)).toEqual([
      "Content",
      "Organization",
      "Language"
    ]);
  });

  it("rejects rubric criteria when max scores do not sum to maxScore", () => {
    expect(() =>
      validateRubric({
        title: "Broken Rubric",
        maxScore: 100,
        criteria: [
          { name: "Content", maxScore: 40 },
          { name: "Language", maxScore: 50 }
        ]
      })
    ).toThrow(/criteria max scores must sum to rubric maxScore/i);
  });
});
