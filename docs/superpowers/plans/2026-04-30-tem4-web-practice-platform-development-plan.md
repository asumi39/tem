# TEM-4 Web Practice Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-first TEM-4 practice platform MVP where students can complete writing exercises, upload answer images for OCR, confirm recognized text, submit attempts, receive AI-assisted scoring, and review archived exam results.

**Architecture:** Start with a Next.js full-stack monolith so the team can ship the writing closed loop quickly while keeping clear domain boundaries. Use a unified exam model (`Question` + `ExamTemplate` + `ExamAttempt` + `Answer` + `ScoringResult`) so later TEM-4 question types reuse the same practice, submission, grading, and archive flow.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, React Hook Form, Zod, Prisma, PostgreSQL, S3-compatible object storage, mocked OCR/AI providers for automated tests, later replaceable with cloud OCR and Claude API or equivalent LLM provider.

---

## 0. Plan Scope and Delivery Strategy

The total architecture covers five large subsystems: base platform, writing practice closed loop, teacher authoring, other text question types, listening question types, and operations/scale. To keep each release testable, development should be split into six milestones:

1. **M0 — Project scaffold and engineering baseline**: application shell, lint/test/build pipeline, database wiring.
2. **M1 — Core domain and seed data**: users, roles, question bank, exam templates, attempts, answers, rubrics.
3. **M2 — Student writing practice MVP**: exam list, attempt creation, timer, manual answer input, submit, archived result.
4. **M3 — File upload and OCR confirmation**: upload answer image, create OCR job, mock OCR worker, student confirms text.
5. **M4 — AI scoring and result explanation**: rubric-based scoring job, mock AI provider, validated structured output, result page.
6. **M5 — Teacher writing management**: teacher maintains questions, exam templates, rubrics, and reviews attempts.
7. **M6 — Expansion after MVP**: writing subtypes, objective/reading questions, listening/audio, analytics, cost controls.

M0–M4 form the first production-like MVP. M5 makes the platform maintainable by teachers. M6 should not start until M0–M5 have passing automated tests and a manually verified student flow.

---

## 1. Target File Structure

Create this structure during implementation. Keep modules focused and avoid mixing page UI, data access, and business logic in the same file.

```text
.
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── (auth)/login/page.tsx
│   ├── (student)/dashboard/page.tsx
│   ├── (student)/exams/page.tsx
│   ├── (student)/exams/[examTemplateId]/page.tsx
│   ├── (student)/attempts/[attemptId]/page.tsx
│   ├── (student)/attempts/[attemptId]/result/page.tsx
│   ├── (student)/history/page.tsx
│   ├── (teacher)/questions/page.tsx
│   ├── (teacher)/questions/[questionId]/page.tsx
│   ├── (teacher)/exam-templates/page.tsx
│   ├── (teacher)/exam-templates/[examTemplateId]/page.tsx
│   ├── (teacher)/rubrics/page.tsx
│   ├── (teacher)/rubrics/[rubricId]/page.tsx
│   └── api/
│       ├── student/exams/route.ts
│       ├── student/exams/[examTemplateId]/route.ts
│       ├── student/exam-attempts/route.ts
│       ├── student/exam-attempts/[attemptId]/route.ts
│       ├── student/exam-attempts/[attemptId]/answers/[answerId]/route.ts
│       ├── student/exam-attempts/[attemptId]/submit/route.ts
│       ├── student/exam-attempts/[attemptId]/result/route.ts
│       ├── student/exam-attempts/history/route.ts
│       ├── files/upload/route.ts
│       ├── ocr/jobs/route.ts
│       ├── ocr/jobs/[jobId]/route.ts
│       ├── answers/[answerId]/ocr-confirmation/route.ts
│       ├── teacher/questions/route.ts
│       ├── teacher/questions/[questionId]/route.ts
│       ├── teacher/exam-templates/route.ts
│       ├── teacher/exam-templates/[examTemplateId]/route.ts
│       ├── teacher/scoring-rubrics/route.ts
│       ├── teacher/scoring-rubrics/[rubricId]/route.ts
│       ├── teacher/exam-attempts/route.ts
│       └── teacher/exam-attempts/[attemptId]/route.ts
├── components/
│   ├── exam/ExamTimer.tsx
│   ├── exam/QuestionRenderer.tsx
│   ├── exam/SubmitExamDialog.tsx
│   ├── writing/WritingAnswerEditor.tsx
│   ├── upload/ImageUploadInput.tsx
│   ├── ocr/OcrReviewPanel.tsx
│   ├── scoring/ScoringResultView.tsx
│   ├── explanation/ExplanationPanel.tsx
│   ├── history/AttemptHistoryList.tsx
│   └── rubrics/RubricEditor.tsx
├── src/
│   ├── auth/
│   │   ├── current-user.ts
│   │   ├── permissions.ts
│   │   └── session.ts
│   ├── db/
│   │   ├── prisma.ts
│   │   └── seed.ts
│   ├── questions/
│   │   ├── question-types.ts
│   │   ├── question.schemas.ts
│   │   └── question.service.ts
│   ├── exam-templates/
│   │   ├── exam-template.schemas.ts
│   │   └── exam-template.service.ts
│   ├── exam-attempts/
│   │   ├── attempt.schemas.ts
│   │   ├── attempt.service.ts
│   │   └── archive.service.ts
│   ├── answers/
│   │   ├── answer.schemas.ts
│   │   └── answer.service.ts
│   ├── attachments/
│   │   ├── attachment.schemas.ts
│   │   ├── attachment.service.ts
│   │   └── storage.ts
│   ├── ocr/
│   │   ├── ocr.schemas.ts
│   │   ├── ocr.service.ts
│   │   └── providers/mock-ocr-provider.ts
│   ├── scoring/
│   │   ├── scoring.schemas.ts
│   │   ├── scoring.service.ts
│   │   └── providers/mock-scoring-provider.ts
│   ├── ai/
│   │   ├── ai-client.ts
│   │   ├── prompts.ts
│   │   └── structured-output.ts
│   ├── rubrics/
│   │   ├── rubric.schemas.ts
│   │   └── rubric.service.ts
│   ├── history/
│   │   └── history.service.ts
│   └── workers/
│       ├── process-ocr-job.ts
│       └── process-scoring-job.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs
└── .env.example
```

