import { expect, test } from "@playwright/test";

/** Date « AAAA-MM-JJ » du jour, dans le fuseau du navigateur de test. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

test("calendrier : une tâche à échéance s'affiche et s'ouvre", async ({ page }) => {
  const title = `Échéance calendrier ${Date.now()}`;
  await page.goto("/tasks");
  await page.getByRole("textbox", { name: /Ajouter : tâche/ }).fill(title);
  await page.getByLabel("Échéance (facultatif)").fill(today());
  await page.getByRole("textbox", { name: /Ajouter : tâche/ }).press("Enter");
  await expect(page).toHaveURL(/\/tasks\?item=/);

  await page.goto("/calendar");
  const event = page.locator(".fc-event", { hasText: title });
  await expect(event).toBeVisible({ timeout: 20_000 });

  await event.click();
  await expect(page).toHaveURL(/\/calendar\?item=/);
  await expect(page.getByRole("complementary", { name: /Détail/ }).getByLabel("Titre")).toHaveValue(title);

  // Vue semaine : la tâche du jour y est aussi.
  await page.getByRole("button", { name: /semaine/i }).click();
  await expect(event).toBeVisible();
});
