/** Outils de la boîte à outils (ordre d'affichage). */
export const TOOLS = [
  {
    slug: "clipboard",
    name: "Presse-papiers partagé",
    description: "Coller un texte ici pour le copier depuis une autre machine.",
    keywords: ["presse-papiers", "clipboard", "copier", "coller", "partager", "machine"],
  },
  { slug: "json", name: "JSON", description: "Formater, minifier et valider du JSON.", keywords: ["json", "formater", "minifier", "valider"] },
  { slug: "base64", name: "Base64", description: "Encoder et décoder du Base64 (UTF-8, variante URL).", keywords: ["base64", "encoder", "décoder"] },
  { slug: "url", name: "Encodage d'URL", description: "Encoder et décoder les caractères spéciaux d'une URL.", keywords: ["url", "encoder", "percent", "uri"] },
  { slug: "jwt", name: "JWT", description: "Décoder un jeton : en-tête, contenu, dates d'expiration.", keywords: ["jwt", "token", "jeton", "bearer"] },
  { slug: "timestamp", name: "Timestamp", description: "Convertir un timestamp Unix en date, et l'inverse.", keywords: ["timestamp", "unix", "epoch", "date"] },
  { slug: "uuid", name: "UUID", description: "Générer des UUID v4 ou v7.", keywords: ["uuid", "guid", "identifiant"] },
  { slug: "cron", name: "Cron", description: "Traduire une expression cron en français, avec ses prochaines exécutions.", keywords: ["cron", "crontab", "planification", "schedule"] },
  { slug: "diff", name: "Comparer deux textes", description: "Voir les lignes ajoutées et supprimées entre deux versions.", keywords: ["diff", "comparer", "différences"] },
  { slug: "hash", name: "Hash", description: "Empreintes SHA-1, SHA-256 et SHA-512 d'un texte.", keywords: ["hash", "sha", "sha256", "empreinte", "checksum"] },
] as const;

export type ToolSlug = (typeof TOOLS)[number]["slug"];

export function getTool(slug: string) {
  return TOOLS.find((tool) => tool.slug === slug);
}
