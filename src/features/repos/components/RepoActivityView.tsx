"use client";

import { GitBranch, GitCommitHorizontal, GitPullRequest, CircleDot, RefreshCw, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Badge, Button, Skeleton } from "@/components/ui/core";
import { formatDateTime, formatRelative } from "@/lib/format";
import { CI_LABELS, type CiState, PULL_LABELS, type PullState } from "../map";
import type { RepoActivity } from "../queries";

const STALE_AFTER_MS = 10 * 60 * 1000;

const CI_VARIANT: Record<CiState, "success" | "danger" | "warning" | "outline"> = {
  success: "success",
  failure: "danger",
  running: "warning",
  cancelled: "outline",
  none: "outline",
};

const PULL_VARIANT: Record<PullState, "success" | "soft" | "outline" | "danger"> = {
  open: "success",
  draft: "outline",
  merged: "soft",
  closed: "danger",
};

function When({ date }: { date: string | null }) {
  if (!date) return null;
  return (
    <time dateTime={date} title={formatDateTime(date)} suppressHydrationWarning>
      {formatRelative(date)}
    </time>
  );
}

function External({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ?? "hover:underline"}>
      {children}
    </a>
  );
}

/** Demande le rafraîchissement ; renvoie le message d'erreur éventuel. */
async function requestActivity(itemId: string, force: boolean): Promise<string | null> {
  try {
    const response = await fetch(`/api/items/${itemId}/github${force ? "?force=1" : ""}`, { method: "POST" });
    const body = (await response.json().catch(() => ({}))) as { error?: string | null };
    return body.error ?? (response.ok ? null : "Activité GitHub indisponible.");
  } catch {
    return "Connexion interrompue.";
  }
}

export type RepoActivityViewProps = {
  itemId: string;
  /** Dépôt GitHub (le suivi GitLab n'existe pas encore). */
  isGithub: boolean;
  activity: RepoActivity | null;
};

/**
 * Activité GitHub d'un repo : CI de la branche par défaut, PR (avec leur
 * CI), derniers commits, issues ouvertes. Rafraîchie à l'ouverture si elle
 * a plus de 10 min, ou à la demande.
 */
