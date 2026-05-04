export const questionTypes = [
  "WRITING_SUMMARY",
  "WRITING_PARAGRAPH",
  "WRITING_OUTLINE",
  "WRITING_FRAMEWORK",
  "WRITING_FULL_MOCK",
  "MULTIPLE_CHOICE",
  "CLOZE",
  "READING",
  "DICTATION",
  "INTERVIEW",
  "LISTENING"
] as const;

export type QuestionType = (typeof questionTypes)[number];

export const writingQuestionTypes = [
  "WRITING_SUMMARY",
  "WRITING_PARAGRAPH",
  "WRITING_OUTLINE",
  "WRITING_FRAMEWORK",
  "WRITING_FULL_MOCK"
] as const satisfies readonly QuestionType[];

export function isWritingQuestionType(type: QuestionType): boolean {
  return writingQuestionTypes.includes(type as (typeof writingQuestionTypes)[number]);
}
