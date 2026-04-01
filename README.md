# FormFlow

Intelligent multi-step form builder: **Zod** `FormDefinition`, **@dnd-kit** builder, **Prisma** persistence (draft / publish), branching rules, public REST embeds, and optional **Vercel AI SDK** follow-ups.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zod](https://zod.dev) — shared schemas, path-aware validation with branching
- [Prisma 6](https://www.prisma.io) + SQLite locally (swap `DATABASE_URL` for Postgres in production)
- [@dnd-kit](https://dndkit.com) — field reordering in the builder
- [AI SDK](https://sdk.vercel.ai/docs) + `@ai-sdk/openai` — optional `/api/ai/suggest-followup`

## Getting started

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL (SQLite file lives next to prisma/schema.prisma, e.g. prisma/dev.db)
# Optional: OPENAI_API_KEY for AI routes
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| `POST /api/ai/suggest-followup` | AI suggestions (stub without `OPENAI_API_KEY`) |

## Project layout

- `prisma/` — schema, migrations, seed (`demo-contact` slug)
- `src/lib/formflow/` — schemas, branching, validation, forms service
- `src/lib/db.ts` — Prisma client singleton
- `src/app/api/` — internal + public REST
- `src/components/formflow/` — builder UI

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:*` — Prisma generate / migrate / push / seed
