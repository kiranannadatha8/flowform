import type { FormDefinition } from "./schema";

/** New draft forms start from this shape (IDs filled with the DB row id). */
export function createEmptyDefinition(id: string, title: string): FormDefinition {
  return {
    id,
    title,
    version: 1,
    steps: [
      {
        id: "step-1",
        title: "Step 1",
        fields: [],
      },
    ],
  };
}

/** Seed definition for local dev and tests. */
export const demoFormDefinition: FormDefinition = {
  id: "demo-contact",
  title: "Contact intake",
  description: "Example multi-step form with AI-assisted fields.",
  version: 1,
  steps: [
    {
      id: "step-basics",
      title: "Basics",
      fields: [
        {
          id: "field-name",
          kind: "text",
          label: "Full name",
          required: true,
          placeholder: "Jane Doe",
        },
        {
          id: "field-email",
          kind: "email",
          label: "Work email",
          required: true,
          aiAssist: { validateWithAi: true },
        },
      ],
    },
    {
      id: "step-details",
      title: "Details",
      fields: [
        {
          id: "field-use-case",
          kind: "textarea",
          label: "What are you trying to build?",
          required: true,
          aiAssist: { suggestFollowUps: true },
        },
        {
          id: "field-company-size",
          kind: "select",
          label: "Company size",
          required: false,
          options: [
            { value: "1-10", label: "1–10" },
            { value: "11-50", label: "11–50" },
            { value: "51+", label: "51+" },
          ],
        },
      ],
    },
  ],
};
