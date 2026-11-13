import { expect, test } from "@playwright/test";

test("pièces jointes : envoyer, télécharger, supprimer", async ({ page }) => {
  // Deux actions serveur et un envoi par fichier : lent sur un serveur froid.
  test.slow();
  await page.goto("/docs");
  const quick = page.getByRole("textbox", { name: /Ajouter : doc/ });
  await quick.fill(`Doc avec fichiers ${Date.now()}`);
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/docs\?item=/);

  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detail.getByText("Aucun fichier pour l'instant.")).toBeVisible();

  const chooser = page.waitForEvent("filechooser");
  await detail.getByRole("button", { name: "Choisir des fichiers" }).click();
  await (await chooser).setFiles([
    { name: "notes.md", mimeType: "text/markdown", buffer: Buffer.from("# Notes\n") },
    { name: "plan.txt", mimeType: "text/plain", buffer: Buffer.from("plan") },
  ]);
  const files = detail.getByRole("list", { name: "Fichiers" });
  await expect(files.getByText("notes.md")).toBeVisible({ timeout: 45_000 });
  await expect(files.getByText("plan.txt")).toBeVisible({ timeout: 45_000 });

  const download = page.waitForEvent("download");
  await detail.getByRole("link", { name: "Télécharger notes.md" }).click();
  expect((await download).suggestedFilename()).toBe("notes.md");

  await detail.getByRole("button", { name: "Supprimer plan.txt" }).click();
  await detail.getByRole("button", { name: "Confirmer" }).click();
  await expect(files.getByText("plan.txt")).toBeHidden();

  await page.reload();
  await expect(page.getByRole("complementary", { name: /Détail/ }).getByRole("list", { name: "Fichiers" }).locator("li")).toHaveCount(1);
});
