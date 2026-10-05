# Mobile API Integration

Living document; endpoints are added per phase. Base URL: `${EXPO_PUBLIC_API_URL}/api`.
Headers on every call: `Authorization: Bearer <accessToken>` (except `/auth/**`), `Accept-Language: <EN|FA|…>` (user's `preferredLanguage`, backend default `EN`).
Errors: HTTP status drives the client's `ApiError.kind` (401 unauthorized, 403 forbidden, 404 notFound, 429 limit, 400/409/422 validation, 5xx server, fetch failure network).

## Auth (added for mobile — web cookie endpoints unchanged)

| Endpoint | Auth | Request | Response | Notes |
|---|---|---|---|---|
| `POST /auth/mobile/login` | none | `{email, password}` | `{message, data:{accessToken, refreshToken, user: UserProfileResponse}}` | Same credential check as `/auth/login` |
| `POST /auth/mobile/register` | none | `UserRegistrationRequest` | 201, same shape | Auto-authenticates |
| `POST /auth/mobile/refresh` | none | `{refreshToken}` | `{message, data:{accessToken}}` | 401 invalid/expired, 403 disabled/deleted user. Refresh token not rotated |
| `POST /auth/forgot-password` | none | `ForgotPasswordRequest` | `ApiResponse<Void>` | existing |
| `GET /user/profile` | bearer | – | `ApiResponse<UserProfileResponse>` | session restore |

**Error quirk:** wrong credentials / inactive account return **HTTP 404** with `{message}` (`DataNotFoundException`), not 401. The mobile login screen shows that message as-is. Validation failures (`@Valid`) return 400 with a field-error map (no `message`); the app validates client-side first.

`PreferredLanguage` is `EN | DE | PR` and is sent upper-case as `Accept-Language`.

`JWTAuthFilter` now accepts `Authorization: Bearer` when no `access_token` cookie is present.

## Dashboard (existing, no backend change)
`GET /dashboard` → `DashboardResponse` directly (not wrapped in `ApiResponse`); types in `mobile/src/types/dashboard.ts`.
- `continueLearning.type` ∈ DAILY_WORDS | VOCAB_REVIEW | GRAMMAR | READING | EXPRESSIONS | EXAM | START (START = new learner).
- `route` fields are **web paths** (`/dashboard/...`); `features/dashboard/routes.ts` maps them to mobile routes, unknown → `/learn`.
- `week.days` is a **rolling last-7-days array, oldest → today** (not Mon–Sun). No minutes-learned data exists, so the UI does not show learning time.
- `focus.area` may be null (nothing to suggest → card hidden); `milestone` / `newContent` may be null. `newContent` is not shown on mobile.
- Loading this endpoint generates today's daily words server-side.

## Daily Words (existing, no backend change)
| Endpoint | Request | Response | Notes |
|---|---|---|---|
| `GET /daily-words` | – | `DailyWord[]` (`id, word, meaning, example, synonyms, level, learned, meaningFa, exampleFa`) | Generates today's words on first call. `meaningFa`/`exampleFa` only for A1–B1 learners with language PR |
| `POST /learning-progress` | `{dailyWordId, learned: true}` | 201 `ApiResponse<String>` | Marks a word learned; the dashboard plan/streak update from this |
| `GET /vocabulary/exists?word=` | – | `{exists, vocabularyItemId}` | Drives the "saved" state of the save button |
| `POST /vocabulary` | `{word, article, meaning, language:'EN', example, level}` | `VocabularyItem` | Backend generates synonyms via Ollama (can hit the AI daily limit → 429). Duplicate → 400 "Vocabulary already exists…", treated as saved |

The quiz after the words is built client-side from the same five words (as on web); there is no quiz endpoint.

## Vocabulary trainer (existing, no backend change)
| Endpoint | Request | Response | Notes |
|---|---|---|---|
| `GET /vocabulary/practice/session[?vocabularyItemId=]` | – | `{items: PracticeVocabularyItem[], newCount, reviewCount}` | Server picks new + due words. Each item has `contextQuestion` (cloze or context multiple choice, 2–4 options `{key,text}`) or `null` when the learner has < 4 saved words (flashcard-only). Never cached |
| `POST /vocabulary/practice/round` | `{vocabularyItemId, flashcardKnewIt, contextSelectedKey \| null}` | `{flashcardCorrect, contextCorrect \| null, correctContextKey \| null, progress}` | One call per word, after both steps. `progress.masteryLevel` ∈ NEW/LEARNING/FAMILIAR/MASTERED. Invalidates the dashboard (review counts) |

`/learn/vocabulary` and `/learn/review` both open this trainer. Saved words are lower-cased by the backend and carry no article when saved from Daily Words (same as web). `audioUrl` is ignored; pronunciation uses on-device German TTS.

## Grammar (existing, no backend change)
| Endpoint | Response / notes |
|---|---|
| `GET /grammar/level-summary` | `[{level, total, learned}]` – level chips |
| `GET /grammar?level=A1` | `{level, categories:[{id,title,titleFa,passThreshold,lessons:[summary rows],testStatus}], uncategorized:[summary rows]}` – light rows, no content/quiz |
| `GET /grammar/{id}` | full lesson: `content`/`example`/`usageTips` are **Markdown and/or rich-text HTML** (rendered natively by `components/content`), `quiz[]` (mcq / fill / truefalse; `answer` is included and checked on the device), `learningProgresses`, `bookmarked`, `*Fa` Persian fields (A1–B1 only) |
| `GET /grammar/{id}/navigation` | `{previous, next}` neighbours in list order |
| `POST/DELETE /grammar/{id}/bookmark` | toggle bookmark; returns the lesson |
| `POST /learning-progress` | `{lessonId, learned}` – mark/unmark learned |
| `GET /exercise-progress`, `POST /exercise-progress {questionKey, correct}`, `DELETE /exercise-progress [keys]` | per-question quiz results, key = `<lessonId>:<questionIndex>` (index in the original `quiz[]`) |
| `GET /grammar/categories/{id}` | category + all lessons with quizzes (feeds the category test) |
| `POST /grammar/categories/{id}/test-result {score,total}` | records the attempt; backend computes pass/fail vs `passThreshold` → `CategoryTestStatus` |
| `POST /grammar/categories/{id}/test-result/complete` | marks a passed category completed |

Rules mirrored from web: quiz answers compare case-insensitively; broken questions are skipped; all-correct lesson quiz marks the lesson learned; the category test draws up to 15 random playable questions. Persian (preferredLanguage `PR`) applies only to A1–B1 and only when a `*Fa` value exists. Not in mobile yet: "saved for later" bookmark list, search.

## Active Expressions (existing, no backend change)
Two collections: `REDEWENDUNG` and `NOMEN_VERB_VERBINDUNG`. (`/redemittel` is a separate speaking/writing-phrase feature and is not part of the mobile scope yet.)

| Endpoint | Notes |
|---|---|
| `GET /expressions/collection-summary` | `[{type, total}]` – hub counts |
| `GET /expressions/continue-learning?type=` | `{items: list rows, readyCount}` – "Weiter lernen" shortlist on the hub |
| `GET /expressions?type=&page=&size=&level=&progress=&bookmarked=&search=&sort=` | zero-based pages; `sort` ∈ recommended / progress / alphabetical; mobile loads 20 per page via infinite scroll; "ALL" filters are omitted so the backend can serve its cached list |
| `GET /expressions/{id}` | full entry (meanings DE/EN/FA, literal/figurative, patterns, examples with EN/FA translations, notes, `progress`, `bookmarked`; `imageUrl` only shown for REDEWENDUNG) |
| `GET /expressions/{id}/navigation` | previous/next in the same collection and level |
| `POST /expressions/{id}/view` | called once when a detail screen opens (counts as seen) |
| `POST/DELETE /expressions/{id}/bookmark` | toggle bookmark |
| `GET /expressions/practice/session[?expressionId=]` | server-picked new + due items; each has `warmupSteps` (RECALL/CONTEXT/COMPLETION/TRANSFORMATION) and the questions for them; never cached |
| `POST /expressions/practice/recall {expressionId,userAnswer}` | `{correct, correctAnswer, progress}` |
| `POST /expressions/practice/question {expressionId,questionId,selectedOptionId}` | `{correct, correctOptionId, explanation, progress}` |
| `POST /expressions/practice/transformation {expressionId,questionId,sentence}` | **AI-judged** (`usedExpression`, `grammarCorrect`, `meaningPreserved`, `feedback`, `c1Suggestion`); counts against the AI daily limit → may return 429 |
| `POST /expressions/practice/production {expressionId,sentence}` | **AI-judged**, same limit rules |

Steps per expression: optional *discover* (skipped when coming from the detail screen), the server's warm-up steps, then always *production*. A step counts as right when the AI says the expression was used **and** the grammar is correct. On an AI error/limit the learner can skip the step. `GET /expressions/difficult` is not used yet.

## Reading (existing, no backend change)
| Endpoint | Notes |
|---|---|
| `GET /reading/level-summary` | `[{level, total, learned}]` – level chips; the list opens on the profile level when it has texts |
| `GET /reading/categories` | `[{id, title}]` – topic filter |
| `GET /reading?level=&page=&size=&search=&bookmarked=&categoryId=` | zero-based pages, 10 per page via infinite scroll; empty filters are omitted so the backend can serve its cached list |
| `GET /reading/{id}` | full text: `content`, server `tokens` (concatenated they reproduce `content`), `annotations` with character `spans`, `keyVocabulary`, `bookmarked`, `quizCompleted`, `learningProgresses` |
| `GET /reading/{id}/navigation` | previous/next text |
| `POST /reading/{id}/view` | called on every open (separate from the cacheable article fetch); failures are ignored |
| `POST/DELETE /reading/{id}/bookmark` | toggle bookmark, returns the article |
| `POST /learning-progress {readingId, learned}` | "Als gelesen markieren" |
| `POST /lexicon {lemma,type,articleId,sentence,translation}` | "Zur Wiederholung speichern" from a highlighted word |
| `GET /dictionary/{lemma}` | lookup for any tapped word; 404 → friendly "no entry" |
| `POST /reading/{articleId}/attempts` | starts the quiz → `{attemptId, questions}` |
| `POST /reading/attempts/{id}/answers {questionId,answer}` | feedback incl. `relatedLemma`, which the app saves to the review list (as web does) |
| `POST /reading/attempts/{id}/complete {wordsTapped,wordsSaved}` | scores + next-text recommendation; the reader and quiz share tapped/saved words through `readingSessionStore` |

Rendering: the app builds text segments from `tokens` + annotation `spans` (`features/reading/segments.ts`) so highlighted phrases and every word are tappable in one selectable text flow. Not in mobile yet: admin features, reading-time tracking.

## Gaps
Push device registration (Phase 13); AI usage/remaining endpoint (optional); (daily-words completion: resolved, uses `POST /learning-progress`).
