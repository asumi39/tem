"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { createStudentWritingAttempt } from "@/src/exam-attempts/student-attempt.service";
import { createDemoStudentWritingAttempt, isDemoStudentFallbackEnabled } from "@/src/student-demo/demo-store";

export async function startStudentAttempt(formData: FormData) {
  const examTemplateId = String(formData.get("examTemplateId") ?? "");
  const currentUser = await getCurrentUser();
  let attemptId: string;

  try {
    const attempt = await createStudentWritingAttempt(prisma, currentUser, { examTemplateId });
    attemptId = attempt.id;
  } catch (error) {
    if (!isDemoStudentFallbackEnabled()) {
      throw error;
    }

    const { attempt } = createDemoStudentWritingAttempt(currentUser, examTemplateId);
    attemptId = String(attempt.id);
  }

  redirect(`/attempts/${attemptId}`);
}
