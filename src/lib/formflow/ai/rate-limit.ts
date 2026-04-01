const buckets = new Map<string, number[]>();

function maxPerMinute(): number {
  const raw = process.env.FORMFLOW_AI_MAX_REQUESTS_PER_MINUTE;
  const n = raw ? Number.parseInt(raw, 10) : 30;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 120) : 30;
}

/** Sliding window rate limit. Returns true if allowed. */
export function allowAiRequest(key: string): boolean {
  const limit = maxPerMinute();
  const now = Date.now();
  const windowMs = 60_000;
  const existing = buckets.get(key) ?? [];
  const recent = existing.filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function clientKeyFromRequest(request: Request): string {
  const h = request.headers;
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = h.get("x-real-ip")?.trim();
  return `ip:${fwd || real || "unknown"}`;
}
