# FormFlow

FormFlow is a **developer-first multi-step form platform**: a single **`FormDefinition`** schema (validated with **Zod**) powers a drag-and-drop builder, draft/publish workflows, optional branching, REST embed APIs, **persisted public responses**, optional **builder password** protection, and **optional** AI-assisted suggestions and runtime follow-ups.

---

## Contents

- [Why FormFlow](#why-formflow)
- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Concepts](#concepts)
- [API reference](#api-reference)
- [Optional AI (Phase 2)](#optional-ai-phase-2)
- [Phase 3 — Responses & builder access](#phase-3--responses--builder-access)
- [Embedding a published form](#embedding-a-published-form)
- [Scripts](#scripts)
- [Database maintenance](#database-maintenance)
- [Repository layout](#repository-layout)
- [Testing & CI](#testing--ci)
- [Deployment (production)](#deployment-production)
- [License](#license)

---

## Why FormFlow

| Capability | Description |
|------------|-------------|
| **One schema** | `FormDefinition` is the source of truth for builder UI, APIs, and `<FormRuntime />`. |
| **Draft / publish** | Edit drafts freely; published forms are immutable in the builder and served via public routes. |
| **Branching** | Declarative rules jump between steps based on answers (see `branchRules` in the schema). |
| **Embeds** | JSON export and public read/submit endpoints for headless or custom frontends. |
| **AI (optional)** | Builder field ideas, runtime suggestion steps, and soft validation hints—gated by settings and env. |
| **Responses (Phase 3)** | Successful **public** submits are stored; builder UI and JSON API to review them. |

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Validation | [Zod 4](https://zod.dev) |
| Persistence | [Prisma 6](https://www.prisma.io), [PostgreSQL 16](https://www.postgresql.org) (Docker for local dev) |
| Builder DnD | [@dnd-kit](https://dndkit.com) |
| AI (optional) | [Vercel AI SDK](https://sdk.vercel.ai/docs), `@ai-sdk/openai` |

---

## Prerequisites

- **Node.js** 20+ (recommended; align with `@types/node` in the repo)
- **npm** (or compatible client)
- **Node 20+** (see `engines` in `package.json`)
- **Docker Desktop** (or Docker Engine + Compose) for the default local database

---

## Quick start

```bash
git clone https://github.com/kiranannadatha8/flowform.git && cd flowform
npm install
cp .env.example .env.local
```

Start PostgreSQL and apply migrations:

```bash
npm run docker:up
# Wait until the database is healthy (~5–15 seconds), then:
npx prisma migrate deploy
npm run db:seed    # optional: seeds published "demo-contact" form
npm run dev
```

Open **http://localhost:3000**.

> **Prisma CLI:** Connection settings are defined in **`prisma.config.ts`**. It loads **`.env`** then **`.env.local`** (same order as Next.js), so you do not need to export `DATABASE_URL` in the shell for `migrate`, `db seed`, or `generate`.

---

## Configuration

Copy **[`.env.example`](.env.example)** (tracked in Git) to **`.env.local`** (or `.env`) and adjust as needed.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Default local compose URL uses host port **5433**. |
| `OPENAI_API_KEY` | No | Enables live OpenAI-backed AI features when set. |
| `FORMFLOW_AI_MAX_REQUESTS_PER_MINUTE` | No | Per–IP sliding window cap for AI routes (default **30**, max **120**). |
| `FORMFLOW_AI_MAX_CONTEXT_CHARS` | No | Approximate cap for answer payloads sent to prompts (default **12000**). |
| `FORMFLOW_BUILDER_PASSWORD` | No | When set, `/builder` (except `/builder/login`) and **internal** `/api/forms/*` routes require an **`ff_builder`** session cookie from `POST /api/builder-auth`. Leave unset for local open access. |

Never commit real secrets. **`.env*`** is ignored by Git.

---

## Concepts

### `FormDefinition`

The canonical shape lives in **`src/lib/formflow/schema.ts`**: steps, fields (`kind`, labels, options, `required`), optional `branchRules`, and optional `settings` (including AI flags).

### Draft vs published

- **Draft:** editable in `/builder/[formId]`; `PATCH /api/forms/[formId]` updates title, slug, and definition.
- **Published:** builder edits are blocked; public traffic uses **`/f/[slug]`** and **`/api/public/forms/[slug]`** (read/submit).

### Submit secret (optional)

On publish, you may request **`generateSubmitSecret`**. Submissions then require the secret via header **`X-FormFlow-Submit-Secret`** or body field **`submitSecret`** (see publish route behavior in code).

---

## API reference

### Application UI

| Route | Description |
|-------|-------------|
| `/` | Landing |
| `/demo` | Phase 0: static hand-built form (no DB); validates via `POST /api/demo/validate` |
| `/builder` | List and create forms |
| `/builder/[formId]` | Editor: steps, fields, branching JSON, Phase 2 toggles, publish |
| `/builder/[formId]/preview` | Preview runtime; submits to internal submit API |
| `/builder/[formId]/responses` | List stored **public** submissions (Phase 3) |
| `/builder/login` | Builder password sign-in when `FORMFLOW_BUILDER_PASSWORD` is set |
| `/f/[slug]` | Live runner for **published** forms |

### Internal (builder; optional password)

When **`FORMFLOW_BUILDER_PASSWORD`** is set, these routes require a valid builder session cookie (sign in at **`/builder/login`** via **`POST /api/builder-auth`**). When unset, behavior matches legacy open dev mode.

| Method & path | Description |
|---------------|-------------|
| `POST /api/builder-auth` | Body `{ "password": "…" }` → sets session cookie; **`DELETE`** clears it |
| `GET`, `POST /api/forms` | List forms, create form |
| `GET`, `PATCH /api/forms/[formId]` | Read / update draft (**409** if published); includes **`submissionCount`** |
| `POST /api/forms/[formId]/publish` | Publish; optional `{ generateSubmitSecret?: boolean }` |
| `POST /api/forms/[formId]/submit` | Validate answers (preview / draft flows); **not** persisted |
| `GET /api/forms/[formId]/export` | Download `FormDefinition` JSON |
| `GET /api/forms/[formId]/submissions` | Paginated submission history (`?limit=`, `?cursor=`); Phase 3 |

### Public (embed)

| Method & path | Description |
|---------------|-------------|
| `GET /api/public/forms/[slug]` | Published definition JSON (**404** if not published) |
| `POST /api/public/forms/[slug]/submit` | Validate and accept submission; optional submit secret; **persists** answers on success (**`submissionId`** in JSON) |

### Optional AI

| Method & path | Description |
|---------------|-------------|
| `POST /api/ai/suggest-followup` | Builder-time field suggestions (`formId`, optional `stepId`, `answers`) |
| `POST /api/ai/runtime-suggestions` | Runtime follow-up fields; requires form **`settings.aiRuntimeSuggestions`** and per-field **`aiAssist.suggestFollowUps`** |
| `POST /api/ai/validate-hint` | Advisory hint for a field; **submit validation remains Zod-only** |

Responses may include **`promptVersion`** (see `src/lib/formflow/ai/prompts.ts`).

### Operations

| Method & path | Description |
|---------------|-------------|
| `GET /api/health` | JSON liveness probe (**`ok`**, **`service`**, **`ts`**) — does not query the database |

---

## Optional AI (Phase 2)

AI features are **opt-in** at both deployment and definition level.

1. **Environment:** set `OPENAI_API_KEY` for live models. Without it, builder suggestions use a small **stub**; **runtime** interstitials do **not** use a fake stub.
2. **Form settings** (builder **Details**): `aiRuntimeSuggestions`, `aiMaxRuntimeCallsPerSession`.
3. **Per field:** “AI follow-ups (runtime)” and “AI soft hint” (builder field rows).

**Guards:** rate limiting, trimmed answer context, bounded model output, JSON + Zod validation with fallbacks. Prompt text is versioned via **`AI_PROMPT_VERSION`**.

---

## Phase 3 — Responses & builder access

1. **Persistence:** Each successful **`POST /api/public/forms/[slug]/submit`** creates a **`FormSubmission`** row (`answers` JSON, `createdAt`). Deletes cascade when the parent **`Form`** is removed.
2. **Not stored:** Internal **`POST /api/forms/[formId]/submit`** (preview) remains ephemeral.
3. **UI:** **`/builder/[formId]/responses`** — paginated list and JSON; **Responses** link + badge in the editor.
4. **Export:** Open **`GET /api/forms/[formId]/submissions?limit=500`** in the browser while signed in (same cookie) for a JSON download.
5. **Privacy:** Treat stored answers as **PII**; restrict production database access and use **`FORMFLOW_BUILDER_PASSWORD`** (or a future SSO layer) before exposing the app on the public internet.
6. **AI routes** (`/api/ai/*`) remain rate-limited but **not** behind the builder cookie; tighten network access or add auth in a later hardening pass if needed.

---

## Embedding a published form

1. **Fetch definition:** `GET /api/public/forms/<slug>`.
2. **Render** in a Next.js or React app using **`<FormRuntime variant="live" definition={...} slug="..." />`**, or build your own UI against the same JSON.
3. **Submit:** `POST /api/public/forms/<slug>/submit` with `{ "answers": { ... } }` and optional secret if configured. On **200**, the body includes **`submissionId`** when the row was stored (Phase 3).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` (prototyping only; prefer migrations for teams) |
| `npm run db:seed` | Run seed via Prisma (`prisma db seed`) |
| `npm run docker:up` | `docker compose up -d` (Postgres) |
| `npm run docker:down` | `docker compose down` |
| `npm run docker:logs` | Tail database logs |
| `npm run test:e2e` | [Playwright](https://playwright.dev) E2E (`build` + `start` + tests; needs DB + seed for full suite) |
| `npm run test:e2e:smoke` | Health + Phase 0 demo only (no seeded form) |
| `npm run test:e2e:ui` | Playwright UI mode |

`postinstall` runs **`prisma generate`** so CI and fresh clones get a client.

---

## Database maintenance

**Default Compose service** uses PostgreSQL with user / password / database **`formflow`**, with host port **5433** mapped to container **5432**. The example `DATABASE_URL` matches this layout.

**Change host port:** edit `docker-compose.yml` **ports** and `DATABASE_URL` together.

**Reset from scratch (destructive):**

```bash
npm run docker:down
docker compose down -v   # removes volumes; data loss
npm run docker:up
npx prisma migrate deploy
npm run db:seed
```

---

## Repository layout

```
formflow/
├── prisma/
│   ├── schema.prisma          # Form + FormSubmission (Phase 3)
│   ├── seed.ts                # Optional demo form (slug: demo-contact)
│   └── migrations/            # SQL migrations
├── prisma.config.ts           # Prisma 6 project config + seed command
├── docker-compose.yml         # Local PostgreSQL
├── src/
│   ├── app/                   # Next.js routes + API routes
│   ├── components/formflow/   # Builder + FormRuntime
│   └── lib/
│       ├── db.ts              # Prisma singleton
│       └── formflow/          # Schema, branching, validation, forms service
│           └── ai/            # Prompts, rate limits, generation helpers
├── e2e/                       # Playwright specs
├── playwright.config.ts
├── .github/workflows/         # CI (lint, build, migrate, seed, E2E)
├── AGENTS.md                  # Notes for AI coding agents
├── CLAUDE.md                  # Short pointer for Claude / Cursor context
└── LICENSE                    # MIT
```

---

## Testing & CI

**GitHub Actions** (`.github/workflows/ci.yml`) on push/PR to **`main`**: starts PostgreSQL 16, runs `prisma migrate deploy`, **`npm run db:seed`**, **`npm run lint`**, **`npm run build`**, then **`npx playwright test`** (Chromium).

**Local full E2E** (matches CI):

```bash
npm run docker:up
npx prisma migrate deploy
npm run db:seed
npm run build
CI=true npx playwright test
```

Without a database, run **`npm run test:e2e:smoke`** only.

---

## Deployment (production)

1. **Database:** managed PostgreSQL (Neon, RDS, Supabase, etc.). Set **`DATABASE_URL`** in the host environment.
2. **Migrations:** run **`npx prisma migrate deploy`** on each release (Vercel post-deploy command, Fly release phase, Kubernetes Job, etc.).
3. **Env vars:** at minimum **`DATABASE_URL`**. Optional: **`OPENAI_API_KEY`**, **`FORMFLOW_BUILDER_PASSWORD`** (recommended for any public URL), AI guardrails, submit secrets per form.
4. **Health checks:** point your platform at **`GET /api/health`**.
5. **Build:** `npm run build` then `npm run start` (or the platform’s Next.js adapter). Ensure **`postinstall`** / **`prisma generate`** runs so the client exists in the deployment image.

---

## License

This project is licensed under the **MIT License** — see [`LICENSE`](LICENSE).

---

## Contributing

Issues and pull requests are welcome. When changing **API behavior** or **`FormDefinition`**, update this README and any affected Zod schemas together so embeds and the builder stay in sync.

For agent or Next.js-specific conventions, see **`AGENTS.md`**.
