import { expect, type Page } from "@playwright/test";

/** Session partagée, créée par auth.setup.ts (non versionnée). */
export const AUTH_FILE = "e2e/.auth/user.json";

/** Crée un compte neuf par l'interface (confirmation d'e-mail désactivée en local). */
export async function signUp(page: Page, next = "/today") {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByRole("button", { name: /Créer un compte/ }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("motdepasse-solide-42");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/?]/g, "\\$&")}$`));
  return email;
}

/**
 * Ouvre la palette au clavier. Juste après un chargement, le raccourci peut
 * arriver avant l'hydratation (écouteur pas encore posé) : on réessaie,
 * sans re-presser si elle est déjà ouverte (le raccourci bascule).
 */
export async function openPalette(page: Page) {
  const input = page.getByRole("combobox", { name: "Capturer ou rechercher" });
  await expect(async () => {
    if (!(await input.isVisible())) await page.keyboard.press("ControlOrMeta+k");
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  return input;
}

/** Valeur du titre dans le panneau détail. */
export function detailTitle(page: Page) {
  return page.getByRole("complementary", { name: /Détail/ }).getByLabel("Titre");
}
