export type JsonResult =
  | { ok: true; output: string }
  | { ok: false; error: string; line: number | null; column: number | null };

/** Ligne et colonne (à partir de 1) d'une position dans le texte. */
export function positionToLineColumn(text: string, position: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, position));
  const lines = before.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

class JsonSyntaxError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

/**
 * Parcours JSON minimal qui ne sert qu'à localiser la première erreur :
 * les messages de JSON.parse ne donnent pas toujours la position.
 */
function locateError(text: string): JsonSyntaxError | null {
  let i = 0;
  const fail = (message: string): never => {
    throw new JsonSyntaxError(message, i);
  };
  const skip = () => {
    while (i < text.length && " \t\n\r".includes(text[i]!)) i++;
  };
  const expect = (literal: string) => {
    if (text.startsWith(literal, i)) i += literal.length;
    else fail(`« ${literal} » attendu`);
  };
  const string = () => {
    i++; // guillemet ouvrant
    while (i < text.length) {
      const char = text[i]!;
      if (char === '"') {
        i++;
        return;
      }
      if (char === "\n") fail("Chaîne non fermée");
      if (char === "\\") {
        const next = text[i + 1];
        if (next === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail("Échappement \\u invalide");
          i += 6;
          continue;
        }
        if (!next || !'"\\/bfnrt'.includes(next)) fail("Échappement invalide");
        i += 2;
        continue;
      }
      i++;
    }
    fail("Chaîne non fermée");
  };
  const number = () => {
    const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!match || match[0] === "-") fail("Nombre invalide");
    i += match![0].length;
  };
  const value = (): void => {
    skip();
    const char = text[i];
    if (char === undefined) fail("Fin inattendue : valeur attendue");
    if (char === "{") {
      i++;
      skip();
      if (text[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        skip();
        if (text[i] === "}") fail("Virgule en trop avant « } »");
        if (text[i] !== '"') fail("Nom de propriété entre guillemets attendu");
        string();
        skip();
        expect(":");
        value();
        skip();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return;
        }
        fail("« , » ou « } » attendu");
      }
    }
    if (char === "[") {
      i++;
      skip();
      if (text[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        skip();
        if (text[i] === "]") fail("Virgule en trop avant « ] »");
        value();
        skip();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return;
        }
        fail("« , » ou « ] » attendu");
      }
    }
    if (char === '"') return string();
    if (char === "t") return expect("true");
    if (char === "f") return expect("false");
    if (char === "n") return expect("null");
    if (char === "-" || (char >= "0" && char <= "9")) return number();
    fail(`Caractère inattendu « ${char} »`);
  };

  try {
    value();
    skip();
    if (i < text.length) fail("Contenu en trop après la valeur JSON");
    return null;
  } catch (error) {
    return error instanceof JsonSyntaxError ? error : null;
  }
}

/** Formate (indent = nombre d'espaces ou "\t") ou minifie (indent = 0). */
export function formatJson(text: string, indent: number | "\t"): JsonResult {
  if (!text.trim()) return { ok: false, error: "Colle du JSON pour commencer", line: null, column: null };
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, output: JSON.stringify(value, null, indent === 0 ? undefined : indent) };
  } catch {
    const located = locateError(text);
    if (!located) return { ok: false, error: "JSON invalide", line: null, column: null };
    const { line, column } = positionToLineColumn(text, located.position);
    return { ok: false, error: located.message, line, column };
  }
}
