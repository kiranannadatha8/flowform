import type { FormDefinition } from "./schema";

/**
 * Phase 0 hand-built definition (no DB). Paired with POST /api/demo/validate and /demo.
 */
export const HANDBUILT_DEMO_DEFINITION: FormDefinition = {
  id: "handbuilt-demo",
  title: "Hand-built demo",
  description: "Static FormDefinition bundled with the app — used to prove the runtime without persistence.",
  version: 1,
  steps: [
    {
      id: "demo-step-1",
      title: "About you",
      fields: [
        {
          id: "demo-name",
          kind: "text",
          label: "Name",
          required: true,
          placeholder: "Ada Lovelace",
        },
        {
          id: "demo-role",
          kind: "select",
          label: "Role",
          required: true,
          options: [
            { value: "eng", label: "Engineering" },
            { value: "pm", label: "Product" },
            { value: "other", label: "Other" },
          ],
        },
      ],
    },
    {
      id: "demo-step-2",
      title: "Feedback",
      fields: [
        {
          id: "demo-notes",
          kind: "textarea",
          label: "What should we build next?",
          required: true,
        },
        {
          id: "demo-nps",
          kind: "number",
          label: "Score (1–10)",
          required: false,
        },
      ],
    },
  ],
  branchRules: [
    {
      id: "demo-rule-1",
      fromStepId: "demo-step-1",
      when: { fieldId: "demo-role", op: "equals", value: "eng" },
      then: { gotoStepId: "demo-step-2" },
    },
  ],
};
