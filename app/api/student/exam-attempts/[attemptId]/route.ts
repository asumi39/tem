import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { getStudentAttempt } from "@/src/exam-attempts/student-attempt.service";
import { getDemoStudentAttempt, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type AttemptRouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_request: Request, context: AttemptRouteContext) {
  try {
    const currentUser = await getCurrentUser();
    const { attemptId } = await context.params;
    const attempt = await getStudentAttempt(prisma, currentUser, attemptId);

    return studentJson({ attempt });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      const { attemptId } = await context.params;
      return studentJson(getDemoStudentAttempt(currentUser, attemptId));
    }

    return studentErrorResponse(error);
  }
}
