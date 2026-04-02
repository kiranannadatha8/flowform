import { Suspense } from "react";

import { BuilderSignInForm } from "./builder-sign-in-form";

export default function BuilderLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <BuilderSignInForm />
    </Suspense>
  );
}
