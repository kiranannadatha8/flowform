import type { ReactNode } from "react";

import { BuilderSignOut } from "@/components/formflow/builder-sign-out";
import { AppShell } from "@/components/shell/app-shell";
import { builderPasswordConfigured } from "@/lib/formflow/builder-auth";

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/builder", label: "Forms" },
        { href: "/demo", label: "Demo" },
      ]}
      navActions={builderPasswordConfigured() ? <BuilderSignOut /> : null}
      showFooter={false}
      mainClassName="py-8"
    >
      {children}
    </AppShell>
  );
}
