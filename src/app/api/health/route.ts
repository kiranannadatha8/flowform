import { NextResponse } from "next/server";

/** Liveness for load balancers and deploy checks (no database ping). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "formflow",
    ts: new Date().toISOString(),
  });
}
