# Mobile Architecture Analysis

Phase 0 output. No production code was modified. Based on a read of `backend/` (Spring Boot controllers, filter, security/CORS config, cookie service) and `frontend/` (axios client, DTO types, theme tokens, CI).

## 1. Current Architecture

- **Not a monorepo.** Root contains `backend/` (Spring Boot, Maven), `frontend/` (Next.js, npm), `Dockerfile`, `docker-compose.yml`, `.github/workflows/` (`frontend.yml`, `maven.yml`, two Sonar workflows). No shared packages.
- **Backend**: Spring Boot, PostgreSQL + MongoDB, Ollama for AI. ~40 controllers under `/api/**`; admin under `/api/admin/**` (`ROLE_ADMIN`).
- **Frontend**: Next.js app router, axios (`frontend/services/api.ts`), TanStack Query already in use, Zustand stores (`frontend/store`), shadcn/Radix + Tailwind. Types for every domain in `frontend/types/*.ts`; one service file per domain in `frontend/services/*.ts`.
- **Deployment**: web on Vercel, backend on Render (different origins).

## 2. Authentication Flow (the main blocker)

Auth is **cookie-only**:

| Step | Behavior |
|---|---|
| `POST /api/auth/login` | Validates credentials, sets `access_token` + `refresh_token` as `HttpOnly; Secure; SameSite=None` cookies (7-day max-age). Body is `ApiResponse<UserProfileResponse>`; **no tokens in the body**. |
| `POST /api/auth/register` | Same, auto-authenticates. |
| `GET /api/auth/refresh` | Reads `refresh_token` **cookie**, issues a new `access_token` cookie. Refresh token is not rotated. |
| `POST /api/auth/logout` | Clears the cookies (stateless; does not revoke the stored refresh token). |
| `JWTAuthFilter` | Reads token **only** from the `access_token` cookie. Missing/invalid → bare 401. Disabled user → 403. Also reads `Accept-Language` into `LanguageContext` (default `EN`). |
| CORS | `allowCredentials=true`, origins = `frontend_url` + `http://localhost:*`. Native apps send no Origin, so CORS does not apply to them. |

**Consequence:** the plan requires tokens in SecureStore with a Bearer-style refresh queue. The backend cannot do that today. React Native's native networking can carry cookies automatically, but that gives no SecureStore control, no explicit refresh lock, and is unreliable across iOS/Android. **Recommended minimal backend change (additive, web unchanged):**

1. `JWTAuthFilter`: if no `access_token` cookie, fall back to `Authorization: Bearer <jwt>`.
2. `login` / `register`: when request has header `X-Client: mobile`, also return `{accessToken, refreshToken}` in the body (cookies unchanged for web).
3. Refresh: accept `POST /api/auth/refresh` with `{refreshToken}` in the body and return `{accessToken}` (keep the existing `GET` cookie version for web).

`/api/auth/refresh` is already in the filter's skip list. This is the only backend work required for Phases 2–4.

## 3. Existing APIs (reusable as-is)

All authenticated unless noted. Detail per endpoint (request/response DTOs) will go into `MOBILE_API_INTEGRATION.md`, filled in per phase as each screen is built, against `frontend/types/*.ts`, which already mirror the DTOs.

