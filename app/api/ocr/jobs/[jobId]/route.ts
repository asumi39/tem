import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { getStudentOcrJob } from "@/src/ocr/ocr.service";
import { getDemoOcrJob, shouldUseDemoStudentFallback } from "@/src/student-demo/demo-store";
import { studentErrorResponse, studentJson } from "@/src/student-api/responses";

type OcrJobRouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: OcrJobRouteContext) {
  try {
    const currentUser = await getCurrentUser();
    const { jobId } = await context.params;
    const job = await getStudentOcrJob(prisma, currentUser, jobId);

    return studentJson({ job });
  } catch (error) {
    if (shouldUseDemoStudentFallback(error)) {
      const currentUser = await getCurrentUser();
      const { jobId } = await context.params;
      return studentJson(getDemoOcrJob(currentUser, jobId));
    }

    return studentErrorResponse(error);
  }
}