---

## 2. M0 — Project Scaffold and Engineering Baseline

**Outcome:** A runnable Next.js TypeScript app with linting, formatting, unit tests, e2e test harness, Prisma, and environment configuration.

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `src/db/prisma.ts`
- Create: `tests/unit/smoke.test.ts`, `tests/e2e/home.spec.ts`
- Modify: `CLAUDE.md` after commands exist

### Task M0.1: Initialize the Next.js application

- [ ] Run scaffold command:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir false --import-alias "@/*"
```

Expected: `package.json`, `app/`, `tsconfig.json`, and Next.js config files are created.

- [ ] Install runtime dependencies:

```bash
npm install @prisma/client zod react-hook-form @hookform/resolvers
```

Expected: dependencies are added to `package.json`.

- [ ] Install development/testing dependencies:

```bash
npm install -D prisma vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
```

Expected: dev dependencies are added to `package.json`.

- [ ] Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx src/db/seed.ts"
  }
}
```

Expected: `npm run typecheck`, `npm run test`, and `npm run build` are stable commands for future tasks.

### Task M0.2: Add test harness

- [ ] Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL("./", import.meta.url).pathname
    }
  }
});
```

- [ ] Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] Create `tests/unit/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs unit tests", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] Run:

```bash
npm run test -- tests/unit/smoke.test.ts
```

Expected: `PASS tests/unit/smoke.test.ts`.

### Task M0.3: Add e2e harness

- [ ] Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ]
});
```

- [ ] Create `tests/e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /TEM-4 Practice/i })).toBeVisible();
});
```

- [ ] Replace `app/page.tsx` with:

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">TEM-4 Practice</h1>
      <p className="mt-4 text-lg text-gray-600">Writing-first web practice platform.</p>
    </main>
  );
}
```

- [ ] Run:

```bash
npm run test:e2e -- tests/e2e/home.spec.ts
```

Expected: one Chromium test passes.

### Task M0.4: Add Prisma baseline

- [ ] Run:

```bash
npx prisma init
```

Expected: `prisma/schema.prisma` and `.env` are created.

- [ ] Create `.env.example`:

```bash
DATABASE_URL="postgresql://tem4:tem4@localhost:5432/tem4_practice"
OBJECT_STORAGE_ENDPOINT="http://localhost:9000"
OBJECT_STORAGE_BUCKET="tem4-practice-dev"
OBJECT_STORAGE_ACCESS_KEY_ID="dev-access-key"
OBJECT_STORAGE_SECRET_ACCESS_KEY="dev-secret-key"
AI_PROVIDER="mock"
OCR_PROVIDER="mock"
```

