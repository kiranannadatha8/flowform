import Link from "next/link";

import { FormRuntime } from "@/components/formflow/form-runtime";
import { HANDBUILT_DEMO_DEFINITION } from "@/lib/formflow/handbuilt-demo-definition";

export default function HandbuiltDemoPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-8 px-6 py-12">
      <header>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← FormFlow
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Phase 0 — hand-built runtime
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This page uses a static <code className="font-mono text-xs">FormDefinition</code> bundled in
          the repo (no database). Submit calls{" "}
          <code className="font-mono text-xs">POST /api/demo/validate</code> for a 200/422
          round-trip.
        </p>
      </header>
      <FormRuntime variant="demo" definition={HANDBUILT_DEMO_DEFINITION} />
    </div>
  );
}
