# FormFlow UI tokens (Phase A)

CSS variables are defined in `src/app/globals.css` under `:root` and dark mode (`prefers-color-scheme: dark`). They are exposed to Tailwind v4 via `@theme inline` as colors.

| Token | Tailwind examples | Purpose |
|-------|-------------------|---------|
| `--background` | `bg-background` | Page canvas |
| `--foreground` | `text-foreground` | Primary text |
| `--surface` | `bg-surface` | Cards, inputs on canvas |
| `--surface-muted` | `bg-surface-muted` | Hover rows, subtle fills |
| `--border` | `border-border` | Dividers, outlines |
| `--muted` | `text-muted` | Secondary / helper text |
| `--accent` | `bg-accent`, `text-accent` | Brand accent |
| `--accent-foreground` | `text-accent-foreground` | Text on accent fills |
| `--ring` | `ring-ring` | Focus rings |
| `--destructive` | `bg-destructive` | Errors / destructive actions |
| `--destructive-foreground` | `text-destructive-foreground` | Text on destructive |

**Typography:** `body` uses **Geist Sans** (`--font-geist-sans`). Monospace uses `--font-geist-mono` via `font-mono`.

**Primitives:** `src/components/ui/button.tsx`, `card.tsx`, `page-header.tsx`.

**Motion:** `prefers-reduced-motion: reduce` short-circuits transitions in `globals.css`.
