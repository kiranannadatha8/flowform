import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type PageHeaderProps = {
  /** Main page title (single h1). */
  title: string;
  description?: ReactNode;
  /** e.g. back link — rendered above the title row. */
  eyebrow?: ReactNode;
  /** Right-aligned actions (buttons). */
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2", className)}>
      {eyebrow ? <div className="text-sm">{eyebrow}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <div className="text-sm text-muted [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
