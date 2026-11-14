import { expect, test } from "@playwright/test";

test("moi : langues, projets (lien normalisé) et certifications", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/me");

  const languages = page.getByRole("region", { name: "Langues" });
  await languages.getByRole("button", { name: "Ajouter une langue" }).click();
  await languages.getByLabel("Langue").fill(`Anglais ${stamp}`);
  await languages.getByLabel("Niveau").fill("C1");
  await languages.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(languages.locator("li").filter({ hasText: `Anglais ${stamp}` })).toContainText("C1");

  const projects = page.getByRole("region", { name: "Projets" });
  await projects.getByRole("button", { name: "Ajouter un projet" }).click();
  await projects.getByLabel("Projet").fill(`MedLink ${stamp}`);
  await projects.getByLabel("Lien").fill("javascript:alert(1)");
  await projects.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("Lien invalide (http ou https)").first()).toBeVisible();
  await projects.getByLabel("Lien").fill("github.com/mydash-e2e/medlink");
  await projects.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(projects.locator("li").filter({ hasText: `MedLink ${stamp}` })).toContainText("https://github.com/mydash-e2e/medlink");

  const certifications = page.getByRole("region", { name: "Certifications" });
  await certifications.getByRole("button", { name: "Ajouter une certification" }).click();
  await certifications.getByLabel("Certification").fill(`AWS ${stamp}`);
  await certifications.getByLabel("Organisme").fill("Amazon Web Services");
  await certifications.getByLabel("Date").fill("2025-04");
  await certifications.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(certifications.locator("li").filter({ hasText: `AWS ${stamp}` })).toContainText("avr. 2025");
});
