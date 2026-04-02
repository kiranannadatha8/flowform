# FormFlow

FormFlow is a **developer-first multi-step form platform**: a single **`FormDefinition`** schema (validated with **Zod**) powers a drag-and-drop builder, draft/publish workflows, optional branching, REST embed APIs, and **optional** AI-assisted builder suggestions and runtime follow-ups.

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
- [Embedding a published form](#embedding-a-published-form)
- [Scripts](#scripts)
- [Database maintenance](#database-maintenance)
- [Repository layout](#repository-layout)

---

## Why FormFlow

| Capability | Description |
|------------|-------------|
| **One schema** | `FormDefinition` is the source of truth for builder UI, APIs, and `<FormRuntime />`. |
| **Draft / publish** | Edit drafts freely; published forms are immutable in the builder and served via public routes. |
| **Branching** | Declarative rules jump between steps based on answers (see `branchRules` in the schema). |
| **Embeds** | JSON export and public read/submit endpoints for headless or custom frontends. |
| **AI (optional)** | Builder field ideas, runtime suggestion steps, and soft validation hints—gated by settings and env. |

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

Copy **`.env.example`** to **`.env.local`** (or `.env`) and adjust as needed.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Default local compose URL uses host port **5433**. |
| `OPENAI_API_KEY` | No | Enables live OpenAI-backed AI features when set. |
| `FORMFLOW_AI_MAX_REQUESTS_PER_MINUTE` | No | Per–IP sliding window cap for AI routes (default **30**, max **120**). |
| `FORMFLOW_AI_MAX_CONTEXT_CHARS` | No | Approximate cap for answer payloads sent to prompts (default **12000**). |

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
| `/f/[slug]` | Live runner for **published** forms |

### Internal (authenticated app / builder)

| Method & path | Description |
|---------------|-------------|
| `GET`, `POST /api/forms` | List forms, create form |
| `GET`, `PATCH /api/forms/[formId]` | Read / update draft (**409** if published) |
| `POST /api/forms/[formId]/publish` | Publish; optional `{ generateSubmitSecret?: boolean }` |
| `POST /api/forms/[formId]/submit` | Validate answers (preview / draft flows) |
| `GET /api/forms/[formId]/export` | Download `FormDefinition` JSON |

### Public (embed)

| Method & path | Description |
|---------------|-------------|
| `GET /api/public/forms/[slug]` | Published definition JSON (**404** if not published) |
| `POST /api/public/forms/[slug]/submit` | Validate and accept submission; optional submit secret |

### Optional AI

| Method & path | Description |
|---------------|-------------|
| `POST /api/ai/suggest-followup` | Builder-time field suggestions (`formId`, optional `stepId`, `answers`) |
| `POST /api/ai/runtime-suggestions` | Runtime follow-up fields; requires form **`settings.aiRuntimeSuggestions`** and per-field **`aiAssist.suggestFollowUps`** |
| `POST /api/ai/validate-hint` | Advisory hint for a field; **submit validation remains Zod-only** |

Responses may include **`promptVersion`** (see `src/lib/formflow/ai/prompts.ts`).

---

## Optional AI (Phase 2)

AI features are **opt-in** at both deployment and definition level.

1. **Environment:** set `OPENAI_API_KEY` for live models. Without it, builder suggestions use a small **stub**; **runtime** interstitials do **not** use a fake stub.
2. **Form settings** (builder **Details**): `aiRuntimeSuggestions`, `aiMaxRuntimeCallsPerSession`.
3. **Per field:** “AI follow-ups (runtime)” and “AI soft hint” (builder field rows).

**Guards:** rate limiting, trimmed answer context, bounded model output, JSON + Zod validation with fallbacks. Prompt text is versioned via **`AI_PROMPT_VERSION`**.

---

## Embedding a published form

1. **Fetch definition:** `GET /api/public/forms/<slug>`.
2. **Render** in a Next.js or React app using **`<FormRuntime variant="live" definition={...} slug="..." />`**, or build your own UI against the same JSON.
3. **Submit:** `POST /api/public/forms/<slug>/submit` with `{ "answers": { ... } }` and optional secret if configured.

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
│   ├── schema.prisma          # PostgreSQL datasource + Form model
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
├── AGENTS.md                  # Notes for AI coding agents
└── CLAUDE.md                  # Short pointer for Claude / Cursor context
```

---

## Contributing

Issues and pull requests are welcome. When changing **API behavior** or **`FormDefinition`**, update this README and any affected Zod schemas together so embeds and the builder stay in sync.

For agent or Next.js-specific conventions, see **`AGENTS.md`**.
