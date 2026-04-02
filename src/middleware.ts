import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  BUILDER_SESSION_COOKIE,
  getBuilderPassword,
  verifyBuilderSessionValue,
} from "@/lib/formflow/builder-auth";

export async function middleware(request: NextRequest) {
  const pwd = getBuilderPassword();
  if (!pwd) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/builder")) {
    return NextResponse.next();
  }
  if (pathname === "/builder/login" || pathname.startsWith("/builder/login/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(BUILDER_SESSION_COOKIE)?.value ?? "";
  if (!(await verifyBuilderSessionValue(token, pwd))) {
    const url = request.nextUrl.clone();
    url.pathname = "/builder/login";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/builder", "/builder/:path*"],
};
