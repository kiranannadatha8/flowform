# FormFlow

Intelligent multi-step form builder: **Zod** `FormDefinition`, **@dnd-kit** builder, **Prisma** persistence (draft / publish), branching rules, public REST embeds, and optional **Vercel AI SDK** follow-ups.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zod](https://zod.dev) — shared schemas, path-aware validation with branching
- [Prisma 6](https://www.prisma.io) + **PostgreSQL** in Docker for local dev
- [@dnd-kit](https://dndkit.com) — field reordering in the builder
- [AI SDK](https://sdk.vercel.ai/docs) + `@ai-sdk/openai` — optional `/api/ai/suggest-followup`

## Getting started

```bash
npm install
cp .env.example .env.local
# .env.local defaults to Postgres on localhost:5433 (see Docker below)

npm run docker:up
# Wait until the db container is healthy (~5–15s), then:
npx prisma migrate deploy
npm run db:seed   # optional: demo-contact form
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Prisma CLI (`DATABASE_URL`)

Configuration lives in **`prisma.config.ts`** (replaces deprecated `package.json#prisma`). It loads **`.env`** then **`.env.local`** so `npx prisma migrate deploy` and `npx prisma db seed` work the same way as Next.js without exporting variables manually.

### Database (Docker)

PostgreSQL 16 runs via **Docker Compose** (user/password/db: `formflow` / `formflow` / `formflow`).

```bash
npm run docker:up      # start Postgres in background
npm run docker:logs    # optional: watch logs
npm run docker:down    # stop (volume keeps data)
```

`DATABASE_URL` in `.env.example` uses host port **5433** (mapped from the container’s 5432):

`postgresql://formflow:formflow@localhost:5433/formflow?schema=public`

To use host port 5432 instead, change the `ports` mapping in `docker-compose.yml` and `DATABASE_URL` accordingly.

For a fresh schema: `npm run docker:down`, remove the Docker volume (`docker volume rm formflow_formflow_pgdata` or `docker compose down -v`), then `docker:up` and `prisma migrate deploy` again.

## Phase 0 (foundation)

| Path / API | Purpose |
|------------|---------|
| `/demo` | **Hand-built runtime** — bundled `HANDBUILT_DEMO_DEFINITION`, no DB |
| `POST /api/demo/validate` | Validates answers against that static definition (200 / 422) |
| `GET /api/forms/[formId]/export` | Download `FormDefinition` JSON for embeds / tooling |
| `src/components/formflow/form-runtime.tsx` | Embeddable multi-step UI (branching, step nav, submit) |
| `src/lib/formflow/index.ts` | Re-exports schema + helpers for custom apps |

**Embed pattern:** fetch `GET /api/public/forms/[slug]` (published), render `<FormRuntime variant="live" definition={…} slug="…" />`, or import a downloaded JSON and pass `definition` in your own app.

## Phase 1 routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/builder` | List forms, create new |
| `/builder/[formId]` | Edit draft: steps, fields, branching JSON, save, publish |
| `/builder/[formId]/preview` | **Runtime preview** (uses `POST /api/forms/[formId]/submit`) |
| `/f/[slug]` | **Published** form runner (live) |
| `GET/POST /api/forms` | List / create forms |
| `GET/PATCH /api/forms/[formId]` | Read / update draft (409 if published) |
| `POST /api/forms/[formId]/publish` | Publish `{ generateSubmitSecret?: boolean }` |
| `POST /api/forms/[formId]/submit` | Validate answers (draft or published; preview) |
| `GET /api/public/forms/[slug]` | Published definition only (embed) |
| `POST /api/public/forms/[slug]/submit` | Validate answers; optional `X-FormFlow-Submit-Secret` or `submitSecret` |
| `POST /api/ai/suggest-followup` | Builder AI field suggestions (rate-limited; Zod-validated output) |
| `POST /api/ai/runtime-suggestions` | Optional runtime follow-up fields (`settings.aiRuntimeSuggestions` + field flag) |
| `POST /api/ai/validate-hint` | Soft advisory hint; **submit still uses Zod only** |

### Phase 2 (AI, controllable) — implemented

- **Form settings:** `definition.settings.aiRuntimeSuggestions`, `aiMaxRuntimeCallsPerSession` (toggles in the builder **Details** section).
- **Per-field:** “AI follow-ups (runtime)” and “AI soft hint” on each field (when **Show** AI flags is enabled in the field list).
- **Runtime:** optional interstitial step after **Continue** when form + field flags allow it; **Skip suggestions** bypasses. Submit validation remains Zod-only; extra AI field keys merge into answers when types match.
- **Soft hints:** blur on fields with “AI soft hint” calls `POST /api/ai/validate-hint` (advisory only).
- **Prompts:** versioned in `src/lib/formflow/ai/prompts.ts` (`AI_PROMPT_VERSION`); API responses include `promptVersion` where applicable.
- **Guards:** `FORMFLOW_AI_MAX_REQUESTS_PER_MINUTE`, `FORMFLOW_AI_MAX_CONTEXT_CHARS`, capped `maxOutputTokens`, JSON parse + Zod fallbacks; **builder** uses stub suggestions when `OPENAI_API_KEY` is unset; **runtime** does not show a fake interstitial without a key.

## Project layout

- `prisma/` — schema, migrations, seed (`demo-contact` slug)
- `src/lib/formflow/` — schemas, branching, validation, forms service
- `src/lib/formflow/ai/` — prompts, rate limits, suggestion + hint generation
- `src/lib/db.ts` — Prisma client singleton
- `src/app/api/` — internal + public REST
- `src/components/formflow/` — builder UI

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:*` — Prisma generate / migrate / push / seed
- `npm run docker:*` — start/stop/logs for Postgres
