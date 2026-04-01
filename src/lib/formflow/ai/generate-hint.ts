import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { sanitizeAnswersForPrompt } from "./context-trim";
import { AI_PROMPT_VERSION, validateHintSystem } from "./prompts";
import { aiHintResponseSchema } from "./schemas";

import type { FormField } from "@/lib/formflow/schema";

export async function generateValidateHint(params: {
  field: FormField;
  value: unknown;
  answers: Record<string, unknown>;
}): Promise<{ hint: string | null; promptVersion: string; mode: "openai" | "stub" }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      hint: null,
      mode: "stub",
      promptVersion: AI_PROMPT_VERSION,
    };
  }

  const prompt = JSON.stringify({
    field: {
      label: params.field.label,
      kind: params.field.kind,
      description: params.field.description,
    },
    value: params.value,
    otherAnswers: sanitizeAnswersForPrompt(params.answers),
  });

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: validateHintSystem(),
      prompt,
      maxOutputTokens: 120,
      temperature: 0.2,
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { hint: null, mode: "openai", promptVersion: AI_PROMPT_VERSION };
    }
    const r = aiHintResponseSchema.safeParse(parsed);
    if (!r.success || r.data.hint == null) {
      return { hint: null, mode: "openai", promptVersion: AI_PROMPT_VERSION };
    }
    return { hint: r.data.hint, mode: "openai", promptVersion: AI_PROMPT_VERSION };
  } catch {
    return { hint: null, mode: "stub", promptVersion: AI_PROMPT_VERSION };
  }
}
