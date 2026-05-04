import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const teacherEmail = "teacher@example.com";
const studentEmail = "student@example.com";
const writingRubricTitle = "TEM-4 Writing Mock Rubric";
const writingQuestionTitle = "Writing Full Mock: Campus Reading";
const examTitle = "Writing Practice MVP";

async function main() {
  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {
      name: "TEM-4 Teacher",
      role: "TEACHER"
    },
    create: {
      email: teacherEmail,
      name: "TEM-4 Teacher",
      role: "TEACHER"
    }
  });

  await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      name: "TEM-4 Student",
      role: "STUDENT"
    },
    create: {
      email: studentEmail,
      name: "TEM-4 Student",
      role: "STUDENT"
    }
  });

  const rubric = await prisma.scoringRubric.upsert({
    where: { title: writingRubricTitle },
    update: {
      description: "Local development rubric for TEM-4 writing mock practice.",
      questionType: "WRITING_FULL_MOCK",
      maxScore: 100,
      criteria: [
        { name: "Content", maxScore: 40, description: "Task fulfillment and relevance." },
        { name: "Organization", maxScore: 20, description: "Structure, coherence, and cohesion." },
        { name: "Language", maxScore: 40, description: "Grammar, vocabulary, and sentence range." }
      ],
      createdById: teacher.id
    },
    create: {
      title: writingRubricTitle,
      description: "Local development rubric for TEM-4 writing mock practice.",
      questionType: "WRITING_FULL_MOCK",
      maxScore: 100,
      criteria: [
        { name: "Content", maxScore: 40, description: "Task fulfillment and relevance." },
        { name: "Organization", maxScore: 20, description: "Structure, coherence, and cohesion." },
        { name: "Language", maxScore: 40, description: "Grammar, vocabulary, and sentence range." }
      ],
      createdById: teacher.id
    }
  });

  const question = await prisma.question.upsert({
    where: { title: writingQuestionTitle },
    update: {
      type: "WRITING_FULL_MOCK",
      prompt:
        "Write a TEM-4 composition about whether campus reading programs should be required. Support your view with reasons and examples.",
      standardAnswer: {
        outline: [
          "State a clear position on required campus reading programs.",
          "Explain benefits or drawbacks with concrete campus examples.",
          "Conclude with a balanced recommendation."
        ]
      },
      explanation: {
        guidance:
          "A strong response should present a clear thesis, organized supporting paragraphs, accurate language, and examples related to campus reading."
      },
      resources: [],
      renderConfig: {
        minWords: 200,
        maxWords: 250,
        inputMode: "textarea"
      },
      gradingConfig: {
        rubricId: rubric.id,
        maxScore: 100
      },
      createdById: teacher.id
    },
    create: {
      title: writingQuestionTitle,
      type: "WRITING_FULL_MOCK",
      prompt:
        "Write a TEM-4 composition about whether campus reading programs should be required. Support your view with reasons and examples.",
      standardAnswer: {
        outline: [
          "State a clear position on required campus reading programs.",
          "Explain benefits or drawbacks with concrete campus examples.",
          "Conclude with a balanced recommendation."
        ]
      },
      explanation: {
        guidance:
          "A strong response should present a clear thesis, organized supporting paragraphs, accurate language, and examples related to campus reading."
      },
      resources: [],
      renderConfig: {
        minWords: 200,
        maxWords: 250,
        inputMode: "textarea"
      },
      gradingConfig: {
        rubricId: rubric.id,
        maxScore: 100
      },
      createdById: teacher.id
    }
  });

  const existingExam = await prisma.examTemplate.findFirst({
    where: { title: examTitle },
    select: { id: true }
  });

  if (existingExam) {
    await prisma.examTemplateQuestion.deleteMany({
      where: { examTemplateId: existingExam.id }
    });
  }

  await prisma.examTemplate.upsert({
    where: { id: existingExam?.id ?? "seed-writing-practice-mvp" },
    update: {
      title: examTitle,
      description: "Single-question writing practice exam for the MVP domain model.",
      durationMinutes: 45,
      visibilityConfig: {
        showStandardAnswerAfterSubmit: true,
        showExplanationAfterSubmit: true
      },
      createdById: teacher.id,
      questions: {
        create: {
          questionId: question.id,
          order: 1,
          points: 100
        }
      }
    },
    create: {
      title: examTitle,
      description: "Single-question writing practice exam for the MVP domain model.",
      durationMinutes: 45,
      visibilityConfig: {
        showStandardAnswerAfterSubmit: true,
        showExplanationAfterSubmit: true
      },
      createdById: teacher.id,
      questions: {
        create: {
          questionId: question.id,
          order: 1,
          points: 100
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
