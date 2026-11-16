import { expect, test } from "@playwright/test";

test("calendrier : écrire, modifier et supprimer une note dans un jour", async ({ page }) => {
  const text = `Note du jour ${Date.now()}`;
  await page.goto("/calendar");

  const todayCell = page.locator(".fc-day-today");
  await expect(todayCell).toBeVisible({ timeout: 20_000 });
  await todayCell.hover();
  await todayCell.getByRole("button", { name: /Ajouter une note le/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Nouvelle note" })).toBeVisible();
  await dialog.getByLabel("Note").fill(text);
  await dialog.getByRole("button", { name: "Ajouter" }).click();
  await expect(dialog).toBeHidden();

  const note = todayCell.locator(".fc-event.calendar-note", { hasText: text });
  await expect(note).toBeVisible();

  // La note n'est pas une note de l'application : elle reste propre au calendrier.
  await expect(page).toHaveURL(/\/calendar$/);

  await note.click();
  await expect(dialog.getByRole("heading", { name: "Modifier la note" })).toBeVisible();
  await expect(dialog.getByLabel("Note")).toHaveValue(text);
  await dialog.getByLabel("Note").fill(`${text} (modifiée)`);
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(todayCell.locator(".calendar-note", { hasText: "(modifiée)" })).toBeVisible();

  // Rechargement : la note est bien enregistrée.
  await page.reload();
  const edited = page.locator(".fc-day-today .calendar-note", { hasText: "(modifiée)" });
  await expect(edited).toBeVisible({ timeout: 20_000 });

  await edited.click();
  await dialog.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.locator(".calendar-note", { hasText: text })).toHaveCount(0);
});

test("calendrier : une note vide est refusée", async ({ page }) => {
  await page.goto("/calendar");
  const todayCell = page.locator(".fc-day-today");
  await expect(todayCell).toBeVisible({ timeout: 20_000 });
  await todayCell.hover();
  await todayCell.getByRole("button", { name: /Ajouter une note le/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Note").fill("   ");
  await dialog.getByRole("button", { name: "Ajouter" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Écris quelque chose");
  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toBeHidden();
});
