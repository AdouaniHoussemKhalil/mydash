import { z } from "zod";

export const CLIPBOARD_MAX = 20_000;

export type SharedClipboard = { text: string; updatedAt: string | null };

export const clipboardTextSchema = z.string().max(CLIPBOARD_MAX, `${CLIPBOARD_MAX.toLocaleString("fr")} caractères maximum`);
