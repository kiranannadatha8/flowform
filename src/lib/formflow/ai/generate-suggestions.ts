import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { AI_PROMPT_VERSION, suggestFollowupBuilderSystem, suggestFollowupRuntimeSystem } from "./prompts";
import {
  type AiFieldSuggestion,
  aiSuggestionListSchema,
  mapAiSuggestionsToFormFields,
} from "./schemas";
import { sanitizeAnswersForPrompt } from "./context-trim";

import type { FormField } from "@/lib/formflow/schema";

export type SuggestionGenerateMode = "builder" | "runtime";

function stubSuggestions(mode: SuggestionGenerateMode, max: number): AiFieldSuggestion[] {
  const base: AiFieldSuggestion[] = [
    {
      kind: "text",
      label: "Anything else we should know?",
      required: false,
      reason:
        mode === "runtime"
          ? "Optional detail to improve routing."
          : "Set OPENAI_API_KEY for live suggestions.",
    },
  ];
  return base.slice(0, max);
}

export async function generateFollowupSuggestions(params: {
  mode: SuggestionGenerateMode;
  formTitle: string;
  stepsSummary: { id: string; title: string; fieldLabels: string[] }[];
  stepId?: string;
  answers: Record<string, unknown>;
  maxSuggestions: number;
}): Promise<{
  mode: "openai" | "stub";
  suggestions: FormField[];
  rawSuggestions: AiFieldSuggestion[];
  promptVersion: string;
}> {
  const max = Math.max(1, Math.min(params.maxSuggestions, params.mode === "runtime" ? 2 : 5));
  const system =
    params.mode === "runtime"
      ? suggestFollowupRuntimeSystem(max)
      : suggestFollowupBuilderSystem(max);

  const answers = sanitizeAnswersForPrompt(params.answers);

  if (!process.env.OPENAI_API_KEY) {
    const raw = stubSuggestions(params.mode, max);
    return {
      mode: "stub",
      rawSuggestions: raw,
      suggestions: mapAiSuggestionsToFormFields(raw),
      promptVersion: AI_PROMPT_VERSION,
    };
  }

  const prompt = JSON.stringify({
    formTitle: params.formTitle,
    stepId: params.stepId ?? null,
    steps: params.stepsSummary,
    answers,
  });

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system,
      prompt,
      maxOutputTokens: params.mode === "runtime" ? 400 : 900,
      temperature: 0.4,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const raw = stubSuggestions(params.mode, max);
      return {
        mode: "stub",
        rawSuggestions: raw,
        suggestions: mapAiSuggestionsToFormFields(raw),
        promptVersion: AI_PROMPT_VERSION,
      };
    }

    const list = aiSuggestionListSchema.safeParse(parsed);
    if (!list.success) {
      const raw = stubSuggestions(params.mode, max);
      return {
        mode: "stub",
        rawSuggestions: raw,
        suggestions: mapAiSuggestionsToFormFields(raw),
        promptVersion: AI_PROMPT_VERSION,
      };
    }

    const picked = list.data.suggestions.slice(0, max);
    if (picked.length === 0) {
      return {
        mode: "openai",
        rawSuggestions: [],
        suggestions: [],
        promptVersion: AI_PROMPT_VERSION,
      };
    }

    return {
      mode: "openai",
      rawSuggestions: picked,
      suggestions: mapAiSuggestionsToFormFields(picked),
      promptVersion: AI_PROMPT_VERSION,
    };
  } catch {
    const raw = stubSuggestions(params.mode, max);
    return {
      mode: "stub",
      rawSuggestions: raw,
      suggestions: mapAiSuggestionsToFormFields(raw),
      promptVersion: AI_PROMPT_VERSION,
    };
  }
}
