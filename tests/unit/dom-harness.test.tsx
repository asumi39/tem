import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function HarnessExample() {
  return <h1>TEM-4 Practice</h1>;
}

describe("DOM test harness", () => {
  it("loads jest-dom matchers through setup", () => {
    render(<HarnessExample />);

    expect(screen.getByRole("heading", { name: "TEM-4 Practice" })).toBeInTheDocument();
  });
});
