/** Aperçu d'une page, tel qu'enregistré dans link_meta. */
export type LinkPreview = {
  pageTitle: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
};

const MAX = { title: 500, description: 1000, siteName: 200, url: 2048 } as const;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—",
  ndash: "–", laquo: "«", raquo: "»", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", ccedil: "ç", ocirc: "ô", ugrave: "ù",
  icirc: "î", copy: "©", reg: "®", middot: "·", bull: "•",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Texte affichable : entités décodées, espaces réduits, longueur bornée. */
function cleanText(value: string | undefined, max: number): string | null {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** URL absolue http(s) résolue depuis la page, ou null. */
function cleanUrl(value: string | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const href = url.toString();
    return href.length <= MAX.url && !/\s/.test(href) ? href : null;
  } catch {
    return null;
  }
}

/** Attributs d'une balise ouvrante (noms en minuscules). */
export function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const inner = tag.replace(/^<\s*[a-z0-9-]+/i, "").replace(/\/?>$/, "");
  const pattern = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of inner.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (name && !(name in attributes)) attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

/** La partie <head> suffit ; à défaut, le début du document. */
function headOf(html: string) {
  const end = html.search(/<\/head\s*>/i);
  return end === -1 ? html.slice(0, 300_000) : html.slice(0, end);
}

/**
 * Lit titre, description, nom du site, image et favicon d'une page HTML
 * (Open Graph, puis Twitter, puis balises classiques).
 */
export function parseHtmlPreview(html: string, pageUrl: string): LinkPreview {
  const head = headOf(html);

  const meta = new Map<string, string>();
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    const key = (attributes.property ?? attributes.name ?? attributes.itemprop)?.toLowerCase();
    const content = attributes.content;
    if (key && content !== undefined && !meta.has(key)) meta.set(key, content);
  }
  const first = (...keys: string[]) => keys.map((key) => meta.get(key)).find((value) => value?.trim());

  const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(head)?.[1];

  let icon: string | undefined;
  let touchIcon: string | undefined;
  for (const [tag] of head.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    const rel = attributes.rel?.toLowerCase().split(/\s+/) ?? [];
    if (!attributes.href) continue;
    if (!icon && rel.includes("icon")) icon = attributes.href;
    if (!touchIcon && rel.includes("apple-touch-icon")) touchIcon = attributes.href;
  }

  return {
    pageTitle: cleanText(first("og:title", "twitter:title") ?? titleTag, MAX.title),
    description: cleanText(first("og:description", "twitter:description", "description"), MAX.description),
    siteName: cleanText(first("og:site_name", "application-name"), MAX.siteName),
    imageUrl: cleanUrl(
      first("og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"),
      pageUrl,
    ),
    faviconUrl: cleanUrl(icon ?? touchIcon ?? "/favicon.ico", pageUrl),
  };
}

/** Jeu de caractères annoncé (en-tête HTTP, sinon balise meta), par défaut utf-8. */
export function detectCharset(contentType: string | null, firstBytes: string): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType ?? "")?.[1];
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(firstBytes)?.[1];
  return (fromHeader ?? fromMeta ?? "utf-8").toLowerCase();
}
