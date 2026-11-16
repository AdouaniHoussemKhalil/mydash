-- Tests du presse-papiers partagé. Lancer : npm run db:test
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

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  format($$insert into public.shared_clipboard (workspace_id, text) values (%L, 'texte à passer')$$,
    (select id from ids where name = 'ws_alice')),
  'owner : peut enregistrer son presse-papiers');
select throws_ok(
  format($$insert into public.shared_clipboard (workspace_id, text) values (%L, 'intrusion')$$,
    (select id from ids where name = 'ws_bob')),
  '42501', null, 'impossible d''écrire dans le presse-papiers d''un autre');
select throws_ok(
  format($$update public.shared_clipboard set text = %L$$, repeat('x', 20001)),
  '23514', null, 'texte trop long refusé');
select throws_ok(
  format($$update public.shared_clipboard set workspace_id = %L$$, (select id from ids where name = 'ws_bob')),
  '42501', null, 'workspace_id n''est pas modifiable');
select lives_ok($$update public.shared_clipboard set text = ''$$, 'owner : peut vider');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.shared_clipboard), 0, 'étranger : ne voit pas le presse-papiers d''Alice');

select * from finish();
rollback;
