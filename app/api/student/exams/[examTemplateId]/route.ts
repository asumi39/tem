import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { getStudentExam } from "@/src/exam-templates/student-exam.service";
import { getDemoStudentExam, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type ExamRouteContext = {
  params: Promise<{ examTemplateId: string }>;
};

export async function GET(_request: Request, context: ExamRouteContext) {
  try {
    const currentUser = await getCurrentUser();
    const { examTemplateId } = await context.params;
    const exam = await getStudentExam(prisma, currentUser, examTemplateId);

    return studentJson({ exam });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const { examTemplateId } = await context.params;
      return studentJson(getDemoStudentExam(examTemplateId));
    }

    return studentErrorResponse(error);
  }
}
