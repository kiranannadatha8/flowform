/** Public surface for embedding or custom runtimes (Phase 0 + 1). */
export type { FormAnswers, FormDefinition, FormField, FormStep, FormSettings } from "./schema";
export { formDefinitionSchema, formAnswersSchema, formSettingsSchema } from "./schema";
export { getNextStepId, getReachableStepIds } from "./branching";
export { validateAnswers, fieldErrorsForStep } from "./validate-answers";
export { HANDBUILT_DEMO_DEFINITION } from "./handbuilt-demo-definition";
export { AI_PROMPT_VERSION } from "./ai/prompts";
