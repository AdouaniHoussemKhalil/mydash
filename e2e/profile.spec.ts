import { expect, test } from "@playwright/test";

// PNG 1×1 valide.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("moi : identité enregistrée et photo", async ({ page }) => {
  await page.goto("/today");
  await page.getByRole("navigation").getByRole("link", { name: "Moi" }).click();
  await expect(page).toHaveURL(/\/me$/);
  const main = page.getByRole("main");

  await main.getByLabel("Titre").fill("Développeur full-stack");
  await main.getByLabel("Titre").press("Enter");
  await expect(main.getByText("Enregistré", { exact: true })).toBeVisible();

  await main.getByLabel("GitHub").fill("github.com/mydash-e2e");
  await main.getByLabel("GitHub").press("Enter");
  await expect(main.getByLabel("GitHub")).toHaveValue("https://github.com/mydash-e2e");

  await main.getByLabel("E-mail de contact").fill("pas-un-mail");
  await main.getByLabel("E-mail de contact").press("Enter");
  await expect(main.getByRole("alert")).toHaveText("E-mail invalide");

  const chooser = page.waitForEvent("filechooser");
  await main.getByRole("button", { name: /photo/ }).first().click();
  await (await chooser).setFiles({ name: "moi.png", mimeType: "image/png", buffer: PNG });
  await expect(main.getByRole("img", { name: "Photo de profil" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("main").getByLabel("Titre")).toHaveValue("Développeur full-stack");
  await expect(page.getByRole("main").getByRole("img", { name: "Photo de profil" })).toBeVisible();
});
