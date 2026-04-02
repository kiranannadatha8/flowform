import { NextResponse } from "next/server";

import {
  createFormSubmission,
  getFormBySlug,
  toPublicDefinition,
  verifySubmitForForm,
} from "@/lib/formflow/forms-service";
import { formAnswersSchema, formDefinitionSchema } from "@/lib/formflow/schema";
import { validateAnswers } from "@/lib/formflow/validate-answers";

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const row = await getFormBySlug(slug);
  if (!row || row.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const answersPayload = body.answers ?? body;
  const parsed = formAnswersSchema.safeParse(answersPayload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answers payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const secret =
    typeof body.submitSecret === "string"
      ? body.submitSecret
      : request.headers.get("x-formflow-submit-secret") ?? undefined;

  if (!verifySubmitForForm(row, secret)) {
    return NextResponse.json({ error: "Invalid or missing submit secret" }, { status: 401 });
  }

  const def = formDefinitionSchema.parse(toPublicDefinition(row));
  const result = validateAnswers(def, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, fieldErrors: result.fieldErrors },
      { status: 422 },
    );
  }

  const submission = await createFormSubmission(row.id, parsed.data as Record<string, unknown>);

  return NextResponse.json({
    ok: true,
    received: true,
    submissionId: submission.id,
  });
}
