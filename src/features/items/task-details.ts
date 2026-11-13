import type { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

type Client = Awaited<ReturnType<typeof createClient>>;
type TaskValues = Pick<TablesUpdate<"task_details">, "status" | "due_date">;

/**
 * Écrit l'état et l'échéance d'une tâche : met à jour la ligne
 * task_details, ou la crée (tâches sans ligne). Renvoie false si refusé.
 */
export async function writeTaskDetails(
  supabase: Client,
  workspaceId: string,
  itemId: string,
  values: TaskValues,
): Promise<boolean> {
  const { data: updated, error } = await supabase
    .from("task_details")
    .update(values)
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId)
    .select("item_id");
  if (error) return false;
  if (updated.length > 0) return true;

  const { error: insertError } = await supabase
    .from("task_details")
    .insert({ ...values, item_id: itemId, workspace_id: workspaceId });
  return !insertError;
}