export function RepoActivityView({ itemId, isGithub, activity }: RepoActivityViewProps) {
  const router = useRouter();
  const headingId = useId();
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // L'état n'est modifié qu'à la réponse (callback), jamais pendant l'effet.
  const fetchActivity = useCallback(
    (force: boolean) =>
      requestActivity(itemId, force).then((error) => {
        setRequestError(error);
        router.refresh();
      }),
    [itemId, router],
  );

  const refreshNow = () => {
    setRefreshing(true);
    void fetchActivity(true).finally(() => setRefreshing(false));
  };

  // À l'ouverture : récupérer en arrière-plan si jamais fait ou trop ancien.
  const autoRequested = useRef(false);
  useEffect(() => {
    if (!isGithub || autoRequested.current) return;
    const last = activity?.fetchedAt ? new Date(activity.fetchedAt).getTime() : 0;
    if (Date.now() - last >= STALE_AFTER_MS) {
      autoRequested.current = true;
      void fetchActivity(false);
    }
  }, [isGithub, activity?.fetchedAt, fetchActivity]);

  if (!isGithub) {
    return (
      <section aria-labelledby={headingId} className="flex flex-col gap-1">
        <h3 id={headingId} className="text-sm font-medium text-neutral-12">
          Activité
        </h3>
        <p className="text-sm text-neutral-11">Le suivi d&apos;activité est disponible pour GitHub uniquement pour l&apos;instant.</p>
      </section>
    );
  }

  const snapshot = activity?.snapshot ?? null;
  const error = requestError ?? activity?.fetchError ?? null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={headingId} className="text-sm font-medium text-neutral-12">
          Activité GitHub
        </h3>
        <span role="status" aria-live="polite" className="text-xs text-neutral-11">
          {refreshing ? "Mise à jour…" : activity?.fetchedAt ? <>Mis à jour <When date={activity.fetchedAt} /></> : null}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={refreshNow} disabled={refreshing}>
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger-11">
          {error}
        </p>
      )}

      {!snapshot ? (
        refreshing || !error ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Chargement de l'activité">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null
      ) : (
        <>
          <div className="flex flex-col gap-1.5 text-sm">
            {snapshot.repo.description && <p className="text-neutral-11">{snapshot.repo.description}</p>}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-11">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5" aria-hidden />
                {snapshot.repo.stars.toLocaleString("fr-FR")}
              </span>
              <span className="inline-flex items-center gap-1">
                <GitBranch className="size-3.5" aria-hidden />
                {snapshot.repo.defaultBranch}
              </span>
              {snapshot.repo.pushedAt && (
                <span>
                  Dernier push <When date={snapshot.repo.pushedAt} />
                </span>
              )}
              {snapshot.repo.private && <Badge variant="outline">Privé</Badge>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-6 px-3 py-2 text-sm">
            <Badge variant={CI_VARIANT[snapshot.ci.state]}>{CI_LABELS[snapshot.ci.state]}</Badge>
            {snapshot.ci.workflow && (
              <span className="text-neutral-11">
                {snapshot.ci.workflow} · {snapshot.ci.branch} · <When date={snapshot.ci.updatedAt} />
              </span>
            )}
            {snapshot.ci.url && (
              <External href={snapshot.ci.url} className="ml-auto text-xs text-accent-11 hover:underline">
                Voir le run
              </External>
            )}
          </div>

          <ActivityList
            title={`Pull requests · ${snapshot.openPullCount} ouverte${snapshot.openPullCount > 1 ? "s" : ""}`}
            icon={<GitPullRequest className="size-4" aria-hidden />}
            empty="Aucune pull request."
            items={snapshot.pulls.map((pull) => ({
              key: `pr-${pull.number}`,
              main: (
                <External href={pull.url}>
                  #{pull.number} {pull.title}
                </External>
              ),
              meta: (
                <>
                  {pull.author && <span>{pull.author}</span>}
                  <When date={pull.updatedAt} />
                </>
              ),
              badges: (
                <>
                  {pull.ci === "failure" && <Badge variant="danger">CI en échec</Badge>}
                  {pull.ci === "running" && <Badge variant="warning">CI en cours</Badge>}
                  <Badge variant={PULL_VARIANT[pull.state]}>{PULL_LABELS[pull.state]}</Badge>
                </>
              ),
            }))}
          />

          <ActivityList
            title="Derniers commits"
            icon={<GitCommitHorizontal className="size-4" aria-hidden />}
            empty="Aucun commit."
            items={snapshot.commits.map((commit) => ({
              key: `c-${commit.sha}`,
              main: <External href={commit.url}>{commit.message}</External>,
              meta: (
                <>
                  <code className="font-mono">{commit.sha}</code>
                  {commit.author && <span>{commit.author}</span>}
                  <When date={commit.date} />
                </>
              ),
            }))}
          />

          <ActivityList
            title="Issues ouvertes"
            icon={<CircleDot className="size-4" aria-hidden />}
            empty="Aucune issue ouverte."
            items={snapshot.issues.map((issue) => ({
              key: `i-${issue.number}`,
              main: (
                <External href={issue.url}>
                  #{issue.number} {issue.title}
                </External>
              ),
              meta: (
                <>
                  {issue.author && <span>{issue.author}</span>}
                  <When date={issue.updatedAt} />
                </>
              ),
            }))}
          />
        </>
      )}
    </section>
  );
}

type Row = { key: string; main: React.ReactNode; meta: React.ReactNode; badges?: React.ReactNode };

function ActivityList({ title, icon, empty, items }: { title: string; icon: React.ReactNode; empty: string; items: Row[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <h4 id={id} className="flex items-center gap-1.5 text-xs font-medium text-neutral-11">
        {icon}
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-11">{empty}</p>
      ) : (
        <ul aria-labelledby={id} className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6">
          {items.map((row) => (
            <li key={row.key} className="flex items-start gap-2 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate text-neutral-12">{row.main}</p>
                <p className="flex flex-wrap gap-x-2 text-xs text-neutral-11">{row.meta}</p>
              </div>
              {row.badges && <div className="flex shrink-0 flex-wrap justify-end gap-1">{row.badges}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
