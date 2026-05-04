import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }) => {
  const response = await request.post("/api/student/demo/reset");
  expect(response.ok()).toBeTruthy();
});

test("student completes a manual-input writing attempt and views archived result/history", async ({ page }) => {
  await page.goto("/exams");

  await expect(page.getByRole("heading", { name: /Practice ledger/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Writing Practice MVP" })).toBeVisible();

  await page.getByRole("button", { name: /Start writing attempt/i }).click();

  await expect(page).toHaveURL(/\/attempts\//);
  await expect(page.getByRole("heading", { name: /Campus Reading/i })).toBeVisible();
  await expect(page.getByTestId("elapsed-time")).toContainText("Elapsed");
  await expect(page.getByTestId("remaining-time")).toContainText("Remaining");

  const editor = page.getByLabel(/Final writing answer/i);
  await editor.fill(
    "Campus reading programs should be required because they give students a shared intellectual rhythm. The archive of common books can support discussion, vocabulary growth, and clearer writing habits."
  );

  await page.getByRole("button", { name: /Save draft/i }).click();
  await expect(page.getByText(/Saved just now/i)).toBeVisible();

  await page.getByRole("button", { name: /Submit attempt/i }).click();
  await expect(page.getByRole("dialog")).toContainText(/archived/i);
  await page.getByRole("button", { name: /Archive and submit/i }).click();

  await expect(page).toHaveURL(/\/attempts\/[^/]+\/result/);
  await expect(page.getByRole("heading", { name: /Archived result/i })).toBeVisible();
  await expect(page.getByText(/give students a shared intellectual rhythm/i)).toBeVisible();
  await expect(page.getByText(/Score pending/i).first()).toBeVisible();
  await expect(page.getByText(/State a clear position on required campus reading programs/i)).toBeVisible();
  await expect(page.getByText(/A strong response should present a clear thesis/i)).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: /History/i }).click();
  await expect(page).toHaveURL(/\/history/);
  await expect(page.getByRole("heading", { name: /Attempt archive/i })).toBeVisible();
  await expect(page.getByText("Writing Practice MVP").first()).toBeVisible();
  await expect(page.getByText(/Score pending/i).first()).toBeVisible();
});

test("submitting archives unsaved editor text and the timer can be hidden and shown", async ({ page }) => {
  await page.goto("/exams");
  await page.getByRole("button", { name: /Start writing attempt/i }).click();

  await expect(page).toHaveURL(/\/attempts\//);
  await expect(page.getByTestId("elapsed-time")).toBeVisible();
  await expect(page.getByRole("button", { name: /Hide timer/i })).toBeVisible();

  await page.getByRole("button", { name: /Hide timer/i }).click();
  await expect(page.getByText(/Timer hidden/i)).toBeVisible();
  await expect(page.getByTestId("elapsed-time")).toBeHidden();

  await page.getByRole("button", { name: /Show timer/i }).click();
  await expect(page.getByTestId("elapsed-time")).toBeVisible();

  const unsavedAnswer =
    "This unsaved answer should still be archived because submit captures the current editor text before finalizing the attempt.";
  await page.getByLabel(/Final writing answer/i).fill(unsavedAnswer);
  await expect(page.getByText(/Unsaved changes/i)).toBeVisible();

  await page.getByRole("button", { name: /Submit attempt/i }).click();
  await page.getByRole("button", { name: /Archive and submit/i }).click();

  await expect(page).toHaveURL(/\/attempts\/[^/]+\/result/);
  await expect(page.getByText(unsavedAnswer)).toBeVisible();
});

