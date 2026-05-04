"use client";

import { ReactNode } from "react";

interface QuestionData {
  id: string;
  title?: string;
  prompt?: string;
  standardAnswer?: unknown;
  explanation?: unknown;
}

interface AnswerData {
  finalText: string | null;
  manualText: string | null;
  inputMethod: string;
  submittedAt?: string | null;
}

interface ExplanationPanelProps {
  questions: QuestionData[];
  answers: AnswerData[];
  showStandardAnswer?: boolean;
  showExplanation?: boolean;
  showStudentAnswer?: boolean;
}

function isStandardAnswerObject(
  answer: unknown
): answer is { outline?: string[] } {
  return typeof answer === "object" && answer !== null;
}

function isExplanationObject(
  explanation: unknown
): explanation is { guidance?: string } {
  return typeof explanation === "object" && explanation !== null;
}

function formatStandardAnswer(standardAnswer: unknown): string {
  if (!standardAnswer) return "";

  if (isStandardAnswerObject(standardAnswer) && standardAnswer.outline) {
    return standardAnswer.outline.join("\n");
  }

  return JSON.stringify(standardAnswer, null, 2);
}

function formatExplanation(explanation: unknown): string {
  if (!explanation) return "";

  if (isExplanationObject(explanation) && explanation.guidance) {
    return explanation.guidance;
  }

  return JSON.stringify(explanation, null, 2);
}

function getFinalText(answer: AnswerData): string {
  return answer.finalText || answer.manualText || "";
}

function getInputMethodLabel(method: string): string {
  switch (method) {
    case "OCR_IMAGE":
      return "OCR Import";
    case "FILE_IMPORT":
      return "File Import";
    default:
      return "Manual Entry";
  }
}

function renderStandardAnswer(standardAnswer: unknown): ReactNode {
  const formatted = formatStandardAnswer(standardAnswer);
  if (!formatted) return null;

  return (
    <div className="mt-4">
      <h4 className="font-medium text-gray-800">Standard Answer</h4>
      <div className="mt-2 whitespace-pre-wrap rounded bg-green-50 p-4 text-green-800">
        {formatted}
      </div>
    </div>
  );
}

function renderExplanation(explanation: unknown): ReactNode {
  const formatted = formatExplanation(explanation);
  if (!formatted) return null;

  return (
    <div className="mt-4">
      <h4 className="font-medium text-gray-800">Explanation</h4>
      <div className="mt-2 whitespace-pre-wrap rounded bg-blue-50 p-4 text-blue-800">
        {formatted}
      </div>
    </div>
  );
}

export function ExplanationPanel({
  questions,
  answers,
  showStandardAnswer = true,
  showExplanation = true,
  showStudentAnswer = true
}: ExplanationPanelProps) {
  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const answer = answers[index];
        const finalText = answer ? getFinalText(answer) : "";

        return (
          <div key={question.id} className="rounded-lg border border-gray-200 bg-white p-6">
            {question.title && (
              <h3 className="font-semibold text-gray-900">{question.title}</h3>
            )}
            {question.prompt && (
              <p className="mt-2 text-gray-600">{question.prompt}</p>
            )}

            {showStudentAnswer && finalText && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800">Your Answer</h4>
                <div className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-4 text-gray-700">
                  {finalText}
                </div>
                {answer && answer.inputMethod && (
                  <p className="mt-1 text-xs text-gray-500">
                    Input method: {getInputMethodLabel(answer.inputMethod)}
                  </p>
                )}
              </div>
            )}

            {showStandardAnswer && question.standardAnswer ? renderStandardAnswer(question.standardAnswer) : null}
            {showExplanation && question.explanation ? renderExplanation(question.explanation) : null}
          </div>
        );
      })}
    </div>
  );
}