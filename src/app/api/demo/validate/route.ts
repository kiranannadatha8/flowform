import { NextResponse } from "next/server";

import { HANDBUILT_DEMO_DEFINITION } from "@/lib/formflow/handbuilt-demo-definition";
import { formAnswersSchema } from "@/lib/formflow/schema";
import { validateAnswers } from "@/lib/formflow/validate-answers";

/**
 * Phase 0: validate answers against the bundled hand-built definition (no database).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = formAnswersSchema.safeParse(body.answers ?? body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answers payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = validateAnswers(HANDBUILT_DEMO_DEFINITION, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, fieldErrors: result.fieldErrors },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    received: true,
    definitionId: HANDBUILT_DEMO_DEFINITION.id,
  });
}
