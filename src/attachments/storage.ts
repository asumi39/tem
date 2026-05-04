import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, normalize, relative, sep } from "node:path";

export interface ObjectStorage {
  putObject(input: { key: string; body: Buffer; contentType: string }): Promise<void>;
  getSignedReadUrl(input: { key: string; expiresInSeconds: number }): Promise<string>;
}

function assertSafeObjectKey(key: string): void {
  const normalized = normalize(key);
  if (
    key.startsWith("/") ||
    normalized === ".." ||
    normalized.startsWith(`..${sep}`) ||
    normalized.includes(`${sep}..${sep}`)
  ) {
    throw new Error("Invalid object key");
  }
}

export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly rootDir: string) {}

  private pathForKey(key: string): string {
    assertSafeObjectKey(key);
    const targetPath = join(this.rootDir, key);
    const relativePath = relative(this.rootDir, targetPath);

    if (relativePath.startsWith("..") || relativePath === "" || relativePath.startsWith(sep)) {
      throw new Error("Invalid object key escapes storage root");
    }

    return targetPath;
  }

  async putObject(input: { key: string; body: Buffer; contentType: string }): Promise<void> {
    const targetPath = this.pathForKey(input.key);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, input.body);
  }

  async getSignedReadUrl(input: { key: string; expiresInSeconds: number }): Promise<string> {
    assertSafeObjectKey(input.key);
    const secret = process.env.LOCAL_STORAGE_SIGNING_SECRET ?? "local-dev-storage-secret";
    const signature = createHmac("sha256", secret)
      .update(`${input.key}:${input.expiresInSeconds}`)
      .digest("hex");
    const encodedKey = encodeURIComponent(input.key);

    return `/api/files/read/${encodedKey}?expires=${input.expiresInSeconds}&signature=${signature}`;
  }
}

export function createLocalObjectStorage(): LocalObjectStorage {
  return new LocalObjectStorage(process.env.LOCAL_OBJECT_STORAGE_DIR ?? ".local-storage");
}
