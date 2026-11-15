/** Expression cron à 5 champs : minute, heure, jour du mois, mois, jour de la semaine. */

type FieldDef = { name: string; min: number; max: number; names?: Record<string, number> };

const MONTH_NAMES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const DAY_NAMES = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const FIELDS: FieldDef[] = [
  { name: "Minutes", min: 0, max: 59 },
  { name: "Heures", min: 0, max: 23 },
  { name: "Jour du mois", min: 1, max: 31 },
  { name: "Mois", min: 1, max: 12, names: MONTH_NAMES },
  // 7 est accepté pour dimanche (ramené à 0).
  { name: "Jour de la semaine", min: 0, max: 7, names: DAY_NAMES },
];

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export type CronField = {
  /** Valeurs triées et uniques. */
  values: number[];
  /** « * » (ou « ? ») : aucune restriction. */
  any: boolean;
  /** Pas « *\/n » depuis le minimum, pour une description plus naturelle. */
  step: number | null;
};

export type ParsedCron = {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
};

export type CronResult = { ok: true; cron: ParsedCron } | { ok: false; error: string };

function parseValue(token: string, field: FieldDef): number {
  const named = field.names?.[token.toLowerCase()];
  if (named !== undefined) return named;
  if (!/^\d+$/.test(token)) throw new Error(`${field.name} : « ${token} » n'est pas une valeur valide`);
  const value = Number(token);
  if (value < field.min || value > field.max) {
    throw new Error(`${field.name} : ${value} est hors de ${field.min}–${field.max}`);
  }
  return value;
}

function parseField(text: string, field: FieldDef): CronField {
  if (text === "*" || text === "?") {
    return { values: range(field.min, field.name === "Jour de la semaine" ? 6 : field.max), any: true, step: null };
  }
  const values = new Set<number>();
  let step: number | null = null;
  for (const part of text.split(",")) {
    if (!part) throw new Error(`${field.name} : élément vide dans la liste`);
    const [base, stepText, extra] = part.split("/");
    if (extra !== undefined) throw new Error(`${field.name} : un seul « / » par élément`);
    let increment = 1;
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1) throw new Error(`${field.name} : pas « /${stepText} » invalide`);
      increment = Number(stepText);
    }
    let from: number;
    let to: number;
    if (base === "*") {
      from = field.min;
      to = field.name === "Jour de la semaine" ? 6 : field.max;
      if (stepText !== undefined && text.split(",").length === 1) step = increment;
    } else if (base!.includes("-")) {
      const [start, end] = base!.split("-");
      from = parseValue(start!, field);
      to = parseValue(end!, field);
      if (from > to) throw new Error(`${field.name} : l'intervalle ${base} est à l'envers`);
    } else {
      from = parseValue(base!, field);
      to = stepText !== undefined ? (field.name === "Jour de la semaine" ? 6 : field.max) : from;
    }
    for (let value = from; value <= to; value += increment) values.add(field.name === "Jour de la semaine" && value === 7 ? 0 : value);
  }
  return { values: [...values].sort((a, b) => a - b), any: false, step };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

export function parseCron(expression: string): CronResult {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "Saisis une expression cron (ex. 0 9 * * 1)" };
  const source = MACROS[trimmed.toLowerCase()] ?? trimmed;
  const parts = source.split(/\s+/);
  if (parts.length !== 5) {
    return {
      ok: false,
      error: `Il faut 5 champs (minute heure jour mois jour-de-semaine), ici ${parts.length}${parts.length === 6 ? " : les secondes ne sont pas prises en charge" : ""}`,
    };
  }
  try {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map((part, index) => parseField(part, FIELDS[index]!)) as [
      CronField,
      CronField,
      CronField,
      CronField,
      CronField,
    ];
    return { ok: true, cron: { minute, hour, dayOfMonth, month, dayOfWeek } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Expression invalide" };
  }
}

// ─────────────── Prochaines exécutions ───────────────

function dayMatches(cron: ParsedCron, date: Date): boolean {
  if (!cron.month.values.includes(date.getMonth() + 1)) return false;
  const domMatch = cron.dayOfMonth.values.includes(date.getDate());
  const dowMatch = cron.dayOfWeek.values.includes(date.getDay());
  // Règle cron : si les deux jours sont restreints, l'un OU l'autre suffit.
  if (!cron.dayOfMonth.any && !cron.dayOfWeek.any) return domMatch || dowMatch;
  return domMatch && dowMatch;
}

