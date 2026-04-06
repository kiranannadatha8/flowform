"use client";

import { useMemo, useRef, useState } from "react";

import { getNextStepId } from "@/lib/formflow/branching";
import type { FormAnswers, FormDefinition, FormField, FormStep } from "@/lib/formflow/schema";
import { fieldErrorsForStep } from "@/lib/formflow/validate-answers";

type FormRuntimeProps =
  | { variant: "demo"; definition: FormDefinition }
  | { variant: "preview"; definition: FormDefinition; formId: string }
  | {
      variant: "live";
      definition: FormDefinition;
      slug: string;
      /** Row id for AI hint endpoint (optional but needed for validate-hint on live). */
      formId?: string;
      submitAuthRequired?: boolean;
    };

function FieldInput({
  field,
  value,
  error,
  onChange,
  softHint,
  onBlurField,
}: {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (v: FormAnswers[string]) => void;
  softHint?: string;
  onBlurField?: () => void;
}) {
  const base =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const errRing = error ? "border-red-500 ring-1 ring-red-500/30" : "";

  const hintEl =
    softHint && !error ? (
      <span className="text-xs text-violet-700 dark:text-violet-300">{softHint}</span>
    ) : null;

  switch (field.kind) {
    case "textarea":
      return (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
          {field.description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{field.description}</span>
          )}
          <textarea
            className={`${base} min-h-[100px] ${errRing}`}
            placeholder={field.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlurField}
          />
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          {hintEl}
        </label>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-300"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlurField}
          />
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
          {error && <span className="text-xs text-red-600">{error}</span>}
          {hintEl}
        </label>
      );
    case "select":
      return (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
          <select
            className={`${base} ${errRing}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlurField}
          >
            <option value="">Choose…</option>
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          {hintEl}
        </label>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset
          className="flex flex-col gap-2 text-sm"
          onBlur={onBlurField}
        >
          <legend className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</legend>
          {(field.options ?? []).map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label key={o.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((x) => x !== o.value)
                      : [...selected, o.value];
                    onChange(next);
                  }}
                />
                <span>{o.label}</span>
              </label>
            );
          })}
          {error && <span className="text-xs text-red-600">{error}</span>}
          {hintEl}
        </fieldset>
      );
    }
    case "number":
      return (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
          <input
            type="number"
            className={`${base} ${errRing}`}
            placeholder={field.placeholder}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => {
              const t = e.target.value;
              if (t === "") {
                onChange(null);
              } else {
                const n = Number(t);
                onChange(Number.isNaN(n) ? t : n);
              }
            }}
            onBlur={onBlurField}
          />
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          {hintEl}
        </label>
      );
    case "date":
      return (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
          <input
            type="date"
            className={`${base} ${errRing}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlurField}
          />
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          {hintEl}
        </label>
      );
    case "email":
    case "text":
    default:
      return (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
          {field.description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{field.description}</span>
          )}
          <input
            type={field.kind === "email" ? "email" : "text"}
            className={`${base} ${errRing}`}
            placeholder={field.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlurField}
          />
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          {hintEl}
        </label>
      );
  }
}

function mergeErrors(
  a: Record<string, string>,
  b: Record<string, string> | null | undefined,
): Record<string, string> {
  if (!b) return a;
  return { ...a, ...b };
}

