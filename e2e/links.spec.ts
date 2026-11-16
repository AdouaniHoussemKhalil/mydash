import { expect, test } from "@playwright/test";
import { detailTitle } from "./helpers";

// Domaines .test (réservés, jamais résolus) : l'aperçu échoue vite et
// le titre généré reste stable, sans dépendre du réseau.
test("liens : URL collée, site ouvrable, statut lu", async ({ page }) => {
  await page.goto("/links");
  const quick = page.getByRole("textbox", { name: /Ajouter : lien/ });
  await quick.fill("docs.example.test/guide");
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/links\?item=/);

  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detailTitle(page)).toHaveValue("docs.example.test/guide");
  await expect(detail.getByLabel("URL")).toHaveValue("https://docs.example.test/guide");
  const open = detail.getByRole("link", { name: "Ouvrir le site" });
  await expect(open).toHaveAttribute("href", "https://docs.example.test/guide");
  await expect(open).toHaveAttribute("target", "_blank");
  await expect(detail.getByText("Aperçu indisponible : Page injoignable")).toBeVisible();

  // La liste propose aussi d'ouvrir le site, et signale « À lire ».
  const row = page.locator("main li").filter({ hasText: "docs.example.test/guide" });
  await expect(row.getByRole("link", { name: /Ouvrir docs\.example\.test dans un nouvel onglet/ })).toBeVisible();
  await expect(row.getByText("À lire", { exact: true })).toBeVisible();

  await detail.getByRole("button", { name: "Marquer comme lu" }).click();
  await expect(detail.getByRole("button", { name: "Remettre à lire" })).toBeVisible();
  await expect(row.getByText("À lire", { exact: true })).toBeHidden();

  // Une URL invalide est refusée sans perdre la précédente.
  await detail.getByLabel("URL").fill("javascript:alert(1)");
  await detail.getByLabel("URL").press("Enter");
  await expect(detail.getByRole("alert")).toHaveText("URL invalide (http ou https)");
  await expect(open).toHaveAttribute("href", "https://docs.example.test/guide");
});
