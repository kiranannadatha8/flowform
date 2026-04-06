"use client";

import { Button } from "@/components/ui/button";

export function BuilderSignOut() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        void (async () => {
          await fetch("/api/builder-auth", { method: "DELETE", credentials: "include" });
          window.location.href = "/builder/login";
        })();
      }}
    >
      Sign out
    </Button>
  );
}
