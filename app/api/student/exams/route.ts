import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { listVisibleWritingExams } from "@/src/exam-templates/student-exam.service";
import { listDemoVisibleWritingExams, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const exams = await listVisibleWritingExams(prisma, currentUser);

    return studentJson({ exams });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      return studentJson(listDemoVisibleWritingExams());
    }

    return studentErrorResponse(error);
  }
}
