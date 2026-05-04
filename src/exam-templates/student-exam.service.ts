import { Prisma, type PrismaClient } from "@prisma/client";

import { assertStudentUser, type CurrentUser } from "../auth/current-user";
import { StudentResourceNotFoundError } from "../shared/student-errors";

export const studentExamVisibilityWhere: Prisma.ExamTemplateWhereInput = {
  OR: [
    { visibilityConfig: { equals: Prisma.DbNull } },
    { visibilityConfig: { path: ["visibleToStudents"], equals: true } }
  ]
};

const templateQuestionInclude = {
  questions: {
    orderBy: { order: "asc" as const },
    include: { question: true }
  }
};

type ExamTemplateWithQuestions = Awaited<
  ReturnType<PrismaClient["examTemplate"]["findMany"]>
>[number] & {
  questions: Array<{
    order: number;
    points: number;
    question: {
      id: string;
      type: string;
      title: string;
      prompt: string;
      standardAnswer?: unknown;
      explanation?: unknown;
      resources?: unknown;
      renderConfig?: unknown;
      gradingConfig?: unknown;
    };
  }>;
};

export function toStudentExamSummary(template: ExamTemplateWithQuestions) {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    durationMinutes: template.durationMinutes,
    questionCount: template.questions.length,
    questions: template.questions.map(({ order, points, question }) => ({
      id: question.id,
      type: question.type,
      title: question.title,
      prompt: question.prompt,
      order,
      points,
      resources: question.resources ?? null,
      renderConfig: question.renderConfig ?? null
    }))
  };
}

export async function listVisibleWritingExams(
  prisma: PrismaClient,
  currentUser: CurrentUser
) {
  assertStudentUser(currentUser);

  const templates = await prisma.examTemplate.findMany({
    where: studentExamVisibilityWhere,
    include: templateQuestionInclude,
    orderBy: { createdAt: "desc" }
  });

  return (templates as ExamTemplateWithQuestions[]).map(toStudentExamSummary);
}

export async function getStudentExam(
  prisma: PrismaClient,
  currentUser: CurrentUser,
  examTemplateId: string
) {
  assertStudentUser(currentUser);

  const template = await prisma.examTemplate.findFirst({
    where: {
      id: examTemplateId,
      ...studentExamVisibilityWhere
    },
    include: templateQuestionInclude
  });

  if (!template) {
    throw new StudentResourceNotFoundError("Exam template not found");
  }

  return toStudentExamSummary(template as ExamTemplateWithQuestions);
}

export async function getVisibleWritingExamTemplateForAttempt(
  prisma: PrismaClient,
  examTemplateId: string
) {
  const template = await prisma.examTemplate.findFirst({
    where: {
      id: examTemplateId,
      ...studentExamVisibilityWhere
    },
    include: templateQuestionInclude
  });

  if (!template) {
    throw new StudentResourceNotFoundError("Exam template not found");
  }

  return template as ExamTemplateWithQuestions;
}
