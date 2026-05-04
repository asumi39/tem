import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { assertTeacherUser } from "@/src/auth/current-user";
import { z } from "zod";

const examTemplateCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  durationMinutes: z.number().int().positive().optional(),
  visibilityConfig: z.object({
    showStandardAnswerAfterSubmit: z.boolean().optional(),
    showExplanationAfterSubmit: z.boolean().optional()
  }).optional(),
  questionIds: z.array(z.string()).optional()
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    assertTeacherUser(currentUser);

    const templates = await prisma.examTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        questions: {
          include: { question: true },
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json({ examTemplates: templates });
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
    const { title, description, durationMinutes, visibilityConfig, questionIds } =
      examTemplateCreateSchema.parse(body);

    const template = await prisma.examTemplate.create({
      data: {
        title,
        description,
        durationMinutes,
        visibilityConfig: visibilityConfig as object,
        createdById: currentUser.id,
        questions: questionIds ? {
          create: questionIds.map((questionId, index) => ({
            questionId,
            order: index + 1,
            points: 100
          }))
        } : undefined
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json({ examTemplate: template }, { status: 201 });
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