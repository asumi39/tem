import { describe, expect, it } from "vitest";
import { scoringOutputSchema, validateScoringOutput } from "@/src/scoring/scoring.schemas";

describe("scoringOutputSchema", () => {
  it("accepts valid structured scoring output", () => {
    const result = scoringOutputSchema.parse({
      score: 8,
      maxScore: 10,
      summary: "答案基本切题。",
      criteria: [
        { name: "内容", score: 4, maxScore: 5, feedback: "观点明确。" },
        { name: "语言", score: 4, maxScore: 5, feedback: "表达清楚。" }
      ],
      suggestions: ["增加例证。"]
    });

    expect(result.score).toBe(8);
    expect(result.maxScore).toBe(10);
    expect(result.criteria).toHaveLength(2);
  });

  it("rejects scores above maxScore", () => {
    expect(() =>
      scoringOutputSchema.parse({
        score: 12,
        maxScore: 10,
        summary: "超分。",
        criteria: [{ name: "内容", score: 12, maxScore: 10, feedback: "超分。" }],
        suggestions: ["重新评分。"]
      })
    ).toThrow();
  });

  it("rejects negative scores", () => {
    expect(() =>
      scoringOutputSchema.parse({
        score: -1,
        maxScore: 10,
        summary: "负分。",
        criteria: [{ name: "内容", score: -1, maxScore: 5, feedback: "负分。" }],
        suggestions: []
      })
    ).toThrow();
  });

  it("rejects zero maxScore", () => {
    expect(() =>
      scoringOutputSchema.parse({
        score: 0,
        maxScore: 0,
        summary: "零分。",
        criteria: [{ name: "内容", score: 0, maxScore: 0, feedback: "零分。" }],
        suggestions: []
      })
    ).toThrow();
  });

  it("rejects empty criteria array", () => {
    expect(() =>
      scoringOutputSchema.parse({
        score: 5,
        maxScore: 10,
        summary: "无标准。",
        criteria: [],
        suggestions: []
      })
    ).toThrow();
  });

  it("rejects empty summary", () => {
    expect(() =>
      scoringOutputSchema.parse({
        score: 5,
        maxScore: 10,
        summary: "",
        criteria: [{ name: "内容", score: 5, maxScore: 5, feedback: "有反馈。" }],
        suggestions: []
      })
    ).toThrow();
  });

  it("rejects criterion score above criterion maxScore", () => {
    expect(() =>
      scoringOutputSchema.parse({
        score: 5,
        maxScore: 10,
        summary: "有效。",
        criteria: [{ name: "内容", score: 6, maxScore: 5, feedback: "超分。" }],
        suggestions: []
      })
    ).toThrow();
  });
});

describe("validateScoringOutput", () => {
  it("returns parsed output on valid input", () => {
    const valid = {
      score: 75,
      maxScore: 100,
      summary: "Good response.",
      criteria: [
        { name: "Content", score: 35, maxScore: 40, feedback: "Well done." }
      ],
      suggestions: ["Add more examples."]
    };

    const result = validateScoringOutput(valid);
    expect(result.score).toBe(75);
  });

  it("throws on invalid input", () => {
    const invalid = {
      score: 150,
      maxScore: 100,
      summary: "Invalid",
      criteria: [],
      suggestions: []
    };

    expect(() => validateScoringOutput(invalid)).toThrow();
  });
});