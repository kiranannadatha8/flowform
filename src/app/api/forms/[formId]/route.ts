import { NextResponse } from "next/server";

import {
  countSubmissions,
  getFormRecord,
  updateDraft,
} from "@/lib/formflow/forms-service";
import { requireBuilderApiAuth } from "@/lib/formflow/require-builder-api";

type RouteParams = { params: Promise<{ formId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }
  const { formId } = await params;
  const form = await getFormRecord(formId);
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const submissionCount = await countSubmissions(formId);

  return NextResponse.json({
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      status: form.status,
      definition: form.definition,
      submitKeyConfigured: Boolean(form.submitSecretHash),
      updatedAt: form.updatedAt.toISOString(),
      submissionCount,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }
  const { formId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const form = await updateDraft(formId, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      definition: body.definition,
    });

    const submissionCount = await countSubmissions(formId);

    return NextResponse.json({
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        status: form.status,
        definition: form.definition,
        submitKeyConfigured: Boolean(form.submitSecretHash),
        updatedAt: form.updatedAt.toISOString(),
        submissionCount,
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
