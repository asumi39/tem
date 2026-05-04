import { ZodError } from "zod";

import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { createOcrJob } from "@/src/ocr/ocr.service";
import { createDemoOcrJob, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return studentJson({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const currentUser = await getCurrentUser();
    const job = await createOcrJob(prisma, currentUser, body);
    return studentJson({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return studentJson({ error: "Invalid OCR job", issues: error.issues }, { status: 400 });
    }

    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      return studentJson(createDemoOcrJob(currentUser, body as { answerId: string; attachmentId: string }), { status: 201 });
    }

    return studentErrorResponse(error);
  }
}