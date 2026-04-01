import { NextResponse } from "next/server";

import { generateFollowupSuggestions } from "@/lib/formflow/ai/generate-suggestions";
import { clientKeyFromRequest, allowAiRequest } from "@/lib/formflow/ai/rate-limit";
import { getFormRecord, toPublicDefinition } from "@/lib/formflow/forms-service";

/**
 * POST /api/ai/suggest-followup
 * Body: { formId: string, stepId?: string, answers?: object }
 * Builder-time follow-up field ideas (validated JSON + rate limit + fallbacks).
 */
export async function POST(request: Request) {
  const key = clientKeyFromRequest(request);
  if (!allowAiRequest(key)) {
    return NextResponse.json({ error: "Too many AI requests; try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const formId = typeof body.formId === "string" ? body.formId : null;
  const stepId = typeof body.stepId === "string" ? body.stepId : undefined;
  const answers =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  if (!formId) {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }

  const row = await getFormRecord(formId);
  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const form = toPublicDefinition(row);
  const stepsSummary = form.steps.map((s) => ({
    id: s.id,
    title: s.title,
    fieldLabels: s.fields.map((f) => f.label),
  }));

  const result = await generateFollowupSuggestions({
    mode: "builder",
    formTitle: form.title,
    stepsSummary,
    stepId,
    answers,
    maxSuggestions: 4,
  });

  return NextResponse.json({
    mode: result.mode,
    promptVersion: result.promptVersion,
    suggestions: result.suggestions,
    rawReasons: result.rawSuggestions.map((r) => r.reason ?? null),
  });
}
