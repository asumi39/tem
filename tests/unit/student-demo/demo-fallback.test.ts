import { afterEach, describe, expect, it, vi } from "vitest";

async function loadResponsesModule() {
  vi.resetModules();
  return import("../../../src/student-api/responses");
}

async function loadDemoStoreModule() {
  vi.resetModules();
  return import("../../../src/student-demo/demo-store");
}

describe("student demo fallback gating", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the same explicit gate as demo auth", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEMO_AUTH_ENABLED", "false");
    let { isDemoStudentFallbackEnabled } = await loadDemoStoreModule();
    expect(isDemoStudentFallbackEnabled()).toBe(false);

    vi.stubEnv("DEMO_AUTH_ENABLED", "true");
    ({ isDemoStudentFallbackEnabled } = await loadDemoStoreModule());
    expect(isDemoStudentFallbackEnabled()).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_AUTH_ENABLED", "true");
    ({ isDemoStudentFallbackEnabled } = await loadDemoStoreModule());
    expect(isDemoStudentFallbackEnabled()).toBe(false);
  });

  it("maps unauthenticated errors to 401", async () => {
    const { studentErrorResponse } = await loadResponsesModule();

    const response = studentErrorResponse(new Error("Unauthenticated"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthenticated" });
  });

  it("does not allow demo fallback for auth or authorization errors", async () => {
    const { shouldUseDemoStudentFallback } = await loadDemoStoreModule();

    expect(shouldUseDemoStudentFallback(new Error("Unauthenticated"))).toBe(false);
    expect(shouldUseDemoStudentFallback(new Error("Student access required"))).toBe(false);
  });
});
