import { expect, test } from "@playwright/test";

test("docs : attacher un lien, le retrouver dans Liens, le retirer", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/docs");
  const quick = page.getByRole("textbox", { name: /Ajouter : doc/ });
  await quick.fill(`Doc liée ${stamp}`);
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/docs\?item=/);

  const detail = page.getByRole("complementary", { name: /Détail/ });
  const input = detail.getByLabel("Attacher un lien");
  // Sans https:// : accepté et normalisé.
  await input.fill(`ref-${stamp}.example.test/api`);
  await input.press("Enter");
  const attached = detail.getByRole("list", { name: "Liens attachés" });
  await expect(attached.getByRole("link", { name: `ref-${stamp}.example.test/api` })).toBeVisible();

  // Une seconde fois : refusé.
  await input.fill(`https://ref-${stamp}.example.test/api`);
  await input.press("Enter");
  await expect(detail.getByRole("alert")).toHaveText("Ce lien est déjà attaché");

  // Le lien existe aussi dans le module Liens.
  await attached.getByRole("link", { name: `ref-${stamp}.example.test/api` }).click();
  await expect(page).toHaveURL(/\/links\?item=/);
  await expect(page.getByRole("complementary", { name: /Détail/ }).getByLabel("URL")).toHaveValue(
    `https://ref-${stamp}.example.test/api`,
  );

  // Retirer le lien de la doc ne le supprime pas.
  await page.goBack();
  await expect(page).toHaveURL(/\/docs\?item=/);
  await page.getByRole("complementary", { name: /Détail/ }).getByRole("button", { name: /Retirer le lien/ }).click();
  await expect(page.getByRole("complementary", { name: /Détail/ }).getByText("Aucun lien attaché.")).toBeVisible();
  await page.goto("/links");
  await expect(page.locator("main").getByRole("link", { name: new RegExp(`^ref-${stamp}[.]example[.]test/api`) })).toBeVisible();
});
