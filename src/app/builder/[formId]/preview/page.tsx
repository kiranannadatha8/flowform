import Link from "next/link";
import { notFound } from "next/navigation";

import { FormRuntime } from "@/components/formflow/form-runtime";
import { getFormRecord } from "@/lib/formflow/forms-service";
import { formDefinitionSchema } from "@/lib/formflow/schema";

type PageProps = { params: Promise<{ formId: string }> };

export const dynamic = "force-dynamic";

export default async function BuilderPreviewPage({ params }: PageProps) {
  const { formId } = await params;
  const row = await getFormRecord(formId);
  if (!row) {
    notFound();
  }

  const definition = formDefinitionSchema.parse(row.definition);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-12">
      <Link
        href={`/builder/${formId}`}
        className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← Back to editor
      </Link>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Preview uses <code className="font-mono text-xs">POST /api/forms/{formId}/submit</code> — same
        validation as production, including branching.
      </p>
      <FormRuntime variant="preview" definition={definition} formId={formId} />
    </div>
  );
}
