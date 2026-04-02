"use client";

export function BuilderSignOut() {
  return (
    <button
      type="button"
      className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      onClick={() => {
        void (async () => {
          await fetch("/api/builder-auth", { method: "DELETE", credentials: "include" });
          window.location.href = "/builder/login";
        })();
      }}
    >
      Sign out
    </button>
  );
}
