import { z } from "zod";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);

export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);

export function toJsonSafeValue(value: unknown): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("JSON values must contain only finite numbers");
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalized = toJsonSafeValue(item);
      return normalized === undefined ? null : normalized;
    });
  }

  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value).flatMap(([key, item]) => {
      const normalized = toJsonSafeValue(item);
      return normalized === undefined ? [] : [[key, normalized] as const];
    });

    return Object.fromEntries(entries);
  }

  throw new Error("Value must be JSON-serializable");
}

export function toJsonSafeObject(value: Record<string, unknown>): Record<string, JsonValue> {
  return toJsonSafeValue(value) as Record<string, JsonValue>;
}
