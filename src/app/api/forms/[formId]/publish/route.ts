import { NextResponse } from "next/server";

import { countSubmissions, publishForm } from "@/lib/formflow/forms-service";
import { requireBuilderApiAuth } from "@/lib/formflow/require-builder-api";

type RouteParams = { params: Promise<{ formId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }
  const { formId } = await params;
  const body = await request.json().catch(() => ({}));
  const generateSubmitSecret = Boolean(body.generateSubmitSecret);

  const result = await publishForm(formId, { generateSubmitSecret });

  if ("error" in result) {
    if (result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Only draft forms can be published" }, { status: 409 });
  }

  const { form, submitSecret } = result;
  const submissionCount = await countSubmissions(formId);

  return NextResponse.json({
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      status: form.status,
      definition: form.definition,
      submitKeyConfigured: Boolean(form.submitSecretHash),
      updatedAt: form.updatedAt.toISOString(),
      submissionCount,
    },
    submitSecret: submitSecret ?? null,
    message:
      submitSecret != null
        ? "Store this submit secret securely; it will not be shown again."
        : undefined,
  });
}
