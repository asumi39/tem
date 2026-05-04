import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { listStudentAttemptHistory } from "@/src/history/student-history.service";
import { listDemoStudentAttemptHistory, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const history = await listStudentAttemptHistory(prisma, currentUser);

    return studentJson({ history });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      return studentJson(listDemoStudentAttemptHistory(currentUser));
    }

    return studentErrorResponse(error);
  }
}
