import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { submitStudentAttempt } from "@/src/exam-attempts/student-attempt.service";
import { processScoringForAttempt } from "@/src/scoring/scoring.service";
import { shouldUseDemoStudentFallback, submitDemoStudentAttempt } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type SubmitRouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function POST(_request: Request, context: SubmitRouteContext) {
  try {
    const currentUser = await getCurrentUser();
    const { attemptId } = await context.params;
    const attempt = await submitStudentAttempt(prisma, currentUser, { attemptId });

    // Trigger scoring after successful submission
    await processScoringForAttempt(prisma, attemptId);

    // Fetch updated attempt with scoring results
    const updatedAttempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { orderBy: { createdAt: "asc" } },
        scoringResults: { orderBy: { createdAt: "asc" } }
      }
    });

    return studentJson({ attempt: updatedAttempt });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      const { attemptId } = await context.params;
      const attempt = submitDemoStudentAttempt(currentUser, attemptId);
      return studentJson(attempt);
    }

    return studentErrorResponse(error);
  }
}
