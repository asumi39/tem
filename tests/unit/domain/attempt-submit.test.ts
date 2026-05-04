import { describe, expect, it, vi } from "vitest";

import { submitExamAttempt } from "../../../src/exam-attempts/attempt.service";

describe("submitExamAttempt", () => {
  it("calculates duration from the persisted attempt startedAt", async () => {
    const update = vi.fn().mockResolvedValue({ id: "attempt-1" });
    const prisma = {
      examAttempt: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "attempt-1",
          status: "IN_PROGRESS",
          startedAt: new Date("2026-04-30T10:00:00.000Z")
        }),
        update
      }
    };

    await submitExamAttempt(prisma as never, {
      attemptId: "attempt-1",
      submittedAt: new Date("2026-04-30T10:15:00.000Z")
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: "attempt-1", status: "IN_PROGRESS" },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date("2026-04-30T10:15:00.000Z"),
        durationSeconds: 900
      }
    });
  });

  it("rejects attempts that are not in progress before updating", async () => {
    const update = vi.fn();
    const prisma = {
      examAttempt: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "attempt-1",
          status: "SUBMITTED",
          startedAt: new Date("2026-04-30T10:00:00.000Z")
        }),
        update
      }
    };

    await expect(
      submitExamAttempt(prisma as never, {
        attemptId: "attempt-1",
        submittedAt: new Date("2026-04-30T10:15:00.000Z")
      })
    ).rejects.toThrow(/only in-progress attempts can be submitted/i);

    expect(update).not.toHaveBeenCalled();
  });
});
