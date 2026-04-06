import { ButtonLink } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-24">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-accent">FormFlow</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Intelligent multi-step forms, built for developers.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Drag-and-drop builder, AI-aware fields for follow-ups and validation, and exports as
            embeddable React plus a REST API — all backed by a single{" "}
            <span className="font-mono text-sm text-foreground">FormDefinition</span> schema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/builder" variant="primary" size="md">
            Open builder
          </ButtonLink>
          <ButtonLink href="/api/forms" variant="secondary" size="md" prefetch={false}>
            Browse API
          </ButtonLink>
          <ButtonLink href="/demo" variant="accent" size="md">
            Try the demo
          </ButtonLink>
          <ButtonLink href="/f/demo-contact" variant="secondary" size="md">
            Live sample form
          </ButtonLink>
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
            <li key={item.title}>
              <FeatureCard title={item.title} body={item.body} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
