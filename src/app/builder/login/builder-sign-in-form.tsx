"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export function BuilderSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/builder";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/builder-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 501) {
        router.replace("/builder");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed");
        return;
      }
      router.replace(nextPath.startsWith("/builder") ? nextPath : "/builder");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-8">
      <PageHeader
        title="Builder sign-in"
        description={
          <>
            Enter the password set as <code>FORMFLOW_BUILDER_PASSWORD</code>. If unset, you are
            redirected to the builder (open mode).
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:text-red-300"
              >
                {error}
              </p>
            ) : null}
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-foreground shadow-sm transition-shadow focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" variant="primary" size="md" disabled={pending}>
              {pending ? "Signing in…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
