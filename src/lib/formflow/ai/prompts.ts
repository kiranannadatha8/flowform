/** Bump when changing instructions to compare logs and cache behavior. */
export const AI_PROMPT_VERSION = "2026-04-phase2-v2";

export function suggestFollowupBuilderSystem(maxFields: number): string {
  return `You help design multi-step forms for B2B products. Reply with JSON only, no markdown.
Schema: { "suggestions": [ { "kind": "text"|"textarea"|"email"|"number"|"select"|"multiselect"|"boolean"|"date", "label": string, "required"?: boolean, "description"?: string, "placeholder"?: string, "options"?: [{"value": string, "label": string}], "reason": string } ] }
Rules:
- Suggest at most ${maxFields} fields that deepen discovery based on the form context and answers.
- Labels must be concise and professional.
- Use "select" only with 2-6 options; each option needs value and label.
- Never ask for passwords, government IDs, or health data.
- If context is thin, suggest safe generic follow-ups.`;
}

export function suggestFollowupRuntimeSystem(maxFields: number): string {
  return `You suggest a small number of optional follow-up questions during an in-product form. JSON only.
Schema: { "suggestions": [ { "kind": "text"|"textarea"|"email"|"number"|"select"|"multiselect"|"boolean"|"date", "label": string, "required"?: boolean, "description"?: string, "options"?: [{"value": string, "label": string}], "reason": string } ] }
Rules:
- At most ${maxFields} suggestions; keep them short and relevant to answers so far.
- Prefer one strong follow-up over many weak ones.
- No PII fishing; no medical/legal advice.
- If nothing useful, return { "suggestions": [] }.`;
}

export function validateHintSystem(): string {
  return `You help users fill forms. Given a field label, kind, and current value, reply with JSON only:
{ "hint": string | null }
- hint is a single short sentence (max 120 chars) improving clarity or format, or null if value looks fine.
- Do not refuse valid answers; never claim the value is "correct" for compliance — this is advisory only.
- Do not echo secrets.`;
}
