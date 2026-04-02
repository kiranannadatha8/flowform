import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-24">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">FormFlow</p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Intelligent multi-step forms, built for developers.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Drag-and-drop builder, AI-aware fields for follow-ups and validation, and exports as
            embeddable React plus a REST API — all backed by a single{" "}
            <span className="font-mono text-sm text-zinc-800 dark:text-zinc-200">FormDefinition</span>{" "}
            schema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/builder"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Open builder
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            href="/api/forms"
            prefetch={false}
          >
            GET /api/forms
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-6 text-sm font-medium text-violet-900 transition hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-950"
          >
            Phase 0 demo
          </Link>
          <Link
            href="/f/demo-contact"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Live demo (seed)
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Zod schemas", body: "Shared validation for API + runtime." },
            { title: "@dnd-kit", body: "Accessible drag-and-drop in the builder." },
            { title: "Prisma + Postgres", body: "Draft/publish storage with public embed APIs." },
            {
              title: "Phase 2 AI",
              body: "Runtime follow-ups, soft hints, rate limits, and versioned prompts — all optional.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{item.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
