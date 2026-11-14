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

  await page.getByRole("link", { name: "Voir mon CV" }).click();
  await expect(page).toHaveURL(/\/me\/cv$/);
  const cv = page.locator(".cv-sheet");
  await expect(cv.getByRole("heading", { level: 1 })).toHaveText(`Prénom Nom ${stamp}`);
  await expect(cv).toContainText(`Visible ${stamp}`);
  await expect(cv).not.toContainText(`Masquée ${stamp}`);
  // Toujours en clair, et l'export PDF est proposé.
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Télécharger en PDF" })).toBeVisible();
});
