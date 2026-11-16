export type TextResult = { ok: true; output: string } | { ok: false; error: string };

/** Texte (UTF-8) → Base64 ; urlSafe : alphabet -_ et sans « = ». */
export function encodeBase64(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = btoa(binary);
  return urlSafe ? base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : base64;
}

/** Base64 (standard ou URL-safe, avec ou sans « = ») → texte UTF-8. */
export function decodeBase64(input: string): TextResult {
  const compact = input.replace(/\s+/g, "");
  if (!compact) return { ok: false, error: "Colle du Base64 pour commencer" };
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(compact)) return { ok: false, error: "Caractères invalides pour du Base64" };
  const standard = compact.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(standard.length + ((4 - (standard.length % 4)) % 4), "=");
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return { ok: true, output: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "Base64 invalide, ou contenu binaire qui n'est pas du texte UTF-8" };
  }
}
