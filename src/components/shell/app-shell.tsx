import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type NavLink = {
  href: string;
  label: string;
  prefetch?: boolean;
};

type AppShellProps = {
  children: ReactNode;
  navLinks?: NavLink[];
  navActions?: ReactNode;
  mainClassName?: string;
  contentClassName?: string;
  showFooter?: boolean;
};

const defaultLinks: NavLink[] = [
  { href: "/builder", label: "Builder" },
  { href: "/demo", label: "Demo" },
  { href: "/f/demo-contact", label: "Live sample" },
];

export function AppShell({
  children,
  navLinks = defaultLinks,
  navActions,
  mainClassName,
  contentClassName,
  showFooter = true,
}: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
              FormFlow
            </Link>
            <nav className="flex min-w-0 items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={link.prefetch}
                  className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          {navActions ? <div className="flex items-center gap-2">{navActions}</div> : null}
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-6xl flex-1 px-6 py-10", mainClassName)}>
        <div className={cn("mx-auto w-full", contentClassName)}>{children}</div>
      </main>

      {showFooter ? (
        <footer className="border-t border-border/80">
          <div className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-muted">
            Build and ship intelligent multi-step forms.
          </div>
        </footer>
      ) : null}
    </div>
  );
}
