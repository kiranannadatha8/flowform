import { NextResponse } from "next/server";

import { getFormRecord } from "@/lib/formflow/forms-service";
import { requireBuilderApiAuth } from "@/lib/formflow/require-builder-api";
import { formAnswersSchema, formDefinitionSchema } from "@/lib/formflow/schema";
import { validateAnswers } from "@/lib/formflow/validate-answers";

type RouteParams = { params: Promise<{ formId: string }> };

/**
 * Preview / internal submit by form id (draft or published). For production embeds use
 * POST /api/public/forms/[slug]/submit with optional submit secret.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }
  const { formId } = await params;
  const row = await getFormRecord(formId);
  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const def = formDefinitionSchema.parse(row.definition);
  const body = await request.json();
  const parsed = formAnswersSchema.safeParse(body.answers ?? body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answers payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = validateAnswers(def, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, fieldErrors: result.fieldErrors },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, received: true, mode: row.status === "DRAFT" ? "draft" : "live" });
}
