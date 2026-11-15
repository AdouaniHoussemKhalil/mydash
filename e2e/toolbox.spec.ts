import { expect, test } from "@playwright/test";
import { openPalette } from "./helpers";

test("boîte à outils : JSON, Base64, URL", async ({ page }) => {
  await page.goto("/toolbox");
  await page.getByRole("main").getByRole("link", { name: /JSON/ }).click();
  await expect(page).toHaveURL(/\/toolbox\/json$/);

  // JSON : erreur localisée, puis formatage.
  await page.getByLabel("JSON à traiter").fill('{"a": 1,}');
  await page.getByRole("button", { name: "Formater" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Ligne 1, colonne 9 : Virgule en trop avant « } »");
  await page.getByLabel("JSON à traiter").fill('{"nom":"MyDash","tags":[1,2]}');
  await page.getByRole("button", { name: "Formater" }).click();
  await expect(page.getByLabel("Résultat")).toHaveValue('{\n  "nom": "MyDash",\n  "tags": [\n    1,\n    2\n  ]\n}');
  await page.getByRole("button", { name: "Minifier" }).click();
  await expect(page.getByLabel("Résultat")).toHaveValue('{"nom":"MyDash","tags":[1,2]}');

  // Base64 depuis la palette (« base64 »), aller-retour avec accents.
  const input = await openPalette(page);
  await input.fill("base64");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/toolbox\/base64$/);
  await page.getByLabel("Texte", { exact: true }).fill("Café à Tunis");
  await expect(page.getByLabel("Base64", { exact: true })).toHaveValue("Q2Fmw6kgw6AgVHVuaXM=");
  await page.getByRole("tab", { name: "Décoder" }).click();
  await page.getByLabel("Base64", { exact: true }).fill("Q2Fmw6kgw6AgVHVuaXM=");
  await expect(page.getByLabel("Texte", { exact: true })).toHaveValue("Café à Tunis");

  // URL
  await page.goto("/toolbox/url");
  await page.getByLabel("Texte", { exact: true }).fill("ville=Tunis & pays");
  await expect(page.getByLabel("Texte encodé")).toHaveValue("ville%3DTunis%20%26%20pays");
});
