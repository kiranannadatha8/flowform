import { NextResponse } from "next/server";

import { getFormRecord, updateDraft } from "@/lib/formflow/forms-service";

type RouteParams = { params: Promise<{ formId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { formId } = await params;
  const form = await getFormRecord(formId);
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json({
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      status: form.status,
      definition: form.definition,
      submitKeyConfigured: Boolean(form.submitSecretHash),
      updatedAt: form.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { formId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const form = await updateDraft(formId, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      definition: body.definition,
    });

    return NextResponse.json({
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        status: form.status,
        definition: form.definition,
        submitKeyConfigured: Boolean(form.submitSecretHash),
        updatedAt: form.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    if (msg === "NOT_DRAFT") {
      return NextResponse.json({ error: "Only draft forms can be edited" }, { status: 409 });
    }
    if (msg === "SLUG_TAKEN") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (msg === "INVALID_SLUG") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    if (msg === "DEFINITION_ID_MISMATCH") {
      return NextResponse.json({ error: "definition.id must match form id" }, { status: 400 });
    }
    throw e;
  }
}
