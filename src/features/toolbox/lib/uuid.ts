export type UuidVersion = "v4" | "v7";

function format(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** UUID v4 : 122 bits aléatoires. */
export function uuidV4(): string {
  return crypto.randomUUID();
}

/**
 * UUID v7 (RFC 9562) : 48 bits d'horodatage en millisecondes puis de
 * l'aléa ; les identifiants se trient dans l'ordre de création.
 */
export function uuidV7(now: number = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let time = now;
  for (let index = 5; index >= 0; index--) {
    bytes[index] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variante RFC
  return format(bytes);
}

/** Génère `count` UUID (1 à 100). */
export function generateUuids(version: UuidVersion, count: number): string[] {
  const total = Math.min(100, Math.max(1, Math.trunc(count) || 1));
  return Array.from({ length: total }, () => (version === "v7" ? uuidV7() : uuidV4()));
}
