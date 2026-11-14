"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useId, useState, useTransition } from "react";
import { Badge, Button, IconButton } from "@/components/ui/core";
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { cn } from "@quickadui/utils";
import { deleteEntry, reorderEntries, saveEntry, setShowOnCv } from "../entries-actions";
import { type Entry, type EntryKind, POSITIONED, SKILL_LEVEL_LABELS, SKILL_LEVELS } from "../entries";
import { ENTRY_CONFIG, type FieldConfig, type FormValues, formToValues, type KindConfig } from "./entry-config";

type AnyEntry = Entry<EntryKind>;

export type EntryListEditorProps<K extends EntryKind> = {
  kind: K;
  entries: Entry<K>[];
};

/**
 * Liste du profil (compétences, expériences…) : ajout et modification dans
 * un formulaire en ligne, suppression confirmée, ordre (listes manuelles),
 * case « afficher sur le CV ».
 */
export function EntryListEditor<K extends EntryKind>({ kind, entries }: EntryListEditorProps<K>) {
  const config = ENTRY_CONFIG[kind] as unknown as KindConfig<EntryKind>;
  const list = entries as AnyEntry[];
  // null : aucun formulaire ; "new" : ajout ; sinon id en modification.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingId = useId();
  const positioned = POSITIONED.has(kind);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, message: string, after?: () => void) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast({ title: message });
        after?.();
      } else {
        toast({ title: result.error ?? "Erreur", variant: "danger" });
      }
    });
  };

  const move = (entry: AnyEntry, direction: -1 | 1) => {
    // Déplacement dans son groupe (catégorie) si la liste est regroupée.
    const sameGroup = config.group ? list.filter((other) => config.group!(other) === config.group!(entry)) : list;
    const index = sameGroup.findIndex((other) => other.id === entry.id);
    const neighbor = sameGroup[index + direction];
    if (!neighbor) return;
    const ids = list.map((other) => other.id);
    const a = ids.indexOf(entry.id);
    const b = ids.indexOf(neighbor.id);
    [ids[a], ids[b]] = [ids[b]!, ids[a]!];
    run(() => reorderEntries(kind, ids), "Ordre enregistré");
  };

  const groups = config.group
    ? [...new Set(list.map((entry) => config.group!(entry)))].map((name) => ({
        name,
        items: list.filter((entry) => config.group!(entry) === name),
      }))
    : [{ name: "", items: list }];

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-lg border border-neutral-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={headingId} className="text-base font-semibold text-neutral-12">
            {config.title}
          </h2>
          <p className="text-sm text-neutral-11">{config.description}</p>
        </div>
        {editing !== "new" && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing("new")} disabled={isPending}>
            <Plus className="size-4" />
            {config.addLabel}
          </Button>
        )}
      </div>

      {editing === "new" && (
        <EntryForm
          config={config}
          initial={config.defaults}
          submitLabel="Ajouter"
          pending={isPending}
          onCancel={() => setEditing(null)}
          onSubmit={(values) => run(() => saveEntry(kind, null, values), "Ajouté", () => setEditing(null))}
        />
      )}

      {list.length === 0 ? (
        editing !== "new" && <p className="text-sm text-neutral-11">{config.empty}</p>
      ) : (
        groups.map((group) => (
          <div key={group.name || "all"} className="flex flex-col gap-2">
            {group.name && <h3 className="text-xs font-medium tracking-wide text-neutral-11 uppercase">{group.name}</h3>}
            <ul className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6" aria-label={group.name || config.title}>
              {group.items.map((entry, index) => {
                const summary = config.summary(entry);
                const cvId = `cv-${entry.id}`;
                if (editing === entry.id) {
                  return (
                    <li key={entry.id} className="p-3">
                      <EntryForm
                        config={config}
                        initial={config.toForm(entry)}
                        submitLabel="Enregistrer"
                        pending={isPending}
                        onCancel={() => setEditing(null)}
                        onSubmit={(values) =>
                          // Conserver « afficher sur le CV » (sinon remis à vrai par défaut).
                          run(() => saveEntry(kind, entry.id, { ...values, show_on_cv: entry.show_on_cv }), "Enregistré", () => setEditing(null))
                        }
                      />
                    </li>
                  );
                }
                return (
                  <li key={entry.id} className={cn("flex flex-wrap items-center gap-2 px-3 py-2", !entry.show_on_cv && "opacity-70")}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-12">{summary.title}</p>
                      {summary.subtitle && <p className="truncate text-xs text-neutral-11">{summary.subtitle}</p>}
                    </div>
                    {summary.meta && (
                      <Badge variant="soft" className="shrink-0">
                        {summary.meta}
                      </Badge>
                    )}
                    <label htmlFor={cvId} className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-11">
                      <Checkbox
                        id={cvId}
                        checked={entry.show_on_cv}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          run(
                            () => setShowOnCv(kind, entry.id, checked === true),
                            checked === true ? "Affiché sur le CV" : "Masqué du CV",
                          )
                        }
                      />
                      Sur le CV
                    </label>
                    {positioned && (
                      <>
                        <IconButton variant="ghost" size="sm" aria-label={`Monter ${summary.title}`} onClick={() => move(entry, -1)} disabled={isPending || index === 0}>
                          <ArrowUp className="size-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label={`Descendre ${summary.title}`}
                          onClick={() => move(entry, 1)}
                          disabled={isPending || index === group.items.length - 1}
                        >
                          <ArrowDown className="size-4" />
                        </IconButton>
                      </>
                    )}
                    <IconButton variant="ghost" size="sm" aria-label={`Modifier ${summary.title}`} onClick={() => setEditing(entry.id)} disabled={isPending}>
                      <Pencil className="size-4" />
                    </IconButton>
                    {confirmId === entry.id ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        autoFocus
                        onBlur={() => setConfirmId(null)}
                        onClick={() => {
                          setConfirmId(null);
                          run(() => deleteEntry(kind, entry.id), `« ${summary.title} » supprimé`);
                        }}
                      >
                        Confirmer
                      </Button>
                    ) : (
                      <IconButton variant="ghost" size="sm" aria-label={`Supprimer ${summary.title}`} onClick={() => setConfirmId(entry.id)} disabled={isPending}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

type EntryFormProps = {
  config: KindConfig<EntryKind>;
  initial: FormValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: Record<string, string | boolean>) => void;
  onCancel: () => void;
};

function EntryForm({ config, initial, submitLabel, pending, onSubmit, onCancel }: EntryFormProps) {
  const [values, setValues] = useState<FormValues>(initial);
  const formId = useId();
  const set = (name: string, value: string | boolean) => setValues((current) => ({ ...current, [name]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(formToValues(values));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-neutral-6 bg-neutral-1 p-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {config.fields.map((field) => (
          <Field key={field.name} field={field} id={`${formId}-${field.name}`} values={values} set={set} />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  field,
  id,
  values,
  set,
}: {
  field: FieldConfig;
  id: string;
  values: FormValues;
  set: (name: string, value: string | boolean) => void;
}) {
  const value = values[field.name];
  const className = cn("flex flex-col gap-1.5", field.wide && "sm:col-span-2");

  if (field.type === "ongoing") {
    return (
      <label htmlFor={id} className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-12">
        <Checkbox id={id} checked={value === true} onCheckedChange={(checked) => set(field.name, checked === true)} />
        {field.label}
      </label>
    );
  }

  if (field.type === "level") {
    const labelId = `${id}-label`;
    return (
      <div className={className}>
        <span id={labelId} className="text-sm font-medium text-neutral-12">
          {field.label}
        </span>
        <Select value={String(value)} onValueChange={(next) => set(field.name, next)}>
          <SelectTrigger aria-labelledby={labelId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {SKILL_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // « Fin » désactivée pour un poste actuel.
  const disabled = field.name === "end_date" && values.ongoing === true;
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-neutral-12">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <Textarea id={id} rows={3} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => set(field.name, event.target.value)} />
      ) : (
        <Input
          id={id}
          type={field.type === "month" ? "month" : field.type === "url" ? "url" : "text"}
          value={disabled ? "" : String(value ?? "")}
          placeholder={field.placeholder}
          disabled={disabled}
          onChange={(event) => set(field.name, event.target.value)}
        />
      )}
    </div>
  );
}
