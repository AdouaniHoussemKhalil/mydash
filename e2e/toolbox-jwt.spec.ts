import { expect, test } from "@playwright/test";

const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

test("boîte à outils : JWT, timestamp, UUID", async ({ page }) => {
  // JWT expiré (exp en 2020), collé avec « Bearer ».
  await page.goto("/toolbox/jwt");
  const jwt = `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub: "42", role: "admin", exp: 1600000000 })}.c2lnbmF0dXJl`;
  await page.getByLabel("JWT").fill(`Bearer ${jwt}`);
  const main = page.getByRole("main");
  await expect(main.getByText("Expiré", { exact: true })).toBeVisible();
  await expect(main.getByText("HS256", { exact: true })).toBeVisible();
  await expect(main.getByLabel("Contenu (payload)")).toHaveValue(/"role": "admin"/);
  await expect(main.getByText("Expire le")).toBeVisible();

  await page.getByLabel("JWT").fill("pas.un");
  await expect(main.getByRole("alert")).toHaveText("Un JWT a 3 parties séparées par des points (ici 2)");

  // Timestamp
  await page.goto("/toolbox/timestamp");
  await page.getByLabel("Timestamp ou date").fill("1794700000");
  await expect(page.getByText("Lu comme : secondes")).toBeVisible();
  await expect(page.getByRole("main")).toContainText("2026-11-14T23:46:40.000Z");
  await page.getByRole("button", { name: "Maintenant" }).click();
  await expect(page.getByLabel("Timestamp ou date")).toHaveValue(/^\d{10}$/);

  // UUID v7 × 3
  await page.goto("/toolbox/uuid");
  await page.getByRole("tab", { name: "v7" }).click();
  await page.getByLabel("Nombre").fill("3");
  await page.getByRole("button", { name: "Générer" }).click();
  const value = await page.getByLabel("3 UUID").inputValue();
  const lines = value.split("\n");
  expect(lines).toHaveLength(3);
  for (const line of lines) expect(line).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
