import { expect, test } from "@playwright/test";

test("boîte à outils : presse-papiers partagé entre deux machines", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const text = `Texte à passer ${Date.now()}\nligne 2`;
  await page.goto("/toolbox/clipboard");
  const main = page.getByRole("main");
  const box = main.getByLabel("Texte partagé");
  await expect(box).toBeEnabled(); // page hydratée
  await box.fill(text);
  await expect(box).toHaveValue(text);
  await expect(main.getByRole("status")).toContainText("Enregistré ·");

  // « Autre machine » : un second navigateur avec la même session.
  const other = await browser.newContext({ storageState: await page.context().storageState() });
  const otherPage = await other.newPage();
  // Rechargé jusqu'à voir le texte (l'enregistrement est asynchrone).
  await expect(async () => {
    await otherPage.goto("/toolbox/clipboard");
    await expect(otherPage.getByRole("main").getByLabel("Texte partagé")).toHaveValue(text, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await expect(otherPage.getByRole("main").getByRole("button", { name: "Copier" })).toBeEnabled();
  await other.close();

  await main.getByRole("button", { name: "Vider" }).click();
  await expect(box).toHaveValue("");
  await expect(main.getByRole("status")).toContainText("Enregistré ·");
  await page.reload();
  await expect(page.getByRole("main").getByLabel("Texte partagé")).toHaveValue("");
});
