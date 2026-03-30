# Term Sheet Tarot

Term Sheet Tarot is a Vite + React simulator for exploring how investor-friendly clauses change ownership, control, and payout outcomes across venture financing scenarios.

## Local Setup

1. Install dependencies with `npm install`.
2. Copy the variable names from `.env.example` into your local `.env`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Start the app with `npm run dev`.

## Testing

Vitest covers domain logic, stores, services, and page/component behavior.

- `npm test`: run the full Vitest suite once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:coverage`: run Vitest with V8 coverage thresholds enabled.

Playwright covers live browser flows, route smoke, share links, and the Supabase-backed authenticated path.

- `npm run test:e2e`: run the Playwright suite across Chromium, Firefox, WebKit, and the mobile project.
- `npm run test:all`: run coverage first, then the full Playwright suite.
- `npx playwright install --with-deps`: install the browsers needed for local E2E runs.

### E2E Environment

The browser suite always needs the frontend runtime variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The authenticated and seeded-share E2E flows also need:

- `E2E_SUPABASE_EMAIL`
- `E2E_SUPABASE_PASSWORD`

If `PLAYWRIGHT_BASE_URL` is set, Playwright will target that deployment instead of starting a local dev server on `http://127.0.0.1:8080`.

If the `E2E_SUPABASE_*` credentials are missing, the read-only route smoke still runs, while the authenticated/share-seeded specs skip themselves.

## Quality Gates

Before shipping code that touches runtime behavior, run:

- `npm run lint`
- `npm run build`
- `npm run test:coverage`
- `npm run test:e2e`

## CI

GitHub Actions is split into two layers:

- Pull requests run lint, build, coverage, and Chromium Playwright checks.
- Pushes to `main` and the nightly workflow run the cross-browser Playwright matrix.
