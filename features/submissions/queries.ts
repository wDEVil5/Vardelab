import { createClient } from "@/lib/supabase/server";

/**
 * Entregas de un hito, de la más reciente a la más antigua. La RLS
 * `submissions_select_member_or_manager` (M5) las deja ver a los integrantes del
 * equipo y al gestor.
 */
export async function getMilestoneSubmissions(milestoneId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("submissions")
    .select("id, url, nota, submitted_by, created_at")
    .eq("milestone_id", milestoneId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMilestoneSubmissions]", error.message);
    return [];
  }

  return data;
}

export type Submission = Awaited<
  ReturnType<typeof getMilestoneSubmissions>
>[number];
