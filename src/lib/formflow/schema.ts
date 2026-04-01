import { z } from "zod";

/** Supported input kinds — extend as the builder grows. */
export const fieldKindSchema = z.enum([
  "text",
  "textarea",
  "email",
  "number",
  "select",
  "multiselect",
  "boolean",
  "date",
]);

export type FieldKind = z.infer<typeof fieldKindSchema>;

export const formFieldSchema = z.object({
  id: z.string().min(1),
  kind: fieldKindSchema,
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  /** When true, runtime may call AI to propose follow-up fields or copy. */
  aiAssist: z
    .object({
      suggestFollowUps: z.boolean().optional(),
      validateWithAi: z.boolean().optional(),
    })
    .optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const formStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
});

export type FormStep = z.infer<typeof formStepSchema>;

/** After completing `fromStepId`, if `when` matches answers, go to `gotoStepId` instead of the next step in order. */
export const branchRuleSchema = z.object({
  id: z.string().min(1),
  fromStepId: z.string().min(1),
  when: z.object({
    fieldId: z.string().min(1),
    op: z.enum(["equals", "not_equals"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
  then: z.object({
    gotoStepId: z.string().min(1),
  }),
});

export type BranchRule = z.infer<typeof branchRuleSchema>;

export const formDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  version: z.number().int().positive().default(1),
  steps: z.array(formStepSchema).min(1),
  branchRules: z.array(branchRuleSchema).optional(),
});

export type FormDefinition = z.infer<typeof formDefinitionSchema>;

/** Answers keyed by field id — values are JSON-serializable. */
export const formAnswersSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
);

export type FormAnswers = z.infer<typeof formAnswersSchema>;
