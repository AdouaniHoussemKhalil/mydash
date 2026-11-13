-- Moi : profil et CV. Données rattachées à l'utilisateur (pas au workspace),
-- lues et écrites par lui seul.

create type public.skill_level as enum ('debutant', 'intermediaire', 'avance', 'expert');

-- Liens affichés sur le CV : http(s) uniquement.
create function public.is_http_url(value text) returns boolean
language sql immutable
set search_path = ''
as $$
  select value is null or (value ~* '^https?://[^\s]+$' and char_length(value) <= 2048);
$$;

-- ─────────────── Identité ───────────────
create table public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '' check (char_length(full_name) <= 120),
  headline      text not null default '' check (char_length(headline) <= 160),
  summary       text not null default '' check (char_length(summary) <= 3000),
  contact_email text check (contact_email is null or (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(contact_email) <= 254)),
  phone         text check (char_length(phone) <= 40),
  location      text check (char_length(location) <= 120),
  website       text check (public.is_http_url(website)),
  linkedin      text check (public.is_http_url(linkedin)),
  github        text check (public.is_http_url(github)),
  -- Photo : <user_id>/<fichier> dans l'espace de stockage avatars
  photo_path    text check (photo_path is null or (photo_path ~ ('^' || user_id || '/[0-9a-f-]{36}\.(jpg|png|webp)$'))),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────── Listes du CV ───────────────
create table public.profile_skills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  category   text not null default '' check (char_length(category) <= 60),
  level      public.skill_level not null default 'intermediaire',
  position   integer not null default 0,
  show_on_cv boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profile_experiences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 120),
  organization text not null default '' check (char_length(organization) <= 120),
  location     text not null default '' check (char_length(location) <= 120),
  start_date   date not null,
  end_date     date,  -- null = en cours
  description  text not null default '' check (char_length(description) <= 3000),
  show_on_cv   boolean not null default true,
  created_at   timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.profile_education (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  degree      text not null check (char_length(btrim(degree)) between 1 and 160),
  school      text not null default '' check (char_length(school) <= 160),
  location    text not null default '' check (char_length(location) <= 120),
  start_date  date,
  end_date    date,
  description text not null default '' check (char_length(description) <= 3000),
  show_on_cv  boolean not null default true,
  created_at  timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.profile_languages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  level      text not null default '' check (char_length(level) <= 60),
  position   integer not null default 0,
  show_on_cv boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profile_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  url         text check (public.is_http_url(url)),
  position    integer not null default 0,
  show_on_cv  boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.profile_certifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 160),
  issuer     text not null default '' check (char_length(issuer) <= 120),
  issued_on  date,
  url        text check (public.is_http_url(url)),
  show_on_cv boolean not null default true,
  created_at timestamptz not null default now()
);

create index profile_skills_user_idx on public.profile_skills (user_id, position);
create index profile_experiences_user_idx on public.profile_experiences (user_id, start_date desc);
create index profile_education_user_idx on public.profile_education (user_id, start_date desc);
create index profile_languages_user_idx on public.profile_languages (user_id, position);
create index profile_projects_user_idx on public.profile_projects (user_id, position);
create index profile_certifications_user_idx on public.profile_certifications (user_id, issued_on desc);

-- ─────────────── Droits ───────────────
-- user_id n'est jamais modifiable ; le reste l'est par le propriétaire.
revoke update on public.profiles, public.profile_skills, public.profile_experiences, public.profile_education,
  public.profile_languages, public.profile_projects, public.profile_certifications
  from anon, authenticated;

grant update (full_name, headline, summary, contact_email, phone, location, website, linkedin, github, photo_path)
  on public.profiles to authenticated;
grant update (name, category, level, position, show_on_cv) on public.profile_skills to authenticated;
grant update (title, organization, location, start_date, end_date, description, show_on_cv)
  on public.profile_experiences to authenticated;
grant update (degree, school, location, start_date, end_date, description, show_on_cv)
  on public.profile_education to authenticated;
grant update (name, level, position, show_on_cv) on public.profile_languages to authenticated;
grant update (name, description, url, position, show_on_cv) on public.profile_projects to authenticated;
grant update (name, issuer, issued_on, url, show_on_cv) on public.profile_certifications to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'profile_skills', 'profile_experiences', 'profile_education',
                           'profile_languages', 'profile_projects', 'profile_certifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- ─────────────── Profil créé à l'inscription ───────────────
create or replace function public.handle_new_user() returns trigger
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

  insert into public.profiles (user_id, contact_email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Comptes existants.
insert into public.profiles (user_id, contact_email)
select id, case when email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then email end from auth.users
on conflict (user_id) do nothing;

-- ─────────────── Photo de profil ───────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);
create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);
create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);
