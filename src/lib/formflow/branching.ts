import type { FormDefinition, FormAnswers } from "./schema";

function valuesEqual(a: unknown, b: string | number | boolean): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a === "string" && typeof b === "number") {
    return Number(a) === b;
  }
  if (typeof a === "number" && typeof b === "string") {
    return a === Number(b);
  }
  return false;
}

function matchesWhen(
  when: {
    fieldId: string;
    op: "equals" | "not_equals";
    value: string | number | boolean;
  },
  answers: FormAnswers,
): boolean {
  const v = answers[when.fieldId];
  const eq = valuesEqual(v, when.value);
  return when.op === "equals" ? eq : !eq;
}

/**
 * Next step after `currentStepId` given answers. Rules on `fromStepId` are evaluated in array order.
 */
export function getNextStepId(
  def: FormDefinition,
  currentStepId: string,
  answers: FormAnswers,
): string | null {
  const order = def.steps.map((s) => s.id);
  const idx = order.indexOf(currentStepId);
  if (idx === -1) {
    return null;
  }

  const rules = def.branchRules?.filter((r) => r.fromStepId === currentStepId) ?? [];
  for (const rule of rules) {
    if (matchesWhen(rule.when, answers)) {
      if (order.includes(rule.then.gotoStepId)) {
        return rule.then.gotoStepId;
      }
    }
  }

  if (idx + 1 < order.length) {
    return order[idx + 1]!;
  }
  return null;
}

/**
 * Steps visited when walking from the first step using `getNextStepId` until the path ends.
 * Stops if a cycle is detected.
 */
export function getReachableStepIds(def: FormDefinition, answers: FormAnswers): Set<string> {
  const first = def.steps[0]?.id;
  if (!first) {
    return new Set();
  }

  const visited: string[] = [];
  const guard = new Set<string>();
  let current: string | null = first;

  while (current) {
    if (guard.has(current)) {
      break;
    }
    guard.add(current);
    visited.push(current);
    const next = getNextStepId(def, current, answers);
    if (!next) {
      break;
    }
    current = next;
  }

  return new Set(visited);
}
