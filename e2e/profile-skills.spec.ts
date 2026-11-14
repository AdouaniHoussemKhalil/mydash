import { expect, test } from "@playwright/test";

test("moi : compétences avec niveau, catégorie, CV et ordre", async ({ page }) => {
  const stamp = Date.now();
  await page.goto("/me");
  const section = page.getByRole("region", { name: "Compétences" });

  for (const [name, level] of [[`Rust ${stamp}`, "Débutant"], [`Go ${stamp}`, "Avancé"]] as const) {
    await section.getByRole("button", { name: "Ajouter une compétence" }).click();
    await section.getByLabel("Compétence").fill(name);
    await section.getByLabel("Catégorie").fill(`Langages ${stamp}`);
    await section.getByRole("combobox", { name: "Niveau" }).click();
    await page.getByRole("option", { name: level }).click();
    await section.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(section.getByText(name, { exact: true })).toBeVisible();
  }

  const group = section.getByRole("list", { name: `Langages ${stamp}` });
  await expect(group.locator("li")).toHaveCount(2);
  await expect(group.locator("li").first()).toContainText("Débutant");

  // Masquer du CV, puis modifier : reste masqué.
  const go = group.locator("li").filter({ hasText: `Go ${stamp}` });
  await go.getByRole("checkbox").click();
  await expect(go.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  await section.getByRole("button", { name: `Modifier Go ${stamp}` }).click();
  await section.getByRole("combobox", { name: "Niveau" }).click();
  await page.getByRole("option", { name: "Expert" }).click();
  await section.getByRole("button", { name: "Enregistrer" }).click();
  await expect(go).toContainText("Expert");
  await expect(go.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");

  // Monter Go au-dessus de Rust.
  await section.getByRole("button", { name: `Monter Go ${stamp}` }).click();
  await expect(group.locator("li").first()).toContainText(`Go ${stamp}`);
  await page.reload();
  await expect(page.getByRole("region", { name: "Compétences" }).getByRole("list", { name: `Langages ${stamp}` }).locator("li").first()).toContainText(`Go ${stamp}`);
});
