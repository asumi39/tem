import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { LocalObjectStorage } from "../../../src/attachments/storage";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("LocalObjectStorage", () => {
  it("stores objects privately under the configured root and returns signed local read URLs", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "tem4-storage-"));
    tempDirs.push(rootDir);
    const storage = new LocalObjectStorage(rootDir);

    await storage.putObject({
      key: "students/student-1/answers/answer-1/attachments/file.png",
      body: Buffer.from("image-bytes"),
      contentType: "image/png"
    });

    await expect(
      readFile(join(rootDir, "students/student-1/answers/answer-1/attachments/file.png"), "utf8")
    ).resolves.toBe("image-bytes");

    const signedUrl = await storage.getSignedReadUrl({
      key: "students/student-1/answers/answer-1/attachments/file.png",
      expiresInSeconds: 300
    });

    expect(signedUrl).toContain("/api/files/read/");
    expect(signedUrl).toContain("expires=300");
    expect(signedUrl).toContain("signature=");
  });

  it("rejects object keys that escape the storage root", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "tem4-storage-"));
    tempDirs.push(rootDir);
    const storage = new LocalObjectStorage(rootDir);

    await expect(
      storage.putObject({
        key: "../outside.png",
        body: Buffer.from("bad"),
        contentType: "image/png"
      })
    ).rejects.toThrow(/invalid|escape|key/i);
  });
});
