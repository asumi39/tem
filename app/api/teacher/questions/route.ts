import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { assertTeacherUser } from "@/src/auth/current-user";
import { questionCreateSchema } from "@/src/questions/question.schemas";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const questions = await prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, email: true, name: true } }
      }
    });

    return NextResponse.json({ questions });
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
    const parsed = questionCreateSchema.parse(body);

    const question = await prisma.question.create({
      data: {
        type: parsed.type,
        title: parsed.title,
        prompt: parsed.prompt,
        standardAnswer: parsed.standardAnswer ?? undefined,
        explanation: parsed.explanation ?? undefined,
        scoringConfig: parsed.scoringConfig ?? undefined,
        resources: parsed.resources ?? undefined,
        renderConfig: parsed.renderConfig ?? undefined,
        gradingConfig: parsed.gradingConfig ?? undefined,
        createdById: currentUser.id
      }
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("access required")
      ? 403
      : message.includes("validation") || message.includes("parse")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
