export const HASH_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

/** Empreinte hexadécimale d'un texte (UTF-8), calculée par le navigateur (Web Crypto). */
export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
