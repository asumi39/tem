import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { assertTeacherUser } from "@/src/auth/current-user";
import { validateRubric } from "@/src/rubrics/rubric.service";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const rubrics = await prisma.scoringRubric.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, email: true, name: true } }
      }
    });

    return NextResponse.json({ rubrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const body = await request.json();
    const data = validateRubric({ ...body, createdById: currentUser.id });

    const rubric = await prisma.scoringRubric.create({ data });

    return NextResponse.json({ rubric }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required")
      ? 403
      : message.includes("validation")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}