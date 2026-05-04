import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  createStudentWritingAttempt,
  getStudentAttempt,
  getStudentAttemptResult,
  redactAttemptSolutionsForInProgress,
  submitStudentAttempt
} from "../../src/exam-attempts/student-attempt.service";
import {
  getStudentExam,
  listVisibleWritingExams,
  studentExamVisibilityWhere
} from "../../src/exam-templates/student-exam.service";
import { saveStudentAnswerText } from "../../src/answers/student-answer.service";
import { listStudentAttemptHistory } from "../../src/history/student-history.service";

const student = { id: "student-1", email: "student@example.com", role: "STUDENT" as const };
const otherStudent = { id: "student-2", email: "other@example.com", role: "STUDENT" as const };

const writingQuestion = {
  id: "q-writing",
  type: "WRITING_FULL_MOCK",
  title: "Write about online learning",
  prompt: "Write a composition about online learning.",
  standardAnswer: { text: "A model composition." },
  explanation: { text: "Use a clear thesis and supporting details." },
  resources: [],
  renderConfig: { minWords: 200 },
  gradingConfig: { rubricId: "rubric-writing" }
};

const visibleWritingExam = {
  id: "exam-writing-visible",
  title: "Visible Writing Exam",
  description: "A visible writing practice exam",
  durationMinutes: 45,
  visibilityConfig: { visibleToStudents: true },
  createdAt: new Date("2026-04-30T08:00:00.000Z"),
  questions: [
    {
      order: 1,
      points: 100,
      question: writingQuestion
    }
  ]
};

const readingQuestion = {
  id: "q-reading",
  type: "READING",
  title: "Read about campus life",
  prompt: "Read the passage and answer the questions.",
  standardAnswer: { answers: ["A"] },
  explanation: { text: "Choose the best option from the passage." },
  resources: [],
  renderConfig: { passage: "Campus life passage" },
  gradingConfig: null
};

const visibleReadingExam = {
  id: "exam-reading-visible",
  title: "Visible Reading Exam",
  description: "A visible reading practice exam",
  durationMinutes: 30,
  visibilityConfig: { visibleToStudents: true },
  createdAt: new Date("2026-04-30T07:00:00.000Z"),
  questions: [
    {
      order: 1,
      points: 100,
      question: readingQuestion
    }
  ]
};

