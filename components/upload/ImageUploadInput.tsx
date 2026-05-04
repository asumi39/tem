"use client";

import { useRef, useState, useTransition } from "react";

type ImageUploadInputProps = {
  answerId: string;
  onUploaded: (attachmentId: string) => Promise<void> | void;
};

export function ImageUploadInput({ answerId, onUploaded }: ImageUploadInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Choose a clear image of your handwritten answer.");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload() {
    if (!file) {
      setError("Choose an image before starting OCR.");
      return;
    }

    setError(null);
    setStatus("Uploading image…");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("answerId", answerId);
        formData.append("file", file);

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const payload = await response.json() as { attachment?: { id?: string } };
        const attachmentId = payload.attachment?.id;
        if (!attachmentId) {
          throw new Error("Upload response missing attachment id");
        }

        setStatus("Image uploaded. OCR can begin.");
        await onUploaded(attachmentId);
      } catch {
        setError("Image upload failed. Use a JPEG, PNG, or WebP image under 8 MB.");
        setStatus("Upload failed");
      }
    });
  }

  return (
    <section className="rounded-[2rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-4 shadow-[0_24px_80px_rgba(42,31,20,0.08)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--tem-vermilion)]">OCR import</p>
          <label htmlFor={`ocr-upload-${answerId}`} className="mt-2 block text-2xl font-black tracking-[-0.03em] text-[color:var(--tem-ink)]">
            Upload answer image
          </label>
        </div>
        <p className="rounded-full border border-[color:var(--tem-border)] px-4 py-2 text-sm text-[color:var(--tem-muted)]" aria-live="polite">
          {file ? file.name : "No image selected"}
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          ref={inputRef}
          id={`ocr-upload-${answerId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setError(null);
            setStatus("Ready to start OCR.");
            setFile(event.target.files?.[0] ?? null);
          }}
          className="w-full rounded-[1.25rem] border border-dashed border-[color:var(--tem-border)] bg-[#fffdf8] p-4 text-sm text-[color:var(--tem-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--tem-ink)] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[color:var(--tem-paper)]"
        />
        <button
          type="button"
          onClick={upload}
          disabled={isPending || !file}
          className="rounded-full bg-[color:var(--tem-ink)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--tem-paper)] transition hover:-translate-y-0.5 hover:bg-[color:var(--tem-vermilion)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPending ? "Reading…" : "Start OCR"}
        </button>
      </div>
      <p className="mt-3 text-sm text-[color:var(--tem-muted)]">{status}</p>
      {error ? <p role="alert" className="mt-2 text-sm font-semibold text-[color:var(--tem-vermilion)]">{error}</p> : null}
    </section>
  );
}
