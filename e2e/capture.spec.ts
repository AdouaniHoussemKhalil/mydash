import { expect, test } from "@playwright/test";
import { detailTitle, openPalette } from "./helpers";

test.describe("capture → recherche", () => {
  test("capturer une note, un repo et un lien, puis les retrouver", async ({ page }) => {
    await page.goto("/today");

    // Texte → note
    let input = await openPalette(page);
    await input.fill("Idée géniale pour MyDash");
    const createOption = page.getByRole("option", { name: /Note : Idée géniale pour MyDash/ });
    await expect(createOption).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/notes\?item=/);
    await expect(detailTitle(page)).toHaveValue("Idée géniale pour MyDash");

    // URL GitHub → repo
    input = await openPalette(page);
    await input.fill("https://github.com/vercel/next.js");
    await expect(page.getByRole("option", { name: /Repo : vercel\/next\.js/ })).toBeVisible();
    await input.press("Enter");
    await expect(page).toHaveURL(/\/repos\?item=/);
    await expect(detailTitle(page)).toHaveValue("vercel/next.js");

    // URL → lien
    input = await openPalette(page);
    await input.fill("example.com/article");
    await expect(page.getByRole("option", { name: /Lien : example\.com\/article/ })).toBeVisible();
    await input.press("Enter");
    await expect(page).toHaveURL(/\/links\?item=/);
    await expect(page.getByRole("complementary", { name: /Détail/ }).getByLabel("URL")).toHaveValue(
      "https://example.com/article",
    );

    // Retrouver par préfixe, sans accent exact sur le début du mot
    input = await openPalette(page);
    await input.fill("génia");
    const found = page.getByRole("option", { name: /Idée géniale pour MyDash/ }).filter({ hasNotText: "Note :" });
    await expect(found).toBeVisible();
    await input.press("ArrowDown");
    await expect(found).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/notes\?item=/);
    await expect(detailTitle(page)).toHaveValue("Idée géniale pour MyDash");

    // Nom exact d'une page : Entrée y va (au lieu de créer une note « inbox »)
    input = await openPalette(page);
    await input.fill("inbox");
    await expect(page.getByRole("option", { name: "Inbox", exact: true })).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/inbox$/);
    for (const title of ["Idée géniale pour MyDash", "vercel/next.js", "example.com/article"]) {
      await expect(page.getByRole("link", { name: new RegExp(title.replace(/[./]/g, "\\$&")) })).toBeVisible();
    }
  });

  test("la barre supérieure ouvre la palette, Échap la ferme", async ({ page }) => {
    await page.goto("/today");
    await page.getByRole("button", { name: /Capturer ou rechercher/ }).click();
    const input = page.getByRole("combobox", { name: "Capturer ou rechercher" });
    await expect(input).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("« ? » affiche l'aide des raccourcis", async ({ page }) => {
    await page.goto("/today");
    // Pendant le streaming, le squelette et la page ont chacun un h1 : viser le visible.
    await page.locator("main h1").filter({ visible: true }).first().click();
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog", { name: "Raccourcis clavier" })).toBeVisible();
  });
});
