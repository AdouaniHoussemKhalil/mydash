import { expect, test } from "@playwright/test";

// PNG 1×1 valide.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("fichiers : chaque fichier déposé devient un élément avec aperçu", async ({ page }) => {
  test.slow();
  await page.goto("/files");
  const stamp = Date.now();

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Ajouter des fichiers" }).click();
  await (await chooser).setFiles([
    { name: `lisezmoi-${stamp}.txt`, mimeType: "text/plain", buffer: Buffer.from("Bonjour") },
    { name: `image-${stamp}.png`, mimeType: "image/png", buffer: PNG },
  ]);

  // Le détail du dernier fichier s'ouvre : vignette, « Voir » dans un nouvel onglet.
  await expect(page).toHaveURL(/\/files\?item=/, { timeout: 45_000 });
  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detail.getByLabel("Titre")).toHaveValue(`image-${stamp}.png`);
  await expect(detail.locator('a[target="_blank"] img').first()).toBeVisible();
  const view = detail.getByRole("link", { name: "Voir", exact: true });
  await expect(view).toHaveAttribute("target", "_blank");
  await expect(view).toHaveAttribute("href", /^\/api\/files\/[^?]+$/);
  await expect(detail.locator("iframe")).toHaveCount(0);

  // La liste indique le type et la taille.
  const list = page.locator("main ul").first();
  await expect(list.getByRole("link", { name: `lisezmoi-${stamp}.txt TXT · 7 o` })).toBeVisible();
  await expect(list.getByRole("link", { name: new RegExp(`^image-${stamp}[.]png Image PNG`) })).toBeVisible();

  // Texte : « Voir » et « Télécharger », sans vignette.
  await list.getByRole("link", { name: new RegExp(`^lisezmoi-${stamp}[.]txt`) }).click();
  await expect(detail.getByText("TXT · 7 o")).toBeVisible();
  await expect(detail.getByRole("link", { name: "Voir", exact: true })).toHaveAttribute("target", "_blank");
  await expect(detail.getByRole("link", { name: "Télécharger", exact: true })).toHaveAttribute("href", /\/api\/files\/.+\?download=1$/);
});
