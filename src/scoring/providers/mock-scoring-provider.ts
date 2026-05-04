import type { ScoringOutput } from "../scoring.schemas";

export interface ScoringInput {
  questionType: string;
  prompt: string;
  studentAnswer: string;
  standardAnswer?: unknown;
  rubric: {
    id: string;
    title: string;
    maxScore: number;
    criteria: Array<{
      name: string;
      maxScore: number;
      description: string;
    }>;
  };
  outputLanguage?: string;
}

export async function scoreWithMockProvider(
  input: ScoringInput
): Promise<ScoringOutput> {
  const { rubric, studentAnswer } = input;
  const answerLength = studentAnswer.trim().split(/\s+/).length;

  const hasContent = answerLength > 50;
  const hasGoodLength = answerLength >= 150;

  const contentScore = hasGoodLength
    ? Math.min(36, Math.floor(answerLength / 5))
    : hasContent
    ? 20
    : 8;

  const orgScore = studentAnswer.includes("first") || studentAnswer.includes("second") || studentAnswer.includes("finally")
    ? 16
    : 10;

  const langScore = studentAnswer.length > 300
    ? 32
    : studentAnswer.length > 200
    ? 26
    : 16;

  const totalScore = Math.min(
    contentScore + orgScore + langScore,
    rubric.maxScore
  );

  const criteria = [
    {
      name: "Content",
      score: contentScore,
      maxScore: 40,
      feedback:
        hasGoodLength && hasContent
          ? "Response addresses the prompt with relevant ideas and examples."
          : hasContent
          ? "Response covers the main topic but could benefit from more development."
          : "Response is too short to fully address the prompt."
    },
    {
      name: "Organization",
      score: orgScore,
      maxScore: 20,
      feedback:
        orgScore >= 16
          ? "Clear structure with introduction, body, and conclusion."
          : "Some organization present but could be more structured."
    },
    {
      name: "Language",
      score: langScore,
      maxScore: 40,
      feedback:
        langScore >= 32
          ? "Good range of vocabulary and sentence structures."
          : langScore >= 26
          ? "Adequate language use with some varied expressions."
          : "Basic language; consider expanding vocabulary and sentence variety."
    }
  ];

  const suggestions: string[] = [];
  if (answerLength < 200) suggestions.push("Try to write at least 200 words for a more complete response.");
  if (!studentAnswer.includes("for example") && !studentAnswer.includes("such as")) {
    suggestions.push("Add specific examples to support your points.");
  }
  if (!studentAnswer.includes("however") && !studentAnswer.includes("although")) {
    suggestions.push("Consider acknowledging counterarguments for a more balanced view.");
  }
  suggestions.push("Review your grammar and punctuation before submitting.");

  return {
    score: totalScore,
    maxScore: rubric.maxScore,
    summary: totalScore >= 70
      ? "Good response demonstrating solid understanding of the topic."
      : totalScore >= 50
      ? "Adequate response but needs more development and examples."
      : "Response requires significant improvement in content and length.",
    criteria,
    suggestions
  };
}