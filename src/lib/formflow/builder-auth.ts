const COOKIE_NAME = "ff_builder";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return hex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) {
    x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return x === 0;
}

/** Issue a signed session value (Edge + Node Web Crypto). */
export async function signBuilderSessionValue(secret: string): Promise<string> {
  const exp = Date.now() + TTL_MS;
  const payload = String(exp);
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyBuilderSessionValue(
  token: string,
  secret: string,
): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = await hmacSha256Hex(secret, expStr);
  return timingSafeEqualHex(expected, sig);
}

export function builderPasswordConfigured(): boolean {
  return Boolean(process.env.FORMFLOW_BUILDER_PASSWORD?.trim());
}

export function getBuilderPassword(): string | null {
  const p = process.env.FORMFLOW_BUILDER_PASSWORD?.trim();
  return p && p.length > 0 ? p : null;
}

export const BUILDER_SESSION_COOKIE = COOKIE_NAME;

export function builderSessionCookieOptions(maxAgeSec: number): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  };
}

/** Constant-time string compare for login password. */
export function safeEqualPassword(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) {
    x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return x === 0;
}