- [ ] Create `src/db/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] Run:

```bash
npm run prisma:generate
```

Expected: Prisma client generates successfully.

### Task M0.5: Update repository guidance

- [ ] Update `CLAUDE.md` command section with the actual commands:

```markdown
## Commands

- `npm run dev` — start local development server.
- `npm run build` — build production app.
- `npm run lint` — run lint checks.
- `npm run typecheck` — run TypeScript checks.
- `npm run test` — run unit/integration tests.
- `npm run test -- tests/unit/example.test.ts` — run a single test file.
- `npm run test:e2e` — run Playwright e2e tests.
- `npm run prisma:migrate` — create/apply local Prisma migrations.
- `npm run prisma:seed` — seed local development data.
```

- [ ] Run final baseline verification:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: all commands pass.

- [ ] Commit:

```bash
git add package.json package-lock.json app src tests prisma next.config.ts tsconfig.json eslint.config.mjs vitest.config.ts playwright.config.ts .env.example CLAUDE.md
git commit -m "chore: scaffold TEM-4 practice platform"
```

---

## 3. M1 — Core Domain Model and Seed Data

**Outcome:** Database schema, Zod schemas, service layer, and seed data represent the unified exam model.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/questions/question-types.ts`, `src/questions/question.schemas.ts`, `src/questions/question.service.ts`
- Create: `src/exam-templates/exam-template.schemas.ts`, `src/exam-templates/exam-template.service.ts`
- Create: `src/exam-attempts/attempt.schemas.ts`, `src/exam-attempts/attempt.service.ts`, `src/exam-attempts/archive.service.ts`
- Create: `src/answers/answer.schemas.ts`, `src/answers/answer.service.ts`
- Create: `src/rubrics/rubric.schemas.ts`, `src/rubrics/rubric.service.ts`
- Create: `src/db/seed.ts`
- Test: `tests/unit/domain/*.test.ts`, `tests/integration/exam-attempt-flow.test.ts`

### Task M1.1: Define Prisma schema

- [ ] Add enums to `prisma/schema.prisma`:

```prisma
enum UserRole {
  STUDENT
  TEACHER
  ADMIN
}

enum QuestionType {
  WRITING_SUMMARY
  WRITING_PARAGRAPH
  WRITING_OUTLINE
  WRITING_FRAMEWORK
  WRITING_FULL_MOCK
  MULTIPLE_CHOICE
  CLOZE
  READING
  DICTATION
  INTERVIEW
  LISTENING
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  SCORING
  SCORED
  FAILED
}

enum InputMethod {
  MANUAL
  OCR_IMAGE
  FILE_IMPORT
}

enum JobStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
}

enum ScorerType {
  AI
  TEACHER
}
```

