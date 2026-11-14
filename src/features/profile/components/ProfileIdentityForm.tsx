"use client";

import { useId, useState, useTransition } from "react";
import { Input, Textarea } from "@/components/ui/forms";
import { cn } from "@quickadui/utils";
import { updateProfile } from "../actions";
import { type Profile, type ProfileField, profilePatchSchema } from "../schemas";

type FieldDef = {
  name: ProfileField;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  multiline?: boolean;
  wide?: boolean;
};

const FIELDS: FieldDef[] = [
  { name: "full_name", label: "Nom complet", placeholder: "ex. Prénom Nom" },
  { name: "headline", label: "Titre", placeholder: "ex. Développeur full-stack" },
  { name: "summary", label: "Résumé", placeholder: "En quelques lignes : ce que tu fais, ce que tu cherches…", multiline: true, wide: true },
  { name: "contact_email", label: "E-mail de contact", type: "email", placeholder: "ex. moi@exemple.com" },
  { name: "phone", label: "Téléphone", type: "tel", placeholder: "ex. +216 20 000 000" },
  { name: "location", label: "Ville", placeholder: "ex. Tunis, Tunisie" },
  { name: "website", label: "Site web", type: "url", placeholder: "ex. monsite.dev" },
  { name: "linkedin", label: "LinkedIn", type: "url", placeholder: "ex. linkedin.com/in/ton-nom" },
  { name: "github", label: "GitHub", type: "url", placeholder: "ex. github.com/ton-compte" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

/** Identité : chaque champ est validé puis enregistré à la sortie du champ. */
export function ProfileIdentityForm({ profile }: { profile: Profile }) {
  const initial = Object.fromEntries(FIELDS.map(({ name }) => [name, profile[name] ?? ""])) as Record<ProfileField, string>;
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [state, setState] = useState<SaveState>("idle");
  const [, startTransition] = useTransition();
  const formId = useId();

  const save = (name: ProfileField) => {
    const value = values[name];
    if (value === saved[name]) return;
    const parsed = profilePatchSchema.safeParse({ [name]: value });
    if (!parsed.success) {
      setErrors((current) => ({ ...current, [name]: parsed.error.issues[0]?.message ?? "Valeur invalide" }));
      return;
    }
    setErrors((current) => ({ ...current, [name]: undefined }));
    // Valeur normalisée (lien complété, espaces retirés) affichée telle qu'enregistrée.
    const normalized = (parsed.data[name] as string | null | undefined) ?? "";
    setState("saving");
    startTransition(async () => {
      const result = await updateProfile({ [name]: value });
      if (!result.ok) {
        setState("error");
        setErrors((current) => ({ ...current, [name]: result.error }));
        return;
      }
      setValues((current) => ({ ...current, [name]: normalized }));
      setSaved((current) => ({ ...current, [name]: normalized }));
      setState("saved");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p role="status" aria-live="polite" className={cn("h-4 text-xs", state === "error" ? "text-danger-11" : "text-neutral-11")}>
        {state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : state === "error" ? "Non enregistré" : ""}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const id = `${formId}-${field.name}`;
          const error = errors[field.name];
          const common = {
            id,
            value: values[field.name],
            placeholder: field.placeholder,
            onBlur: () => save(field.name),
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? `${id}-error` : undefined,
          };
          return (
            <div key={field.name} className={cn("flex flex-col gap-1.5", field.wide && "sm:col-span-2")}>
              <label htmlFor={id} className="text-sm font-medium text-neutral-12">
                {field.label}
              </label>
              {field.multiline ? (
                <Textarea
                  {...common}
                  rows={4}
                  maxLength={3000}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              ) : (
                <Input
                  {...common}
                  type={field.type ?? "text"}
                  maxLength={field.type === "url" ? 2048 : 254}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      save(field.name);
                    }
                  }}
                />
              )}
              {error && (
                <p id={`${id}-error`} role="alert" className="text-xs text-danger-11">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
