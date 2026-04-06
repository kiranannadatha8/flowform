# Agent notes — FormFlow

## Next.js

This project targets **Next.js 16**. App Router layouts, APIs, and conventions can differ from older majors. Before implementing routing or server features, consult the in-repo guides under `node_modules/next/dist/docs/` when something does not match expectations.

## Project focus

- **Source of truth:** `src/lib/formflow/schema.ts` (`FormDefinition`, steps, fields, branching, settings).
- **Persistence:** Prisma + PostgreSQL; config in `prisma.config.ts` (loads `.env` then `.env.local`).
- **AI:** Optional; gated by env and definition settings under `src/lib/formflow/ai/`.

## Where to look

| Concern | Location |
|---------|----------|
| Public + internal HTTP API | `src/app/api/` |
| Builder UI | `src/components/formflow/form-editor.tsx`, `sortable-form-fields.tsx` |
| Runtime UX | `src/components/formflow/form-runtime.tsx` |
| Domain logic | `src/lib/formflow/` |
| Builder session + middleware | `src/lib/formflow/builder-auth.ts`, `src/middleware.ts` |
| Phase 3 submissions | `prisma/schema.prisma` (`FormSubmission`), `forms-service.ts`, `public/.../submit` |
| E2E | `e2e/*.spec.ts`, `playwright.config.ts`; CI in `.github/workflows/ci.yml` |

Human-oriented setup, env vars, and route tables: **`README.md`**.
