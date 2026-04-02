import type { Form } from "@prisma/client";

import { prisma } from "@/lib/db";

import { generateSubmitSecret, hashSubmitSecret, verifySubmitSecret } from "./api-key";
import { createEmptyDefinition } from "./defaults";
import { formDefinitionSchema, type FormDefinition } from "./schema";
import { randomSlugSuffix, slugifyTitle } from "./slug";

export type FormListItem = Pick<Form, "id" | "slug" | "title" | "status" | "updatedAt">;

function parseDefinition(json: unknown): FormDefinition {
  return formDefinitionSchema.parse(json);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugifyTitle(base);
  for (let i = 0; i < 8; i++) {
    const hit = await prisma.form.findUnique({ where: { slug } });
    if (!hit) {
      return slug;
    }
    slug = `${slugifyTitle(base)}-${randomSlugSuffix()}`;
  }
  return `${slugifyTitle(base)}-${randomSlugSuffix()}`;
}

export async function listForms(): Promise<FormListItem[]> {
  return prisma.form.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, updatedAt: true },
  });
}

export async function createForm(title: string): Promise<Form> {
  const slug = await uniqueSlug(title);
  return prisma.$transaction(async (tx) => {
    const row = await tx.form.create({
      data: {
        slug,
        title,
        status: "DRAFT",
        definition: { _placeholder: true } as object,
      },
    });
    const definition = createEmptyDefinition(row.id, title);
    return tx.form.update({
      where: { id: row.id },
      data: { definition: definition as object },
    });
  });
}

export async function getFormRecord(id: string): Promise<Form | null> {
  return prisma.form.findUnique({ where: { id } });
}

export async function getFormBySlug(slug: string): Promise<Form | null> {
  return prisma.form.findUnique({ where: { slug } });
}

export async function updateDraft(
  id: string,
  patch: { title?: string; slug?: string; definition?: unknown },
): Promise<Form> {
  const existing = await prisma.form.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  if (existing.status !== "DRAFT") {
    throw new Error("NOT_DRAFT");
  }

  const data: {
    title?: string;
    slug?: string;
    definition?: object;
  } = {};

  if (patch.title !== undefined) {
    data.title = patch.title;
  }

  if (patch.slug !== undefined) {
    const next = slugifyTitle(patch.slug);
    if (next.length === 0) {
      throw new Error("INVALID_SLUG");
    }
    const clash = await prisma.form.findFirst({
      where: { slug: next, NOT: { id } },
    });
    if (clash) {
      throw new Error("SLUG_TAKEN");
    }
    data.slug = next;
  }

  if (patch.definition !== undefined) {
    const def = parseDefinition(patch.definition);
    if (def.id !== id) {
      throw new Error("DEFINITION_ID_MISMATCH");
    }
    data.definition = def as object;
  }

  return prisma.form.update({
    where: { id },
    data,
  });
}

export type PublishResult =
  | { form: Form; submitSecret?: string }
  | { error: "NOT_FOUND" | "NOT_DRAFT" };

export async function publishForm(
  id: string,
  options: { generateSubmitSecret?: boolean } = {},
): Promise<PublishResult> {
  const existing = await prisma.form.findUnique({ where: { id } });
  if (!existing) {
    return { error: "NOT_FOUND" };
  }
  if (existing.status !== "DRAFT") {
    return { error: "NOT_DRAFT" };
  }

  let def = parseDefinition(existing.definition);
  def = {
    ...def,
    version: def.version + 1,
  };

  let submitSecret: string | undefined;
  let submitSecretHash: string | null = existing.submitSecretHash;

  if (options.generateSubmitSecret) {
    submitSecret = generateSubmitSecret();
    submitSecretHash = hashSubmitSecret(submitSecret);
  }

  const form = await prisma.form.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      definition: def as object,
      submitSecretHash,
    },
  });

  return { form, submitSecret };
}

export function toPublicDefinition(form: Form): FormDefinition {
  return parseDefinition(form.definition);
}

export function verifySubmitForForm(form: Form, secret: string | undefined): boolean {
  return verifySubmitSecret(secret ?? "", form.submitSecretHash);
}

export async function countSubmissions(formId: string): Promise<number> {
  return prisma.formSubmission.count({ where: { formId } });
}

export async function createFormSubmission(
  formId: string,
  answers: Record<string, unknown>,
): Promise<{ id: string }> {
  const row = await prisma.formSubmission.create({
    data: {
      formId,
      answers: answers as object,
    },
    select: { id: true },
  });
  return row;
}

export type SubmissionListItem = {
  id: string;
  createdAt: Date;
  answers: Record<string, unknown>;
};

export async function listFormSubmissions(
  formId: string,
  opts: { limit: number; cursor?: string },
): Promise<{ items: SubmissionListItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit, 1), 100);
  const rows = await prisma.formSubmission.findMany({
    where: { formId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(opts.cursor
      ? {
          cursor: { id: opts.cursor },
          skip: 1,
        }
      : {}),
    select: { id: true, answers: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    answers: r.answers as Record<string, unknown>,
  }));
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor };
}
