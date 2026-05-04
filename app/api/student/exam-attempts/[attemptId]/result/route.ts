import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { getStudentAttemptResult } from "@/src/exam-attempts/student-attempt.service";
import { getDemoStudentAttemptResult, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type ResultRouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_request: Request, context: ResultRouteContext) {
  try {
    const currentUser = await getCurrentUser();
    const { attemptId } = await context.params;
    const result = await getStudentAttemptResult(prisma, currentUser, attemptId);

    return studentJson({ result });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      const { attemptId } = await context.params;
      return studentJson(getDemoStudentAttemptResult(currentUser, attemptId));
    }

    return studentErrorResponse(error);
  }
}