| Domain | Endpoints |
|---|---|
| Auth (public) | `POST /auth/login`, `/auth/register`, `/auth/forgot-password`, `PUT /auth/reset-password`, `GET /auth/refresh`, `POST /auth/logout` |
| **Dashboard** | `GET /dashboard` → `DashboardResponse { user, currentStreak, continueLearning, today, review, focus, week, milestone, newContent }` |
| Daily words | `GET /daily-words` |
| Vocabulary | CRUD `/vocabulary`, `/{id}/bookmark`, `GET /vocabulary/practice/session`, `POST /vocabulary/practice/round` |
| Grammar | `GET /grammar?level=`, `/grammar/level-summary`, `/grammar/{id}`, `/{id}/navigation`, bookmarks; `GET /grammar/categories/{id}`, `POST /grammar/categories/{id}/test-result[/complete]` |
| Expressions | `/expressions` (paged), `/collection-summary`, `/continue-learning`, `/difficult`, `/{id}`, `/{id}/navigation`, `/{id}/view`, bookmarks; practice: `GET /expressions/practice/session`, `POST .../recall|question|transformation|production` |
| Redemittel | `/redemittel/hub`, list, `/today`, `/review`, `/practice`, `/{id}`, `/learn`, `/save`, answer endpoints |
| Reading | `/reading` (list), `/level-summary`, `/categories`, `/{id}`, `/navigation`, `/view`, bookmarks; attempts: `POST /reading/{id}/attempts`, `/attempts/{id}/answers`, `/attempts/{id}/complete` |
| Exam | `/exam` (list), `/level-summary`, `/{id}`, bookmarks; attempts: `POST /exam/{id}/attempts`, `/attempts/{id}/answers`, `/attempts/{id}/complete`, `mark-completed`; practice sessions + time config; `/exercise-progress` |
| Writing | `/writing/learn`, `/writing/attempts` (+ `/{id}/ai-feedback`, `/progress`), `/writing/learn-progress` |
| AI Tutor | `POST /ollama/chat {sessionId, question}`, `GET /ollama/user-sessions`, `GET /ollama/message/{sessionId}`, `PUT /ollama/session-title/{id}`, `DELETE /ollama/session/{id}` |
| User | `GET /user/profile`, `PUT /user/onboarding`, `PUT /user/update-profile`, `PUT /user/update-password`, `POST /user/avatar` (multipart) |
| Progress | `/learning-progress/overview`, `/streak`, `/stats`, `/recent-vocabulary-progress` |
| Notifications (in-app) | `/notifications` (paged), `/unread-count`, `PATCH /{id}/read`, `POST /read-all`, `POST /{id}/click`; `/notification-preferences` GET/PUT |
| Uploads | `/uploads/**` is public (images/audio URLs) |

**Key finding:** the aggregated dashboard endpoint the plan hoped for **already exists** and its shape (`continueLearning`, `today`, `review`, `focus`, `week`, `milestone`) matches the plan nearly 1:1. No new dashboard endpoint is needed. Caveat: `route` fields in the DTO are **web paths**, so the mobile app needs a small route-mapper (`/grammar/...` → Expo Router path).

## 4. Missing APIs / Gaps

| Gap | Needed for | Severity |
|---|---|---|
| Bearer/body-token auth (see §2) | Phases 2+ | **Blocking** (small, additive) |
| Push device-token registration (`POST /notifications/devices`) and a push channel. Notifications are in-app only today (`NotificationDispatchService` comment: "In-app is the only channel today") | Phase 13 | Phase-13 only |
| AI usage endpoint (remaining/limit for current user). Limits are enforced server-side (`EntitlementService` → 429 + message) and readable only via admin endpoint | Tutor UX ("3 left today") | Optional. Without it the app shows the 429 message, as web does |
| Daily-words completion/“mark learned” endpoint not identified (only `GET /daily-words`) | Phase 5 | **To verify** in Phase 5 (may be tracked via `/learning-progress`) |
| Analytics events | §53 | Defer; no backend sink exists |

## 5. Mobile Architecture

Create **`mobile/`** at repo root (no monorepo migration yet), Expo SDK (latest stable) + TypeScript strict + Expo Router, structure per the plan (`app/`, `src/{api,components,features,hooks,stores,theme,utils}`).

- **Server state**: TanStack Query. **UI state**: Zustand. **Secrets**: SecureStore only (tokens). Profile cached in Query, not persisted.
- **API client** (`src/api/client.ts`): `fetch` wrapper (no axios dependency needed), `Authorization: Bearer`, `Accept-Language` from the profile's `preferredLanguage` (backend expects `EN`/`FA`-style upper-case codes, default EN), single-flight refresh lock mirroring the web interceptor logic, normalized `ApiError` kinds (network / auth / forbidden / notFound / validation / server / **limit (429)**).
- **Styling**: NativeWind is acceptable (web uses Tailwind), but a plain `StyleSheet` + theme-token approach avoids a babel/Metro dependency. **Recommendation: theme tokens + StyleSheet** for the foundation; revisit NativeWind only if it speeds screens meaningfully.
- **Tokens from web theme** (`frontend/app/globals.css`): background `hsl(220 50% 98%)`, foreground `hsl(224 27% 15%)`, primary `hsl(216 100% 62%)`, accent `hsl(216 100% 96%)`, radius 14px, dark mode `hsl(233 35% 14%)` background. Mirror these in `src/theme`.
- **Types**: copy needed types from `frontend/types/*.ts` into `mobile/src/types` initially (they are plain TS). Extract to a shared package only later.

