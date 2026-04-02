"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-8 px-6 py-24">
      <div>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← FormFlow
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Builder sign-in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the password configured as{" "}
          <code className="font-mono text-xs">FORMFLOW_BUILDER_PASSWORD</code>. If unset, you are
          redirected to the builder (open mode).
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Signing in…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
