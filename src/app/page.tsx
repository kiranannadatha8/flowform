import { ButtonLink } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/card";
import { AppShell } from "@/components/shell/app-shell";

export default function Home() {
  return (
    <AppShell
      navLinks={[
        { href: "/builder", label: "Builder" },
        { href: "/demo", label: "Demo" },
        { href: "/f/demo-contact", label: "Live sample" },
      ]}
      contentClassName="max-w-3xl"
      mainClassName="py-20"
    >
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-accent">Professional forms, developer speed.</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Design, publish, and embed intelligent multi-step forms.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            FormFlow gives you one schema for builder UI, runtime, validation, and APIs. Ship forms
            quickly with branching, AI assist, and production-ready endpoints.
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

        <ol className="grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-3">
          <li className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">1. Build</p>
            <p className="text-sm text-foreground">Create steps and fields in a visual editor.</p>
          </li>
          <li className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">2. Publish</p>
            <p className="text-sm text-foreground">Lock a draft into a live, versioned form.</p>
          </li>
          <li className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">3. Collect</p>
            <p className="text-sm text-foreground">Embed via React or use the public submit API.</p>
          </li>
        </ol>

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
      </div>
    </AppShell>
  );
}
