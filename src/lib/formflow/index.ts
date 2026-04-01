/** Public surface for embedding or custom runtimes (Phase 0 + 1). */
export type { FormAnswers, FormDefinition, FormField, FormStep } from "./schema";
export { formDefinitionSchema, formAnswersSchema } from "./schema";
export { getNextStepId, getReachableStepIds } from "./branching";
export { validateAnswers, fieldErrorsForStep } from "./validate-answers";
export { HANDBUILT_DEMO_DEFINITION } from "./handbuilt-demo-definition";
