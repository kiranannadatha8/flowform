import { createHash, randomBytes } from "node:crypto";

export function hashSubmitSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function verifySubmitSecret(secret: string, hash: string | null): boolean {
  if (!hash) {
    return true;
  }
  const h = hashSubmitSecret(secret);
  return h.length === hash.length && timingSafeEqualHex(h, hash);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function generateSubmitSecret(): string {
  return `ff_submit_${randomBytes(24).toString("base64url")}`;
}