- [ ] Add models to `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  questions      Question[]      @relation("QuestionAuthor")
  examTemplates  ExamTemplate[]  @relation("ExamTemplateAuthor")
  examAttempts   ExamAttempt[]   @relation("StudentAttempts")
  scoringRubrics ScoringRubric[] @relation("RubricAuthor")
  attachments    Attachment[]    @relation("AttachmentOwner")
}

model Question {
  id              String       @id @default(cuid())
  type            QuestionType
  title           String
  prompt          String
  content         Json
  standardAnswer  Json
  explanation     String
  metadata        Json
  createdById     String
  scoringRubricId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  createdBy     User            @relation("QuestionAuthor", fields: [createdById], references: [id])
  scoringRubric ScoringRubric?  @relation(fields: [scoringRubricId], references: [id])
  templateItems ExamTemplateQuestion[]
  answers       Answer[]
}

model ExamTemplate {
  id               String   @id @default(cuid())
  title            String
  description      String
  examType         String
  timeLimitSeconds Int?
  visibility       String
  createdById      String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  createdBy User                   @relation("ExamTemplateAuthor", fields: [createdById], references: [id])
  questions ExamTemplateQuestion[]
  attempts  ExamAttempt[]
}

model ExamTemplateQuestion {
  id             String @id @default(cuid())
  examTemplateId String
  questionId     String
  orderIndex     Int
  points         Int

  examTemplate ExamTemplate @relation(fields: [examTemplateId], references: [id])
  question     Question     @relation(fields: [questionId], references: [id])

  @@unique([examTemplateId, questionId])
}

model ExamAttempt {
  id                     String        @id @default(cuid())
  examTemplateId         String
  studentId              String
  status                 AttemptStatus @default(IN_PROGRESS)
  startedAt              DateTime      @default(now())
  submittedAt            DateTime?
  durationSeconds        Int?
  totalScore             Int?
  examTemplateSnapshot   Json?
  questionSnapshot       Json?
  standardAnswerSnapshot Json?
  explanationSnapshot    Json?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  examTemplate   ExamTemplate    @relation(fields: [examTemplateId], references: [id])
  student        User            @relation("StudentAttempts", fields: [studentId], references: [id])
  answers        Answer[]
  scoringResults ScoringResult[]
}

model Answer {
  id            String      @id @default(cuid())
  examAttemptId String
  questionId    String
  inputMethod   InputMethod @default(MANUAL)
  rawText       String?
  ocrText       String?
  finalText     String?
  submittedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  examAttempt    ExamAttempt     @relation(fields: [examAttemptId], references: [id])
  question       Question        @relation(fields: [questionId], references: [id])
  attachments    Attachment[]
  ocrJobs        OcrJob[]
  scoringResults ScoringResult[]

  @@unique([examAttemptId, questionId])
}

model Attachment {
  id               String   @id @default(cuid())
  ownerId          String
  answerId         String?
  fileType         String
  storageKey       String
  originalFilename String
  mimeType         String
  sizeBytes        Int
  createdAt        DateTime @default(now())

  owner  User    @relation("AttachmentOwner", fields: [ownerId], references: [id])
  answer Answer? @relation(fields: [answerId], references: [id])
  ocrJobs OcrJob[]
}

model OcrJob {
  id             String    @id @default(cuid())
  attachmentId   String
  answerId       String
  status         JobStatus @default(PENDING)
  provider       String
  recognizedText String?
  confidence     Float?
  errorMessage   String?
  createdAt      DateTime @default(now())
  completedAt    DateTime?

  attachment Attachment @relation(fields: [attachmentId], references: [id])
  answer     Answer     @relation(fields: [answerId], references: [id])
}

model ScoringRubric {
  id           String       @id @default(cuid())
  title        String
  questionType QuestionType
  criteria     Json
  maxScore     Int
  createdById  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdBy User       @relation("RubricAuthor", fields: [createdById], references: [id])
  questions Question[]
}

model ScoringResult {
  id              String     @id @default(cuid())
  examAttemptId   String
  answerId        String
  scorerType      ScorerType
  score           Int
  maxScore        Int
  rubricBreakdown Json
  feedback        Json
  modelName       String?
  modelVersion    String?
  inputSummary    String?
  createdAt       DateTime @default(now())

  examAttempt ExamAttempt @relation(fields: [examAttemptId], references: [id])
  answer      Answer      @relation(fields: [answerId], references: [id])
}
```

- [ ] Run:

```bash
npm run prisma:migrate -- --name initial_domain_model
```

Expected: migration applies and Prisma client regenerates.

### Task M1.2: Add domain schemas

- [ ] Create Zod schemas for input boundaries. Example for `src/scoring/scoring.schemas.ts`:

```ts
import { z } from "zod";

export const scoringCriterionResultSchema = z.object({
  name: z.string().min(1),
  score: z.number().int().min(0),
  maxScore: z.number().int().positive(),
  feedback: z.string().min(1)
}).refine((value) => value.score <= value.maxScore, {
  message: "criterion score cannot exceed maxScore",
  path: ["score"]
});

export const scoringOutputSchema = z.object({
  score: z.number().int().min(0),
  maxScore: z.number().int().positive(),
  summary: z.string().min(1),
  criteria: z.array(scoringCriterionResultSchema).min(1),
  suggestions: z.array(z.string().min(1))
}).refine((value) => value.score <= value.maxScore, {
  message: "score cannot exceed maxScore",
  path: ["score"]
});

export type ScoringOutput = z.infer<typeof scoringOutputSchema>;
```

- [ ] Add tests in `tests/unit/domain/scoring-output.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scoringOutputSchema } from "@/src/scoring/scoring.schemas";

describe("scoringOutputSchema", () => {
  it("accepts structured scoring output", () => {
    const result = scoringOutputSchema.parse({
      score: 8,
      maxScore: 10,
      summary: "答案基本切题。",
      criteria: [
        { name: "内容", score: 4, maxScore: 5, feedback: "观点明确。" },
        { name: "语言", score: 4, maxScore: 5, feedback: "表达清楚。" }
      ],
      suggestions: ["增加例证。"]
    });

    expect(result.score).toBe(8);
  });

  it("rejects scores above maxScore", () => {
    expect(() => scoringOutputSchema.parse({
      score: 12,
      maxScore: 10,
      summary: "超分。",
      criteria: [{ name: "内容", score: 12, maxScore: 10, feedback: "超分。" }],
      suggestions: ["重新评分。"]
    })).toThrow();
  });
});
```

