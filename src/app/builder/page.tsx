import Link from "next/link";

import { CreateFormButton } from "@/components/formflow/create-form-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listForms } from "@/lib/formflow/forms-service";

export const dynamic = "force-dynamic";

export default async function BuilderIndexPage() {
  const forms = await listForms();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Forms"
        description={
          <>
            Drafts are editable; published forms are served from{" "}
            <code>/api/public/forms/&lt;slug&gt;</code>.
          </>
        }
        actions={<CreateFormButton />}
      />

      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-border">
          {forms.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-muted">No forms yet.</li>
          ) : (
            forms.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/builder/${f.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{f.title}</p>
                    <p className="truncate font-mono text-xs text-muted">{f.slug}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      f.status === "PUBLISHED"
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {f.status}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
