import { FormEditor } from "@/components/formflow/form-editor";
import { builderPasswordConfigured } from "@/lib/formflow/builder-auth";

type PageProps = { params: Promise<{ formId: string }> };

export default async function BuilderFormPage({ params }: PageProps) {
  const { formId } = await params;
  return <FormEditor formId={formId} builderAuthEnabled={builderPasswordConfigured()} />;
}
