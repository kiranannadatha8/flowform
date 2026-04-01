import { NextResponse } from "next/server";

import { generateValidateHint } from "@/lib/formflow/ai/generate-hint";
import { clientKeyFromRequest, allowAiRequest } from "@/lib/formflow/ai/rate-limit";
import { getFormRecord, toPublicDefinition } from "@/lib/formflow/forms-service";
import { formDefinitionSchema } from "@/lib/formflow/schema";

/**
 * POST /api/ai/validate-hint
 * Soft advisory hint only — **Zod validation on submit remains authoritative.**
 * Body: { formId, fieldId, value, answers? }
 */
export async function POST(request: Request) {
  const key = `hint:${clientKeyFromRequest(request)}`;
  if (!allowAiRequest(key)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const formId = typeof body.formId === "string" ? body.formId : null;
  const fieldId = typeof body.fieldId === "string" ? body.fieldId : null;
  const value = body.value;
  const answers =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  if (!formId || !fieldId) {
    return NextResponse.json({ error: "formId and fieldId are required" }, { status: 400 });
  }

  const row = await getFormRecord(formId);
  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const def = formDefinitionSchema.parse(toPublicDefinition(row));
  let field = null as (typeof def.steps)[0]["fields"][0] | null;
  for (const s of def.steps) {
    const f = s.fields.find((x) => x.id === fieldId);
    if (f) {
      field = f;
      break;
    }
  }

  if (!field) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  if (!field.aiAssist?.validateWithAi) {
    return NextResponse.json({ hint: null, message: "AI hints off for this field." });
  }

  const result = await generateValidateHint({ field, value, answers });
  return NextResponse.json({
    hint: result.hint,
    mode: result.mode,
    promptVersion: result.promptVersion,
  });
}
