import Link from "next/link";

import { BuilderSignOut } from "@/components/formflow/builder-sign-out";
import { CreateFormButton } from "@/components/formflow/create-form-button";
import { builderPasswordConfigured } from "@/lib/formflow/builder-auth";
import { listForms } from "@/lib/formflow/forms-service";

export const dynamic = "force-dynamic";

export default async function BuilderIndexPage() {
  const forms = await listForms();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← FormFlow
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Forms
              </h1>
              {builderPasswordConfigured() ? <BuilderSignOut /> : null}
            </div>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Drafts are editable; published forms are served from{" "}
              <code className="font-mono text-xs">/api/public/forms/&lt;slug&gt;</code>.
            </p>
          </div>
          <CreateFormButton />
        </div>
      </header>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60">
        {forms.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">No forms yet.</li>
        ) : (
          forms.map((f) => (
            <li key={f.id}>
              <Link
                href={`/builder/${f.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{f.title}</p>
                  <p className="truncate font-mono text-xs text-zinc-500">{f.slug}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    f.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                  }`}
                >
                  {f.status}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
