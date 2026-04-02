import { NextResponse } from "next/server";

import { createForm, listForms } from "@/lib/formflow/forms-service";
import { requireBuilderApiAuth } from "@/lib/formflow/require-builder-api";

export async function GET() {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }
  const forms = await listForms();
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const denied = await requireBuilderApiAuth();
  if (denied) {
    return denied;
  }
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim().length > 0 ? body.title.trim() : null;
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const form = await createForm(title);
  return NextResponse.json(
    {
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        status: form.status,
        definition: form.definition,
        submitKeyConfigured: Boolean(form.submitSecretHash),
      },
    },
    { status: 201 },
  );
}
