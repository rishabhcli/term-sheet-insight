# Repository Guidelines

## Project Structure & Module Organization
src/ contains all application code.
- src/pages/: route-level screens.
- src/components/: reusable UI components, including generated shadcn/ui primitives under src/components/ui/.
- src/features/term-sheet-tarot/: domain logic, services, and feature components.
- src/lib/ and src/hooks/: shared helpers and hooks.
- src/integrations/supabase/: generated Supabase client and database types.
- src/test/ and feature-level test folders: unit test entry points and helpers.
- public/: static assets.
- supabase/: migrations and local Supabase config.
- index.html, vite.config.ts, tsconfig*.ts, and package.json: build/runtime configuration.

## Build, Test, and Development Commands
- npm install: install dependencies.
- npm run dev: run the Vite dev server.
- npm run build: production build.
- npm run build:dev: development-mode build.
- npm run lint: run ESLint.
- npm test: run the Vitest suite once.
- npm run test:watch: run Vitest in watch mode.
- npm run preview: preview a production build locally.

## Coding Style & Naming Conventions
- TypeScript-first codebase with 2-space indentation.
- Use camelCase for variables/functions and PascalCase for components/types.
- Prefer feature-first folders (features/<feature>/domain|services|components).
- Keep domain calculations pure in domain/, and API/sync logic in services/.
- Use existing ESLint rules (typescript-eslint, React Hooks, react-refresh) and avoid introducing lint violations.
- Favor explicit exports and avoid broad any unless strongly justified.

## Testing Guidelines
- Test runner: Vitest (setupFiles: ./src/test/setup.ts).
- Test files: src/**/*.{test,spec}.{ts,tsx}.
- Naming: use *.test.ts / *.test.tsx and clear business-focused descriptions.
- Add/adjust tests for financial logic and term-clause behavior in feature folders.
- At minimum, run npm test before opening PRs for code changes touching logic.

## Commit & Pull Request Guidelines
Recent history is compact and imperative (for example, Added ..., Fixed ..., Tested ...).
- Use short, imperative commit titles (feat: add compare scenario reset state, fix: correct waterfall calculation).
- PRs should include:
  - What changed and why.
  - Test evidence (npm test, npm run lint, and npm run build when UI or config is changed).
  - Linked issue/context and any schema or migration impact.
  - Screenshots or short before/after notes for user-facing behavior.

## Security & Configuration Tips
- Do not commit secrets or .env values.
- Required frontend env vars for Supabase are VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
- When DB types or schema changes, update Supabase types and migrations in supabase/migrations/.
