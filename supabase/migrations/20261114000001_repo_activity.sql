-- Repos : activité GitHub (CI, PR, commits, issues), mise en cache.

create table public.repo_activity (
  item_id        uuid primary key,
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  -- Résumé pour les listes
  ci_state       text check (ci_state in ('success', 'failure', 'running', 'cancelled', 'none')),
  open_pr_count  integer check (open_pr_count >= 0),
  -- Détail affiché (dépôt, CI, PR, commits, issues), validé côté serveur
  snapshot       jsonb not null default '{}'::jsonb
                 check (jsonb_typeof(snapshot) = 'object' and pg_column_size(snapshot) <= 200000),
  -- Dernière tentative (réussie ou non) ; null = jamais récupéré
  fetched_at     timestamptz,
  fetch_error    text check (char_length(fetch_error) <= 300),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (item_id, workspace_id),
  foreign key (item_id, workspace_id)
    references public.items (id, workspace_id) on delete cascade
);

create trigger repo_activity_updated_at before update on public.repo_activity
  for each row execute function public.set_updated_at();

alter table public.repo_activity enable row level security;

revoke update on public.repo_activity from anon, authenticated;
grant update (ci_state, open_pr_count, snapshot, fetched_at, fetch_error)
  on public.repo_activity to authenticated;

create policy repo_activity_select on public.repo_activity
  for select to authenticated using (public.is_member(workspace_id));
create policy repo_activity_insert on public.repo_activity
  for insert to authenticated with check (public.can_write(workspace_id));
create policy repo_activity_update on public.repo_activity
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
create policy repo_activity_delete on public.repo_activity
  for delete to authenticated using (public.can_write(workspace_id));
