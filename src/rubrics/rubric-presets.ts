import type { RubricInput } from "./rubric.schemas";

export const rubricPresets: Record<string, Omit<RubricInput, "createdById">> = {
  WRITING_SUMMARY: {
    title: "Writing Summary Rubric",
    description: "Evaluation criteria for summarizing passages in TEM-4",
    questionType: "WRITING_SUMMARY",
    maxScore: 100,
    criteria: [
      { name: "Content Accuracy", maxScore: 40, description: "Correctly identifies main ideas" },
      { name: "Conciseness", maxScore: 20, description: "Summarizes without unnecessary details" },
      { name: "Language Quality", maxScore: 25, description: "Grammar and vocabulary" },
      { name: "Structure", maxScore: 15, description: "Logical organization" }
    ]
  },
  WRITING_PARAGRAPH: {
    title: "Writing Paragraph Rubric",
    description: "Evaluation criteria for paragraph writing",
    questionType: "WRITING_PARAGRAPH",
    maxScore: 100,
    criteria: [
      { name: "Topic Sentence", maxScore: 15, description: "Clear main idea" },
      { name: "Supporting Details", maxScore: 30, description: "Relevant examples" },
      { name: "Coherence", maxScore: 25, description: "Logical flow" },
      { name: "Language", maxScore: 30, description: "Grammar and vocabulary" }
    ]
  },
  WRITING_OUTLINE: {
    title: "Writing Outline Rubric",
    description: "Evaluation criteria for essay outlines",
    questionType: "WRITING_OUTLINE",
    maxScore: 100,
    criteria: [
      { name: "Thesis Statement", maxScore: 20, description: "Clear central argument" },
      { name: "Structure", maxScore: 35, description: "Logical organization" },
      { name: "Supporting Points", maxScore: 30, description: "Relevant main points" },
      { name: "Clarity", maxScore: 15, description: "Clear formatting" }
    ]
  },
  WRITING_FRAMEWORK: {
    title: "Writing Framework Rubric",
    description: "Evaluation criteria for framework- based writing",
    questionType: "WRITING_FRAMEWORK",
    maxScore: 100,
    criteria: [
      { name: "Framework Adherence", maxScore: 25, description: "Follows given framework" },
      { name: "Content Development", maxScore: 30, description: "Appropriate content" },
      { name: "Language Use", maxScore: 30, description: "Grammar and vocabulary" },
      { name: "Completion", maxScore: 15, description: "All sections completed" }
    ]
  },
  WRITING_FULL_MOCK: {
    title: "TEM-4 Writing Full Mock Rubric",
    description: "Full essay writing evaluation for TEM-4",
    questionType: "WRITING_FULL_MOCK",
    maxScore: 100,
    criteria: [
      { name: "Content", maxScore: 40, description: "Task fulfillment" },
      { name: "Organization", maxScore: 20, description: "Structure and coherence" },
      { name: "Language", maxScore: 40, description: "Grammar and vocabulary" }
    ]
  }
};

export function getRubricPreset(questionType: string) {
  return rubricPresets[questionType] || null;
}
