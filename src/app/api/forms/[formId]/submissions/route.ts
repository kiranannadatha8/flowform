import { NextResponse } from "next/server";

import { getFormRecord, listFormSubmissions } from "@/lib/formflow/forms-service";
import { requireBuilderApiAuth } from "@/lib/formflow/require-builder-api";

type RouteParams = { params: Promise<{ formId: string }> };

/** Paginated submission history for a form (Phase 3). Requires builder session when password is set. */
export async function GET(request: Request, { params }: RouteParams) {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }

  const { formId } = await params;
  const row = await getFormRecord(formId);
  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const { items, nextCursor } = await listFormSubmissions(formId, {
    limit: Number.isFinite(limit) ? limit : 50,
    cursor,
  });

  return NextResponse.json({
    formId,
    submissions: items.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      answers: s.answers,
    })),
    nextCursor,
  });
}