export function FormRuntime(props: FormRuntimeProps) {
  const { definition, variant } = props;
  const first = definition.steps[0]?.id ?? "";

  const [answers, setAnswers] = useState<FormAnswers>({});
  const [history, setHistory] = useState<string[]>(() => (first ? [first] : []));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitSecret, setSubmitSecret] = useState("");
  const [phase, setPhase] = useState<"filling" | "done">("filling");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string> | null>(null);
  const [interstitialFields, setInterstitialFields] = useState<FormField[] | null>(null);
  const [runtimeAiCallsUsed, setRuntimeAiCallsUsed] = useState(0);
  const [hints, setHints] = useState<Record<string, string>>({});

  const answersRef = useRef<FormAnswers>({});
  answersRef.current = answers;

  const currentStepId = history[history.length - 1] ?? "";
  const currentStep: FormStep | undefined = useMemo(
    () => definition.steps.find((s) => s.id === currentStepId),
    [definition.steps, currentStepId],
  );

  const showingAiInterstitial = Boolean(interstitialFields?.length);
  const displayTitle = showingAiInterstitial
    ? "Suggested follow-up (optional)"
    : currentStep?.title ?? "";
  const displayDescription = showingAiInterstitial
    ? "Optional. Official validation still uses your published fields only; extra answers are stored as additional keys."
    : currentStep?.description;

  function aiFormId(): string | null {
    if (variant === "preview") {
      return props.formId;
    }
    if (variant === "live" && props.formId) {
      return props.formId;
    }
    return null;
  }

  function fetchHint(fieldId: string) {
    const fid = aiFormId();
    if (!fid || variant === "demo") return;
    void (async () => {
      try {
        const res = await fetch("/api/ai/validate-hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: fid,
            fieldId,
            value: answersRef.current[fieldId],
            answers: answersRef.current,
}),
        });
        const data = (await res.json()) as { hint?: string | null };
        if (typeof data.hint === "string" && data.hint.length > 0) {
          setHints((h) => ({ ...h, [fieldId]: data.hint ?? "" }));
        }
      } catch {
        /* ignore */
      }
    })();
  }

  function setFieldValue(fieldId: string, value: FormAnswers[string]) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  function onBack() {
    if (showingAiInterstitial) {
      setInterstitialFields(null);
      setFieldErrors({});
      return;
    }
    if (history.length <= 1) return;
    setHistory((h) => h.slice(0, -1));
    setFieldErrors({});
    setServerFieldErrors(null);
    setErrorMessage(null);
  }

  async function submitToServer(body: FormAnswers) {
    if (variant === "demo") {
      return fetch("/api/demo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: body }),
      });
    }
    if (variant === "preview") {
      return fetch(`/api/forms/${props.formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: body }),
      });
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const secret = submitSecret.trim();
    if (secret) {
      headers["X-FormFlow-Submit-Secret"] = secret;
    }
    return fetch(`/api/public/forms/${props.slug}/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ answers: body, submitSecret: secret || undefined }),
    });
  }

  async function doFinalSubmit() {
    setLoading(true);
    setErrorMessage(null);
    setServerFieldErrors(null);
    try {
      const res = await submitToServer(answersRef.current);
      const data = (await res.json().catch(() => ({}))) as {
        fieldErrors?: Record<string, string>;
        error?: string;
      };

      if (res.status === 422 && data.fieldErrors) {
        setServerFieldErrors(data.fieldErrors);
        setErrorMessage("Some answers need attention.");
        return;
      }
      if (!res.ok) {
        setErrorMessage(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setPhase("done");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function skipInterstitialAndAdvance() {
    setInterstitialFields(null);
    setFieldErrors({});
    const nextId = getNextStepId(definition, currentStepId, answersRef.current);
    if (nextId !== null) {
      setHistory((h) => [...h, nextId]);
      setServerFieldErrors(null);
      setErrorMessage(null);
    } else {
      void doFinalSubmit();
    }
  }

  async function maybeAiThenAdvance() {
    const maxCalls = definition.settings?.aiMaxRuntimeCallsPerSession ?? 3;
    const enabled =
      Boolean(definition.settings?.aiRuntimeSuggestions) &&
      variant !== "demo" &&
      currentStep &&
      currentStep.fields.some((f) => f.aiAssist?.suggestFollowUps) &&
      runtimeAiCallsUsed < maxCalls;

    if (enabled && currentStep) {
      const body =
        variant === "live"
          ? { slug: props.slug, stepId: currentStepId, answers: answersRef.current }
          : { formId: props.formId, stepId: currentStepId, answers: answersRef.current };

      setLoading(true);
      try {
        const res = await fetch("/api/ai/runtime-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { suggestions?: FormField[] };
        if (res.ok && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setRuntimeAiCallsUsed((c) => c + 1);
          setInterstitialFields(data.suggestions);
          setLoading(false);
          return;
        }
      } catch {
        /* fall through */
      } finally {
        setLoading(false);
      }
    }

    const nextId = getNextStepId(definition, currentStepId, answersRef.current);
    if (nextId !== null) {
      setHistory((h) => [...h, nextId]);
      setServerFieldErrors(null);
      setErrorMessage(null);
      return;
    }
    await doFinalSubmit();
  }

  async function onPrimary() {
    if (showingAiInterstitial && interstitialFields) {
      const synthetic: FormStep = {
        id: "_ai_interstitial",
        title: "AI",
        fields: interstitialFields,
      };
      const errs = fieldErrorsForStep(synthetic, answersRef.current);
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
      setInterstitialFields(null);
      const nextId = getNextStepId(definition, currentStepId, answersRef.current);
      if (nextId !== null) {
        setHistory((h) => [...h, nextId]);
        setServerFieldErrors(null);
        setErrorMessage(null);
      } else {
        await doFinalSubmit();
      }
      return;
    }

    if (!currentStep) return;

    const errs = fieldErrorsForStep(currentStep, answersRef.current);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    await maybeAiThenAdvance();
  }

  if (!first || !currentStep) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">This form has no steps to display.</p>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-lg font-medium text-emerald-900 dark:text-emerald-100">
          Thanks — your response was received.
        </p>
        <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/80">
          You can close this page or go back to the home screen.
        </p>
      </div>
    );
  }

  const mergedErrors = mergeErrors(fieldErrors, serverFieldErrors);
  const fieldsToRender = showingAiInterstitial && interstitialFields
    ? interstitialFields
    : currentStep.fields;

  const primaryLabel = loading
    ? "Sending…"
    : showingAiInterstitial
      ? "Continue"
      : getNextStepId(definition, currentStepId, answersRef.current) === null
        ? "Submit"
        : "Continue";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{definition.title}</h2>
          {definition.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{definition.description}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Step {history.length}
          {showingAiInterstitial ? " · AI" : ""}
        </span>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/60">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{displayTitle}</h3>
        {displayDescription && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{displayDescription}</p>
        )}

        {showingAiInterstitial && (
          <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:bg-violet-950/50 dark:text-violet-100">
            AI-generated optional fields. Submit validation still follows your published{" "}
            <code className="font-mono">FormDefinition</code>; extra keys are accepted if types
            match.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-5">
          {fieldsToRender.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.id]}
              error={mergedErrors[field.id]}
              softHint={hints[field.id]}
              onBlurField={
                field.aiAssist?.validateWithAi ? () => fetchHint(field.id) : undefined
              }
              onChange={(v) => {
                setFieldValue(field.id, v);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next[field.id];
                  return next;
                });
                setHints((prev) => {
                  const next = { ...prev };
                  delete next[field.id];
                  return next;
                });
                setServerFieldErrors(null);
              }}
            />
          ))}
        </div>

        {variant === "live" && props.submitAuthRequired && !showingAiInterstitial && (
          <label className="mt-6 flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Submit secret</span>
            <input
              type="password"
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Required for this form"
              value={submitSecret}
              onChange={(e) => setSubmitSecret(e.target.value)}
            />
          </label>
        )}

        {errorMessage && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={(history.length <= 1 && !showingAiInterstitial) || loading}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Back
          </button>
          <div className="flex flex-wrap gap-2">
            {showingAiInterstitial && (
              <button
                type="button"
                onClick={skipInterstitialAndAdvance}
                disabled={loading}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Skip suggestions
              </button>
            )}
            <button
              type="button"
              onClick={() => void onPrimary()}
              disabled={loading}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
