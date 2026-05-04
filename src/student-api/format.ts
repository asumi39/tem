export function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) {
    return "Not submitted";
  }

  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function stringifySnapshot(value: unknown): string {
  if (value == null) {
    return "Not provided.";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stringifySnapshot(item)).join("\n");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record.text ?? record.guidance ?? record.outline ?? record.answer;

    if (preferred !== undefined) {
      return stringifySnapshot(preferred);
    }

    return Object.entries(record)
      .map(([key, entry]) => `${key}: ${stringifySnapshot(entry)}`)
      .join("\n");
  }

  return String(value);
}
