-- Calendrier : petites notes écrites directement dans un jour.
-- Indépendantes des items (ni module Notes, ni recherche).

create table public.calendar_notes (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  day          date not null,
  text         text not null check (char_length(btrim(text)) between 1 and 200),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index calendar_notes_day_idx on public.calendar_notes (workspace_id, day);

create trigger calendar_notes_updated_at before update on public.calendar_notes
  for each row execute function public.set_updated_at();

alter table public.calendar_notes enable row level security;

revoke update on public.calendar_notes from anon, authenticated;
grant update (day, text) on public.calendar_notes to authenticated;

create policy calendar_notes_select on public.calendar_notes
  for select to authenticated using (public.is_member(workspace_id));
create policy calendar_notes_insert on public.calendar_notes
  for insert to authenticated
  with check (public.can_write(workspace_id) and created_by = (select auth.uid()));
create policy calendar_notes_update on public.calendar_notes
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
create policy calendar_notes_delete on public.calendar_notes
  for delete to authenticated using (public.can_write(workspace_id));
