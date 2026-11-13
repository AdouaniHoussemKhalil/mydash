import { unstable_rethrow } from "next/navigation";
import { repoFromHref } from "@/lib/repo";
import { getRepoActivity, type RepoActivity } from "../queries";
import { RepoActivityView } from "./RepoActivityView";

/** Section « Activité GitHub » du détail d'un repo. */
export async function ItemRepoActivity({ itemId, url }: { itemId: string; url: string | null }) {
  const repo = url ? repoFromHref(url) : null;
  if (!repo) {
    return <p className="text-sm text-neutral-11">Ajoute l&apos;URL du dépôt pour suivre son activité.</p>;
  }
  let activity: RepoActivity | null;
  try {
    activity = await getRepoActivity(itemId);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-sm text-danger-11">
        Impossible de charger l&apos;activité. Recharge la page.
      </p>
    );
  }
  // Activité d'un autre dépôt (URL modifiée depuis) : ne pas l'afficher.
  const current = `${repo.owner}/${repo.name}`.toLowerCase();
  if (activity?.snapshot && activity.snapshot.repo.fullName.toLowerCase() !== current) {
    activity = { snapshot: null, ciState: null, fetchedAt: null, fetchError: null };
  }
  return <RepoActivityView itemId={itemId} isGithub={repo.provider === "github"} activity={activity} />;
}
