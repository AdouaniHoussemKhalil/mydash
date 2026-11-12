-- Phase 1 — Liens : URL sur les items, statut de lecture des liens.

-- URL portée par l'item (liens aujourd'hui ; repos et outils plus tard).
-- http(s) uniquement : jamais de javascript: ou data: rendus dans un href.
alter table public.items
  add column url text
  check (url is null or (url ~* '^https?://[^\s]+$' and char_length(url) <= 2048));

grant update (url) on public.items to authenticated;

-- Données propres aux liens, créées à la demande (statut, plus tard aperçu).
create table public.link_meta (
  item_id      uuid primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- même workspace que l'item ; unique pour une relation 1-1 côté API
  unique (item_id, workspace_id),
  foreign key (item_id, workspace_id)
    references public.items (id, workspace_id) on delete cascade
);

create trigger link_meta_updated_at before update on public.link_meta
  for each row execute function public.set_updated_at();

alter table public.link_meta enable row level security;

revoke update on public.link_meta from anon, authenticated;
grant update (is_read) on public.link_meta to authenticated;

create policy link_meta_select on public.link_meta
  for select to authenticated using (public.is_member(workspace_id));
create policy link_meta_insert on public.link_meta
  for insert to authenticated with check (public.can_write(workspace_id));
create policy link_meta_update on public.link_meta
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
create policy link_meta_delete on public.link_meta
  for delete to authenticated using (public.can_write(workspace_id));
