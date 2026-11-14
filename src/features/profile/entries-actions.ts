"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { ENTRY_KINDS, ENTRY_SCHEMAS, ENTRY_TABLES, type EntryKind, POSITIONED } from "./entries";

const kindSchema = z.enum(ENTRY_KINDS);
const idSchema = z.uuid("Élément introuvable");

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Table d'une liste. Les six tables ont la même forme d'accès (user_id,
 * id) ; le nom vient de ENTRY_TABLES (jamais de l'utilisateur) et les
 * valeurs sont validées par le schéma du type : le cast est sans risque.
 */
function table(supabase: Client, kind: EntryKind) {
  return supabase.from(ENTRY_TABLES[kind] as "profile_projects");
}

/** Crée (id absent) ou modifie une entrée d'une liste du profil. */
export async function saveEntry(kind: unknown, id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedKind = kindSchema.safeParse(kind);
  if (!parsedKind.success) return { ok: false, error: "Liste inconnue" };
  const parsed = ENTRY_SCHEMAS[parsedKind.data].safeParse(values);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data as Record<string, unknown>;

  const user = await getCurrentUser();
  const supabase = await createClient();

  if (id === null || id === undefined) {
    let position: number | undefined;
    if (POSITIONED.has(parsedKind.data)) {
      // À la fin de la liste.
      const { data: last } = await table(supabase, parsedKind.data)
        .select("position")
        .eq("user_id", user.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      position = ((last as { position?: number } | null)?.position ?? -1) + 1;
    }
    const { data: created, error } = await table(supabase, parsedKind.data)
      .insert({ ...data, ...(position !== undefined ? { position } : {}) } as never)
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Ajout impossible. Réessaie." };
    refresh();
    return { ok: true, data: { id: created.id } };
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Élément introuvable" };
  const { data: updated, error } = await table(supabase, parsedKind.data)
    .update(data as never)
    .eq("user_id", user.id)
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Enregistrement impossible. Réessaie." };
  if (!updated) return { ok: false, error: "Élément introuvable" };
  refresh();
  return { ok: true, data: { id: updated.id } };
}

export async function deleteEntry(kind: unknown, id: unknown): Promise<ActionResult> {
  const parsedKind = kindSchema.safeParse(kind);
  const parsedId = idSchema.safeParse(id);
  if (!parsedKind.success || !parsedId.success) return { ok: false, error: "Élément introuvable" };
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error, count } = await table(supabase, parsedKind.data)
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("id", parsedId.data);
  if (error || !count) return { ok: false, error: "Suppression impossible. Réessaie." };
  refresh();
  return { ok: true, data: undefined };
}

/** Afficher ou masquer une entrée sur le CV. */
export async function setShowOnCv(kind: unknown, id: unknown, show: unknown): Promise<ActionResult> {
  const parsedKind = kindSchema.safeParse(kind);
  const parsedId = idSchema.safeParse(id);
  const parsedShow = z.boolean().safeParse(show);
  if (!parsedKind.success || !parsedId.success || !parsedShow.success) return { ok: false, error: "Données invalides" };
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await table(supabase, parsedKind.data)
    .update({ show_on_cv: parsedShow.data })
    .eq("user_id", user.id)
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: "Enregistrement impossible. Réessaie." };
  refresh();
  return { ok: true, data: undefined };
}

/**
 * Nouvel ordre d'une liste ordonnée à la main : ids dans l'ordre voulu.
 * Les positions sont réécrites 0, 1, 2… (listes courtes).
 */
export async function reorderEntries(kind: unknown, ids: unknown): Promise<ActionResult> {
  const parsedKind = kindSchema.safeParse(kind);
  const parsedIds = z.array(idSchema).max(200).safeParse(ids);
  if (!parsedKind.success || !parsedIds.success || !POSITIONED.has(parsedKind.data)) {
    return { ok: false, error: "Ordre invalide" };
  }
  const user = await getCurrentUser();
  const supabase = await createClient();
  const results = await Promise.all(
    parsedIds.data.map((entryId, position) =>
      table(supabase, parsedKind.data).update({ position }).eq("user_id", user.id).eq("id", entryId),
    ),
  );
  if (results.some((result) => result.error)) return { ok: false, error: "Réordonnancement impossible. Réessaie." };
  refresh();
  return { ok: true, data: undefined };
}
