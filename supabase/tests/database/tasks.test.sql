-- Tests des tâches (task_details). Lancer : npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

create temp table ids (name text primary key, id uuid not null);
grant select on ids to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test');

insert into ids
select 'ws_alice', id from public.workspaces where created_by = '11111111-1111-1111-1111-111111111111'
union all
select 'ws_bob', id from public.workspaces where created_by = '22222222-2222-2222-2222-222222222222';

insert into public.items (id, workspace_id, created_by, type, title)
values ('cccccccc-0000-0000-0000-000000000001', (select id from ids where name = 'ws_alice'),
        '11111111-1111-1111-1111-111111111111', 'task', 'Rendre le rapport');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  format($$insert into public.task_details (item_id, workspace_id, due_date)
    values ('cccccccc-0000-0000-0000-000000000001', %L, '2026-12-01')$$, (select id from ids where name = 'ws_alice')),
  'owner : peut donner une échéance à sa tâche');
select is((select status::text from public.task_details), 'todo', 'une tâche commence « à faire »');
select lives_ok(
  $$update public.task_details set status = 'done', due_date = null$$,
  'owner : peut changer l''état et retirer l''échéance');
select throws_ok(
  $$update public.task_details set status = 'bloquée'$$,
  '22P02', null, 'un état inconnu est refusé');
select throws_ok(
  format($$update public.task_details set workspace_id = %L$$, (select id from ids where name = 'ws_bob')),
  '42501', null, 'task_details : workspace_id n''est pas modifiable');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.task_details), 0, 'étranger : ne voit pas les tâches d''Alice');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
delete from public.items where id = 'cccccccc-0000-0000-0000-000000000001';
select is((select count(*)::int from public.task_details), 0, 'task_details est supprimé avec la tâche');

select * from finish();
rollback;
