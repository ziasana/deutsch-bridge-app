# Deutsch Bridge – Mobile

React Native + Expo (SDK 57) + TypeScript client for the existing Spring Boot API.

```bash
cp .env.example .env     # set EXPO_PUBLIC_API_URL (see comments in the file)
npm install
npm start                # then press i (iOS) or a (Android)
npm run typecheck && npm run lint && npm test
```

## Layout
- `src/app/` – Expo Router routes only (SDK 57 default root)
- `src/api/` – `client.ts` (bearer auth, refresh lock, error normalization), `tokenStorage.ts` (SecureStore), `errors.ts`
- `src/components/ui/` – design system (tokens mirror `frontend/app/globals.css` in `src/theme`)
- `src/config/env.ts` – environment; production builds require https

## Auth
The web app uses HttpOnly cookies. Mobile uses additive endpoints that return tokens in the body:
`POST /api/auth/mobile/login | register | refresh`, plus `Authorization: Bearer` on every other call.
See `../MOBILE_API_INTEGRATION.md`.

## Release checklist (EAS)
1. `npx eas-cli@latest login`, then `eas init` (writes `extra.eas.projectId` into `app.json`; push needs it).
2. Replace the `REPLACE-ME` API URLs in `eas.json` (production must be https; the app refuses to start otherwise).
3. Credentials: `eas credentials` (APNs key for iOS push, FCM for Android). Apple Developer account required for iOS.
4. Development build (needed for push; Expo Go on Android has no remote push): `eas build --profile development --platform ios|android`.
5. Backend: set `PUSH_ENABLED=true` (see `../MOBILE_API_INTEGRATION.md`).
6. Release: `eas build --profile production`, then `eas submit`. Build numbers auto-increment.

CI (`.github/workflows/mobile.yml`) runs typecheck, lint, tests, `expo-doctor` and a full iOS + Android bundle.

## Resilience
- A root error boundary shows a German "try again" screen instead of crashing on an unexpected render error.
- An unobtrusive "Keine Internetverbindung" notice appears while offline; queries still run and fail into the normal error states, and refetch on reconnect.
- Known: `npm audit` reports advisories only in Expo's build tooling (`@expo/prebuild-config` etc.), none in runtime dependencies; they are resolved by Expo SDK upgrades, not `audit fix --force`.
