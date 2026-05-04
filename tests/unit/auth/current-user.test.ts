import { afterEach, describe, expect, it, vi } from "vitest";

async function loadCurrentUserModule() {
  vi.resetModules();
  return import("../../../src/auth/current-user");
}

describe("demo current user gating", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables demo auth automatically in test", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEMO_AUTH_ENABLED", "false");
    const { getCurrentUser, isDemoAuthEnabled } = await loadCurrentUserModule();

    await expect(getCurrentUser()).resolves.toMatchObject({ id: "student-demo", role: "STUDENT" });
    expect(isDemoAuthEnabled()).toBe(true);
  });

  it("requires explicit demo auth opt-in outside test", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEMO_AUTH_ENABLED", "true");
    const { getCurrentUser, isDemoAuthEnabled } = await loadCurrentUserModule();

    await expect(getCurrentUser()).resolves.toMatchObject({ id: "student-demo", role: "STUDENT" });
    expect(isDemoAuthEnabled()).toBe(true);
  });

  it("rejects unauthenticated in development when demo auth is not explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEMO_AUTH_ENABLED", "false");
    const { getCurrentUser, isDemoAuthEnabled } = await loadCurrentUserModule();

    expect(isDemoAuthEnabled()).toBe(false);
    await expect(getCurrentUser()).rejects.toThrow(/unauthenticated/i);
  });

  it("never enables demo auth in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_AUTH_ENABLED", "true");
    const { getCurrentUser, isDemoAuthEnabled } = await loadCurrentUserModule();

    expect(isDemoAuthEnabled()).toBe(false);
    await expect(getCurrentUser()).rejects.toThrow(/unauthenticated/i);
  });
});
