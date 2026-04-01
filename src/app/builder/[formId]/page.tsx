import { FormEditor } from "@/components/formflow/form-editor";

type PageProps = { params: Promise<{ formId: string }> };

export default async function BuilderFormPage({ params }: PageProps) {
  const { formId } = await params;
  return <FormEditor formId={formId} />;
}
