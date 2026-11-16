import { describe, expect, it } from "vitest";
import { decodeEntities, detectCharset, parseAttributes, parseHtmlPreview } from "./parse";

const PAGE = "https://exemple.com/blog/article";

describe("parseHtmlPreview", () => {
  it("préfère Open Graph et résout les URL relatives", () => {
    const html = `<!doctype html><html><head>
      <title>Titre HTML</title>
      <meta property="og:title" content="Titre &amp; OG">
      <meta name="description" content="Desc classique">
      <meta property="og:description" content="  Desc
        OG  ">
      <meta property="og:site_name" content="Exemple">
      <meta property="og:image" content="/img/cover.png">
      <link rel="shortcut icon" href="/static/fav.ico">
    </head><body><meta property="og:title" content="ignoré"></body></html>`;
    expect(parseHtmlPreview(html, PAGE)).toEqual({
      pageTitle: "Titre & OG",
      description: "Desc OG",
      siteName: "Exemple",
      imageUrl: "https://exemple.com/img/cover.png",
      faviconUrl: "https://exemple.com/static/fav.ico",
    });
  });

  it("se rabat sur <title>, la description classique et /favicon.ico", () => {
    const html = `<head><title> Mon   site </title><meta content='Une page' name='description'></head>`;
    expect(parseHtmlPreview(html, PAGE)).toEqual({
      pageTitle: "Mon site",
      description: "Une page",
      siteName: null,
      imageUrl: null,
      faviconUrl: "https://exemple.com/favicon.ico",
    });
  });

  it("utilise les balises Twitter à défaut d'Open Graph", () => {
    const html = `<head><meta name="twitter:title" content="TW"><meta name="twitter:image" content="https://cdn.ex/i.jpg"></head>`;
    const preview = parseHtmlPreview(html, PAGE);
    expect(preview.pageTitle).toBe("TW");
    expect(preview.imageUrl).toBe("https://cdn.ex/i.jpg");
  });

  it("refuse les URL d'image non http(s)", () => {
    const html = `<head><meta property="og:image" content="javascript:alert(1)"><link rel="icon" href="data:image/png;base64,xx"></head>`;
    const preview = parseHtmlPreview(html, PAGE);
    expect(preview.imageUrl).toBeNull();
    expect(preview.faviconUrl).toBeNull();
  });

  it("borne la longueur du titre", () => {
    const html = `<head><title>${"a".repeat(800)}</title></head>`;
    expect(parseHtmlPreview(html, PAGE).pageTitle).toHaveLength(500);
  });
});

describe("parseAttributes", () => {
  it("lit les guillemets doubles, simples et l'absence de guillemets", () => {
    expect(parseAttributes(`<meta name="a" content='b c' data-x=y async>`)).toEqual({
      name: "a",
      content: "b c",
      "data-x": "y",
      async: "",
    });
  });
});

describe("decodeEntities", () => {
  it("décode les entités nommées et numériques", () => {
    expect(decodeEntities("caf&eacute; &#233; &#xE9; &amp; &inconnue;")).toBe("café é é & &inconnue;");
  });
});

describe("detectCharset", () => {
  it("lit l'en-tête puis la balise meta", () => {
    expect(detectCharset("text/html; charset=ISO-8859-1", "")).toBe("iso-8859-1");
    expect(detectCharset("text/html", '<meta charset="windows-1252">')).toBe("windows-1252");
    expect(detectCharset(null, "")).toBe("utf-8");
  });
});
