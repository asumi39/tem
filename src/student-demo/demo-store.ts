import type { CurrentUser } from "@/src/auth/current-user";
import { isDemoAuthEnabled } from "@/src/auth/current-user";
import { isAuthorizationError, isUnauthenticatedError } from "@/src/student-api/responses";

type DemoQuestion = {
  id: string;
  type: string;
  title: string;
  prompt: string;
  order: number;
  points: number;
  standardAnswer: unknown;
  explanation: unknown;
  resources: unknown;
  renderConfig: Record<string, unknown>;
  gradingConfig: Record<string, unknown>;
};

type DemoAnswer = {
  id: string;
  examAttemptId: string;
  questionId: string;
  inputMethod: "MANUAL" | "OCR_IMAGE";
  manualText: string | null;
  ocrText: string | null;
  finalText: string | null;
  isSubmitted: boolean;
  submittedAt: Date | null;
  createdAt: Date;
};

type DemoAttempt = {
  id: string;
  studentId: string;
  examTemplateId: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: Date;
  submittedAt: Date | null;
  durationSeconds: number | null;
  totalScore: number | null;
  maxScore: number | null;
  examTemplateSnapshot: Record<string, unknown>;
  questionSnapshot: Array<Record<string, unknown>>;
  standardAnswerSnapshot: Record<string, unknown>;
  explanationSnapshot: Record<string, unknown>;
  answers: DemoAnswer[];
  scoringResults: unknown[];
};

const demoQuestion: DemoQuestion = {
  id: "demo-question-campus-reading",
  type: "WRITING_FULL_MOCK",
  title: "Campus Reading",
  prompt:
    "Write a TEM-4 composition about whether campus reading programs should be required. Support your view with reasons and examples.",
  order: 1,
  points: 100,
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
    maxScore: 100,
    rubricStatus: "teacher-rubric-required"
  }
};

const demoExam = {
  id: "demo-writing-practice-mvp",
  title: "Writing Practice MVP",
  description: "Single-question writing practice exam for the MVP manual-input flow.",
  durationMinutes: 45,
  questionCount: 1,
  questions: [demoQuestion]
};

const globalStore = globalThis as typeof globalThis & {
  __tem4DemoAttempts?: Map<string, DemoAttempt>;
  __tem4DemoAttemptCounter?: number;
};

function demoAttempts() {
  if (!globalStore.__tem4DemoAttempts) {
    globalStore.__tem4DemoAttempts = new Map();
  }

  return globalStore.__tem4DemoAttempts;
}

function nextAttemptId() {
  globalStore.__tem4DemoAttemptCounter = (globalStore.__tem4DemoAttemptCounter ?? 0) + 1;
  return `demo-attempt-${globalStore.__tem4DemoAttemptCounter}`;
}

function cloneAttempt(attempt: DemoAttempt) {
  return {
    ...attempt,
    startedAt: new Date(attempt.startedAt),
    submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : null,
    answers: attempt.answers.map((answer) => ({
      ...answer,
      submittedAt: answer.submittedAt ? new Date(answer.submittedAt) : null,
      createdAt: new Date(answer.createdAt)
    }))
  };
}

function redactInProgress(attempt: DemoAttempt) {
  const redacted = cloneAttempt(attempt) as Partial<DemoAttempt>;

  if (redacted.status === "IN_PROGRESS") {
    delete redacted.standardAnswerSnapshot;
    delete redacted.explanationSnapshot;
  }

  return redacted;
}

export function isDemoStudentFallbackEnabled() {
  return isDemoAuthEnabled();
}

export function shouldUseDemoStudentFallback(error: unknown) {
  return isDemoStudentFallbackEnabled() && !isUnauthenticatedError(error) && !isAuthorizationError(error);
}

export function resetDemoStudentFallback() {
  if (!isDemoStudentFallbackEnabled()) {
    throw new Error("Demo fallback reset is unavailable");
  }

  globalStore.__tem4DemoAttempts = new Map();
  globalStore.__tem4DemoAttemptCounter = 0;
}

export function listDemoVisibleWritingExams() {
  return { exams: [demoExam] };
}

export function getDemoStudentExam(examTemplateId: string) {
  if (examTemplateId !== demoExam.id) {
    throw new Error("Demo exam template not found");
  }

  return { exam: demoExam };
}

