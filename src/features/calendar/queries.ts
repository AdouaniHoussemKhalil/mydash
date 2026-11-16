import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import type { CalendarNote } from "./schemas";

/** Notes du calendrier du workspace actif (plus récentes en dernier dans un même jour). */
export async function listCalendarNotes(limit = 3000): Promise<CalendarNote[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_notes")
    .select("id, day, text")
    .eq("workspace_id", workspaceId)
    .order("day", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error("Impossible de charger les notes du calendrier");
  return data;
}
