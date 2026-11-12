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

/** Ouvre la palette au clavier et attend le champ. */
export async function openPalette(page: Page) {
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByRole("combobox", { name: "Capturer ou rechercher" });
  await expect(input).toBeVisible();
  return input;
}

/** Valeur du titre dans le panneau détail. */
export function detailTitle(page: Page) {
  return page.getByRole("complementary", { name: /Détail/ }).getByLabel("Titre");
}
