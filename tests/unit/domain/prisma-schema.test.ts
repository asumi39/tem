import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

describe("Prisma domain schema", () => {
  it("stores OCR confidence as a first-class job field", () => {
    const ocrJobModel = schema.match(/model OcrJob \{[\s\S]*?\n\}/)?.[0];

    expect(ocrJobModel).toBeDefined();
    expect(ocrJobModel).toMatch(/confidence\s+Float\?/);
  });
});
