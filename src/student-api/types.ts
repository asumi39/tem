export type StudentQuestionView = {
  id: string;
  type?: string;
  title?: string;
  prompt?: string;
  order?: number;
  points?: number;
  resources?: unknown;
  renderConfig?: unknown;
  standardAnswer?: unknown;
  explanation?: unknown;
};

export type StudentAnswerView = {
  id: string;
  questionId: string;
  manualText?: string | null;
  finalText?: string | null;
  isSubmitted?: boolean;
};

export type StudentAttemptView = {
  id: string;
  examTemplateId: string;
  status: string;
  startedAt: string | Date;
  submittedAt?: string | Date | null;
  durationSeconds?: number | null;
  totalScore?: number | null;
  maxScore?: number | null;
  examTemplateSnapshot?: unknown;
  questionSnapshot?: unknown;
  answers?: unknown;
};

export type StudentExamSummaryView = {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  questionCount: number;
  questions?: unknown;
};

export type StudentAttemptResultView = {
  id: string;
  examTemplateId: string;
  status: string;
  scoreStatus: string;
  startedAt: string | Date;
  submittedAt?: string | Date | null;
  durationSeconds?: number | null;
  totalScore?: number | null;
  maxScore?: number | null;
  examTemplate?: Record<string, unknown>;
  questions: StudentQuestionView[];
  answers: StudentAnswerView[];
  scoringResults?: unknown[];
};

export type StudentHistoryItemView = {
  id: string;
  examTemplateId: string;
  examTitle?: string | null;
  status: string;
  startedAt: string | Date;
  submittedAt?: string | Date | null;
  durationSeconds?: number | null;
  totalScore?: number | null;
  maxScore?: number | null;
};
