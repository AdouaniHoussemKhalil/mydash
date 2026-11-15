/** Outils de la boîte à outils (ordre d'affichage). */
export const TOOLS = [
  { slug: "json", name: "JSON", description: "Formater, minifier et valider du JSON.", keywords: ["json", "formater", "minifier", "valider"] },
  { slug: "base64", name: "Base64", description: "Encoder et décoder du Base64 (UTF-8, variante URL).", keywords: ["base64", "encoder", "décoder"] },
  { slug: "url", name: "Encodage d'URL", description: "Encoder et décoder les caractères spéciaux d'une URL.", keywords: ["url", "encoder", "percent", "uri"] },
] as const;

export type ToolSlug = (typeof TOOLS)[number]["slug"];

export function getTool(slug: string) {
  return TOOLS.find((tool) => tool.slug === slug);
}
