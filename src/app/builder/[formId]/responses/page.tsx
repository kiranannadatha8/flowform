import Link from "next/link";
import { notFound } from "next/navigation";

import { BuilderSignOut } from "@/components/formflow/builder-sign-out";
import { getFormRecord, listFormSubmissions } from "@/lib/formflow/forms-service";
import { builderPasswordConfigured } from "@/lib/formflow/builder-auth";

type PageProps = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ cursor?: string }>;
};

export const dynamic = "force-dynamic";

export default async function FormResponsesPage({ params, searchParams }: PageProps) {
  const { formId } = await params;
  const { cursor } = await searchParams;

  const row = await getFormRecord(formId);
  if (!row) {
    notFound();
  }

  const { items, nextCursor } = await listFormSubmissions(formId, {
    limit: 40,
    cursor: cursor && cursor.length > 0 ? cursor : undefined,
  });

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/builder/${formId}`}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              ← Editor
            </Link>
            {builderPasswordConfigured() ? <BuilderSignOut /> : null}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Responses · {row.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Rows are stored when respondents complete{" "}
            <code className="font-mono text-xs">POST /api/public/forms/{row.slug}/submit</code>.
            Preview submits are not stored.
          </p>
        </div>
        <Link
          href={`/api/forms/${formId}/submissions?limit=500`}
          className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Export JSON
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
          No submissions yet. Share the live URL or embed the public submit API.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                <time
                  dateTime={s.createdAt.toISOString()}
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.createdAt.toLocaleString()}
                </time>
                <code className="text-[10px] text-zinc-400 dark:text-zinc-500">{s.id}</code>
              </div>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                {JSON.stringify(s.answers, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}

      {nextCursor ? (
        <div className="flex justify-center">
          <Link
            href={`/builder/${formId}/responses?cursor=${encodeURIComponent(nextCursor)}`}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Load more
          </Link>
        </div>
      ) : null}
    </div>
  );
}
