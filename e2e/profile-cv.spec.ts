import { expect, test } from "@playwright/test";

test("moi : CV généré depuis le profil, éléments masqués exclus", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/me");
  const main = page.getByRole("main");
  await main.getByLabel("Nom complet").fill(`Prénom Nom ${stamp}`);
  await main.getByLabel("Nom complet").press("Enter");
  await expect(main.getByText("Enregistré", { exact: true })).toBeVisible();

  const skills = page.getByRole("region", { name: "Compétences" });
  for (const name of [`Visible ${stamp}`, `Masquée ${stamp}`]) {
    await skills.getByRole("button", { name: "Ajouter une compétence" }).click();
    await skills.getByLabel("Compétence").fill(name);
    await skills.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(skills.getByText(name, { exact: true })).toBeVisible();
  }
  const hidden = skills.locator("li").filter({ hasText: `Masquée ${stamp}` });
  await hidden.getByRole("checkbox").click();
  await expect(hidden.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");

  // Choix du modèle et de la couleur avant la génération.
  await page.getByRole("link", { name: "Voir mon CV" }).click();
  await expect(page).toHaveURL(/\/me\/cv$/);
  await page.getByRole("radio", { name: /Sobre/ }).click();
  await page.getByRole("radio", { name: "Couleur de l'app" }).click();
  await page.getByRole("button", { name: "Générer le CV" }).click();
  await expect(page).toHaveURL(/\/me\/cv\/apercu$/);
  const cv = page.locator(".cv-sheet");
  await expect(cv.getByRole("heading", { level: 1 })).toHaveText(`Prénom Nom ${stamp}`);
  await expect(cv).toContainText(`Visible ${stamp}`);
  await expect(cv).not.toContainText(`Masquée ${stamp}`);
  // Toujours en clair, et l'export PDF est proposé.
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Télécharger en PDF" })).toBeVisible();
});

test("moi : modèle Deux colonnes et couleur, retenus au retour", async ({ page }) => {
  await page.goto("/me/cv");
  await page.getByRole("radio", { name: /Deux colonnes/ }).click();
  await page.getByRole("radio", { name: "Bleu ciel" }).click();
  await page.getByRole("button", { name: "Générer le CV" }).click();
  await expect(page).toHaveURL(/\/me\/cv\/apercu$/);
  // Colonne gauche avec Contact ; couleur appliquée à la zone du CV seulement.
  await expect(page.locator(".cv-sheet aside")).toContainText("Contact");
  await expect
    .poll(() => page.locator(".cv-accent-scope:has(.cv-sheet)").evaluate((el) => getComputedStyle(el).getPropertyValue("--color-accent-9").trim()))
    .toBe("#4FC3E8");

  await page.getByRole("link", { name: "Changer de modèle" }).click();
  await expect(page.getByRole("radio", { name: /Deux colonnes/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Bleu ciel" })).toHaveAttribute("aria-checked", "true");
});

test("moi : modèle Simple, sans photo ni niveaux de compétences", async ({ page }) => {
  const skill = `Simple ${Date.now()}`;
  await page.goto("/me");
  const skills = page.getByRole("region", { name: "Compétences" });
  await skills.getByRole("button", { name: "Ajouter une compétence" }).click();
  await skills.getByLabel("Compétence").fill(skill);
  await skills.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(skills.getByText(skill, { exact: true })).toBeVisible();

  await page.goto("/me/cv");
  await page.getByRole("radio", { name: /Simple/ }).click();
  await page.getByRole("button", { name: "Générer le CV" }).click();
  await expect(page).toHaveURL(/\/me\/cv\/apercu$/);
  const cv = page.locator(".cv-sheet");
  await expect(cv.getByRole("region", { name: "Compétences" })).toContainText(skill);
  // Ni photo, ni initiales, ni jauge de niveau, ni colonne latérale.
  await expect(cv.locator("img, [role=img], aside")).toHaveCount(0);

  await page.getByRole("link", { name: "Changer de modèle" }).click();
  await expect(page.getByRole("radio", { name: /Simple/ })).toHaveAttribute("aria-checked", "true");
});
