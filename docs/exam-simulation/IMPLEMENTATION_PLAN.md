# Full Exam Simulation – analysis & implementation plan

## 1. Existing architecture (inspected)

| Concern | Where | Notes |
|---|---|---|
| Exercise content | `ExamExercise` (`exam_exercises`) | one row = one "Teil" exercise. `section` (`LESEVERSTEHEN`, `SPRACHBAUSTEINE`, `HOERVERSTEHEN`, `SCHRIFTLICHER_AUSDRUCK`, `MUENDLICHER_AUSDRUCK`), `taskType`, `level`, `partNumber`, `examType`, editorial `status` (only `PUBLISHED` is learner-visible), `version`. Passages/questions/answerOptions are JSONB. |
| Teil resolution | `ExamTeilResolver.teilOf` | Lesen/Hören → `partNumber`; Sprachbausteine → task type (MC = Teil 1, WORD_BANK_CLOZE = Teil 2). **Reused** for pool eligibility. |
| Answer key | `ExamQuestion.correctAnswer` | server only. `ExamExerciseMapper.mapQuestionsToPublic` strips it – **reused**. Correctness = trim + equalsIgnoreCase (`ExamAttemptService.isCorrect`) – **same rule reused**. |
| Single-exercise attempts | `ExamAttempt`, `ExamAttemptService`, `/api/exam/**` | immediate-feedback practice flow. **Untouched.** |
| Time training | `ExamTimeConfiguration*`, `ExamPracticeSession*` | recommended-time stats for practice. **Untouched**; simulation has its own authoritative timers. |
| Auth | JWT filter, `RequestContext`, `/api/admin/**` → `ROLE_ADMIN` | **reused**; admin endpoints live under `/api/admin/exam-simulation`. |
| Persistence | Flyway `V*.sql`, Hibernate `validate`, `JsonType` for JSONB, NanoId ids | **same approach** (`V33`). |
| Frontend | Next.js app router, axios `services/*`, react-query, `types/*`, German UI in `componenets/exam`, `AudioPlayer`, `LessonMarkdown`, Tailwind tokens | **reused**. Practice boards are coupled to instant feedback, so the simulation gets a feedback-free question renderer built on the same design tokens/types. |

## 2. Database (migration `V33__exam_simulation.sql`)

* `exam_profiles` – versioned profile (`UNIQUE(code, version)`), scalar rules as columns, parts/timers/rubrics as JSONB `config`. Only `DRAFT` profiles are editable; publishing freezes the version.
* `exam_simulation_attempts` – owner, profile id/code/version, **full profile snapshot (JSONB)**, status, stage timeline (JSONB), `final_deadline_at`, result (JSONB). Partial unique index: one `IN_PROGRESS` attempt per user+profile code.
* `exam_simulation_attempt_parts` – per part: reserved exercise id/version + **immutable exercise snapshot (JSONB, incl. answer key, server only)**.
* `exam_simulation_answers` – autosaved answers, `UNIQUE(attempt, part, question)`, idempotent upsert with client timestamp ordering.
* `exam_simulation_usage` – reservation ledger `UNIQUE(user, profile_code, exercise)`; never deleted (abandon/expire/cancel keep it).
* `exam_simulation_assessments` – manual (or later AI-estimated) part assessments; only `MANUAL` counts.
* `exam_simulation_audit` – state-transition audit trail (profiles and attempts).

## 3. Phases

1. **Foundation** – enums, profile model/config, validator, profile service (create/edit/duplicate/publish/deactivate/archive), TELC B1 seed (DRAFT until an admin records official verification), reusable scoring (`PartScorer` strategy per `PartScoringMethod`, `BigDecimal`) and result calculator (written / oral / overall kept separate).
2. **Selection & reservation** – eligibility rules, per-user no-repeat pool, Postgres advisory lock per (user, profile code) + unique ledger, shortage → `409 INSUFFICIENT_CONTENT`.
3. **Lifecycle & timers** – attempt state machine, server-side stage clock (shared timers, lazy advance + scheduled sweeper), autosave, resume, section completion, idempotent finalisation, cancel, audit.
4. **API** – `/api/exam-simulation/**` (learner, ownership-checked) and `/api/admin/exam-simulation/**`.
5. **Learner UI** – overview, active exam (sticky server-driven countdown, navigation, flags, autosave, audio, writing editor, oral practice, review & submit), results + history + progress chart.
6. **Admin UI** – profile CRUD/validation/publish, availability, attempts and assessment queue.
7. **Tests** – unit (scoring, clock, validator, calculator), integration with Testcontainers (selection, concurrency, lifecycle, security), frontend component tests; regression run of the existing suite.

## 4. Key decisions

* Scoring/pass rules are data (`ExamProfile`), not code. Services never reference "TELC" or "B1".
* A written result is `AWAITING_ASSESSMENT` until every manual written part is assessed; no invented writing score. Overall result follows the profile's `OverallResultPolicy`; with `WRITTEN_AND_ORAL_REQUIRED` and an unscored oral part it is `INCOMPLETE_ORAL_NOT_ASSESSED`.
* Stage deadlines are chained: a stage that expires hands over to the next at its deadline; finishing early hands over immediately. Last stage expiring finalises the attempt as `EXPIRED` (scored from the saved answers).
* Answer keys are returned only per the profile's `AnswerReleasePolicy`, after finalisation.