export function createDemoStudentWritingAttempt(currentUser: CurrentUser, examTemplateId: string) {
  if (examTemplateId !== demoExam.id) {
    throw new Error("Demo exam template not found");
  }

  const startedAt = new Date();
  const attemptId = nextAttemptId();
  const answer: DemoAnswer = {
    id: `${attemptId}-answer-1`,
    examAttemptId: attemptId,
    questionId: demoQuestion.id,
    inputMethod: "MANUAL",
    manualText: null,
    ocrText: null,
    finalText: null,
    isSubmitted: false,
    submittedAt: null,
    createdAt: startedAt
  };
  const attempt: DemoAttempt = {
    id: attemptId,
    studentId: currentUser.id,
    examTemplateId: demoExam.id,
    status: "IN_PROGRESS",
    startedAt,
    submittedAt: null,
    durationSeconds: null,
    totalScore: null,
    maxScore: null,
    examTemplateSnapshot: {
      id: demoExam.id,
      title: demoExam.title,
      description: demoExam.description,
      durationMinutes: demoExam.durationMinutes
    },
    questionSnapshot: demoExam.questions.map((question) => ({
      id: question.id,
      type: question.type,
      title: question.title,
      prompt: question.prompt,
      order: question.order,
      points: question.points,
      resources: question.resources,
      renderConfig: question.renderConfig,
      gradingConfig: question.gradingConfig
    })),
    standardAnswerSnapshot: { [demoQuestion.id]: demoQuestion.standardAnswer },
    explanationSnapshot: { [demoQuestion.id]: demoQuestion.explanation },
    answers: [answer],
    scoringResults: []
  };

  demoAttempts().set(attempt.id, attempt);

  return { attempt: redactInProgress(attempt) };
}

export function getDemoStudentAttempt(currentUser: CurrentUser, attemptId: string) {
  const attempt = demoAttempts().get(attemptId);

  if (!attempt || attempt.studentId !== currentUser.id) {
    throw new Error("Demo attempt not found");
  }

  return { attempt: redactInProgress(attempt) };
}

export function saveDemoStudentAnswerText(
  currentUser: CurrentUser,
  attemptId: string,
  answerId: string,
  text: string
) {
  const attempt = demoAttempts().get(attemptId);

  if (!attempt || attempt.studentId !== currentUser.id || attempt.status !== "IN_PROGRESS") {
    throw new Error("Demo answer not found");
  }

  const answer = attempt.answers.find((candidate) => candidate.id === answerId);

  if (!answer) {
    throw new Error("Demo answer not found");
  }

  answer.manualText = text;
  answer.finalText = text;
  answer.isSubmitted = false;

  return { answer: { ...answer } };
}

