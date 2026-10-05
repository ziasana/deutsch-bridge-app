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

## Dashboard (existing)
`GET /dashboard` → `DashboardResponse` (see `frontend/types/dashboard.ts`). `route` fields are web paths; the app maps them to Expo Router paths.

## Gaps
Push device registration (Phase 13); AI usage/remaining endpoint (optional); daily-words completion endpoint (verify in Phase 5).
