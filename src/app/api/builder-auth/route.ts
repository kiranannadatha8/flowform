import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  BUILDER_SESSION_COOKIE,
  builderSessionCookieOptions,
  getBuilderPassword,
  safeEqualPassword,
  signBuilderSessionValue,
} from "@/lib/formflow/builder-auth";

export async function POST(request: Request) {
  const pwd = getBuilderPassword();
  if (!pwd) {
    return NextResponse.json(
      { error: "FORMFLOW_BUILDER_PASSWORD is not set; builder UI is open." },
      { status: 501 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const attempt = typeof body.password === "string" ? body.password : "";
  if (!safeEqualPassword(attempt, pwd)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signBuilderSessionValue(pwd);
  const jar = await cookies();
  jar.set(BUILDER_SESSION_COOKIE, token, builderSessionCookieOptions(60 * 60 * 24 * 7));

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(BUILDER_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ ok: true });
}
