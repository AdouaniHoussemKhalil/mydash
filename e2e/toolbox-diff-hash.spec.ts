import { expect, test } from "@playwright/test";

test("boîte à outils : comparer deux textes et hash", async ({ page }) => {
  await page.goto("/toolbox/diff");
  const main = page.getByRole("main");
  await main.getByLabel("Texte d'origine").fill("ligne 1\nligne 2\nligne 3");
  await main.getByLabel("Texte modifié").fill("ligne 1\nligne deux\nligne 3\nligne 4");
  await expect(main.getByRole("status")).toHaveText("+2 −1 lignes");
  const table = main.getByRole("table", { name: "Différences" });
  await expect(table).toContainText("ligne deux");

  await main.getByRole("tab", { name: "À la suite" }).click();
  await expect(main.getByRole("table", { name: "Différences" }).locator("tr")).toHaveCount(5);

  await main.getByLabel("Texte modifié").fill("ligne 1\nligne 2\nligne 3");
  await expect(main.getByRole("status")).toHaveText("Textes identiques");

  await page.goto("/toolbox/hash");
  await page.getByRole("main").getByLabel("Texte").fill("abc");
  await expect(page.getByRole("main").getByRole("definition").nth(1)).toHaveText(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});
