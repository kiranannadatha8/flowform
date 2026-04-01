import { notFound } from "next/navigation";

import { FormRuntime } from "@/components/formflow/form-runtime";
import { getFormBySlug, toPublicDefinition } from "@/lib/formflow/forms-service";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const row = await getFormBySlug(slug);
  return {
    title: row?.title ? `${row.title} · FormFlow` : "Form · FormFlow",
  };
}

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getFormBySlug(slug);
  if (!row || row.status !== "PUBLISHED") {
    notFound();
  }

  const definition = toPublicDefinition(row);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-6 py-12">
      <FormRuntime
        variant="live"
        definition={definition}
        slug={slug}
        formId={row.id}
        submitAuthRequired={Boolean(row.submitSecretHash)}
      />
    </div>
  );
}
