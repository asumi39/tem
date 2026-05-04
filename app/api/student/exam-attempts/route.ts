import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { createStudentWritingAttempt } from "@/src/exam-attempts/student-attempt.service";
import { createDemoStudentWritingAttempt, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

export async function POST(request: Request) {
  const body = (await request.json()) as { examTemplateId: string };

  try {
    const currentUser = await getCurrentUser();
    const attempt = await createStudentWritingAttempt(prisma, currentUser, {
      examTemplateId: body.examTemplateId
    });

    return studentJson({ attempt }, { status: 201 });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      return studentJson(createDemoStudentWritingAttempt(currentUser, body.examTemplateId), { status: 201 });
    }

    return studentErrorResponse(error);
  }
}