- [ ] Run:

```bash
npm run test -- tests/unit/domain/scoring-output.test.ts
```

Expected: tests pass.

### Task M1.3: Add seed data

- [ ] Create `src/db/seed.ts` with one student, one teacher, one writing rubric, one writing question, and one exam template.

Seed content must include:

```ts
const teacherEmail = "teacher@example.com";
const studentEmail = "student@example.com";
const writingRubricTitle = "TEM-4 Writing Mock Rubric";
const writingQuestionTitle = "Writing Full Mock: Campus Reading";
const examTitle = "Writing Practice MVP";
```

- [ ] Run:

```bash
npm run prisma:seed
```

Expected: local database contains a teacher, a student, a rubric, a writing question, and one visible exam template.

- [ ] Commit:

```bash
git add prisma src tests package.json package-lock.json
git commit -m "feat: add core exam domain model"
```

---

## 4. M2 — Student Writing Practice MVP

**Outcome:** A student can see available writing exams, start an attempt, type an answer, submit, and view an archived result with snapshots.

**Files:**
- Create/modify: student pages under `app/(student)/...`
- Create/modify: student API routes under `app/api/student/...`
- Create: `components/exam/ExamTimer.tsx`, `components/exam/QuestionRenderer.tsx`, `components/writing/WritingAnswerEditor.tsx`, `components/exam/SubmitExamDialog.tsx`, `components/history/AttemptHistoryList.tsx`
- Modify: `src/exam-attempts/attempt.service.ts`, `src/exam-attempts/archive.service.ts`, `src/answers/answer.service.ts`, `src/history/history.service.ts`
- Test: `tests/unit/exam-timer.test.tsx`, `tests/integration/student-writing-flow.test.ts`, `tests/e2e/student-writing-mvp.spec.ts`

### Task M2.1: Implement attempt creation and answer save APIs

- [ ] Write integration test `tests/integration/student-writing-flow.test.ts` covering:
  - list visible exams,
  - create attempt,
  - create empty answer rows for template questions,
  - save answer text,
  - submit attempt,
  - preserve template/question/standard answer/explanation snapshots.

- [ ] Implement route handlers:

```text
GET  /api/student/exams
GET  /api/student/exams/:examTemplateId
POST /api/student/exam-attempts
GET  /api/student/exam-attempts/:attemptId
PATCH /api/student/exam-attempts/:attemptId/answers/:answerId
POST /api/student/exam-attempts/:attemptId/submit
GET  /api/student/exam-attempts/:attemptId/result
GET  /api/student/exam-attempts/history
```

- [ ] Apply authorization rule in every student route:

```ts
// Student routes must only read/write records belonging to currentUser.id.
if (attempt.studentId !== currentUser.id) {
  return Response.json({ error: "Not found" }, { status: 404 });
}
```

- [ ] Run:

```bash
npm run test -- tests/integration/student-writing-flow.test.ts
```

Expected: integration test passes.

### Task M2.2: Build student writing UI

- [ ] Implement `app/(student)/exams/page.tsx`: list visible exams with title, description, and start button.
- [ ] Implement `app/(student)/attempts/[attemptId]/page.tsx`: show prompt, timer, text editor, save state, submit dialog.
- [ ] Implement `app/(student)/attempts/[attemptId]/result/page.tsx`: show submitted text, duration, standard answer snapshot, explanation snapshot, and score placeholder if scoring is not finished.
- [ ] Implement `app/(student)/history/page.tsx`: list attempts with title, submitted time, duration, and score status.

UI acceptance criteria:

```text
- Student can navigate from exam list to an attempt page.
- Timer can be shown or hidden.
- Timer displays elapsed time and remaining time if the template has a limit.
- Answer editor autosaves or provides an explicit save button with visible saved state.
- Submit dialog states that the attempt will be archived.
- Result page reads from snapshots, not live question text.
```

- [ ] Run e2e test:

```bash
npm run test:e2e -- tests/e2e/student-writing-mvp.spec.ts
```

Expected: Playwright completes a manual-input writing submission.

- [ ] Commit:

```bash
git add app components src tests
git commit -m "feat: add student writing attempt flow"
```

---

## 5. M3 — File Upload and OCR Confirmation

**Outcome:** A student can upload an answer image, receive mock OCR text, edit it, confirm it as the final answer, and submit.

