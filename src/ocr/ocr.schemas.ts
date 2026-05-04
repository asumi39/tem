import { z } from "zod";

export const ocrJobStatuses = ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED"] as const;
export type OcrJobStatus = (typeof ocrJobStatuses)[number];

export const ocrJobCreateSchema = z.object({
  answerId: z.string().min(1),
  attachmentId: z.string().min(1)
});

export const ocrConfirmationSchema = z.object({
  text: z.string().min(1)
});

export type OcrJobCreateInput = z.infer<typeof ocrJobCreateSchema>;
export type OcrConfirmationInput = z.infer<typeof ocrConfirmationSchema>;

const allowedTransitions: Record<OcrJobStatus, OcrJobStatus[]> = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["SUCCEEDED", "FAILED"],
  SUCCEEDED: [],
  FAILED: []
};

export function assertOcrStatusTransition(from: OcrJobStatus, to: OcrJobStatus): void {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`Invalid OCR job status transition from ${from} to ${to}`);
  }
}
