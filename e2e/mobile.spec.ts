import { expect, test } from "@playwright/test";
import { detailTitle } from "./helpers";

test("mobile : capture depuis la barre et détail plein écran", async ({ page }) => {
  await page.goto("/today");
  await page.getByRole("button", { name: /Capturer ou rechercher/ }).click();
  const input = page.getByRole("combobox", { name: "Capturer ou rechercher" });
  await input.fill("Note prise sur mobile");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/notes\?item=/);
  await expect(detailTitle(page)).toHaveValue("Note prise sur mobile");

  await page.getByRole("button", { name: "Fermer le détail (Échap)" }).click();
  await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Inbox" }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByRole("link", { name: /Note prise sur mobile/ })).toBeVisible();
});
