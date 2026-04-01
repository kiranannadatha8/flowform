import { NextResponse } from "next/server";

import { getFormBySlug, toPublicDefinition } from "@/lib/formflow/forms-service";

type RouteParams = { params: Promise<{ slug: string }> };

/** Published form definition for embeds (no secrets). */
export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const row = await getFormBySlug(slug);
  if (!row || row.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const definition = toPublicDefinition(row);

  return NextResponse.json({
    slug: row.slug,
    title: row.title,
    version: definition.version,
    definition,
    submitAuthRequired: Boolean(row.submitSecretHash),
  });
}
