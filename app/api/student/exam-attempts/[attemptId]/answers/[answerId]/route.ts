import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { saveStudentAnswerText } from "@/src/answers/student-answer.service";
import { saveDemoStudentAnswerText, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type AnswerRouteContext = {
  params: Promise<{ attemptId: string; answerId: string }>;
};

export async function PATCH(request: Request, context: AnswerRouteContext) {
  const body = (await request.json()) as { text: string };

  try {
    const currentUser = await getCurrentUser();
    const { attemptId, answerId } = await context.params;
    const answer = await saveStudentAnswerText(prisma, currentUser, {
      attemptId,
      answerId,
      text: body.text
    });

    return studentJson({ answer });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      const { attemptId, answerId } = await context.params;
      return studentJson(saveDemoStudentAnswerText(currentUser, attemptId, answerId, body.text));
    }

    return studentErrorResponse(error);
  }
}
