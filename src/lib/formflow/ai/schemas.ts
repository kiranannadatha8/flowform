import { z } from "zod";

import { fieldKindSchema, type FormField } from "@/lib/formflow/schema";

/** Model output before ids are assigned. */
export const aiFieldSuggestionSchema = z.object({
  kind: fieldKindSchema,
  label: z.string().min(1).max(240),
  required: z.boolean().optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(200).optional(),
  options: z.array(z.object({ value: z.string().max(80), label: z.string().max(120) })).max(12).optional(),
  reason: z.string().max(400).optional(),
});

export type AiFieldSuggestion = z.infer<typeof aiFieldSuggestionSchema>;

export const aiSuggestionListSchema = z.object({
  suggestions: z.array(aiFieldSuggestionSchema).max(8),
});

function newFieldId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ai-${crypto.randomUUID()}`;
  }
  return `ai-${Math.random().toString(36).slice(2, 14)}`;
}

export function mapAiSuggestionsToFormFields(rows: AiFieldSuggestion[]): FormField[] {
  return rows.map((row) => {
    const id = newFieldId();
    const base: FormField = {
      id,
      kind: row.kind,
      label: row.label,
      required: row.required ?? false,
      description: row.description,
      placeholder: row.placeholder,
    };
    if (row.kind === "select" || row.kind === "multiselect") {
      const opts =
        row.options && row.options.length > 0
          ? row.options
          : [
              { value: "a", label: "Option A" },
              { value: "b", label: "Option B" },
            ];
      return { ...base, options: opts };
    }
    return base;
  });
}

export const aiHintResponseSchema = z.object({
  hint: z.string().max(120).nullable(),
});
