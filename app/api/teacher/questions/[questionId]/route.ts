import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { assertTeacherUser, type CurrentUser } from "@/src/auth/current-user";
import { questionUpdateSchema } from "@/src/questions/question.schemas";

type QuestionRouteParams = { params: Promise<{ questionId: string }> };

async function canEditQuestion(user: CurrentUser, questionId: string): Promise<boolean> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { createdById: true }
  });

  if (!question) return false;
  if (user.role === "ADMIN") return true;

  return question.createdById === user.id;
}

export async function GET(_request: Request, context: QuestionRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { questionId } = await context.params;
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } }
      }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: QuestionRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { questionId } = await context.params;
    const canEdit = await canEditQuestion(currentUser, questionId);

    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to edit this question" }, { status: 403 });
    }

    const body = await request.json();
    const data = questionUpdateSchema.parse(body);

    const { type, title, prompt, standardAnswer, explanation, scoringConfig, resources, renderConfig, gradingConfig } = data;

    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (standardAnswer !== undefined) updateData.standardAnswer = standardAnswer;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (scoringConfig !== undefined) updateData.scoringConfig = scoringConfig;
    if (resources !== undefined) updateData.resources = resources;
    if (renderConfig !== undefined) updateData.renderConfig = renderConfig;
    if (gradingConfig !== undefined) updateData.gradingConfig = gradingConfig;

    const question = await prisma.question.update({
      where: { id: questionId },
      data: updateData
    });

    return NextResponse.json({ question });
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

export async function DELETE(_request: Request, context: QuestionRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { questionId } = await context.params;
    const canEdit = await canEditQuestion(currentUser, questionId);

    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to delete this question" }, { status: 403 });
    }

    await prisma.question.delete({ where: { id: questionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const isForeignKeyError = message.toLowerCase().includes("foreign key constraint");
    const status = message.includes("access required") || message.includes("Not authorized")
      ? 403
      : isForeignKeyError
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}