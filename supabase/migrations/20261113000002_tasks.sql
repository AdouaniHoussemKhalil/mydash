-- Phase 1 — Tâches : échéance et état.

create type public.task_status as enum ('todo', 'doing', 'done');

-- Données propres aux tâches (relation 1-1 avec items).
create table public.task_details (
  item_id      uuid primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  status       public.task_status not null default 'todo',
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (item_id, workspace_id),
  foreign key (item_id, workspace_id)
    references public.items (id, workspace_id) on delete cascade
);

-- Calendrier : tâches d'un workspace sur une période.
create index task_details_due_idx on public.task_details (workspace_id, due_date)
  where due_date is not null;

create trigger task_details_updated_at before update on public.task_details
  for each row execute function public.set_updated_at();

alter table public.task_details enable row level security;

revoke update on public.task_details from anon, authenticated;
grant update (status, due_date) on public.task_details to authenticated;

create policy task_details_select on public.task_details
  for select to authenticated using (public.is_member(workspace_id));
create policy task_details_insert on public.task_details
  for insert to authenticated with check (public.can_write(workspace_id));
create policy task_details_update on public.task_details
  for update to authenticated
  using (public.can_write(workspace_id)) with check (public.can_write(workspace_id));
create policy task_details_delete on public.task_details
  for delete to authenticated using (public.can_write(workspace_id));

-- Tâches créées avant cette migration : « à faire », sans échéance.
insert into public.task_details (item_id, workspace_id)
select id, workspace_id from public.items where type = 'task'
on conflict (item_id) do nothing;