**Files:**
- Create: `src/attachments/attachment.schemas.ts`, `src/attachments/attachment.service.ts`, `src/attachments/storage.ts`
- Create: `src/ocr/ocr.schemas.ts`, `src/ocr/ocr.service.ts`, `src/ocr/providers/mock-ocr-provider.ts`
- Create: `src/workers/process-ocr-job.ts`
- Create: `components/upload/ImageUploadInput.tsx`, `components/ocr/OcrReviewPanel.tsx`
- Create/modify: `app/api/files/upload/route.ts`, `app/api/ocr/jobs/route.ts`, `app/api/ocr/jobs/[jobId]/route.ts`, `app/api/answers/[answerId]/ocr-confirmation/route.ts`
- Test: `tests/unit/ocr/*.test.ts`, `tests/integration/ocr-flow.test.ts`, `tests/e2e/student-ocr-flow.spec.ts`

### Task M3.1: Implement upload validation and private storage abstraction

- [ ] Add schema rules:

```ts
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxUploadBytes = 8 * 1024 * 1024;
```

- [ ] Validate file upload at the API boundary:
  - reject non-image MIME types,
  - reject files larger than 8 MB,
  - generate server-side storage keys,
  - never trust the original filename for storage paths.

- [ ] Use local filesystem storage for development tests behind the `storage.ts` interface, with method names:

```ts
export interface ObjectStorage {
  putObject(input: { key: string; body: Buffer; contentType: string }): Promise<void>;
  getSignedReadUrl(input: { key: string; expiresInSeconds: number }): Promise<string>;
}
```

- [ ] Run:

```bash
npm run test -- tests/unit/attachments tests/integration/ocr-flow.test.ts
```

Expected: invalid upload cases fail safely; valid upload creates `Attachment`.

### Task M3.2: Implement OCR job flow

- [ ] Implement `mock-ocr-provider.ts` to return deterministic text:

```ts
export async function recognizeImage(): Promise<{ text: string; confidence: number }> {
  return {
    text: "This is recognized mock OCR text for the writing answer.",
    confidence: 0.92
  };
}
```

- [ ] Implement job statuses:

```text
PENDING -> PROCESSING -> SUCCEEDED
PENDING -> PROCESSING -> FAILED
```

- [ ] On successful OCR, save:
  - `OcrJob.recognizedText`,
  - `OcrJob.confidence`,
  - `OcrJob.completedAt`,
  - `Answer.ocrText`.

- [ ] Add `PATCH /api/answers/:answerId/ocr-confirmation` to copy the student-edited OCR text into `Answer.finalText` and set `Answer.inputMethod = OCR_IMAGE`.

- [ ] Run:

```bash
npm run test -- tests/integration/ocr-flow.test.ts
```

Expected: upload creates OCR job; processing job updates answer; confirmation updates final answer.

### Task M3.3: Add OCR UI to attempt page

- [ ] Add `ImageUploadInput` below the writing editor.
- [ ] Add `OcrReviewPanel` with:
  - recognized text area,
  - confidence display,
  - editable text before confirmation,
  - confirm button,
  - retry upload affordance when job fails.

- [ ] Run:

```bash
npm run test:e2e -- tests/e2e/student-ocr-flow.spec.ts
```

Expected: student uploads image, sees mock OCR text, edits it, confirms, submits, and result page shows edited final text.

- [ ] Commit:

```bash
git add app components src tests prisma
git commit -m "feat: add OCR upload and confirmation flow"
```

---

## 6. M4 — AI Scoring and Result Explanation

**Outcome:** After submission, the platform creates a scoring job, validates structured scoring output, stores traceable scoring results, and shows score, rubric breakdown, suggestions, standard answer, and explanation.

**Files:**
- Create/modify: `src/scoring/scoring.schemas.ts`, `src/scoring/scoring.service.ts`, `src/scoring/providers/mock-scoring-provider.ts`
- Create/modify: `src/ai/ai-client.ts`, `src/ai/prompts.ts`, `src/ai/structured-output.ts`
- Create: `src/workers/process-scoring-job.ts`
- Create: `components/scoring/ScoringResultView.tsx`, `components/explanation/ExplanationPanel.tsx`
- Modify: `app/api/student/exam-attempts/[attemptId]/submit/route.ts`, `app/api/student/exam-attempts/[attemptId]/result/route.ts`
- Test: `tests/unit/scoring/*.test.ts`, `tests/integration/scoring-flow.test.ts`, `tests/e2e/student-scoring-result.spec.ts`

### Task M4.1: Implement rubric-based scoring contract

- [ ] Require scoring input to include:

