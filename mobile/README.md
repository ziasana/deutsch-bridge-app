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
