import { NextResponse } from "next/server";

import { getFormRecord, toPublicDefinition } from "@/lib/formflow/forms-service";

type RouteParams = { params: Promise<{ formId: string }> };

/** Download FormDefinition JSON (Phase 0 static export for embeds / hand-built demos). */
export async function GET(_request: Request, { params }: RouteParams) {
  const { formId } = await params;
  const row = await getFormRecord(formId);
  if (!row) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const definition = toPublicDefinition(row);
  const filename = `formflow-${row.slug}-v${definition.version}.json`;

  return new NextResponse(JSON.stringify(definition, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
