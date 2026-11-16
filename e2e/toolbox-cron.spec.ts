import { expect, test } from "@playwright/test";
import { openPalette } from "./helpers";

test("boîte à outils : traducteur cron", async ({ page }) => {
  await page.goto("/today");
  const palette = await openPalette(page);
  await palette.fill("crontab");
  await palette.press("Enter");
  await expect(page).toHaveURL(/\/toolbox\/cron$/);

  const main = page.getByRole("main");
  await main.getByLabel("Expression cron").fill("0 9 * * 1");
  await expect(main.getByRole("status")).toHaveText("Tous les lundis, à 9 h 00");
  const runs = main.getByRole("list", { name: "Prochaines exécutions" }).locator("li");
  await expect(runs).toHaveCount(5);
  await expect(runs.first()).toContainText("lundi");
  await expect(runs.first()).toContainText("09:00");

  await main.getByRole("button", { name: /Toutes les 15 min/ }).click();
  await expect(main.getByRole("status")).toHaveText("Toutes les 15 minutes");

  await main.getByLabel("Expression cron").fill("0 25 * * *");
  await expect(main.getByRole("alert")).toHaveText("Heures : 25 est hors de 0–23");
});
