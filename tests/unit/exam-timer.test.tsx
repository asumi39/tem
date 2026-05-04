import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExamTimer } from "@/components/exam/ExamTimer";

const startedAt = "2026-04-30T10:00:00.000Z";

describe("ExamTimer", () => {
  it("shows elapsed and remaining time when a duration limit is present", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T10:12:05.000Z"));

    render(<ExamTimer startedAt={startedAt} durationMinutes={45} showTimer />);

    expect(screen.getByTestId("elapsed-time")).toHaveTextContent("Elapsed12:05");
    expect(screen.getByTestId("remaining-time")).toHaveTextContent("Remaining32:55");

    vi.useRealTimers();
  });

  it("renders a hidden-timer notice without elapsed values when timers are disabled", () => {
    render(<ExamTimer startedAt={startedAt} durationMinutes={45} showTimer={false} />);

    expect(screen.getByText(/Timer hidden/i)).toBeInTheDocument();
    expect(screen.queryByTestId("elapsed-time")).not.toBeInTheDocument();
  });
});