function containsUndefined(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(containsUndefined);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(containsUndefined);
  }

  return false;
}
function createPrismaForStudentFlow() {
  const attemptRecord = {
    id: "attempt-1",
    studentId: student.id,
    examTemplateId: visibleWritingExam.id,
    status: "IN_PROGRESS",
    startedAt: new Date("2026-04-30T10:00:00.000Z"),
    submittedAt: null,
    durationSeconds: null,
    totalScore: null,
    maxScore: null,
    examTemplateSnapshot: {
      id: visibleWritingExam.id,
      title: visibleWritingExam.title,
      description: visibleWritingExam.description,
      durationMinutes: visibleWritingExam.durationMinutes,
      visibilityConfig: visibleWritingExam.visibilityConfig
    },
    questionSnapshot: [
      {
        id: writingQuestion.id,
        type: writingQuestion.type,
        title: writingQuestion.title,
        prompt: writingQuestion.prompt,
        order: 1,
        points: 100,
        resources: writingQuestion.resources,
        renderConfig: writingQuestion.renderConfig,
        gradingConfig: writingQuestion.gradingConfig
      }
    ],
    standardAnswerSnapshot: { [writingQuestion.id]: writingQuestion.standardAnswer },
    explanationSnapshot: { [writingQuestion.id]: writingQuestion.explanation },
    answers: [
      {
        id: "answer-1",
        examAttemptId: "attempt-1",
        questionId: writingQuestion.id,
        inputMethod: "MANUAL",
        manualText: null,
        ocrText: null,
        finalText: null,
        isSubmitted: false,
        submittedAt: null
      }
    ],
    scoringResults: []
  };

  const prisma = {
    examTemplate: {
      findMany: vi.fn().mockResolvedValue([
        visibleWritingExam,
        visibleReadingExam
      ]),
      findFirst: vi.fn().mockResolvedValue(visibleWritingExam),
      findUniqueOrThrow: vi.fn().mockResolvedValue(visibleWritingExam)
    },
    examAttempt: {
      create: vi.fn().mockResolvedValue(attemptRecord),
      findFirst: vi.fn().mockResolvedValue(attemptRecord),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn().mockResolvedValue(attemptRecord),
      update: vi.fn().mockResolvedValue({
        ...attemptRecord,
        status: "SUBMITTED",
        submittedAt: new Date("2026-04-30T10:30:00.000Z"),
        durationSeconds: 1800,
        answers: attemptRecord.answers.map((answer) => ({
          ...answer,
          manualText: "My composition text.",
          finalText: "My composition text.",
          isSubmitted: true,
          submittedAt: new Date("2026-04-30T10:30:00.000Z")
        }))
      })
    },
    answer: {
      findFirst: vi.fn().mockResolvedValue({
        ...attemptRecord.answers[0],
        examAttempt: { status: "IN_PROGRESS" }
      }),
      upsert: vi.fn().mockResolvedValue({
        ...attemptRecord.answers[0],
        manualText: "My composition text.",
        finalText: "My composition text."
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    },
    $transaction: vi.fn(async (callback) => callback(prisma))
  };

  return prisma;
}

describe("student writing flow services", () => {
  it("builds an explicit student visibility filter without undefined values", () => {
    expect(containsUndefined(studentExamVisibilityWhere)).toBe(false);
    expect(studentExamVisibilityWhere).toEqual({
      OR: [
        { visibilityConfig: { equals: Prisma.DbNull } },
        { visibilityConfig: { path: ["visibleToStudents"], equals: true } }
      ]
    });
  });

  it("lists visible exams without restricting results to writing templates", async () => {
    const prisma = createPrismaForStudentFlow();

    const exams = await listVisibleWritingExams(prisma as never, student);

    expect(exams.map((exam) => exam.id)).toEqual([
      visibleWritingExam.id,
      visibleReadingExam.id
    ]);
    expect(prisma.examTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.any(Object) })
    );
  });

  it("fetches a visible non-writing exam template", async () => {
    const prisma = createPrismaForStudentFlow();
    prisma.examTemplate.findFirst = vi.fn().mockResolvedValue(visibleReadingExam);

    const exam = await getStudentExam(prisma as never, student, visibleReadingExam.id);

    expect(exam).toMatchObject({
      id: visibleReadingExam.id,
      title: visibleReadingExam.title,
      questionCount: 1
    });
  });

  it("creates an attempt with one empty answer row per template question and preserves snapshots", async () => {
    const prisma = createPrismaForStudentFlow();

    const attempt = await createStudentWritingAttempt(prisma as never, student, {
      examTemplateId: visibleWritingExam.id,
      startedAt: new Date("2026-04-30T10:00:00.000Z")
    });

    expect(prisma.examAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: student.id,
        examTemplateId: visibleWritingExam.id,
        status: "IN_PROGRESS",
        answers: {
          create: [
            expect.objectContaining({
              questionId: writingQuestion.id,
              inputMethod: "MANUAL",
              manualText: null,
              finalText: null,
              isSubmitted: false
            })
          ]
        }
      }),
      include: expect.objectContaining({ answers: expect.any(Object) })
    });
    expect(attempt.questionSnapshot).toEqual([
      expect.objectContaining({ id: writingQuestion.id, prompt: writingQuestion.prompt })
    ]);
    expect(attempt).not.toHaveProperty("standardAnswerSnapshot");
    expect(attempt).not.toHaveProperty("explanationSnapshot");
  });

  it("saves manual answer text as the final text for the current student's in-progress attempt", async () => {
    const prisma = createPrismaForStudentFlow();

    const answer = await saveStudentAnswerText(prisma as never, student, {
      attemptId: "attempt-1",
      answerId: "answer-1",
      text: "My composition text."
    });

    expect(answer).toMatchObject({
      manualText: "My composition text.",
      finalText: "My composition text."
    });
    expect(prisma.answer.updateMany).toHaveBeenCalledWith({
      where: {
        id: "answer-1",
        examAttemptId: "attempt-1",
        examAttempt: { studentId: student.id, status: "IN_PROGRESS" }
      },
      data: {
        inputMethod: "MANUAL",
        manualText: "My composition text.",
        finalText: "My composition text.",
        isSubmitted: false
      }
    });
    expect(prisma.answer.upsert).not.toHaveBeenCalled();
  });

  it("rejects manual answer changes after the owning attempt is submitted", async () => {
    const prisma = createPrismaForStudentFlow();
    prisma.answer.findFirst = vi.fn().mockResolvedValue({
      id: "answer-1",
      examAttemptId: "attempt-1",
      questionId: writingQuestion.id,
      examAttempt: { status: "SUBMITTED" }
    });

    await expect(
      saveStudentAnswerText(prisma as never, student, {
        attemptId: "attempt-1",
        answerId: "answer-1",
        text: "Edited after submission."
      })
    ).rejects.toThrow(/not found|progress|submitted|conflict/i);

    expect(prisma.answer.upsert).not.toHaveBeenCalled();
    expect(prisma.answer.updateMany).not.toHaveBeenCalled();
  });

  it("does not update answer text if the attempt is no longer in progress at write time", async () => {
    const prisma = createPrismaForStudentFlow();
    prisma.answer.updateMany = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      saveStudentAnswerText(prisma as never, student, {
        attemptId: "attempt-1",
        answerId: "answer-1",
        text: "Late save after submit."
      })
    ).rejects.toThrow(/not found|progress|submitted|conflict/i);

    expect(prisma.answer.updateMany).toHaveBeenCalledWith({
      where: {
        id: "answer-1",
        examAttemptId: "attempt-1",
        examAttempt: { studentId: student.id, status: "IN_PROGRESS" }
      },
      data: {
        inputMethod: "MANUAL",
        manualText: "Late save after submit.",
        finalText: "Late save after submit.",
        isSubmitted: false
      }
    });
    expect(prisma.answer.upsert).not.toHaveBeenCalled();
  });

  it("submits the current student's attempt and marks answers submitted", async () => {
    const prisma = createPrismaForStudentFlow();
    const submittedAt = new Date("2026-04-30T10:30:00.000Z");

    const attempt = await submitStudentAttempt(prisma as never, student, {
      attemptId: "attempt-1",
      submittedAt
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.answer.updateMany).toHaveBeenCalledWith({
      where: { examAttemptId: "attempt-1" },
      data: { isSubmitted: true, submittedAt }
    });
    expect(prisma.examAttempt.update).toHaveBeenCalledWith({
      where: { id: "attempt-1", status: "IN_PROGRESS" },
      data: { status: "SUBMITTED", submittedAt, durationSeconds: 1800 },
      include: expect.objectContaining({ answers: expect.any(Object), scoringResults: expect.any(Object) })
    });
    expect(attempt.status).toBe("SUBMITTED");
  });

  it("redacts standard answer and explanation snapshots from in-progress attempt details", async () => {
    const prisma = createPrismaForStudentFlow();

    const attempt = await getStudentAttempt(prisma as never, student, "attempt-1");

    expect(attempt).toMatchObject({
      id: "attempt-1",
      status: "IN_PROGRESS",
      questionSnapshot: [expect.objectContaining({ id: writingQuestion.id, prompt: writingQuestion.prompt })],
      answers: [expect.objectContaining({ id: "answer-1" })]
    });
    expect(attempt).not.toHaveProperty("standardAnswerSnapshot");
    expect(attempt).not.toHaveProperty("explanationSnapshot");
  });

  it("redacts snapshot fields through the redaction helper for in-progress attempts", () => {
    const redacted = redactAttemptSolutionsForInProgress({
      id: "attempt-1",
      status: "IN_PROGRESS",
      questionSnapshot: [{ id: writingQuestion.id, prompt: writingQuestion.prompt }],
      standardAnswerSnapshot: { [writingQuestion.id]: writingQuestion.standardAnswer },
      explanationSnapshot: { [writingQuestion.id]: writingQuestion.explanation }
    });

    expect(redacted).toEqual({
      id: "attempt-1",
      status: "IN_PROGRESS",
      questionSnapshot: [{ id: writingQuestion.id, prompt: writingQuestion.prompt }]
    });
  });

  it("rejects result data for an in-progress attempt before standard answers are exposed", async () => {
    const prisma = createPrismaForStudentFlow();

    await expect(getStudentAttemptResult(prisma as never, student, "attempt-1")).rejects.toThrow(
      /submitted|result|progress/i
    );
  });

  it("returns result data from archived snapshots instead of current template records after submission", async () => {
    const prisma = createPrismaForStudentFlow();
    prisma.examAttempt.findFirst = vi.fn().mockResolvedValue({
      id: "attempt-1",
      studentId: student.id,
      examTemplateId: visibleWritingExam.id,
      status: "SUBMITTED",
      startedAt: new Date("2026-04-30T10:00:00.000Z"),
      submittedAt: new Date("2026-04-30T10:30:00.000Z"),
      durationSeconds: 1800,
      totalScore: null,
      maxScore: null,
      examTemplateSnapshot: {
        id: visibleWritingExam.id,
        title: visibleWritingExam.title,
        description: visibleWritingExam.description,
        durationMinutes: visibleWritingExam.durationMinutes,
        visibilityConfig: visibleWritingExam.visibilityConfig
      },
      questionSnapshot: [
        {
          id: writingQuestion.id,
          type: writingQuestion.type,
          title: writingQuestion.title,
          prompt: writingQuestion.prompt,
          order: 1,
          points: 100,
          resources: writingQuestion.resources,
          renderConfig: writingQuestion.renderConfig,
          gradingConfig: writingQuestion.gradingConfig
        }
      ],
      standardAnswerSnapshot: { [writingQuestion.id]: writingQuestion.standardAnswer },
      explanationSnapshot: { [writingQuestion.id]: writingQuestion.explanation },
      answers: [
        {
          id: "answer-1",
          examAttemptId: "attempt-1",
          questionId: writingQuestion.id,
          inputMethod: "MANUAL",
          manualText: "My composition text.",
          finalText: "My composition text.",
          isSubmitted: true,
          submittedAt: new Date("2026-04-30T10:30:00.000Z")
        }
      ],
      scoringResults: []
    });

    const result = await getStudentAttemptResult(prisma as never, student, "attempt-1");

    expect(result).toMatchObject({
      id: "attempt-1",
      status: "SUBMITTED",
      scoreStatus: "SUBMITTED",
      examTemplate: { title: visibleWritingExam.title },
      questions: [
        {
          id: writingQuestion.id,
          prompt: writingQuestion.prompt,
          standardAnswer: writingQuestion.standardAnswer,
          explanation: writingQuestion.explanation
        }
      ]
    });
  });

  it("lists only the current student's attempt history by recent submission or start time", async () => {
    const prisma = createPrismaForStudentFlow();
    prisma.examAttempt.findMany = vi.fn().mockResolvedValue([
      {
        id: "submitted-attempt",
        studentId: student.id,
        examTemplateId: visibleWritingExam.id,
        status: "SUBMITTED",
        startedAt: new Date("2026-04-30T09:00:00.000Z"),
        submittedAt: new Date("2026-04-30T10:00:00.000Z"),
        durationSeconds: 3600,
        totalScore: null,
        maxScore: null,
        examTemplateSnapshot: { id: visibleWritingExam.id, title: visibleWritingExam.title },
        questionSnapshot: [],
        standardAnswerSnapshot: {},
        explanationSnapshot: {}
      },
      {
        id: "draft-attempt",
        studentId: student.id,
        examTemplateId: visibleWritingExam.id,
        status: "IN_PROGRESS",
        startedAt: new Date("2026-04-30T11:00:00.000Z"),
        submittedAt: null,
        durationSeconds: null,
        totalScore: null,
        maxScore: null,
        examTemplateSnapshot: { id: visibleWritingExam.id, title: "Draft Exam" },
        questionSnapshot: [],
        standardAnswerSnapshot: {},
        explanationSnapshot: {}
      }
    ]);

    const history = await listStudentAttemptHistory(prisma as never, student);

    expect(prisma.examAttempt.findMany).toHaveBeenCalledWith({
      where: { studentId: student.id },
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
      take: 50
    });
    expect(history.map((item) => item.id)).toEqual(["draft-attempt", "submitted-attempt"]);
  });

  it("treats another student's attempt as not found", async () => {
    const prisma = createPrismaForStudentFlow();
    prisma.examAttempt.findFirst = vi.fn().mockResolvedValue(null);

    await expect(getStudentAttempt(prisma as never, otherStudent, "attempt-1")).rejects.toThrow(/not found/i);
  });
});
