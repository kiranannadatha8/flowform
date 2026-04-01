/** URL-safe slug from title; caller ensures uniqueness. */
export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "form";
}

export function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
