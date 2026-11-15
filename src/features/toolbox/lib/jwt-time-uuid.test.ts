import { describe, expect, it } from "vitest";
import { encodeBase64 } from "./base64";
import { decodeJwt } from "./jwt";
import { formatUtc, parseTimestamp } from "./timestamp";
import { generateUuids, uuidV4, uuidV7 } from "./uuid";

const part = (value: object) => encodeBase64(JSON.stringify(value), true);
const token = (payload: object) => `${part({ alg: "HS256", typ: "JWT" })}.${part(payload)}.c2lnbmF0dXJl`;

describe("decodeJwt", () => {
  const now = new Date("2026-11-15T12:00:00Z");

  it("décode en-tête, contenu et dates, détecte l'expiration", () => {
    const result = decodeJwt(`Bearer ${token({ sub: "42", nom: "Hé", iat: 1794600000, exp: 1794700000 })}`, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.payload).toMatchObject({ sub: "42", nom: "Hé" });
    expect(result.dates.exp?.toISOString()).toBe("2026-11-14T23:46:40.000Z");
    expect(result.expired).toBe(true);
    expect(result.hasSignature).toBe(true);
  });

  it("jeton valide, sans exp, ou pas encore valable", () => {
    const valid = decodeJwt(token({ exp: 1800000000 }), now);
    expect(valid.ok && valid.expired).toBe(false);
    const noExp = decodeJwt(token({ sub: "x" }), now);
    expect(noExp.ok && noExp.expired).toBeNull();
    const future = decodeJwt(token({ nbf: 1800000000 }), now);
    expect(future.ok && future.notYetValid).toBe(true);
  });

  it("erreurs claires", () => {
    expect(decodeJwt("abc.def", now)).toEqual({ ok: false, error: "Un JWT a 3 parties séparées par des points (ici 2)" });
    expect(decodeJwt(`${part({ alg: "x" })}.${encodeBase64("pas du json", true)}.sig`, now)).toEqual({
      ok: false,
      error: "Contenu : ce n'est pas du JSON",
    });
    expect(decodeJwt("  ", now).ok).toBe(false);
  });
});

describe("parseTimestamp", () => {
  it("secondes et millisecondes détectées", () => {
    expect(parseTimestamp("1794700000")).toMatchObject({ ok: true, unit: "seconds", milliseconds: 1794700000000 });
    expect(parseTimestamp("1794700000123")).toMatchObject({ ok: true, unit: "milliseconds", seconds: 1794700000 });
  });

  it("date ISO → timestamp", () => {
    expect(parseTimestamp("2026-11-14T23:46:40Z")).toMatchObject({ ok: true, unit: "date", seconds: 1794700000 });
  });

  it("refuse le reste et formate en UTC", () => {
    expect(parseTimestamp("demain").ok).toBe(false);
    expect(formatUtc(new Date("2026-11-14T23:46:40Z"))).toBe("samedi 14 novembre 2026 à 23:46:40 UTC");
  });
});

describe("UUID", () => {
  const pattern = (version: number) => new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${version}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`);

  it("v4 et v7 bien formés", () => {
    expect(uuidV4()).toMatch(pattern(4));
    expect(uuidV7()).toMatch(pattern(7));
  });

  it("v7 : horodatage en tête, donc triable", () => {
    const first = uuidV7(1794700000000);
    const second = uuidV7(1794700000001);
    // 1794700000000 ms = 0x01a1dc74bb00
    expect(first.slice(0, 13)).toBe("01a1dc74-bb00");
    expect([second, first].sort()).toEqual([first, second]);
  });

  it("génère entre 1 et 100 identifiants uniques", () => {
    const list = generateUuids("v4", 250);
    expect(list).toHaveLength(100);
    expect(new Set(list).size).toBe(100);
    expect(generateUuids("v7", 0)).toHaveLength(1);
  });
});
