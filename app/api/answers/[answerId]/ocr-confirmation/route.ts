import { ZodError } from "zod";

import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { confirmAnswerOcrText } from "@/src/ocr/ocr.service";
import { confirmDemoAnswerOcrText, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type OcrConfirmationRouteContext = {
  params: Promise<{ answerId: string }>;
};

export async function PATCH(request: Request, context: OcrConfirmationRouteContext) {
  let body: { text: string };
  try {
    body = await request.json();
  } catch {
    return studentJson({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const currentUser = await getCurrentUser();
    const { answerId } = await context.params;
    const answer = await confirmAnswerOcrText(prisma, currentUser, { answerId, text: body.text });
    return studentJson({ answer });
  } catch (error) {
    if (error instanceof ZodError) {
      return studentJson({ error: "Invalid OCR confirmation", issues: error.issues }, { status: 400 });
    }

    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      const { answerId } = await context.params;
      return studentJson(confirmDemoAnswerOcrText(currentUser, answerId, body.text));
    }

    return studentErrorResponse(error);
  }
}