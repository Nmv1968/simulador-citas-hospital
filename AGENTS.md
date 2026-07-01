<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hospital Appointment Concurrency Lab

## Quick start

```bash
npm run dev       # dev server (Turbopack)
npm run build     # production build + TypeScript check
npm run lint      # ESLint
```

## Architecture

Single-page Next.js app (no app router pages besides `/`). Two modes toggled by `viewMode` state in `src/app/page.tsx`:

- **`laboratorio`**: VS Code-themed lab. Tabs: simulator, database, explainer. Tests TOCTOU race conditions.
- **`agendador`**: Real-world scheduler via `<AppointmentScheduler>`. Nav managed by `currentView` state, not routes.

State management: vanilla `useState`/`useCallback` — no React Query, no Zustand, no server actions.

## Key directories

| Path | Purpose |
|------|---------|
| `src/app/` | Root page + 4 API route handlers |
| `src/components/` | ~12 React components (all `"use client"`) |
| `sql/` | `schema.sql` (tables + RPCs), `seed-data.sql` (25 doctors, 100 patients) |
| `src/types/` | TypeScript interfaces (`Doctor`, `Patient`, `Appointment`, `TestResult`) |
| `src/lib/` | Supabase client init |

## Stack specifics

- **Tailwind CSS v4**: Uses `@tailwindcss/postcss` plugin and `@import "tailwindcss"` in globals.css. No `tailwind.config.js`.
- **Supabase**: Client-side only (`.from("table").select(...)` in components). No server components. Env vars in `.env`:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Schema DDL**: Run `sql/schema.sql` in Supabase SQL Editor. DDL (ALTER TABLE) is executed via `exec_ddl_query` SECURITY DEFINER RPC because the REST API cannot run DDL.
- **Path alias**: `@/` → `./src/`.
- **UI language**: Spanish. Error/toast UI text is hardcoded in components.

## API routes

All in `src/app/api/`. Route handlers use `NextRequest`/`NextResponse` pattern.

| Route | Purpose |
|-------|---------|
| `POST /api/book-appointment` | TOCTOU demo — check → artificial delay → insert |
| `GET /api/db-admin` | Check UNIQUE constraint status via RPC |
| `POST /api/db-admin` | Apply/remove UNIQUE constraint via RPC |
| `GET /api/simulations` | List `test_results` table |
| `POST /api/simulations` | Insert row into `test_results` |
| `POST /api/reset-data` | Truncate `appointments` table |

## React 19 gotchas

- **`set-state-in-effect`** is enforced by ESLint. The codebase suppresses it with `// eslint-disable-line` comments where data-fetching is done inside `useEffect`. This is intentional — don't remove those comments.
- **Do not put function references in `useEffect` dependency arrays** — React will error "The final argument passed to useEffect changed size between renders." Use primitive values (`dateFrom`, `doctorFilter`, etc.) or a ref pattern instead.
- **`useCallback` + `useEffect` sync**: If a `useCallback` depends on state X, and a `useEffect` needs to run when X changes, put X (not the callback) in the effect's deps.

## No tests

There is no test framework, no test runner, and no test files in the project. `npm run build` is the verification step.

## Database changes

If you rename or restructure tables:
1. Update `sql/schema.sql` (the single source of truth).
2. Run it in the Supabase SQL Editor to migrate.
3. Update the Supabase table name strings in API routes and components.
4. Update TypeScript interfaces in `src/types/index.ts` if needed.
