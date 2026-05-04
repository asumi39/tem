import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { assertTeacherUser, type CurrentUser } from "@/src/auth/current-user";
import { validateRubric } from "@/src/rubrics/rubric.service";

type RubricRouteParams = { params: Promise<{ rubricId: string }> };

async function canEditRubric(user: CurrentUser, rubricId: string): Promise<boolean> {
  const rubric = await prisma.scoringRubric.findUnique({
    where: { id: rubricId },
    select: { createdById: true }
  });

  if (!rubric) return false;
  if (user.role === "ADMIN") return true;

  return rubric.createdById === user.id;
}

export async function GET(_request: Request, context: RubricRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { rubricId } = await context.params;
    const rubric = await prisma.scoringRubric.findUnique({
      where: { id: rubricId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } }
      }
    });

    if (!rubric) {
      return NextResponse.json({ error: "Rubric not found" }, { status: 404 });
    }

    return NextResponse.json({ rubric });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RubricRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { rubricId } = await context.params;
    const canEdit = await canEditRubric(currentUser, rubricId);

    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to edit this rubric" }, { status: 403 });
    }

    const body = await request.json();
    const data = validateRubric({ ...body, createdById: currentUser.id });

    const rubric = await prisma.scoringRubric.update({
      where: { id: rubricId },
      data
    });

    return NextResponse.json({ rubric });
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

export async function DELETE(_request: Request, context: RubricRouteParams) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const { rubricId } = await context.params;
    const canEdit = await canEditRubric(currentUser, rubricId);

    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to delete this rubric" }, { status: 403 });
    }

    await prisma.scoringRubric.delete({ where: { id: rubricId } });

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