"use server";

import { refresh } from "next/cache";
import { getActiveWorkspaceId } from "@/features/workspace";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { daySchema, noteIdSchema, noteTextSchema } from "./schemas";

/** Écrit une petite note dans un jour. */
export async function addCalendarNote(day: unknown, text: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedDay = daySchema.safeParse(day);
  const parsedText = noteTextSchema.safeParse(text);
  if (!parsedDay.success) return { ok: false, error: firstIssue(parsedDay.error) };
  if (!parsedText.success) return { ok: false, error: firstIssue(parsedText.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_notes")
    .insert({ workspace_id: workspaceId, day: parsedDay.data, text: parsedText.data })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Enregistrement impossible. Réessaie." };
  refresh();
  return { ok: true, data };
}

export async function updateCalendarNote(id: unknown, text: unknown): Promise<ActionResult> {
  const parsedId = noteIdSchema.safeParse(id);
  const parsedText = noteTextSchema.safeParse(text);
  if (!parsedId.success) return { ok: false, error: "Note introuvable" };
  if (!parsedText.success) return { ok: false, error: firstIssue(parsedText.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_notes")
    .update({ text: parsedText.data })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Enregistrement impossible. Réessaie." };
  if (!data) return { ok: false, error: "Note introuvable" };
  refresh();
  return { ok: true, data: undefined };
}

export async function deleteCalendarNote(id: unknown): Promise<ActionResult> {
  const parsedId = noteIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Note introuvable" };
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("calendar_notes")
    .delete({ count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data);
  if (error || !count) return { ok: false, error: "Suppression impossible. Réessaie." };
  refresh();
  return { ok: true, data: undefined };
}
