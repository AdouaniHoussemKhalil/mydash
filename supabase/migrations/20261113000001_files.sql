-- Phase 1 — Fichiers : stockage privé Supabase Storage + table item_files.

-- ─────────────── Espace de stockage ───────────────
-- Privé : lecture par URL signée uniquement. 50 Mo par fichier.
insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

-- ─────────────── Métadonnées ───────────────
create table public.item_files (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  item_id      uuid not null,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  name         text not null check (char_length(btrim(name)) between 1 and 255),
  mime_type    text not null default 'application/octet-stream' check (char_length(mime_type) <= 255),
  size_bytes   bigint not null check (size_bytes between 0 and 52428800),
  -- <workspace_id>/<item_id>/<uuid> : le chemin désigne toujours son workspace
  storage_path text not null unique check (
    storage_path ~ ('^' || workspace_id || '/' || item_id || '/[0-9a-f-]{36}$')
  ),
  created_at   timestamptz not null default now(),
  foreign key (item_id, workspace_id)
    references public.items (id, workspace_id) on delete cascade
);

create index item_files_item_idx on public.item_files (item_id, created_at);

alter table public.item_files enable row level security;

revoke update on public.item_files from anon, authenticated;
grant update (name) on public.item_files to authenticated;

create policy item_files_select on public.item_files
  for select to authenticated using (public.is_member(workspace_id));
create policy item_files_insert on public.item_files
  for insert to authenticated
  with check (public.can_write(workspace_id) and created_by = (select auth.uid()));
create policy item_files_update on public.item_files
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
create policy item_files_delete on public.item_files
  for delete to authenticated using (public.can_write(workspace_id));

-- ─────────────── Droits sur les objets stockés ───────────────
-- Workspace désigné par le premier segment du chemin (null s'il n'est pas un uuid).
create function public.storage_workspace_id(object_name text) returns uuid
language sql immutable
set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

-- Item désigné par le deuxième segment, s'il appartient bien à ce workspace.
create function public.storage_item_in_workspace(object_name text) returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.items i
    where i.workspace_id = public.storage_workspace_id(object_name)
      and i.id::text = split_part(object_name, '/', 2)
  );
$$;

create policy files_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'files' and public.is_member(public.storage_workspace_id(name)));
create policy files_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'files'
    and public.can_write(public.storage_workspace_id(name))
    and public.storage_item_in_workspace(name)
  );
create policy files_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'files' and public.can_write(public.storage_workspace_id(name)));
