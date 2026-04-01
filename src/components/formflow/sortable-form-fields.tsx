"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { FieldKind, FormField } from "@/lib/formflow/schema";

type Props = {
  fields: FormField[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onChangeField: (fieldId: string, patch: Partial<FormField>) => void;
  onRemove: (fieldId: string) => void;
  /** Phase 2: per-field AI flags in the builder. */
  showAiFlags?: boolean;
  disabled?: boolean;
};

const KINDS: FieldKind[] = [
  "text",
  "textarea",
  "email",
  "number",
  "select",
  "multiselect",
  "boolean",
  "date",
];

function mergeAiAssist(
  field: FormField,
  patch: Partial<NonNullable<FormField["aiAssist"]>>,
): Partial<FormField> {
  const next = {
    suggestFollowUps: patch.suggestFollowUps ?? field.aiAssist?.suggestFollowUps ?? false,
    validateWithAi: patch.validateWithAi ?? field.aiAssist?.validateWithAi ?? false,
  };
  if (!next.suggestFollowUps && !next.validateWithAi) {
    return { aiAssist: undefined };
  }
  return { aiAssist: next };
}

function SortableRow({
  field,
  onChangeField,
  onRemove,
  showAiFlags,
  disabled,
}: {
  field: FormField;
  onChangeField: (fieldId: string, patch: Partial<FormField>) => void;
  onRemove: (fieldId: string) => void;
  showAiFlags?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="cursor-grab touch-none rounded px-1 text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
            aria-label={`Drag ${field.label}`}
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          <input
            className="min-w-0 flex-1 rounded border border-zinc-200 bg-transparent px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            value={field.label}
            onChange={(e) => onChangeField(field.id, { label: e.target.value })}
            aria-label="Field label"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <select
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            value={field.kind}
            disabled={disabled}
            onChange={(e) =>
              onChangeField(field.id, { kind: e.target.value as FieldKind })
            }
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              disabled={disabled}
              checked={field.required}
              onChange={(e) => onChangeField(field.id, { required: e.target.checked })}
            />
            Required
          </label>
          <button
            type="button"
            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            onClick={() => onRemove(field.id)}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      </div>
      {showAiFlags && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 pt-2 text-[11px] dark:border-zinc-800">
          <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              disabled={disabled}
              checked={Boolean(field.aiAssist?.suggestFollowUps)}
              onChange={(e) =>
                onChangeField(field.id, mergeAiAssist(field, { suggestFollowUps: e.target.checked }))
              }
            />
            AI follow-ups (runtime)
          </label>
          <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              disabled={disabled}
              checked={Boolean(field.aiAssist?.validateWithAi)}
              onChange={(e) =>
                onChangeField(field.id, mergeAiAssist(field, { validateWithAi: e.target.checked }))
              }
            />
            AI soft hint
          </label>
        </div>
      )}
    </li>
  );
}

export function SortableFormFields({
  fields,
  onReorder,
  onChangeField,
  onRemove,
  showAiFlags,
  disabled,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(oldIndex, newIndex);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {fields.map((field) => (
            <SortableRow
              key={field.id}
              field={field}
              onChangeField={onChangeField}
              onRemove={onRemove}
              showAiFlags={showAiFlags}
              disabled={disabled}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export function reorderFields(fields: FormField[], oldIndex: number, newIndex: number): FormField[] {
  return arrayMove(fields, oldIndex, newIndex);
}
