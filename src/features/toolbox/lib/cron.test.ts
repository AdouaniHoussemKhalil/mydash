import { describe, expect, it } from "vitest";
import { describeCron, nextRuns, parseCron } from "./cron";

function describe_(expression: string): string {
  const result = parseCron(expression);
  if (!result.ok) throw new Error(result.error);
  return describeCron(result.cron);
}

describe("describeCron", () => {
  it.each([
    ["* * * * *", "Toutes les minutes"],
    ["*/15 * * * *", "Toutes les 15 minutes"],
    ["0 9 * * 1", "Tous les lundis, à 9 h 00"],
    ["30 18 * * *", "Tous les jours à 18 h 30"],
    ["0 9 * * 1-5", "Du lundi au vendredi, à 9 h 00"],
    ["0 9 * * MON-FRI", "Du lundi au vendredi, à 9 h 00"],
    ["0 8,18 * * *", "Tous les jours à 8 h 00 et 18 h 00"],
    ["0 0 1 * *", "Le 1er du mois, à 0 h 00"],
    ["0 0 1,15 * *", "Le 1er et 15 du mois, à 0 h 00"],
    ["*/10 9-17 * * 1-5", "Du lundi au vendredi, toutes les 10 minutes entre 9 h 00 et 17 h 50"],
    ["0 */2 * * *", "Toutes les 2 heures à la minute 00"],
    ["5 * * * *", "Toutes les heures à la minute 05"],
    ["0 9 * 1,7 *", "Tous les jours à 9 h 00, en janvier et juillet"],
    ["0 9 * 6-8 *", "Tous les jours à 9 h 00, de juin à août"],
    ["0 9 * * 0,6", "Le samedi et dimanche, à 9 h 00"],
    ["0 9 * * 7", "Tous les dimanches, à 9 h 00"],
    ["@daily", "Tous les jours à 0 h 00"],
    ["@hourly", "Toutes les heures à la minute 00"],
  ])("%s → %s", (expression, sentence) => {
    expect(describe_(expression)).toBe(sentence);
  });
});

describe("parseCron : erreurs par champ", () => {
  it.each([
    ["0 9 * *", "Il faut 5 champs (minute heure jour mois jour-de-semaine), ici 4"],
    ["0 0 9 * * 1", "Il faut 5 champs (minute heure jour mois jour-de-semaine), ici 6 : les secondes ne sont pas prises en charge"],
    ["75 9 * * *", "Minutes : 75 est hors de 0–59"],
    ["0 25 * * *", "Heures : 25 est hors de 0–23"],
    ["0 9 * 13 *", "Mois : 13 est hors de 1–12"],
    ["0 9 * * lun", "Jour de la semaine : « lun » n'est pas une valeur valide"],
    ["0 9-5 * * *", "Heures : l'intervalle 9-5 est à l'envers"],
    ["*/0 * * * *", "Minutes : pas « /0 » invalide"],
    ["", "Saisis une expression cron (ex. 0 9 * * 1)"],
  ])("%s", (expression, error) => {
    expect(parseCron(expression)).toEqual({ ok: false, error });
  });
});

describe("nextRuns", () => {
  const parsed = (expression: string) => {
    const result = parseCron(expression);
    if (!result.ok) throw new Error(result.error);
    return result.cron;
  };
  // Dimanche 15 novembre 2026, 10:30 (heure locale)
  const from = new Date(2026, 10, 15, 10, 30);

  it("lundis à 9 h", () => {
    const runs = nextRuns(parsed("0 9 * * 1"), 3, from);
    expect(runs.map((run) => [run.getDate(), run.getHours(), run.getMinutes()])).toEqual([
      [16, 9, 0],
      [23, 9, 0],
      [30, 9, 0],
    ]);
  });

  it("toutes les 15 minutes : à partir de la prochaine", () => {
    expect(nextRuns(parsed("*/15 * * * *"), 2, from).map((run) => run.getMinutes())).toEqual([45, 0]);
  });

  it("jour du mois OU jour de semaine (règle cron)", () => {
    const runs = nextRuns(parsed("0 0 1 * 1"), 3, from);
    expect(runs.map((run) => [run.getMonth(), run.getDate()])).toEqual([
      [10, 16],
      [10, 23],
      [10, 30],
    ]);
  });

  it("29 février : trouve la prochaine année bissextile", () => {
    const [run] = nextRuns(parsed("0 0 29 2 *"), 1, from);
    expect(run?.getFullYear()).toBe(2028);
  });
});
