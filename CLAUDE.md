# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current repository state

This worktree contains the scaffolded implementation branch for a browser-first TEM-4 practice platform. The current codebase is the M3 implementation: a Next.js app shell with TypeScript, Tailwind CSS, ESLint, Vitest, Playwright, and Prisma with implemented domain models for the writing practice closed loop.

Primary product/design sources:

- `hajimeru.txt` — initial product notes in Chinese.
- `docs/superpowers/specs/2026-04-30-tem4-web-practice-platform-architecture.md` — full technical architecture proposal.
- `docs/superpowers/plans/2026-04-30-tem4-web-practice-platform-development-plan.md` — phased implementation plan.

## Commands

Run commands from this repository root: `/Volumes/fdisk/shigoto/code/tem/`.

- `npm run dev` — start the Next.js development server.
- `npm run build` — build the production app.
- `npm run start` — start the production server after a build.
- `npm run lint` — run ESLint over the repository.
- `npm run typecheck` — run TypeScript without emitting files.
- `npm run test` — run Vitest unit/integration tests; e2e tests are excluded by `vitest.config.ts`.
- `npm run test -- tests/unit/smoke.test.ts` — run a single Vitest test file.
- `npm run test:watch` — run Vitest in watch mode.
- `npm run test:e2e` — run Playwright tests.
- `npm run test:e2e -- tests/e2e/home.spec.ts` — run a single Playwright spec.
- `npm run prisma:generate` — generate Prisma Client from `prisma/schema.prisma`.
- `npm run prisma:migrate` — create/apply local Prisma migrations.
- `npm run prisma:seed` — run `src/db/seed.ts`; this script is present but the seed file has not been implemented yet.

For a full baseline verification run:

```bash
npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e -- tests/e2e/home.spec.ts
```

## Current code structure

- `app/` — Next.js App Router application shell. Currently contains only the root layout, homepage, global CSS, and favicon.
- `src/db/prisma.ts` — Prisma Client singleton for server-side database access.
- `prisma/schema.prisma` — Prisma baseline configuration using PostgreSQL and `prisma-client-js`; no domain models are defined yet.
- `tests/unit/` — Vitest unit tests for the current test harness.
- `tests/e2e/` — Playwright browser tests. These are intentionally excluded from Vitest.
- `tests/setup.ts` — Testing Library / jest-dom setup for Vitest.
- `vitest.config.ts` — jsdom-based Vitest config; `@/*` alias maps to repository root for absolute imports.
- `playwright.config.ts` — Playwright config that starts `npm run dev` at `http://localhost:3000` (not 3000).
- `.env.example` — local environment template for PostgreSQL, object storage, AI provider, and OCR provider settings.

## Architecture direction

The platform should use a unified exam-paper model so all TEM-4 exercise types share the same core practice flow:

- `Question` defines prompt/content, standard answer, explanation, scoring configuration, and rendering metadata.
- `ExamTemplate` groups ordered questions and timing/visibility configuration.
- `ExamAttempt` records a student's practice session, status, duration, score, and immutable snapshots.
- `Answer` stores manual input, OCR text, final confirmed text, attachments, and submission state.
- `ScoringRubric` is maintained by teachers and controls formal AI grading.
- `ScoringResult` stores AI or teacher scoring output, rubric breakdowns, feedback, and model metadata.

The intended application layers are:

```text
Browser UI
  -> Next.js App Router pages/components
  -> Route Handlers / backend services
  -> Prisma + PostgreSQL
  -> Object storage for uploads
  -> OCR and AI provider adapters
```

The first product milestone should implement the writing practice closed loop: student selects writing exam, creates an attempt, enters or OCR-imports an answer, confirms final text, submits, receives rubric-based AI scoring, and views an archived result/history page.

## Important business rules

- Historical exam results must read from snapshots saved on `ExamAttempt`, not from mutable current question/template records.
- OCR output is only a draft answer. Students must be able to review and edit recognized text before submission.
- Formal AI scores require a teacher-maintained rubric. Without a rubric, produce informal suggestions only.
- AI outputs must be structured and validated before persistence.
- AI/OCR calls should store provider/model metadata, input summary, output, status, and timing/cost information once those services exist.
- Uploaded files should be private and exposed through short-lived signed URLs after access checks.
- Student-owned attempt, answer, attachment, and scoring records must not be readable by other students.

## Docker deployment

Production deployment uses Docker with the following configuration:

- **Port**: `3000:3000` (container port mapped to host port)
- **Environment variables**:
  - `DATABASE_URL=postgresql://temuser:tempass@db:54:32/temdb`
  - `NODE_ENV=production`
  - `DEMO_AUTH_ENABLED=true` (enables demo student authentication)

**Remote deployment** (tem.phuyu.cloud):
```bash
ssh f@tem.phuyu.cloud "cd tem && git pull origin main && docker compose down && docker compose up -d --build"
```

## Demo authentication

The app includes a demo mode for development/testing without a real database. When `DEMO_AUTH_ENABLED=true`:
- A mock student user is automatically authenticated
- In-memory demo data is used instead of database queries
- This allows full UI testing without database setup

In `src/auth/current-user.ts`:
```typescript
export function isDemoAuthEnabled(): boolean {
  return process.env.DEMO_AUTH_ENABLED === "true" || process.env.NODE_ENV !== "production";
}
```

## Next.js version note

`AGENTS.md` was generated by Create Next App and notes that this project uses a newer Next.js version with breaking changes. Before relying on older Next.js assumptions, check the installed docs under `node_modules/next/dist/docs/` or verify behavior against the current code.
