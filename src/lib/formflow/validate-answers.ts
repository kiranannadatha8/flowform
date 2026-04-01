import type { FormDefinition, FormField, FormAnswers, FormStep } from "./schema";
import { getReachableStepIds } from "./branching";

function fieldError(field: FormField, value: unknown): string | null {
  const empty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (field.required && empty) {
    return `${field.label} is required`;
  }

  if (empty && !field.required) {
    return null;
  }

  switch (field.kind) {
    case "email":
      if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field.label} must be a valid email`;
      }
      break;
    case "number":
      if (typeof value !== "number" && typeof value !== "string") {
        return `${field.label} must be a number`;
      }
      if (typeof value === "string" && value.trim() !== "" && Number.isNaN(Number(value))) {
        return `${field.label} must be a number`;
      }
      break;
    case "select":
      if (typeof value !== "string") {
        return `${field.label} must be a single choice`;
      }
      if (field.options && !field.options.some((o) => o.value === value)) {
        return `${field.label} has an invalid choice`;
      }
      break;
    case "multiselect":
      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
        return `${field.label} must be a list of choices`;
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") {
        return `${field.label} must be true or false`;
      }
      break;
    case "date":
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return `${field.label} must be a valid date`;
      }
      break;
    default:
      if (typeof value !== "string") {
        return `${field.label} must be text`;
      }
  }

  return null;
}

/** Client-side step validation (Next button) — same rules as full submit for fields on this step. */
export function fieldErrorsForStep(step: FormStep, answers: FormAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of step.fields) {
    const err = fieldError(field, answers[field.id]);
    if (err) {
      out[field.id] = err;
    }
  }
  return out;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string> };

/**
 * Validates answers for fields on the path implied by branching rules (Phase 1).
 */
export function validateAnswers(def: FormDefinition, answers: FormAnswers): ValidationResult {
  const reachable = getReachableStepIds(def, answers);
  const fieldErrors: Record<string, string> = {};

  for (const step of def.steps) {
    if (!reachable.has(step.id)) {
      continue;
    }
    for (const field of step.fields) {
      const err = fieldError(field, answers[field.id]);
      if (err) {
        fieldErrors[field.id] = err;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true };
}
