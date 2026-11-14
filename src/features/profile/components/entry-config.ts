import {
  type Entry,
  type EntryKind,
  formatMonth,
  formatPeriod,
  SKILL_LEVEL_LABELS,
  type SkillLevel,
  toMonthInput,
} from "../entries";

export type FieldType = "text" | "textarea" | "month" | "url" | "level" | "ongoing";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  wide?: boolean;
};

export type FormValues = Record<string, string | boolean>;

export type KindConfig<K extends EntryKind> = {
  title: string;
  description: string;
  addLabel: string;
  empty: string;
  fields: FieldConfig[];
  defaults: FormValues;
  toForm: (entry: Entry<K>) => FormValues;
  summary: (entry: Entry<K>) => { title: string; subtitle?: string; meta?: string };
  /** Regroupement à l'affichage (compétences par catégorie). */
  group?: (entry: Entry<K>) => string;
};

const joined = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

export const ENTRY_CONFIG: { [K in EntryKind]: KindConfig<K> } = {
  skills: {
    title: "Compétences",
    description: "Avec un niveau de 1 à 4 ; regroupées par catégorie sur le CV.",
    addLabel: "Ajouter une compétence",
    empty: "Aucune compétence pour l'instant.",
    fields: [
      { name: "name", label: "Compétence", type: "text", placeholder: "ex. TypeScript" },
      { name: "category", label: "Catégorie", type: "text", placeholder: "ex. Frontend" },
      { name: "level", label: "Niveau", type: "level" },
    ],
    defaults: { name: "", category: "", level: "intermediaire" },
    toForm: (entry) => ({ name: entry.name, category: entry.category, level: entry.level }),
    summary: (entry) => ({ title: entry.name, meta: SKILL_LEVEL_LABELS[entry.level as SkillLevel] }),
    group: (entry) => entry.category || "Autres",
  },
  experiences: {
    title: "Expériences",
    description: "Classées de la plus récente à la plus ancienne.",
    addLabel: "Ajouter une expérience",
    empty: "Aucune expérience pour l'instant.",
    fields: [
      { name: "title", label: "Poste", type: "text", placeholder: "ex. Développeur full-stack" },
      { name: "organization", label: "Entreprise", type: "text", placeholder: "ex. Acme" },
      { name: "location", label: "Lieu", type: "text", placeholder: "ex. Tunis" },
      { name: "start_date", label: "Début", type: "month" },
      { name: "end_date", label: "Fin", type: "month" },
      { name: "ongoing", label: "Poste actuel", type: "ongoing" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Missions, réalisations, technologies…", wide: true },
    ],
    defaults: { title: "", organization: "", location: "", start_date: "", end_date: "", ongoing: false, description: "" },
    toForm: (entry) => ({
      title: entry.title,
      organization: entry.organization,
      location: entry.location,
      start_date: toMonthInput(entry.start_date),
      end_date: toMonthInput(entry.end_date),
      ongoing: entry.end_date === null,
      description: entry.description,
    }),
    summary: (entry) => ({
      title: entry.title,
      subtitle: joined(entry.organization, entry.location),
      meta: formatPeriod(entry.start_date, entry.end_date),
    }),
  },
  education: {
    title: "Formations",
    description: "Diplômes et écoles, du plus récent au plus ancien.",
    addLabel: "Ajouter une formation",
    empty: "Aucune formation pour l'instant.",
    fields: [
      { name: "degree", label: "Diplôme", type: "text", placeholder: "ex. Master informatique" },
      { name: "school", label: "École", type: "text", placeholder: "ex. Université de Tunis" },
      { name: "location", label: "Lieu", type: "text" },
      { name: "start_date", label: "Début", type: "month" },
      { name: "end_date", label: "Fin", type: "month" },
      { name: "description", label: "Description", type: "textarea", wide: true },
    ],
    defaults: { degree: "", school: "", location: "", start_date: "", end_date: "", description: "" },
    toForm: (entry) => ({
      degree: entry.degree,
      school: entry.school,
      location: entry.location,
      start_date: toMonthInput(entry.start_date),
      end_date: toMonthInput(entry.end_date),
      description: entry.description,
    }),
    summary: (entry) => ({
      title: entry.degree,
      subtitle: joined(entry.school, entry.location),
      meta: formatPeriod(entry.start_date, entry.end_date, "en cours"),
    }),
  },
  languages: {
    title: "Langues",
    description: "Avec ton niveau (Natif, C1, courant…).",
    addLabel: "Ajouter une langue",
    empty: "Aucune langue pour l'instant.",
    fields: [
      { name: "name", label: "Langue", type: "text", placeholder: "ex. Anglais" },
      { name: "level", label: "Niveau", type: "text", placeholder: "ex. C1, courant" },
    ],
    defaults: { name: "", level: "" },
    toForm: (entry) => ({ name: entry.name, level: entry.level }),
    summary: (entry) => ({ title: entry.name, meta: entry.level }),
  },
  projects: {
    title: "Projets",
    description: "Projets personnels ou professionnels à mettre en avant.",
    addLabel: "Ajouter un projet",
    empty: "Aucun projet pour l'instant.",
    fields: [
      { name: "name", label: "Projet", type: "text", placeholder: "ex. MedLink TN" },
      { name: "url", label: "Lien", type: "url", placeholder: "ex. github.com/moi/projet" },
      { name: "description", label: "Description", type: "textarea", wide: true },
    ],
    defaults: { name: "", url: "", description: "" },
    toForm: (entry) => ({ name: entry.name, url: entry.url ?? "", description: entry.description }),
    summary: (entry) => ({ title: entry.name, subtitle: entry.url ?? undefined }),
  },
  certifications: {
    title: "Certifications",
    description: "Certifications et attestations.",
    addLabel: "Ajouter une certification",
    empty: "Aucune certification pour l'instant.",
    fields: [
      { name: "name", label: "Certification", type: "text", placeholder: "ex. AWS Cloud Practitioner" },
      { name: "issuer", label: "Organisme", type: "text", placeholder: "ex. Amazon Web Services" },
      { name: "issued_on", label: "Date", type: "month" },
      { name: "url", label: "Lien", type: "url" },
    ],
    defaults: { name: "", issuer: "", issued_on: "", url: "" },
    toForm: (entry) => ({
      name: entry.name,
      issuer: entry.issuer,
      issued_on: toMonthInput(entry.issued_on),
      url: entry.url ?? "",
    }),
    summary: (entry) => ({ title: entry.name, subtitle: entry.issuer || undefined, meta: entry.issued_on ? formatMonth(entry.issued_on) : undefined }),
  },
};

/** Valeurs du formulaire → valeurs envoyées (« poste actuel » = pas de fin). */
export function formToValues(values: FormValues): Record<string, string | boolean> {
  const { ongoing, ...rest } = values;
  if (ongoing === true) rest.end_date = "";
  return rest;
}
