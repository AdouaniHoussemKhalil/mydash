export const URL_MAX = 2048;

/**
 * Extensions de fichier courantes : « README.md » ou « notes.txt » sans
 * schéma désignent un fichier, même si .md ou .py sont aussi des TLD.
 */
const FILE_EXTENSIONS = new Set([
  "txt", "md", "pdf", "doc", "docx", "xls", "xlsx", "csv", "json", "yaml", "yml", "xml", "html",
  "css", "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java", "sh", "sql", "png", "jpg",
  "jpeg", "gif", "svg", "webp", "zip", "tar", "gz", "log", "env", "lock", "toml",
]);

/**
 * Interprète une saisie comme une URL http(s). Accepte « https://… » et les
 * formes courtes « www.exemple.com » ou « exemple.com/chemin » (sans espace).
 */
export function parseUrl(input: string): URL | null {
  const value = input.trim();
  if (!value || /\s/.test(value) || value.length > URL_MAX) return null;

  let withScheme: string | null = null;
  if (/^https?:\/\//i.test(value)) {
    withScheme = value;
  } else {
    const bare = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.([a-z]{2,})(:\d+)?([/?#]|$)/i.exec(value);
    const tld = bare?.[3]?.toLowerCase();
    const isFileName = !bare?.[1] && tld !== undefined && FILE_EXTENSIONS.has(tld) && !/[/?#]/.test(value);
    if (bare && !isFileName) withScheme = `https://${value}`;
  }
  if (!withScheme) return null;

  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") || url.hostname === "localhost" ? url : null;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function safeDecode(text: string) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** Titre lisible tiré d'une URL : « exemple.com/docs/guide ». */
export function urlTitle(url: URL, max = 500) {
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return truncate(`${url.hostname.replace(/^www\./, "")}${safeDecode(path)}`, max);
}

/** Nom d'hôte affichable (« exemple.com »), ou null si l'URL est invalide. */
export function displayHost(href: string): string | null {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