```text
question type, prompt, student final answer, standard answer, teacher rubric, max score, output language, required JSON fields
```

- [ ] If a question has no rubric, return a non-formal result:

```json
{
  "formalScoreAllowed": false,
  "summary": "缺少老师评分标准，本次仅生成练习建议，不生成正式分数。"
}
```

- [ ] If a rubric exists, require output shape:

```json
{
  "score": 8,
  "maxScore": 10,
  "summary": "答案基本切题，但论证展开不足。",
  "criteria": [
    {
      "name": "内容完整性",
      "score": 3,
      "maxScore": 4,
      "feedback": "覆盖了核心观点，但缺少具体支撑。"
    }
  ],
  "suggestions": ["增加一个具体例子支撑主题句。"]
}
```

- [ ] Run:

```bash
npm run test -- tests/unit/scoring
```

Expected: schema rejects malformed output and scores above rubric max.

### Task M4.2: Implement mock scoring provider and scoring worker

- [ ] Implement `mock-scoring-provider.ts` to return deterministic rubric-based output.
- [ ] On attempt submission:
  - set attempt status to `SCORING`,
  - create scoring work for each submitted answer,
  - run worker synchronously in development/test or enqueue for production later.
- [ ] Save `ScoringResult` with:
  - `scorerType = AI`,
  - `score`, `maxScore`,
  - `rubricBreakdown`,
  - `feedback`,
  - `modelName`, `modelVersion`,
  - `inputSummary`.
- [ ] Update attempt status to `SCORED` and `totalScore` after all answers are scored.

- [ ] Run:

```bash
npm run test -- tests/integration/scoring-flow.test.ts
```

Expected: submitted attempt becomes scored and result is persisted.

### Task M4.3: Build result page

- [ ] `ScoringResultView` must show:
  - total score and max score,
  - each criterion score,
  - feedback summary,
  - suggestions.
- [ ] `ExplanationPanel` must show:
  - standard answer snapshot,
  - explanation snapshot,
  - student final answer.

- [ ] Run:

```bash
npm run test:e2e -- tests/e2e/student-scoring-result.spec.ts
```

Expected: student submits writing answer and sees score, feedback, standard answer, and explanation.

- [ ] Commit:

```bash
git add app components src tests prisma
git commit -m "feat: add rubric-based AI scoring results"
```

---

## 7. M5 — Teacher Writing Management

**Outcome:** Teachers can maintain writing questions, exam templates, and scoring rubrics without developer seed changes.

**Files:**
- Create/modify teacher pages under `app/(teacher)/...`
- Create/modify teacher API routes under `app/api/teacher/...`
- Create: `components/rubrics/RubricEditor.tsx`
- Modify: `src/questions/question.service.ts`, `src/exam-templates/exam-template.service.ts`, `src/rubrics/rubric.service.ts`
- Test: `tests/integration/teacher-management-flow.test.ts`, `tests/e2e/teacher-writing-management.spec.ts`

### Task M5.1: Implement teacher rubric management

- [ ] Add routes:

```text
GET   /api/teacher/scoring-rubrics
POST  /api/teacher/scoring-rubrics
PATCH /api/teacher/scoring-rubrics/:rubricId
```

- [ ] Enforce teacher ownership:

```text
Teachers can edit only rubrics where createdById equals currentUser.id.
Admins can edit all rubrics.
Students cannot access teacher rubric routes.
```

- [ ] Build `RubricEditor` with fields:
  - title,
  - question type,
  - max score,
  - criteria list with name, max score, description.

- [ ] Run:

```bash
npm run test -- tests/integration/teacher-management-flow.test.ts
```

Expected: teacher creates and edits a rubric; student receives 403.

### Task M5.2: Implement teacher question and exam-template management

- [ ] Add question routes:

```text
GET   /api/teacher/questions
POST  /api/teacher/questions
PATCH /api/teacher/questions/:questionId
```

- [ ] Add exam template routes:

```text
GET   /api/teacher/exam-templates
POST  /api/teacher/exam-templates
PATCH /api/teacher/exam-templates/:examTemplateId
```

- [ ] Teacher question form must support first writing subtype fields:
  - writing full mock,
  - prompt,
  - content JSON,
  - standard answer JSON,
  - explanation,
  - rubric selection.

- [ ] Teacher template form must support:
  - title,
  - description,
  - time limit seconds,
  - visibility,
  - ordered question selection,
  - points per question.

- [ ] Run:

```bash
npm run test:e2e -- tests/e2e/teacher-writing-management.spec.ts
```

Expected: teacher creates rubric, question, template; student can see the new exam.

