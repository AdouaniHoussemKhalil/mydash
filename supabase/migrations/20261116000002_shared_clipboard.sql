-- Boîte à outils : presse-papiers partagé entre machines (un texte par espace).

create table public.shared_clipboard (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  text         text not null default '' check (char_length(text) <= 20000),
  updated_by   uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now()
);

create trigger shared_clipboard_updated_at before update on public.shared_clipboard
  for each row execute function public.set_updated_at();

alter table public.shared_clipboard enable row level security;

revoke update on public.shared_clipboard from anon, authenticated;
grant update (text) on public.shared_clipboard to authenticated;

create policy shared_clipboard_select on public.shared_clipboard
  for select to authenticated using (public.is_member(workspace_id));
create policy shared_clipboard_insert on public.shared_clipboard
  for insert to authenticated
  with check (public.can_write(workspace_id) and updated_by = (select auth.uid()));
create policy shared_clipboard_update on public.shared_clipboard
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
