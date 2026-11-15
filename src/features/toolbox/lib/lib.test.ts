import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "./base64";
import { formatJson, positionToLineColumn } from "./json";
import { decodeUrl, encodeUrl } from "./url";

describe("formatJson", () => {
  it("formate, minifie et garde l'ordre des clés", () => {
    expect(formatJson('{"b":1,"a":[1,2]}', 2)).toEqual({ ok: true, output: '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}' });
    expect(formatJson('{\n  "a" : 1 }', 0)).toEqual({ ok: true, output: '{"a":1}' });
    expect(formatJson('{"a":1}', "\t")).toEqual({ ok: true, output: '{\n\t"a": 1\n}' });
  });

  it("donne la ligne et la colonne de l'erreur", () => {
    const result = formatJson('{\n  "a": 1,\n  "b": }', 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBe(3);
      expect(result.column).toBeGreaterThan(1);
    }
  });

  it("message précis à la bonne position", () => {
    expect(formatJson('{"a": 1,}', 2)).toMatchObject({ ok: false, error: "Virgule en trop avant « } »", line: 1, column: 9 });
    expect(formatJson("[1, 2,]", 2)).toMatchObject({ ok: false, error: "Virgule en trop avant « ] »", line: 1, column: 7 });
    expect(formatJson('{"a": 1, 2}', 2)).toMatchObject({ ok: false, error: "Nom de propriété entre guillemets attendu" });
    expect(formatJson("[1, 2", 2)).toMatchObject({ ok: false, error: "« , » ou « ] » attendu", line: 1, column: 6 });
    expect(formatJson("{'a': 1}", 2)).toMatchObject({ ok: false, line: 1, column: 2 });
    expect(formatJson('{"a": 1} x', 2)).toMatchObject({ ok: false, error: "Contenu en trop après la valeur JSON" });
  });

  it("vide → invitation, pas une erreur technique", () => {
    expect(formatJson("  ", 2)).toMatchObject({ ok: false, error: "Colle du JSON pour commencer" });
  });

  it("position → ligne et colonne", () => {
    expect(positionToLineColumn("ab\ncd", 4)).toEqual({ line: 2, column: 2 });
  });
});

describe("Base64", () => {
  it("aller-retour avec accents et emoji (UTF-8)", () => {
    const text = "Café ☕ à Tunis";
    expect(decodeBase64(encodeBase64(text))).toEqual({ ok: true, output: text });
  });

  it("variante URL-safe sans « = »", () => {
    expect(encodeBase64("??>", true)).toBe("Pz8-");
    expect(encodeBase64("??>")).toBe("Pz8+");
    expect(decodeBase64("Pz8-")).toEqual({ ok: true, output: "??>" });
  });

  it("refuse l'invalide", () => {
    expect(decodeBase64("pas du base64 !").ok).toBe(false);
    expect(decodeBase64("/w==").ok).toBe(false); // octet 0xFF : pas de l'UTF-8
  });
});

describe("URL", () => {
  it("encode et décode", () => {
    expect(encodeUrl("a b&c=é")).toBe("a%20b%26c%3D%C3%A9");
    expect(decodeUrl("a+b%26c")).toEqual({ ok: true, output: "a b&c" });
    expect(decodeUrl("a+b", false)).toEqual({ ok: true, output: "a+b" });
    expect(decodeUrl("%E0%A4%A").ok).toBe(false);
  });
});
