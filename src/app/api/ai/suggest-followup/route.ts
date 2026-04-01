import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { getFormRecord, toPublicDefinition } from "@/lib/formflow/forms-service";

/**
 * POST /api/ai/suggest-followup
 * Body: { formId, stepId?, fieldId?, answers: Record<string, unknown> }
 * Returns suggested follow-up fields or questions (JSON).
 * Requires OPENAI_API_KEY when using the default OpenAI provider.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const formId = typeof body.formId === "string" ? body.formId : null;
  const answers =
    body.answers && typeof body.answers === "object" ? (body.answers as Record<string, unknown>) : {};

  if (!formId) {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }

  const row = await getFormRecord(formId);
  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const form = toPublicDefinition(row);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        mode: "stub",
        suggestions: [
          {
            id: "suggested-followup-1",
            kind: "text",
            label: "What is your timeline?",
            reason: "Set OPENAI_API_KEY to enable live AI suggestions.",
          },
        ],
      },
      { status: 200 },
    );
  }

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are helping design a multi-step form. Given the form title, steps, and current answers, suggest 1-3 follow-up fields as JSON only. Schema: { "suggestions": [ { "id": string, "kind": "text"|"textarea"|"email"|"select", "label": string, "required"?: boolean, "options"?: [{"value","label"}], "reason": string } ] }`,
    prompt: JSON.stringify({
      formTitle: form.title,
      steps: form.steps.map((s) => ({
        id: s.id,
        title: s.title,
        fieldLabels: s.fields.map((f) => f.label),
      })),
      answers,
    }),
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Model did not return valid JSON", raw: text },
      { status: 502 },
    );
  }

  return NextResponse.json({ mode: "openai", result: parsed });
}
