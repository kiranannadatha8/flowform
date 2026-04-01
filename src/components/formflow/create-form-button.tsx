"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateFormButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onCreate() {
    setPending(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled form" }),
      });
      if (!res.ok) {
        throw new Error("Could not create form");
      }
      const data = await res.json();
      router.push(`/builder/${data.form.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCreate()}
      disabled={pending}
      className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      {pending ? "Creating…" : "New form"}
    </button>
  );
}
