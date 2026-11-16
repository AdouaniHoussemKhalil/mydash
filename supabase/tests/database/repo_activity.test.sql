-- Tests de repo_activity. Lancer : npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create temp table ids (name text primary key, id uuid not null);
grant select on ids to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test');

insert into ids
select 'ws_alice', id from public.workspaces where created_by = '11111111-1111-1111-1111-111111111111'
union all
select 'ws_bob', id from public.workspaces where created_by = '22222222-2222-2222-2222-222222222222';

insert into public.items (id, workspace_id, created_by, type, title, url)
values ('dddddddd-0000-0000-0000-000000000001', (select id from ids where name = 'ws_alice'),
        '11111111-1111-1111-1111-111111111111', 'repo', 'vercel/next.js', 'https://github.com/vercel/next.js');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  format($$insert into public.repo_activity (item_id, workspace_id, ci_state, open_pr_count, snapshot, fetched_at)
    values ('dddddddd-0000-0000-0000-000000000001', %L, 'failure', 3, '{"commits": []}', now())$$,
    (select id from ids where name = 'ws_alice')),
  'owner : peut enregistrer l''activité de son repo');
select throws_ok(
  $$update public.repo_activity set ci_state = 'rouge'$$,
  '23514', null, 'un état de CI inconnu est refusé');
select throws_ok(
  $$update public.repo_activity set snapshot = '[]'$$,
  '23514', null, 'le snapshot doit être un objet');
select throws_ok(
  format($$update public.repo_activity set workspace_id = %L$$, (select id from ids where name = 'ws_bob')),
  '42501', null, 'repo_activity : workspace_id n''est pas modifiable');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.repo_activity), 0, 'étranger : ne voit pas l''activité d''Alice');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
delete from public.items where id = 'dddddddd-0000-0000-0000-000000000001';
select is((select count(*)::int from public.repo_activity), 0, 'repo_activity est supprimé avec le repo');

select * from finish();
rollback;
