# DTZ A2–B1 Mündliche Prüfung — exercise creator

Admin → Prüfungsvorbereitung → **DTZ A2–B1 · Mündliche Prüfung** (`/admin/exam-prep/dtz-muendlich`), three tabs. No runtime AI: prompts are
copied into an external AI tool and the returned JSON is imported (`Upload JSON → Validate → Preview → Import as DRAFT → Edit → Publish`).

| Teil | Task type (`exerciseType`) | Content |
|---|---|---|
| 1 Über sich sprechen | `SELF_INTRODUCTION` | One fixed template: the six topics Name, Geburtsort, Wohnort, Arbeit/Beruf, Familie, Sprachen (labels and order cannot change). Optional `practiceSupport` (question, sentence starter, vocabulary, en/fa explanation) is kept apart from the topics. |
| 2 Über Erfahrungen sprechen | `PHOTO_EXPERIENCE` | `image` + `participantA` (exact instruction, exactly the two picture prompts) + `participantB` (exact instruction, 4 `questionsA2`, 4 `questionsB1`). Learner picks A2, B1 or mixed for the same photo. |
| 3 Gemeinsam etwas planen | `JOINT_PLANNING` | `situation`, exact `taskInstruction`, 4–6 `planningNotes` (open keywords), optional `learnerSupport.examplePhrases`. No dialogue. |

## Storage (no migration)
* Same table as all exam content (`exam_exercises`): `exam_type = DTZ`, `section = MUENDLICHER_AUSDRUCK`, `part_number` 1–3, level `B1` (DTZ convention).
* Structured content: `metadata.dtzOral` (jsonb, import shape). One readable passage per exercise.
* **Image field**: the existing exam-image model — `ExamPassage.imageUrl` (`/uploads/exam-passages/<file>`), uploaded through `POST /api/admin/exam/upload-image`.
  The JSON field is `image.imageUrl` (not `assetId`); the AI returns `imagePrompt` and `imageUrl: null`. Links to other sites and placeholder files are rejected.
* New enum values `SELF_INTRODUCTION`, `PHOTO_EXPERIENCE` are stored as strings; the `task_type` check constraint was already dropped (V30), so **no Flyway migration is required**.

## Rules
* Structural validation is deterministic and blocks import/save (`ExamDtzOralReader`); semantic checks (photo prompt too thin / may contain text or logos, A2 too abstract,
  B1 repeats A2, questions off-topic, hiking notes copied, situation without joint planning, unrelated notes) are warnings only.
* Publish rule (`ExamContentService.dtzOralProblem`): the stored content must pass the same checks, and Teil 2 needs an uploaded image. An edit that would break a published exercise is refused.
* Only one non-archived Teil 1 template may exist (create and import refuse a second one).
* Learners get `dtzOral` without admin-only fields (the image prompt is dropped).

## API (admin)
`POST /api/admin/exam-content/dtz-oral` · `PUT /api/admin/exam-content/dtz-oral/{id}` · `POST /api/admin/exam-content/dtz-oral/template` (standard Teil 1 draft) ·
prompts via the existing `POST /api/admin/exam-content/prompt` (`exam=DTZ, section=MUENDLICH, part=TEIL_n`) · validate/import/status via the existing endpoints.
