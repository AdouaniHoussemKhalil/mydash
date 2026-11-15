export type RichBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

const BULLET = /^\s*[-•▪*–]\s+/;

/**
 * Découpe un texte saisi en blocs : une ligne commençant par -, •, ▪, * ou –
 * est une puce (les puces voisines forment une liste) ; une ligne courte
 * finissant par « : » est un sous-titre ; le reste, des paragraphes.
 */
export function parseRichText(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, "");
      const last = blocks.at(-1);
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
    } else if (line.endsWith(":") && line.length <= 80) {
      blocks.push({ type: "heading", text: line.replace(/\s*:$/, "") });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }
  return blocks;
}
