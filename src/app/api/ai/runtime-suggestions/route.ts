import { NextResponse } from "next/server";

import { generateFollowupSuggestions } from "@/lib/formflow/ai/generate-suggestions";
import { clientKeyFromRequest, allowAiRequest } from "@/lib/formflow/ai/rate-limit";
import { getFormBySlug, getFormRecord, toPublicDefinition } from "@/lib/formflow/forms-service";
import { formDefinitionSchema } from "@/lib/formflow/schema";

/**
 * POST /api/ai/runtime-suggestions
 * Optional follow-up fields for the **current step** (ephemeral; merged into answers client-side).
 * Requires `definition.settings.aiRuntimeSuggestions` and at least one field on the step with
 * `aiAssist.suggestFollowUps`.
 *
 * Body: { stepId: string, answers: object, slug?: string, formId?: string }
 * - **Live:** pass `slug` (published forms only).
 * - **Preview / demo:** pass `formId` (any status for internal preview).
 */
export async function POST(request: Request) {
  const key = clientKeyFromRequest(request);
  if (!allowAiRequest(key)) {
    return NextResponse.json({ error: "Too many AI requests; try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const stepId = typeof body.stepId === "string" ? body.stepId : null;
  const slug = typeof body.slug === "string" ? body.slug : undefined;
  const formId = typeof body.formId === "string" ? body.formId : undefined;
  const answers =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  if (!stepId) {
    return NextResponse.json({ error: "stepId is required" }, { status: 400 });
  }
  if (!slug && !formId) {
    return NextResponse.json({ error: "slug or formId is required" }, { status: 400 });
  }

  let row = null as Awaited<ReturnType<typeof getFormRecord>>;
  if (slug) {
    const bySlug = await getFormBySlug(slug);
    if (!bySlug || bySlug.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    row = bySlug;
  } else if (formId) {
    row = await getFormRecord(formId);
    if (!row) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
  }

  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const def = formDefinitionSchema.parse(toPublicDefinition(row));

  if (!def.settings?.aiRuntimeSuggestions) {
    return NextResponse.json(
      { error: "Runtime AI is disabled for this form", suggestions: [] },
      { status: 403 },
    );
  }

  const step = def.steps.find((s) => s.id === stepId);
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 400 });
  }

  const aiEnabled = step.fields.some((f) => f.aiAssist?.suggestFollowUps);
  if (!aiEnabled) {
    return NextResponse.json({ suggestions: [], message: "No AI follow-up fields on this step." });
  }

  const stepsSummary = def.steps.map((s) => ({
    id: s.id,
    title: s.title,
    fieldLabels: s.fields.map((f) => f.label),
  }));

  const result = await generateFollowupSuggestions({
    mode: "runtime",
    formTitle: def.title,
    stepsSummary,
    stepId,
    answers,
    maxSuggestions: 2,
  });

  return NextResponse.json({
    mode: result.mode,
    promptVersion: result.promptVersion,
    suggestions: result.suggestions,
  });
}
