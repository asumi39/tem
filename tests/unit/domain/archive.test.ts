import { describe, expect, it } from "vitest";

import { buildAttemptSnapshots, calculateDurationSeconds } from "../../../src/exam-attempts/archive.service";

function hasUndefinedValue(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(hasUndefinedValue);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(hasUndefinedValue);
  }

  return false;
}

describe("archive helpers", () => {
  it("builds immutable attempt snapshots from ordered exam template questions", () => {
    const snapshots = buildAttemptSnapshots({
      id: "exam-1",
      title: "Writing Practice MVP",
      description: "Writing practice",
      durationMinutes: 45,
      visibilityConfig: { showExplanationsAfterSubmit: true },
      questions: [
        {
          order: 2,
          points: 60,
          question: {
            id: "q-2",
            type: "WRITING_PARAGRAPH",
            title: "Second",
            prompt: "Write second.",
            standardAnswer: "Second standard",
            explanation: "Second explanation",
            resources: [],
            renderConfig: {},
            gradingConfig: {}
          }
        },
        {
          order: 1,
          points: 40,
          question: {
            id: "q-1",
            type: "WRITING_FULL_MOCK",
            title: "First",
            prompt: "Write first.",
            standardAnswer: "First standard",
            explanation: "First explanation",
            resources: [{ kind: "image", label: "Campus" }],
            renderConfig: { minWords: 200 },
            gradingConfig: { rubricId: "rubric-1" }
          }
        }
      ]
    });

    expect(snapshots.examTemplateSnapshot).toMatchObject({
      id: "exam-1",
      title: "Writing Practice MVP",
      durationMinutes: 45
    });
    expect(snapshots.questionSnapshot).toMatchObject([
      { id: "q-1", order: 1, points: 40, title: "First" },
      { id: "q-2", order: 2, points: 60, title: "Second" }
    ]);
    expect(snapshots.standardAnswerSnapshot).toEqual({
      "q-1": "First standard",
      "q-2": "Second standard"
    });
    expect(snapshots.explanationSnapshot).toEqual({
      "q-1": "First explanation",
      "q-2": "Second explanation"
    });
  });

  it("accepts nullable and missing Prisma JSON fields and returns JSON-safe snapshots", () => {
    const snapshots = buildAttemptSnapshots({
      id: "exam-null-json",
      title: "Nullable JSON Exam",
      description: null,
      durationMinutes: null,
      visibilityConfig: null,
      questions: [
        {
          order: 1,
          points: 100,
          question: {
            id: "q-null-json",
            type: "WRITING_SUMMARY",
            title: "Nullable JSON Question",
            prompt: "Summarize the text.",
            standardAnswer: null,
            explanation: null,
            resources: null,
            renderConfig: null,
            gradingConfig: undefined
          }
        }
      ]
    });

    expect(snapshots.examTemplateSnapshot).toEqual({
      id: "exam-null-json",
      title: "Nullable JSON Exam",
      description: null,
      durationMinutes: null,
      visibilityConfig: null
    });
    expect(snapshots.questionSnapshot).toEqual([
      {
        id: "q-null-json",
        type: "WRITING_SUMMARY",
        title: "Nullable JSON Question",
        prompt: "Summarize the text.",
        order: 1,
        points: 100,
        resources: null,
        renderConfig: null
      }
    ]);
    expect(snapshots.standardAnswerSnapshot).toEqual({ "q-null-json": null });
    expect(snapshots.explanationSnapshot).toEqual({ "q-null-json": null });
    expect(hasUndefinedValue(snapshots)).toBe(false);
  });

  it("calculates duration seconds from startedAt and submittedAt", () => {
    expect(
      calculateDurationSeconds(
        new Date("2026-04-30T10:00:00.000Z"),
        new Date("2026-04-30T10:12:34.900Z")
      )
    ).toBe(755);
  });
});
