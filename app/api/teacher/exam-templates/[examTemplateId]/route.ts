import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { assertTeacherUser, type CurrentUser } from "@/src/auth/current-user";
import { z } from "zod";

type ExamTemplateRouteParams = { params: Promise<{ examTemplateId: string }> };

const examTemplateUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  durationMinutes: z.number().int().positive().optional(),
  visibilityConfig: z.object({
    showStandardAnswerAfterSubmit: z.boolean().optional(),
    showExplanationAfterSubmit: z.boolean().optional()
  }).optional(),
  questionIds: z.array(z.string()).optional()
});

async function canEditExamTemplate(user: CurrentUser, examTemplateId: string): Promise<boolean> {
  const template = await prisma.examTemplate.findUnique({
    where: { id: examTemplateId },
    select: { createdById: true }
  });

  if (!template) return false;
  if (user.role === "ADMIN") return true;

  return template.createdById === user.id;
}

export async function GET(_request: Request, context: ExamTemplateRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { examTemplateId } = await context.params;
    const template = await prisma.examTemplate.findUnique({
      where: { id: examTemplateId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        questions: {
          include: { question: true },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Exam template not found" }, { status: 404 });
    }

    return NextResponse.json({ examTemplate: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: ExamTemplateRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { examTemplateId } = await context.params;
    const canEdit = await canEditExamTemplate(currentUser, examTemplateId);

    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to edit this exam template" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, durationMinutes, visibilityConfig, questionIds } =
      examTemplateUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (visibilityConfig !== undefined) updateData.visibilityConfig = visibilityConfig as object;

    if (questionIds !== undefined) {
      await prisma.examTemplateQuestion.deleteMany({ where: { examTemplateId } });
      await prisma.examTemplateQuestion.createMany({
        data: questionIds.map((questionId, index) => ({
          examTemplateId,
          questionId,
          order: index + 1,
          points: 100
        }))
      });
    }

    const template = await prisma.examTemplate.update({
      where: { id: examTemplateId },
      data: updateData,
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json({ examTemplate: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required") || message.includes("Not authorized")
      ? 403
      : message.includes("validation")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: ExamTemplateRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { examTemplateId } = await context.params;
    const canEdit = await canEditExamTemplate(currentUser, examTemplateId);

    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to delete this exam template" }, { status: 403 });
    }

    await prisma.examTemplate.delete({ where: { id: examTemplateId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required") || message.includes("Not authorized")
      ? 403
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}