// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fetchLinkPreview, isPublicAddress } from "./fetch";

describe("isPublicAddress", () => {
  it.each([
    "127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.10", "169.254.169.254", "100.64.0.1",
    "0.0.0.0", "224.0.0.1", "::1", "::", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1",
    "64:ff9b::7f00:1", "64:ff9b::10.0.0.1", "::ffff:7f00:1", "pas-une-ip", "1:2:3",
  ])("refuse %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(["93.184.215.14", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8", "64:ff9b::8c52:7904"])("accepte %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });
});

describe("fetchLinkPreview : refus avant toute connexion", () => {
  it.each([
    ["http://127.0.0.1/", "Adresse non autorisée"],
    ["http://[::1]/", "Adresse non autorisée"],
    ["http://169.254.169.254/latest/meta-data", "Adresse non autorisée"],
    ["http://localhost:3000/", "Port non autorisé"],
    ["http://localhost/", "Adresse non autorisée"],
    ["http://intranet.local/", "Adresse non autorisée"],
    ["https://user:pass@exemple.com/", "URL avec identifiants refusée"],
    ["ftp://exemple.com/", "Protocole non pris en charge"],
    ["https://exemple.com:22/", "Port non autorisé"],
  ])("%s → %s", async (url, message) => {
    await expect(fetchLinkPreview(url)).rejects.toThrow(message);
  });
});
