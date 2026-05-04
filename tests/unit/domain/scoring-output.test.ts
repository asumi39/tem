import { describe, expect, it } from "vitest";

import { validateScoringOutput } from "../../../src/scoring/scoring.schemas";

describe("scoringOutputSchema", () => {
  it("accepts structured scoring output when total and criterion scores fit their maximums", () => {
    const result = validateScoringOutput({
      score: 78,
      maxScore: 100,
      summary: "Clear position with room for stronger examples.",
      criteria: [
        { name: "Content", score: 30, maxScore: 40, feedback: "Addresses the task." },
        { name: "Language", score: 48, maxScore: 60, feedback: "Generally accurate." }
      ],
      suggestions: ["Add one concrete campus reading example."]
    });

    expect(result.score).toBe(78);
    expect(result.criteria).toHaveLength(2);
  });

  it("rejects a score above maxScore", () => {
    expect(() =>
      validateScoringOutput({
        score: 101,
        maxScore: 100,
        summary: "Invalid score.",
        criteria: [],
        suggestions: []
      })
    ).toThrow(/score cannot exceed maxScore/i);
  });

  it("rejects formal scoring output without criteria", () => {
    expect(() =>
      validateScoringOutput({
        score: 0,
        maxScore: 100,
        summary: "Missing rubric breakdown.",
        criteria: [],
        suggestions: []
      })
    ).toThrow(/criteria/i);
  });

  it("rejects a criterion score above its criterion maxScore", () => {
    expect(() =>
      validateScoringOutput({
        score: 90,
        maxScore: 100,
        summary: "Invalid criterion score.",
        criteria: [
          { name: "Content", score: 41, maxScore: 40, feedback: "Too high." }
        ],
        suggestions: []
      })
    ).toThrow(/criterion score cannot exceed criterion maxScore/i);
  });
});