## 6. Data Flow

```
Screen → hook (useDashboard) → TanStack Query → domain api (dashboardApi) → client.ts
  → Bearer + Accept-Language → Spring API → 401 → refresh lock → retry → fail → logout (clear SecureStore + Query cache)
```

## 7. Navigation Architecture

Expo Router: `(auth)` stack (login/register/forgot) and `(tabs)` (Home, Learn, Exam, Tutor, Profile), with feature stacks pushed above tabs. Root layout gates on session restoration (SecureStore → `GET /user/profile`) with a splash hold, redirects unauthenticated users to `(auth)` and users with incomplete onboarding to onboarding (`PUT /user/onboarding` exists). Exam: level → Teil → paged/grouped exercise list (backed by `/exam` list; confirm paging params in Phase 10) → exercise.

## 8. Shared Code Opportunities

- DTO types (`frontend/types`) — copy now, package later.
- Endpoint paths and request shapes (`frontend/services/*`) — reference, not importable (axios + Next specifics).
- Zod schemas: `frontend/schema/` (3 files) — reuse for login/register validation.
- Nothing shared with the web build; the web app stays untouched.

## 9. Risks

1. **Auth change touches the shared backend filter** — must stay additive and covered by tests (existing `AuthControllerTest`); web cookie flow must remain identical.
2. **Refresh token is not rotated and logout doesn't revoke it** — a stolen mobile refresh token stays valid ~7 days. Acceptable for MVP, but worth hardening later.
3. **Dashboard `route` strings are web routes** — needs a mapper; unknown routes must fall back safely.
4. **Content volume**: exam lists could be large; must verify `/exam` supports pagination/filtering, otherwise a backend gap appears in Phase 10.
5. **Audio & images** are served from `/uploads` on the backend host; verify absolute vs relative URLs in DTOs when building Hören.
6. **Local toolchain**: Node v25 is installed; Expo tooling generally targets LTS (20/22). May need `nvm`/LTS for reliable Metro/EAS. iOS builds need Xcode (a simulator tool is available here); a physical iPhone and Apple Developer account are needed for TestFlight later.
7. **Accept-Language header casing** is read raw (`EN` default); mobile must send the same values the web sends.
8. **Plan wording vs reality**: “Active Expressions” maps to `/expressions` + `/redemittel`; exam “Testinformation”/mündlich have no dedicated endpoints found, so they're correctly deferred.
9. **Scope**: 14 phases is a multi-week build. Each phase should land as a reviewable commit.

## 10. Recommended Implementation Order

0. **Backend auth addendum** (Bearer fallback, mobile token body, POST refresh) + tests.
1. **Foundation**: `mobile/` Expo app, tsconfig strict, lint/prettier, env config (`.env.example`), theme, API client + error model, core design-system components.
2. **Auth**: login/register/forgot, SecureStore, refresh lock, route guard, session restore.
3. **Tabs shell**, then 4. **Dashboard** (uses existing `/dashboard`, highest priority).
5. Daily Words → 6. Vocabulary trainer → 7. Grammar → 8. Expressions/Redemittel → 9. Reading → 10. Exam (+ Hören/Schreiben) → 11. Tutor → 12. Profile/Progress/Settings → 13. Push (needs backend device endpoint) → 14. Hardening + EAS.

## Decisions I need from you before Phase 1

1. **Approve the small additive backend auth change** (§2). Without it, mobile auth would have to rely on native cookie handling, which I advise against.
2. **Styling**: StyleSheet + theme tokens (my recommendation) vs NativeWind.
3. **Location**: `mobile/` at repo root, and OK to use an LTS Node via `nvm` if Expo needs it?
