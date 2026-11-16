import { expect, test } from "@playwright/test";
import { detailTitle } from "./helpers";

test("repos : coller l'URL d'un dépôt", async ({ page }) => {
  const name = `outil-${Date.now()}`;
  await page.goto("/repos");
  const quick = page.getByRole("textbox", { name: /Ajouter : repo/ });

  // Une URL qui n'est pas un dépôt est refusée.
  await quick.fill("https://github.com/settings/profile");
  await quick.press("Enter");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Ce n'est pas l'URL d'un dépôt GitHub ou GitLab");

  // Une URL de dépôt (même une page interne) donne owner/repo et l'URL canonique.
  await quick.fill(`github.com/mydash-e2e/${name}/tree/main/src`);
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/repos\?item=/);
  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detailTitle(page)).toHaveValue(`mydash-e2e/${name}`);
  await expect(detail.getByLabel("URL du dépôt")).toHaveValue(`https://github.com/mydash-e2e/${name}`);
  const open = detail.getByRole("link", { name: "Ouvrir sur GitHub" });
  await expect(open).toHaveAttribute("href", `https://github.com/mydash-e2e/${name}`);
  await expect(open).toHaveAttribute("target", "_blank");

  // La liste propose d'ouvrir le dépôt.
  const row = page.locator("main li").filter({ hasText: `mydash-e2e/${name}` });
  await expect(row.getByRole("link", { name: /Ouvrir github\.com dans un nouvel onglet/ })).toBeVisible();

  // Modifier l'URL : seul un dépôt est accepté.
  await detail.getByLabel("URL du dépôt").fill("https://nextjs.org/docs");
  await detail.getByLabel("URL du dépôt").press("Enter");
  await expect(detail.getByRole("region", { name: "Dépôt" }).getByRole("alert")).toHaveText(
    "Ce n'est pas l'URL d'un dépôt GitHub ou GitLab",
  );
  await expect(open).toHaveAttribute("href", `https://github.com/mydash-e2e/${name}`);
});

test("repos : GitLab indique que le suivi d'activité est réservé à GitHub", async ({ page }) => {
  await page.goto("/repos");
  const quick = page.getByRole("textbox", { name: /Ajouter : repo/ });
  await quick.fill(`gitlab.com/mydash-e2e/projet-${Date.now()}`);
  await quick.press("Enter");
  await expect(page).toHaveURL(/\/repos\?item=/);
  const detail = page.getByRole("complementary", { name: /Détail/ });
  await expect(detail.getByRole("link", { name: "Ouvrir sur GitLab" })).toBeVisible();
  await expect(detail.getByText("Le suivi d'activité est disponible pour GitHub uniquement pour l'instant.")).toBeVisible();
});
