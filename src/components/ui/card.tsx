import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface text-foreground shadow-sm dark:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 border-b border-border px-6 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export type FeatureCardProps = {
  title: string;
  body: string;
  className?: string;
};

/** Compact marketing / dashboard feature tile. */
export function FeatureCard({ title, body, className }: FeatureCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="py-5">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-2 text-sm text-muted">{body}</p>
      </CardContent>
    </Card>
  );
}
