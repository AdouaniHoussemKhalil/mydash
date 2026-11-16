import { expect, test } from "@playwright/test";

test("tâches : échéance, état, retard et filtre", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/tasks");
  const quick = page.getByRole("textbox", { name: /Ajouter : tâche/ });
  await quick.fill(`Facture ${stamp}`);
  await page.getByLabel("Échéance (facultatif)").fill("2020-01-15");
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/tasks\?item=/);

  const row = page.locator("main li").filter({ hasText: `Facture ${stamp}` });
  await expect(row).toContainText("15 janv. 2020");
  await expect(row).toContainText("en retard");
  await expect(row).toContainText("À faire");

  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detail.getByRole("textbox", { name: "Échéance", exact: true })).toHaveValue("2020-01-15");
  await detail.getByRole("combobox", { name: "État" }).click();
  await page.getByRole("option", { name: "Terminé" }).click();
  await expect(row).toContainText("Terminé");
  await expect(row).not.toContainText("en retard");

  // Filtre par état
  const filters = page.getByRole("navigation", { name: "Filtrer par état" });
  await filters.getByRole("link", { name: "Terminé" }).click();
  await expect(page).toHaveURL(/status=done/);
  await expect(row).toBeVisible();
  await filters.getByRole("link", { name: "À faire" }).click();
  await expect(page).toHaveURL(/status=todo/);
  await expect(row).toBeHidden();
});
