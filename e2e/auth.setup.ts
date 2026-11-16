import { test as setup } from "@playwright/test";
import { AUTH_FILE, signUp } from "./helpers";

/**
 * Crée un compte une seule fois et enregistre la session : les tests la
 * réutilisent (plus rapide, et préchauffe le serveur fraîchement démarré).
 */
setup("créer un compte de test", async ({ page }) => {
  setup.setTimeout(90_000);
  await signUp(page);
  await page.context().storageState({ path: AUTH_FILE });
});
