import { getCurrentUser } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";
import type { Entries } from "./entries";

/** Toutes les listes du profil de l'utilisateur connecté, déjà ordonnées. */
export async function listEntries(): Promise<Entries> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const byPosition = { ascending: true } as const;
  const newestFirst = { ascending: false, nullsFirst: false } as const;

  const [skills, experiences, education, languages, projects, certifications] = await Promise.all([
    supabase.from("profile_skills").select("*").eq("user_id", user.id).order("position", byPosition).order("created_at"),
    supabase
      .from("profile_experiences")
      .select("*")
      .eq("user_id", user.id)
      // En cours (fin vide) d'abord, puis du plus récent au plus ancien.
      .order("end_date", { ascending: false, nullsFirst: true })
      .order("start_date", newestFirst),
    supabase
      .from("profile_education")
      .select("*")
      .eq("user_id", user.id)
      .order("end_date", { ascending: false, nullsFirst: true })
      .order("start_date", newestFirst),
    supabase.from("profile_languages").select("*").eq("user_id", user.id).order("position", byPosition).order("created_at"),
    supabase.from("profile_projects").select("*").eq("user_id", user.id).order("position", byPosition).order("created_at"),
    supabase.from("profile_certifications").select("*").eq("user_id", user.id).order("issued_on", newestFirst),
  ]);

  for (const result of [skills, experiences, education, languages, projects, certifications]) {
    if (result.error) throw new Error("Impossible de charger le profil");
  }
  return {
    skills: skills.data ?? [],
    experiences: experiences.data ?? [],
    education: education.data ?? [],
    languages: languages.data ?? [],
    projects: projects.data ?? [],
    certifications: certifications.data ?? [],
  };
}
