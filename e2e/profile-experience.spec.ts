import { expect, test } from "@playwright/test";

test("moi : expériences (poste actuel, dates, tri) et formations", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/me");
  const experiences = page.getByRole("region", { name: "Expériences" });

  // Ancienne expérience
  await experiences.getByRole("button", { name: "Ajouter une expérience" }).click();
  await experiences.getByLabel("Poste", { exact: true }).fill(`Stagiaire ${stamp}`);
  await experiences.getByLabel("Entreprise").fill("Acme");
  await experiences.getByLabel("Début").fill("2019-02");
  await experiences.getByLabel("Fin").fill("2018-08");
  await experiences.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("La fin ne peut pas précéder le début").first()).toBeVisible();
  await experiences.getByLabel("Fin").fill("2019-08");
  await experiences.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(experiences.getByText(`Stagiaire ${stamp}`)).toBeVisible();

  // Poste actuel : la fin est désactivée, « aujourd'hui » affiché
  await experiences.getByRole("button", { name: "Ajouter une expérience" }).click();
  await experiences.getByLabel("Poste", { exact: true }).fill(`Développeur ${stamp}`);
  await experiences.getByLabel("Début").fill("2023-03");
  await experiences.getByLabel("Poste actuel").click();
  await expect(experiences.getByLabel("Fin")).toBeDisabled();
  await experiences.getByRole("button", { name: "Ajouter", exact: true }).click();

  const rows = experiences.locator("li").filter({ hasText: String(stamp) });
  await expect(rows).toHaveCount(2);
  // Le plus récent (en cours) d'abord.
  await expect(rows.first()).toContainText(`Développeur ${stamp}`);
  await expect(rows.first()).toContainText("mars 2023 – aujourd'hui");
  await expect(rows.last()).toContainText("févr. 2019 – août 2019");

  const education = page.getByRole("region", { name: "Formations" });
  await education.getByRole("button", { name: "Ajouter une formation" }).click();
  await education.getByLabel("Diplôme").fill(`Master ${stamp}`);
  await education.getByLabel("École").fill("Université de Tunis");
  await education.getByLabel("Début").fill("2016-09");
  await education.getByLabel("Fin").fill("2018-06");
  await education.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(education.locator("li").filter({ hasText: `Master ${stamp}` })).toContainText("sept. 2016 – juin 2018");
});