- [ ] Commit:

```bash
git add app components src tests
git commit -m "feat: add teacher writing management"
```

---

## 8. M6 — Post-MVP Expansion Plan

Do not start M6 until M0–M5 pass `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build`.

### M6.1 Writing subtype expansion

**Goal:** Support all writing exercise types from the product brief.

- [ ] Add renderer/config support for `WRITING_SUMMARY`.
- [ ] Add renderer/config support for `WRITING_PARAGRAPH`.
- [ ] Add renderer/config support for `WRITING_OUTLINE`.
- [ ] Add renderer/config support for `WRITING_FRAMEWORK`.
- [ ] Add subtype-specific rubric presets.
- [ ] Add e2e test for each subtype using the same attempt/answer/scoring/archive flow.

### M6.2 Objective and reading question expansion

**Goal:** Reuse exam attempts and answers for auto-graded text question types.

- [ ] Add `MULTIPLE_CHOICE` renderer and auto-grading strategy.
- [ ] Add `CLOZE` renderer and auto-grading strategy.
- [ ] Add `READING` passage renderer with grouped questions.
- [ ] Store objective grading results in `ScoringResult` with `scorerType = AI` only when AI explanation is used; otherwise use deterministic service output.
- [ ] Add e2e test for mixed writing + objective exam template.

### M6.3 Listening question expansion

**Goal:** Add audio resource handling without changing the core exam attempt model.

- [ ] Extend `Attachment.fileType` usage for audio resources.
- [ ] Add private signed URL playback for audio.
- [ ] Add audio player component with optional play-count or time restrictions.
- [ ] Add `DICTATION`, `INTERVIEW`, and `LISTENING` renderers.
- [ ] Add e2e test for audio prompt + text answer submission.

### M6.4 Operations, observability, and cost control

**Goal:** Make AI/OCR usage traceable and controllable.

- [ ] Add usage tables or daily aggregate views for OCR and AI calls.
- [ ] Track provider, model, token estimate, status, latency, and cost estimate.
- [ ] Add admin pages for AI/OCR usage.
- [ ] Add per-user upload, OCR, and scoring rate limits.
- [ ] Add alerts or dashboard queries for high-cost accounts.

---

## 9. Release Gates

Each milestone must satisfy these gates before moving on:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

For milestones with browser-facing changes, also run:

```bash
npm run test:e2e
```

Manual acceptance for M0–M4 MVP:

```text
1. Student logs in as seeded student.
2. Student opens writing exam list.
3. Student starts Writing Practice MVP.
4. Student hides and shows timer.
5. Student uploads answer image.
6. Student sees mock OCR text.
7. Student edits OCR text and confirms it.
8. Student submits attempt.
9. System generates rubric-based scoring result.
10. Student sees score, criteria feedback, suggestions, standard answer, explanation, duration, and final answer.
11. Student opens history and sees the archived attempt.
12. Teacher edits original question explanation.
13. Student result page still shows the old explanation snapshot for the archived attempt.
```

---

## 10. Product Decisions Locked for MVP

These decisions reduce ambiguity during implementation:

- **Login method for MVP:** seeded email-based demo users, with real authentication added after the writing closed loop works.
- **Primary exercise type:** `WRITING_FULL_MOCK` first; other writing subtypes after M5.
- **OCR provider for automated tests:** deterministic mock provider.
- **AI provider for automated tests:** deterministic mock scoring provider.
- **Formal score rule:** no teacher rubric means no formal AI score.
- **Storage for MVP tests:** local storage adapter behind an object-storage interface.
- **Archive rule:** result pages must read from attempt snapshots, not current question/template records.
- **Permission rule:** student-owned data returns 404 to other students; teacher-only APIs return 403 to students.

---

## 11. Self-Review

- **Spec coverage:** The plan covers the architecture proposal’s first-stage scope: web app scaffold, roles, writing question bank, exam templates, attempts, manual input, upload, OCR confirmation, AI scoring, result page, history, and teacher rubrics. Later proposal sections for objective, reading, listening, analytics, and cost controls are deferred to M6 with explicit prerequisites.
- **Placeholder scan:** The plan avoids TBD/TODO placeholders and gives concrete milestone outputs, file paths, API routes, validation rules, test commands, and acceptance criteria.
- **Type consistency:** Core names are consistent across schema, services, routes, and UI: `Question`, `ExamTemplate`, `ExamAttempt`, `Answer`, `Attachment`, `OcrJob`, `ScoringRubric`, and `ScoringResult`.
