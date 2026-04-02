import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  BUILDER_SESSION_COOKIE,
  getBuilderPassword,
  verifyBuilderSessionValue,
} from "@/lib/formflow/builder-auth";

/** When FORMFLOW_BUILDER_PASSWORD is set, require valid ff_builder cookie. */
export async function requireBuilderApiAuth(): Promise<NextResponse | null> {
  const pwd = getBuilderPassword();
  if (!pwd) {
    return null;
  }

  const jar = await cookies();
  const token = jar.get(BUILDER_SESSION_COOKIE)?.value ?? "";
  if (!(await verifyBuilderSessionValue(token, pwd))) {
    return NextResponse.json(
      { error: "Unauthorized", hint: "Set ff_builder session via POST /api/builder-auth" },
      { status: 401 },
    );
  }

  return null;
}
