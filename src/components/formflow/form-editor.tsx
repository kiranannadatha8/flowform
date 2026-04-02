"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BuilderSignOut } from "@/components/formflow/builder-sign-out";
import { SortableFormFields, reorderFields } from "@/components/formflow/sortable-form-fields";
import type { FieldKind, FormDefinition, FormField, FormStep } from "@/lib/formflow/schema";
import { branchRuleSchema, formDefinitionSchema } from "@/lib/formflow/schema";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}`;
}

function defaultField(kind: FieldKind): FormField {
  const id = newId("field");
  const base: FormField = {
    id,
    kind,
    label: `New ${kind} field`,
    required: false,
  };
  if (kind === "select" || kind === "multiselect") {
    return {
      ...base,
      options: [
        { value: "a", label: "Option A" },
        { value: "b", label: "Option B" },
      ],
    };
  }
  return base;
}

type Props = { formId: string; builderAuthEnabled?: boolean };

export function FormEditor({ formId, builderAuthEnabled = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [branchJson, setBranchJson] = useState("[]");
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [publishSecret, setPublishSecret] = useState<string | null>(null);
  const [generateSecretOnPublish, setGenerateSecretOnPublish] = useState(false);
  const [aiContextJson, setAiContextJson] = useState("{}");
  const [aiSuggestions, setAiSuggestions] = useState<FormField[] | null>(null);
  const [aiSelected, setAiSelected] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (!res.ok) {
        throw new Error("Failed to load form");
      }
      const data = await res.json();
      const def = formDefinitionSchema.parse(data.form.definition);
      setSlug(data.form.slug);
      setTitle(data.form.title);
      setStatus(data.form.status);
      setDefinition(def);
      setBranchJson(JSON.stringify(def.branchRules ?? [], null, 2));
      setActiveStepId(def.steps[0]?.id ?? null);
      setSubmissionCount(
        typeof data.form.submissionCount === "number" ? data.form.submissionCount : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  const draftLocked = status === "PUBLISHED";

  async function saveDraft() {
    if (!definition || draftLocked) return;
    let parsedRules: FormDefinition["branchRules"];
    try {
      const raw = JSON.parse(branchJson) as unknown;
      if (!Array.isArray(raw)) {
        throw new Error("Branch rules must be a JSON array");
      }
      parsedRules = raw.map((r) => branchRuleSchema.parse(r));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid branch rules JSON");
      return;
    }

    const nextDef: FormDefinition = {
      ...definition,
      branchRules: parsedRules.length > 0 ? parsedRules : undefined,
      settings: definition.settings,
    };

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          definition: nextDef,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      const data = await res.json();
      const def = formDefinitionSchema.parse(data.form.definition);
      setDefinition(def);
      setSlug(data.form.slug);
      setTitle(data.form.title);
      setStatus(data.form.status);
      setBranchJson(JSON.stringify(def.branchRules ?? [], null, 2));
      setSubmissionCount(
        typeof data.form.submissionCount === "number" ? data.form.submissionCount : null,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setSaving(true);
    setError(null);
    setPublishSecret(null);
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateSubmitSecret: generateSecretOnPublish }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Publish failed");
      }
      const data = await res.json();
      setStatus(data.form.status);
      setDefinition(formDefinitionSchema.parse(data.form.definition));
      setSubmissionCount(
        typeof data.form.submissionCount === "number" ? data.form.submissionCount : null,
      );
      if (typeof data.submitSecret === "string") {
        setPublishSecret(data.submitSecret);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  function updateStep(stepId: string, patch: Partial<FormStep>) {
    if (!definition || draftLocked) return;
    setDefinition({
      ...definition,
      steps: definition.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  }

  function addStep() {
    if (!definition || draftLocked) return;
    const id = newId("step");
    const step: FormStep = {
      id,
      title: `Step ${definition.steps.length + 1}`,
      fields: [],
    };
    setDefinition({ ...definition, steps: [...definition.steps, step] });
    setActiveStepId(id);
  }

  function addField(stepId: string, kind: FieldKind) {
    if (!definition || draftLocked) return;
    const field = defaultField(kind);
    setDefinition({
      ...definition,
      steps: definition.steps.map((s) =>
        s.id === stepId ? { ...s, fields: [...s.fields, field] } : s,
      ),
    });
  }

  function changeField(stepId: string, fieldId: string, patch: Partial<FormField>) {
    if (!definition || draftLocked) return;
    setDefinition({
      ...definition,
      steps: definition.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              fields: s.fields.map((f) => {
                if (f.id !== fieldId) return f;
                const merged: FormField = { ...f, ...patch };
                if (
                  (merged.kind === "select" || merged.kind === "multiselect") &&
                  (!merged.options || merged.options.length === 0)
                ) {
                  merged.options = [
                    { value: "a", label: "Option A" },
                    { value: "b", label: "Option B" },
                  ];
                }
                return merged;
              }),
            }
          : s,
      ),
    });
  }

  function removeField(stepId: string, fieldId: string) {
    if (!definition || draftLocked) return;
    setDefinition({
      ...definition,
      steps: definition.steps.map((s) =>
        s.id === stepId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s,
      ),
    });
  }

  function reorderFieldList(stepId: string, oldIndex: number, newIndex: number) {
    if (!definition || draftLocked) return;
    setDefinition({
      ...definition,
      steps: definition.steps.map((s) =>
        s.id === stepId ? { ...s, fields: reorderFields(s.fields, oldIndex, newIndex) } : s,
      ),
    });
  }

  if (loading || !definition) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading form…
      </div>
    );
  }

  const activeStep = definition.steps.find((s) => s.id === activeStepId) ?? definition.steps[0];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/builder"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← All forms
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Edit form
          </h1>
          {builderAuthEnabled ? <BuilderSignOut /> : null}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "PUBLISHED"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Public embed:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-900">
            GET /api/public/forms/{slug}
          </code>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/builder/${formId}/responses`}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Responses
            {submissionCount !== null ? (
              <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {submissionCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={`/builder/${formId}/preview`}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Preview runtime
          </Link>
          {status === "PUBLISHED" && (
            <Link
              href={`/f/${slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Open live page
            </Link>
          )}
          <a
            href={`/api/forms/${formId}/export`}
            download
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Export JSON
          </a>
          <Link
            href="/demo"
            className="rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Phase 0 hand-built demo
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {publishSecret && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-medium">Submit secret (copy now; it won’t be shown again)</p>
          <code className="mt-2 block break-all rounded bg-white/80 px-2 py-1 font-mono text-xs dark:bg-zinc-900">
            {publishSecret}
          </code>
          <p className="mt-2 text-xs opacity-90">
            Send as header <code className="font-mono">X-FormFlow-Submit-Secret</code> or{" "}
            <code className="font-mono">submitSecret</code> in the JSON body when submitting.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/60">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Title</span>
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={title}
              disabled={draftLocked}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Slug (URL)</span>
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={slug}
              disabled={draftLocked}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phase 2 · AI</p>
            <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                className="mt-1"
                disabled={draftLocked}
                checked={Boolean(definition.settings?.aiRuntimeSuggestions)}
                onChange={(e) =>
                  setDefinition({
                    ...definition,
                    settings: {
                      ...definition.settings,
                      aiRuntimeSuggestions: e.target.checked,
                    },
                  })
                }
              />
              <span>
                Allow optional <strong>runtime</strong> AI follow-ups after steps where a field has
                “AI follow-ups (runtime)” enabled. Requires{" "}
                <code className="font-mono text-xs">OPENAI_API_KEY</code> for live models.
              </span>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Max AI suggestion rounds per respondent
              </span>
              <input
                type="number"
                min={0}
                max={20}
                className="max-w-xs rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                disabled={draftLocked}
                value={definition.settings?.aiMaxRuntimeCallsPerSession ?? 3}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setDefinition({
                    ...definition,
                    settings: {
                      ...definition.settings,
                      aiMaxRuntimeCallsPerSession: Number.isNaN(n)
                        ? undefined
                        : Math.max(0, Math.min(20, n)),
                    },
                  });
                }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Steps</h2>
          <button
            type="button"
            disabled={draftLocked}
            onClick={addStep}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Add step
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {definition.steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStepId(s.id)}
              className={`rounded-full px-3 py-1 text-sm ${
                activeStep?.id === s.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        {activeStep && (
          <div className="mt-6 space-y-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Step title</span>
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={activeStep.title}
                disabled={draftLocked}
                onChange={(e) => updateStep(activeStep.id, { title: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "text",
                  "textarea",
                  "email",
                  "number",
                  "select",
                  "multiselect",
                  "boolean",
                  "date",
                ] as FieldKind[]
              ).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  disabled={draftLocked}
                  onClick={() => addField(activeStep.id, kind)}
                  className="rounded-lg border border-dashed border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  + {kind}
                </button>
              ))}
            </div>
            <SortableFormFields
              fields={activeStep.fields}
              onReorder={(o, n) => reorderFieldList(activeStep.id, o, n)}
              onChangeField={(fieldId, patch) => changeField(activeStep.id, fieldId, patch)}
              onRemove={(fieldId) => removeField(activeStep.id, fieldId)}
              showAiFlags
              disabled={draftLocked}
            />

            {!draftLocked && (
              <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                <h4 className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  AI: suggest fields for this step
                </h4>
                <p className="mt-1 text-xs text-violet-800/90 dark:text-violet-200/90">
                  Calls the builder suggestion API with optional sample answers. Accept suggestions
                  into this step — you can edit labels and kinds after.
                </p>
                <textarea
                  className="mt-3 w-full rounded-lg border border-violet-200 bg-white p-2 font-mono text-xs dark:border-violet-800 dark:bg-zinc-950"
                  rows={3}
                  value={aiContextJson}
                  onChange={(e) => setAiContextJson(e.target.value)}
                  placeholder='Optional JSON answers, e.g. {"field-name": "Acme Inc"}'
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-violet-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
                    disabled={aiLoading}
                    onClick={() => {
                      void (async () => {
                        setAiLoading(true);
                        setError(null);
                        try {
                          let answers: Record<string, unknown> = {};
                          try {
                            answers = JSON.parse(aiContextJson || "{}") as Record<string, unknown>;
                          } catch {
                            setError("AI context must be valid JSON");
                            return;
                          }
                          const res = await fetch("/api/ai/suggest-followup", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              formId,
                              stepId: activeStep.id,
                              answers,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            throw new Error(data.error ?? "Suggestion failed");
                          }
                          const list = data.suggestions as FormField[];
                          setAiSuggestions(Array.isArray(list) ? list : []);
                          const sel: Record<string, boolean> = {};
                          for (const f of list ?? []) {
                            sel[f.id] = true;
                          }
                          setAiSelected(sel);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "AI suggest failed");
                        } finally {
                          setAiLoading(false);
                        }
                      })();
                    }}
                  >
                    {aiLoading ? "Generating…" : "Generate suggestions"}
                  </button>
                </div>
                {aiSuggestions && aiSuggestions.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-violet-200 pt-3 dark:border-violet-800">
                    {aiSuggestions.map((f) => (
                      <li key={f.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={Boolean(aiSelected[f.id])}
                          onChange={(e) =>
                            setAiSelected((s) => ({ ...s, [f.id]: e.target.checked }))
                          }
                        />
                        <span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {f.label}
                          </span>{" "}
                          <span className="text-xs text-zinc-500">({f.kind})</span>
                        </span>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        className="mt-2 rounded-full border border-violet-300 px-3 py-1 text-sm font-medium text-violet-900 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-100 dark:hover:bg-violet-950"
                        onClick={() => {
                          if (!definition || !activeStep || !aiSuggestions) return;
                          const chosen = aiSuggestions.filter((f) => aiSelected[f.id]);
                          setDefinition({
                            ...definition,
                            steps: definition.steps.map((s) =>
                              s.id === activeStep.id
                                ? { ...s, fields: [...s.fields, ...chosen] }
                                : s,
                            ),
                          });
                          setAiSuggestions(null);
                        }}
                      >
                        Add selected to this step
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/60">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Branching (JSON)
        </h2>
        <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
          After completing <code className="font-mono">fromStepId</code>, if{" "}
          <code className="font-mono">when</code> matches answers, go to{" "}
          <code className="font-mono">gotoStepId</code> instead of the next step in order.
        </p>
        <textarea
          className="min-h-[140px] w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          value={branchJson}
          disabled={draftLocked}
          onChange={(e) => setBranchJson(e.target.value)}
        />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving || draftLocked}
          onClick={() => void saveDraft()}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={generateSecretOnPublish}
            disabled={draftLocked}
            onChange={(e) => setGenerateSecretOnPublish(e.target.checked)}
          />
          Generate submit secret on publish
        </label>
        <button
          type="button"
          disabled={saving || draftLocked}
          onClick={() => void publish()}
          className="rounded-full border border-emerald-600 px-5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
        >
          Publish
        </button>
      </section>
    </div>
  );
}