/** Prochaines exécutions (heure locale) strictement après `from`. */
export function nextRuns(cron: ParsedCron, count = 5, from: Date = new Date()): Date[] {
  const runs: Date[] = [];
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // Au plus ~ 8 ans de jours (couvre « 29 février »).
  for (let index = 0; index < 366 * 8 && runs.length < count; index++) {
    if (dayMatches(cron, day)) {
      for (const hour of cron.hour.values) {
        for (const minute of cron.minute.values) {
          const run = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
          if (run > from) {
            runs.push(run);
            if (runs.length === count) return runs;
          }
        }
      }
    }
    day.setDate(day.getDate() + 1);
  }
  return runs;
}

// ─────────────── Description en français ───────────────

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const time = (hour: number, minute: number) => `${hour} h ${String(minute).padStart(2, "0")}`;

function joinFr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}

/** Valeurs consécutives ? (pour « de 9 h à 17 h », « du lundi au vendredi ») */
function contiguous(values: number[]): boolean {
  return values.length > 2 && values.every((value, index) => index === 0 || value === values[index - 1]! + 1);
}

function describeTime(minute: CronField, hour: CronField): string {
  if (minute.any && hour.any) return "toutes les minutes";
  if (minute.step && hour.any) return `toutes les ${minute.step} minutes`;
  if (minute.step && contiguous(hour.values)) {
    const last = minute.values.at(-1)!;
    return `toutes les ${minute.step} minutes entre ${time(hour.values[0]!, 0)} et ${time(hour.values.at(-1)!, last)}`;
  }
  if (minute.any && !hour.any) {
    return contiguous(hour.values)
      ? `toutes les minutes entre ${time(hour.values[0]!, 0)} et ${time(hour.values.at(-1)!, 59)}`
      : `toutes les minutes de ${joinFr(hour.values.map((h) => `${h} h`))}`;
  }
  const minutes = joinFr(minute.values.map((m) => String(m).padStart(2, "0")));
  if (hour.any) return minute.values.length === 1 ? `toutes les heures à la minute ${minutes}` : `aux minutes ${minutes} de chaque heure`;
  if (hour.step) return `toutes les ${hour.step} heures à la minute ${minutes}`;
  if (contiguous(hour.values) && minute.values.length === 1) {
    return `toutes les heures de ${time(hour.values[0]!, minute.values[0]!)} à ${time(hour.values.at(-1)!, minute.values[0]!)}`;
  }
  const times = hour.values.flatMap((h) => minute.values.map((m) => time(h, m)));
  return times.length <= 6 ? `à ${joinFr(times)}` : `aux minutes ${minutes} de ${joinFr(hour.values.map((h) => `${h} h`))}`;
}

function describeDays(cron: ParsedCron): string | null {
  const { dayOfMonth, dayOfWeek } = cron;
  const weekdays = () => {
    // Lundi → dimanche (dimanche en dernier), pour « du lundi au vendredi ».
    const ordered = dayOfWeek.values.map((day) => (day === 0 ? 7 : day)).sort((a, b) => a - b);
    if (contiguous(ordered)) return `du ${DAYS[ordered[0]! % 7]} au ${DAYS[ordered.at(-1)! % 7]}`;
    return `le ${joinFr(ordered.map((day) => DAYS[day % 7]!))}`.replace(/^le (\S+)$/, "tous les $1s");
  };
  const monthDays = () => {
    const days = dayOfMonth.values.map((day) => (day === 1 ? "1er" : String(day)));
    if (dayOfMonth.step) return `tous les ${dayOfMonth.step} jours`;
    return `le ${joinFr(days)} du mois`;
  };
  if (dayOfMonth.any && dayOfWeek.any) return null;
  if (!dayOfMonth.any && !dayOfWeek.any) return `${monthDays()} ou ${weekdays()}`;
  return dayOfWeek.any ? monthDays() : weekdays();
}

function describeMonths(month: CronField): string | null {
  if (month.any) return null;
  if (contiguous(month.values)) return `de ${MONTHS[month.values[0]! - 1]} à ${MONTHS[month.values.at(-1)! - 1]}`;
  return `en ${joinFr(month.values.map((value) => MONTHS[value - 1]!))}`;
}

/** « Tous les lundis à 9 h 00 », « Toutes les 15 minutes »… */
export function describeCron(cron: ParsedCron): string {
  const timePart = describeTime(cron.minute, cron.hour);
  const dayPart = describeDays(cron);
  const monthPart = describeMonths(cron.month);
  const isFrequency = timePart.startsWith("toutes");
  let sentence: string;
  if (!dayPart) sentence = isFrequency ? timePart : `tous les jours ${timePart}`;
  else sentence = `${dayPart}, ${timePart}`;
  if (monthPart) sentence += `, ${monthPart}`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
