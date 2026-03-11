# Testing Plan

This document defines how tests are organized and run in UniAssignment.

## Tooling

- Unit/component tests: Vitest + Testing Library
- End-to-end tests: Playwright
- CI: GitHub Actions (`.github/workflows/ci.yml`)

## Folder structure

- `tests/unit/utils`: pure utility tests
- `tests/unit/context`: context/business-logic helper tests
- `tests/unit/components`: component interaction tests with targeted mocks
- `tests/e2e`: browser flows for smoke and regression coverage
- `tests/e2e/helpers`: shared Playwright helpers (auth, naming)

## Local commands

- `npm run typecheck`: TypeScript checks only
- `npm run test`: run all Vitest tests once
- `npm run test:watch`: run Vitest in watch mode
- `npm run test:coverage`: generate Vitest coverage report
- `npm run build`: production build validation
- `npm run e2e`: full Playwright suite
- `npm run e2e:ui`: Playwright UI mode
- `npm run validate`: typecheck + unit + build + Playwright smoke

## Mocking strategy

- Keep utility tests pure and deterministic (fake timers where needed).
- For component tests, mock only heavy dependencies:
  - `useApp` context for app actions/state
  - heavy rich-text and reminder children when only parent behavior is under test
- Avoid over-mocking core browser behavior unless tests are unstable.

## E2E auth and env

Playwright auth-required tests use these variables:

- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

App runtime config for E2E uses Firebase envs:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

When auth vars are missing, auth-required E2E specs are skipped.

## CI behavior

- Pull requests:
  - Typecheck
  - Unit tests
  - Build
  - Playwright smoke (`--grep @smoke`)
- Push to `main`:
  - Typecheck
  - Unit tests
  - Build
  - Full Playwright suite

On Playwright failure, CI uploads:

- `playwright-report/`
- `test-results/`
