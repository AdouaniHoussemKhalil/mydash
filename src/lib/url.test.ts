import { describe, expect, it } from "vitest";
import { displayHost, parseUrl, urlTitle } from "./url";

describe("parseUrl", () => {
  it("refuse les schémas autres que http(s)", () => {
    expect(parseUrl("javascript:alert(1)")).toBeNull();
    expect(parseUrl("ftp://exemple.com")).toBeNull();
  });

  it("refuse une URL trop longue", () => {
    expect(parseUrl(`https://exemple.com/${"a".repeat(2100)}`)).toBeNull();
  });
});

describe("urlTitle", () => {
  it("garde le chemin décodé sans « www. »", () => {
    expect(urlTitle(new URL("https://www.exemple.com/caf%C3%A9/"))).toBe("exemple.com/café");
  });

  it("ne plante pas sur un encodage invalide", () => {
    expect(urlTitle(new URL("https://exemple.com/%E0%A4%A"))).toBe("exemple.com/%E0%A4%A");
  });
});

describe("displayHost", () => {
  it("renvoie l'hôte ou null", () => {
    expect(displayHost("https://www.nextjs.org/docs")).toBe("nextjs.org");
    expect(displayHost("pas une url")).toBeNull();
  });
});
