export type DiffLine =
  | { type: "equal"; text: string; left: number; right: number }
  | { type: "removed"; text: string; left: number }
  | { type: "added"; text: string; right: number };

export type DiffResult = { lines: DiffLine[]; added: number; removed: number; identical: boolean };

/** Au-delà, le calcul (proportionnel à lignes × lignes) devient trop lourd. */
export const DIFF_MAX_LINES = 3000;

function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.replace(/\r\n/g, "\n").split("\n");
}

/**
 * Différences ligne à ligne (plus longue sous-séquence commune) : ce qui
 * est commun, supprimé (texte de gauche) ou ajouté (texte de droite),
 * avec les numéros de ligne de chaque côté.
 */
export function diffLines(leftText: string, rightText: string, ignoreTrailingSpaces = false): DiffResult {
  const left = splitLines(leftText);
  const right = splitLines(rightText);
  const key = (line: string) => (ignoreTrailingSpaces ? line.trimEnd() : line);

  // Préfixe et suffixe communs retirés : le cas courant (petite modification) reste léger.
  let start = 0;
  while (start < left.length && start < right.length && key(left[start]!) === key(right[start]!)) start++;
  let endLeft = left.length;
  let endRight = right.length;
  while (endLeft > start && endRight > start && key(left[endLeft - 1]!) === key(right[endRight - 1]!)) {
    endLeft--;
    endRight--;
  }

  const a = left.slice(start, endLeft);
  const b = right.slice(start, endRight);
  const n = a.length;
  const m = b.length;
  // table[i][j] = longueur de la plus longue sous-séquence commune de a[i:] et b[j:]
  const table = new Uint32Array((n + 1) * (m + 1));
  const at = (i: number, j: number) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[at(i, j)] = key(a[i]!) === key(b[j]!) ? table[at(i + 1, j + 1)]! + 1 : Math.max(table[at(i + 1, j)]!, table[at(i, j + 1)]!);
    }
  }

  const lines: DiffLine[] = [];
  for (let index = 0; index < start; index++) lines.push({ type: "equal", text: right[index]!, left: index + 1, right: index + 1 });
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && key(a[i]!) === key(b[j]!)) {
      lines.push({ type: "equal", text: b[j]!, left: start + i + 1, right: start + j + 1 });
      i++;
      j++;
    } else if (j < m && (i === n || table[at(i, j + 1)]! >= table[at(i + 1, j)]!)) {
      lines.push({ type: "added", text: b[j]!, right: start + j + 1 });
      j++;
    } else {
      lines.push({ type: "removed", text: a[i]!, left: start + i + 1 });
      i++;
    }
  }
  for (let offset = 0; offset < left.length - endLeft; offset++) {
    lines.push({ type: "equal", text: right[endRight + offset]!, left: endLeft + offset + 1, right: endRight + offset + 1 });
  }

  // Suppressions avant ajouts dans chaque bloc modifié (lecture naturelle).
  const ordered: DiffLine[] = [];
  let block: DiffLine[] = [];
  const flush = () => {
    ordered.push(...block.filter((line) => line.type === "removed"), ...block.filter((line) => line.type === "added"));
    block = [];
  };
  for (const line of lines) {
    if (line.type === "equal") {
      flush();
      ordered.push(line);
    } else {
      block.push(line);
    }
  }
  flush();

  const added = ordered.filter((line) => line.type === "added").length;
  const removed = ordered.filter((line) => line.type === "removed").length;
  return { lines: ordered, added, removed, identical: added === 0 && removed === 0 };
}

export type SideBySideRow = {
  left: { number: number; text: string; changed: boolean } | null;
  right: { number: number; text: string; changed: boolean } | null;
};

/** Vue côte à côte : suppressions et ajouts d'un même bloc mis en regard. */
export function toSideBySide(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];
  const flush = () => {
    for (let index = 0; index < Math.max(removed.length, added.length); index++) {
      const r = removed[index];
      const a = added[index];
      rows.push({
        left: r && r.type === "removed" ? { number: r.left, text: r.text, changed: true } : null,
        right: a && a.type === "added" ? { number: a.right, text: a.text, changed: true } : null,
      });
    }
    removed = [];
    added = [];
  };
  for (const line of lines) {
    if (line.type === "removed") removed.push(line);
    else if (line.type === "added") added.push(line);
    else {
      flush();
      rows.push({ left: { number: line.left, text: line.text, changed: false }, right: { number: line.right, text: line.text, changed: false } });
    }
  }
  flush();
  return rows;
}
