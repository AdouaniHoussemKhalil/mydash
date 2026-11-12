import { expect, test } from "@playwright/test";
import { detailTitle } from "./helpers";

test("liens : URL collée, site ouvrable, statut lu", async ({ page }) => {
  await page.goto("/links");
  const quick = page.getByRole("textbox", { name: /Ajouter : lien/ });
  await quick.fill("example.org/guide");
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/links\?item=/);

  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detailTitle(page)).toHaveValue("example.org/guide");
  await expect(detail.getByLabel("URL")).toHaveValue("https://example.org/guide");
  const open = detail.getByRole("link", { name: "Ouvrir le site" });
  await expect(open).toHaveAttribute("href", "https://example.org/guide");
  await expect(open).toHaveAttribute("target", "_blank");

  // La liste propose aussi d'ouvrir le site, et signale « À lire ».
  const row = page.locator("main li").filter({ hasText: "example.org/guide" });
  await expect(row.getByRole("link", { name: /Ouvrir example\.org dans un nouvel onglet/ })).toBeVisible();
  await expect(row.getByText("À lire", { exact: true })).toBeVisible();

  await detail.getByRole("button", { name: "Marquer comme lu" }).click();
  await expect(detail.getByRole("button", { name: "Remettre à lire" })).toBeVisible();
  await expect(row.getByText("À lire", { exact: true })).toBeHidden();

  // Une URL invalide est refusée sans perdre la précédente.
  await detail.getByLabel("URL").fill("javascript:alert(1)");
  await detail.getByLabel("URL").press("Enter");
  await expect(detail.getByRole("alert")).toHaveText("URL invalide (http ou https)");
  await expect(open).toHaveAttribute("href", "https://example.org/guide");
});
