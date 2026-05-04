import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }) => {
  const response = await request.post("/api/student/demo/reset");
  expect(response.ok()).toBeTruthy();
});

test("student imports an answer image with OCR, edits the recognized text, and archives it", async ({ page }) => {
  page.on("console", msg => console.log(`BROWSER: ${msg.text()}`));
  page.on("pageerror", err => console.log(`PAGE ERROR: ${err.message}`));

  await page.goto("/exams");
  await page.getByRole("button", { name: /Start writing attempt/i }).click();

  await expect(page).toHaveURL(/\/attempts\//);

  // Upload image
  await page.getByLabel(/Upload answer image/i).setInputFiles({
    name: "answer.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  });

  // Click Start OCR to upload and process
  await page.getByRole("button", { name: /Start OCR/i }).click();

  // Wait for OCR to complete and panel to appear
  await expect(page.getByLabel(/Review OCR text/i)).toBeVisible({ timeout: 10000 });

  const ocrEditor = page.getByLabel(/Review OCR text/i);
  await expect(ocrEditor).toHaveValue(/recognized OCR draft text/i);
  await expect(page.getByText(/Confidence 92%/i)).toBeVisible();

  const editedText = "Edited OCR final text for the archived TEM writing attempt.";
  await ocrEditor.fill(editedText);
  await page.getByRole("button", { name: /Use OCR text/i }).click();

  await expect(page.getByLabel(/Final writing answer/i)).toHaveValue(editedText);

  await page.getByRole("button", { name: /Submit attempt/i }).click();
  await page.getByRole("button", { name: /Archive and submit/i }).click();

  await expect(page).toHaveURL(/\/attempts\/[^/]+\/result/);
  await expect(page.getByText(editedText)).toBeVisible();
});
