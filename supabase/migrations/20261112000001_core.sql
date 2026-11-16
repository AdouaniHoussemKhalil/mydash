-- MyDash — schéma noyau (Phase 0)
-- Toute donnée appartient à un workspace ; l'accès est contrôlé par la RLS
-- via l'appartenance à workspace_members (owner | editor | viewer).

create extension if not exists vector with schema extensions;

create type public.member_role as enum ('owner', 'editor', 'viewer');
create type public.item_type as enum (
  'link', 'note', 'doc', 'file', 'repo', 'tool', 'prompt', 'skill', 'snippet', 'task', 'event'
);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────── Workspaces ───────────────────────────

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  is_personal boolean not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.member_role not null default 'viewer',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

-- Helpers RLS. security definer : lisent workspace_members sans repasser
-- par ses propres policies (évite la récursion).
create function public.is_member(ws uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create function public.can_write(ws uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'editor')
  );
$$;

create function public.is_owner(ws uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

-- ─────────────────────────── Items ───────────────────────────

create table public.items (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  type          public.item_type not null,
  title         text not null check (char_length(btrim(title)) between 1 and 500),
  body          text not null default '',
  pinned        boolean not null default false,
  archived      boolean not null default false,
  in_inbox      boolean not null default true,
  parent_id     uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- 'simple' : contenu mêlant français, anglais et code, sans racinisation.
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', title), 'A') ||
    setweight(to_tsvector('simple', body), 'B')
  ) stored,
  -- Phase 5 (recherche sémantique). Non indexée tant qu'elle est vide.
  embedding     extensions.vector(1024),
  unique (id, workspace_id),
  -- un parent appartient forcément au même workspace
  foreign key (parent_id, workspace_id)
    references public.items (id, workspace_id) on delete set null (parent_id),
  check (parent_id is null or parent_id <> id)
);
create index items_list_idx   on public.items (workspace_id, type, archived, updated_at desc);
create index items_search_idx on public.items using gin (search_vector);
create index items_pinned_idx on public.items (workspace_id) where pinned and not archived;
create index items_inbox_idx  on public.items (workspace_id) where in_inbox and not archived;
create index items_parent_idx on public.items (parent_id) where parent_id is not null;
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ─────────────────────────── Tags & Espaces ───────────────────────────

create table public.tags (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 50),
  color        text check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at   timestamptz not null default now(),
  unique (id, workspace_id)
);
create unique index tags_name_uniq on public.tags (workspace_id, lower(name));

create table public.spaces (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  icon         text check (char_length(icon) <= 40),
  color        text check (color ~ '^#[0-9a-fA-F]{6}$'),
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, workspace_id)
);
create index spaces_workspace_idx on public.spaces (workspace_id, position);
create trigger spaces_updated_at before update on public.spaces
  for each row execute function public.set_updated_at();

-- Liaisons : workspace_id + FK composites => impossible de relier des
-- éléments de workspaces différents, et la RLS reste une simple appartenance.
create table public.item_tags (
  workspace_id uuid not null,
  item_id      uuid not null,
  tag_id       uuid not null,
  primary key (item_id, tag_id),
  foreign key (item_id, workspace_id) references public.items (id, workspace_id) on delete cascade,
  foreign key (tag_id, workspace_id) references public.tags (id, workspace_id) on delete cascade
);
create index item_tags_tag_idx on public.item_tags (tag_id);

create table public.item_spaces (
  workspace_id uuid not null,
  item_id      uuid not null,
  space_id     uuid not null,
  primary key (item_id, space_id),
  foreign key (item_id, workspace_id) references public.items (id, workspace_id) on delete cascade,
  foreign key (space_id, workspace_id) references public.spaces (id, workspace_id) on delete cascade
);
create index item_spaces_space_idx on public.item_spaces (space_id);

create table public.item_links (
  workspace_id uuid not null,
  from_item    uuid not null,
  to_item      uuid not null,
  relation     text not null default 'related' check (char_length(relation) between 1 and 40),
  created_at   timestamptz not null default now(),
  primary key (from_item, to_item, relation),
  check (from_item <> to_item),
  foreign key (from_item, workspace_id) references public.items (id, workspace_id) on delete cascade,
  foreign key (to_item, workspace_id) references public.items (id, workspace_id) on delete cascade
);
create index item_links_to_idx on public.item_links (to_item);

-- ─────────────────────── Workspace personnel à l'inscription ───────────────────────

create function public.handle_new_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  ws uuid;
begin
  insert into public.workspaces (name, is_personal, created_by)
  values ('Personnel', true, new.id)
  returning id into ws;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws, new.id, 'owner');

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────── Droits par colonne ───────────────────────────
-- workspace_id, created_by et les identifiants ne sont jamais modifiables
-- par le client ; les tables de liaison ne se modifient pas (delete + insert).

revoke update on public.workspaces, public.workspace_members, public.items, public.tags,
  public.spaces, public.item_tags, public.item_spaces, public.item_links
  from anon, authenticated;

grant update (name) on public.workspaces to authenticated;
grant update (type, title, body, pinned, archived, in_inbox, parent_id) on public.items to authenticated;
grant update (name, color) on public.tags to authenticated;
grant update (name, icon, color, position) on public.spaces to authenticated;

-- ─────────────────────────── RLS ───────────────────────────

alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.items             enable row level security;
alter table public.tags              enable row level security;
alter table public.spaces            enable row level security;
alter table public.item_tags         enable row level security;
alter table public.item_spaces       enable row level security;
alter table public.item_links        enable row level security;

-- Workspaces : créés par trigger uniquement (MVP) ; renommage par l'owner.
create policy workspaces_select on public.workspaces
  for select to authenticated using (public.is_member(id));
create policy workspaces_update on public.workspaces
  for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));

-- Membres : lecture seule en MVP. Les écritures (invitations) arriveront
-- avec le partage, sous forme de policies is_owner().
create policy workspace_members_select on public.workspace_members
  for select to authenticated using (public.is_member(workspace_id));

-- Items : created_by ne peut pas être usurpé.
create policy items_select on public.items
  for select to authenticated using (public.is_member(workspace_id));
create policy items_insert on public.items
  for insert to authenticated
  with check (public.can_write(workspace_id) and created_by = (select auth.uid()));
create policy items_update on public.items
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
create policy items_delete on public.items
  for delete to authenticated using (public.can_write(workspace_id));

-- Tags, Espaces et liaisons : lecture membres, écriture owner/editor.
do $$
declare
  t text;
begin
  foreach t in array array['tags', 'spaces', 'item_tags', 'item_spaces', 'item_links'] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated using (public.is_member(workspace_id))', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated with check (public.can_write(workspace_id))', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated using (public.can_write(workspace_id))', t);
  end loop;

  foreach t in array array['tags', 'spaces'] loop
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated using (public.can_write(workspace_id)) with check (public.can_write(workspace_id))', t);
  end loop;
end;
$$;