export function submitDemoStudentAttempt(currentUser: CurrentUser, attemptId: string) {
  const attempt = demoAttempts().get(attemptId);

  if (!attempt || attempt.studentId !== currentUser.id || attempt.status !== "IN_PROGRESS") {
    throw new Error("Demo in-progress attempt not found");
  }

  const submittedAt = new Date();
  attempt.status = "SUBMITTED";
  attempt.submittedAt = submittedAt;
  attempt.durationSeconds = Math.max(
    1,
    Math.floor((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
  );
  attempt.answers = attempt.answers.map((answer) => ({
    ...answer,
    isSubmitted: true,
    submittedAt
  }));

  return { attempt: cloneAttempt(attempt) };
}

export function getDemoStudentAttemptResult(currentUser: CurrentUser, attemptId: string) {
  const attempt = demoAttempts().get(attemptId);

  if (!attempt || attempt.studentId !== currentUser.id || attempt.status === "IN_PROGRESS") {
    throw new Error("Demo result not found");
  }

  return {
    result: {
      id: attempt.id,
      examTemplateId: attempt.examTemplateId,
      status: attempt.status,
      scoreStatus: "SUBMITTED",
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationSeconds: attempt.durationSeconds,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      examTemplate: attempt.examTemplateSnapshot,
      questions: attempt.questionSnapshot.map((question) => ({
        ...question,
        standardAnswer: attempt.standardAnswerSnapshot[String(question.id)] ?? null,
        explanation: attempt.explanationSnapshot[String(question.id)] ?? null
      })),
      answers: attempt.answers,
      scoringResults: attempt.scoringResults
    }
  };
}

export function listDemoStudentAttemptHistory(currentUser: CurrentUser) {
  const history = [...demoAttempts().values()]
    .filter((attempt) => attempt.studentId === currentUser.id)
    .sort((left, right) => {
      const leftTime = (left.submittedAt ?? left.startedAt).getTime();
      const rightTime = (right.submittedAt ?? right.startedAt).getTime();

      return rightTime - leftTime;
    })
    .map((attempt) => ({
      id: attempt.id,
      examTemplateId: attempt.examTemplateId,
      examTitle: String(attempt.examTemplateSnapshot.title ?? demoExam.title),
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationSeconds: attempt.durationSeconds,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore
    }));

  return { history };
}

type DemoOcrJob = {
  id: string;
  answerId: string;
  attachmentId: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  text: string | null;
  confidence: number | null;
  createdAt: Date;
};

const globalOcrJobs = globalThis as typeof globalThis & {
  __tem4DemoOcrJobs?: Map<string, DemoOcrJob>;
  __tem4DemoOcrJobCounter?: number;
};

function demoOcrJobs() {
  if (!globalOcrJobs.__tem4DemoOcrJobs) {
    globalOcrJobs.__tem4DemoOcrJobs = new Map();
  }
  return globalOcrJobs.__tem4DemoOcrJobs;
}

function nextOcrJobId() {
  globalOcrJobs.__tem4DemoOcrJobCounter = (globalOcrJobs.__tem4DemoOcrJobCounter ?? 0) + 1;
  return `demo-ocr-job-${globalOcrJobs.__tem4DemoOcrJobCounter}`;
}

export function createDemoOcrJob(currentUser: CurrentUser, input: { answerId: string; attachmentId: string }) {
  const attempt = [...demoAttempts().values()].find(
    (a) => a.studentId === currentUser.id && a.status === "IN_PROGRESS" && a.answers.some((a) => a.id === input.answerId)
  );

  if (!attempt) {
    throw new Error("Demo answer not found");
  }

  const job: DemoOcrJob = {
    id: nextOcrJobId(),
    answerId: input.answerId,
    attachmentId: input.attachmentId,
    status: "SUCCEEDED",
    text: "Recognized OCR draft text.",
    confidence: 0.92,
    createdAt: new Date()
  };

  demoOcrJobs().set(job.id, job);

  return { job };
}

export function getDemoOcrJob(currentUser: CurrentUser, jobId: string) {
  const job = demoOcrJobs().get(jobId);

  if (!job) {
    throw new Error("Demo OCR job not found");
  }

  return { job };
}

export function confirmDemoAnswerOcrText(
  currentUser: CurrentUser,
  answerId: string,
  text: string
) {
  const attempt = [...demoAttempts().values()].find(
    (a) => a.studentId === currentUser.id && a.status === "IN_PROGRESS" && a.answers.some((a) => a.id === answerId)
  );

  if (!attempt) {
    throw new Error("Demo answer not found");
  }

  const answer = attempt.answers.find((a) => a.id === answerId);

  if (!answer) {
    throw new Error("Demo answer not found");
  }

  answer.ocrText = text;
  answer.finalText = text;
  answer.inputMethod = "OCR_IMAGE";
  answer.isSubmitted = false;

  return { answer: { ...answer } };
}

type DemoAttachment = {
  id: string;
  answerId: string;
  filename: string;
  contentType: string;
  storageKey: string;
  createdAt: Date;
};

const globalAttachments = globalThis as typeof globalThis & {
  __tem4DemoAttachments?: Map<string, DemoAttachment>;
  __tem4DemoAttachmentCounter?: number;
};

function demoAttachments() {
  if (!globalAttachments.__tem4DemoAttachments) {
    globalAttachments.__tem4DemoAttachments = new Map();
  }
  return globalAttachments.__tem4DemoAttachments;
}

function nextAttachmentId() {
  globalAttachments.__tem4DemoAttachmentCounter = (globalAttachments.__tem4DemoAttachmentCounter ?? 0) + 1;
  return `demo-attachment-${globalAttachments.__tem4DemoAttachmentCounter}`;
}

export function createDemoAttachment(
  currentUser: CurrentUser,
  input: { answerId: string; filename: string; contentType: string }
) {
  const attachment: DemoAttachment = {
    id: nextAttachmentId(),
    answerId: input.answerId,
    filename: input.filename,
    contentType: input.contentType,
    storageKey: `demo/${currentUser.id}/${input.answerId}/${input.filename}`,
    createdAt: new Date()
  };

  demoAttachments().set(attachment.id, attachment);

  return { attachment };
}
