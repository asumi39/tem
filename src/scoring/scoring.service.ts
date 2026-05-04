import type { PrismaClient } from "@prisma/client";
import type { ScoringOutput } from "./scoring.schemas";
import { validateScoringOutput } from "./scoring.schemas";
import { scoreWithMockProvider, type ScoringInput } from "./providers/mock-scoring-provider";

export interface ScoringJobInput {
  attemptId: string;
  answerId: string;
  questionId: string;
  rubricId: string;
}

interface QuestionData {
  id: string;
  title: string;
  type: string;
  prompt: string;
  standardAnswer?: unknown;
  explanation?: unknown;
  gradingConfig?: {
    rubricId?: string;
    maxScore?: number;
  };
}

interface RubricData {
  id: string;
  title: string;
  maxScore: number;
  criteria: Array<{
    name: string;
    maxScore: number;
    description: string;
  }>;
}

interface AnswerData {
  id: string;
  finalText: string | null;
}

export async function runScoringJob(
  prisma: PrismaClient,
  input: ScoringJobInput
): Promise<void> {
  const { attemptId, answerId, questionId, rubricId } = input;

  const [question, rubric, answer] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId } }),
    prisma.scoringRubric.findUnique({ where: { id: rubricId } }),
    prisma.answer.findUnique({ where: { id: answerId } })
  ]);

  if (!question || !rubric || !answer) {
    await prisma.scoringResult.create({
      data: {
        examAttemptId: attemptId,
        answerId,
        questionId,
        rubricId,
        scorerType: "AI",
        score: null,
        maxScore: null,
        rubricBreakdown: { error: "Missing question, rubric, or answer" },
        feedback: { error: "Could not retrieve required data for scoring" },
        callStatus: "FAILED"
      }
    });
    return;
  }

  const studentAnswer = answer.finalText || answer.manualText || "";
  if (!studentAnswer.trim()) {
    await prisma.scoringResult.create({
      data: {
        examAttemptId: attemptId,
        answerId,
        questionId,
        rubricId,
        scorerType: "AI",
        score: 0,
        maxScore: rubric.maxScore,
        rubricBreakdown: { error: "Empty answer" },
        feedback: { error: "No answer provided" },
        callStatus: "FAILED"
      }
    });
    return;
  }

  const scoringInput: ScoringInput = {
    questionType: question.type,
    prompt: question.prompt,
    studentAnswer,
    standardAnswer: question.standardAnswer,
    rubric: {
      id: rubric.id,
      title: rubric.title,
      maxScore: rubric.maxScore,
      criteria: rubric.criteria as RubricData["criteria"]
    },
    outputLanguage: "zh-CN"
  };

  let scoringOutput: ScoringOutput;
  try {
    scoringOutput = await scoreWithMockProvider(scoringInput);
    scoringOutput = validateScoringOutput(scoringOutput);
  } catch (error) {
    await prisma.scoringResult.create({
      data: {
        examAttemptId: attemptId,
        answerId,
        questionId,
        rubricId,
        scorerType: "AI",
        score: null,
        maxScore: rubric.maxScore,
        rubricBreakdown: { error: "Invalid scoring output" },
        feedback: { error: String(error) },
        rawOutput: { error: String(error) },
        callStatus: "FAILED"
      }
    });
    return;
  }

  await prisma.scoringResult.create({
    data: {
      examAttemptId: attemptId,
      answerId,
      questionId,
      rubricId,
      scorerType: "AI",
      score: scoringOutput.score,
      maxScore: scoringOutput.maxScore,
      rubricBreakdown: scoringOutput.criteria,
      feedback: {
        summary: scoringOutput.summary,
        suggestions: scoringOutput.suggestions
      },
      modelName: "mock-scorer",
      modelVersion: "1.0.0",
      inputSummary: {
        questionType: scoringInput.questionType,
        answerLength: studentAnswer.length
      },
      rawOutput: scoringOutput,
      callStatus: "SUCCEEDED"
    }
  });
}

export async function processScoringForAttempt(
  prisma: PrismaClient,
  attemptId: string
): Promise<void> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: { question: true }
      }
    }
  });

  if (!attempt) {
    return;
  }

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { status: "SCORING" }
  });

  const questionsSnapshot = attempt.questionSnapshot as unknown as QuestionData[];
  const answers = attempt.answers;

  for (const answer of answers) {
    const question = questionsSnapshot.find(
      (q) => q.id === answer.questionId
    );

    if (!question?.gradingConfig?.rubricId) {
      await prisma.scoringResult.create({
        data: {
          examAttemptId: attemptId,
          answerId: answer.id,
          questionId: answer.questionId,
          scorerType: "AI",
          score: null,
          maxScore: null,
          rubricBreakdown: { error: "No rubric configured" },
          feedback: {
            formalScoreAllowed: false,
            summary: "缺少老师评分标准，本次仅生成练习建议，不生成正式分数。"
          },
          callStatus: "SUCCEEDED"
        }
      });
      continue;
    }

    await runScoringJob(prisma, {
      attemptId,
      answerId: answer.id,
      questionId: answer.questionId,
      rubricId: question.gradingConfig.rubricId
    });
  }

  const results = await prisma.scoringResult.findMany({
    where: { examAttemptId: attemptId }
  });

  const validScores = results.filter((r) => r.score !== null);
  const totalScore = validScores.reduce((sum, r) => sum + (r.score || 0), 0);
  const maxScore = validScores.reduce((sum, r) => sum + (r.maxScore || 0), 0);

  const hasFailure = results.some((r) => r.callStatus === "FAILED");
  const newStatus = hasFailure ? "FAILED" : "SCORED";

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: newStatus,
      totalScore,
      maxScore: maxScore > 0 ? maxScore : null
    }
  });
}