function maxContextChars(): number {
  const raw = process.env.FORMFLOW_AI_MAX_CONTEXT_CHARS;
  const n = raw ? Number.parseInt(raw, 10) : 12_000;
  return Number.isFinite(n) && n > 1024 ? Math.min(n, 100_000) : 12_000;
}

/** Safe trim: keep structure, drop long strings in answers. */
export function sanitizeAnswersForPrompt(answers: Record<string, unknown>): Record<string, unknown> {
  const max = maxContextChars();
  const out: Record<string, unknown> = {};
  let used = 0;
  for (const [k, v] of Object.entries(answers)) {
    let piece: unknown = v;
    if (typeof v === "string" && v.length > 500) {
      piece = `${v.slice(0, 500)}…`;
    }
    const enc = JSON.stringify({ [k]: piece });
    if (used + enc.length > max) break;
    out[k] = piece;
    used += enc.length;
  }
  return out;
}
