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

## Gaps
Push device registration (Phase 13); AI usage/remaining endpoint (optional); daily-words completion endpoint (verify in Phase 5).
