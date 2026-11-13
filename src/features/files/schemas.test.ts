import { describe, expect, it } from "vitest";
import { fileInfoSchema, fileNameSchema, formatBytes, previewKind } from "./schemas";

describe("fileNameSchema", () => {
  it("retire le chemin et les caractères de contrôle", () => {
    expect(fileNameSchema.parse(String.raw`C:\Users\moi\rapport` + "\u0007.pdf")).toBe("rapport.pdf");
    expect(fileNameSchema.parse("../../etc/passwd")).toBe("passwd");
  });

  it("refuse un nom vide", () => {
    expect(fileNameSchema.safeParse("dossier/").success).toBe(false);
  });
});

describe("fileInfoSchema", () => {
  it("refuse plus de 50 Mo", () => {
    const result = fileInfoSchema.safeParse({ name: "a.zip", size: 50 * 1024 * 1024 + 1, mimeType: "application/zip" });
    expect(result.success).toBe(false);
  });

  it("remplace un type MIME douteux", () => {
    expect(fileInfoSchema.parse({ name: "a", size: 1, mimeType: "" }).mimeType).toBe("application/octet-stream");
    expect(fileInfoSchema.parse({ name: "a", size: 1, mimeType: "Image/PNG" }).mimeType).toBe("image/png");
  });
});

describe("formatBytes", () => {
  it("affiche une taille lisible", () => {
    expect(formatBytes(512)).toBe("512 o");
    expect(formatBytes(2048)).toBe("2 Ko");
    expect(formatBytes(3.4 * 1024 * 1024)).toMatch(/^3,4 Mo$/);
  });
});

describe("previewKind", () => {
  it("reconnaît les images et les PDF", () => {
    expect(previewKind("image/png")).toBe("image");
    expect(previewKind("application/pdf")).toBe("pdf");
    expect(previewKind("image/svg+xml")).toBeNull();
  });
});
