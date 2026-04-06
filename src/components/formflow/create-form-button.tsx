"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
    <Button type="button" variant="primary" size="md" disabled={pending} onClick={() => void onCreate()}>
      {pending ? "Creating…" : "New form"}
    </Button>
  );
}
