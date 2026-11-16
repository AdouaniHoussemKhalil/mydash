-- Tests des notes du calendrier. Lancer : npm run db:test
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
  format($$insert into public.calendar_notes (workspace_id, day, text) values (%L, '2026-11-12', 'Appeler le comptable')$$,
    (select id from ids where name = 'ws_alice')),
  'owner : peut écrire une note dans un jour');
select throws_ok(
  format($$insert into public.calendar_notes (workspace_id, day, text) values (%L, '2026-11-12', '   ')$$,
    (select id from ids where name = 'ws_alice')),
  '23514', null, 'note vide refusée');
select throws_ok(
  format($$insert into public.calendar_notes (workspace_id, day, text) values (%L, '2026-11-12', 'intrusion')$$,
    (select id from ids where name = 'ws_bob')),
  '42501', null, 'impossible d''écrire dans le calendrier d''un autre');
select throws_ok(
  format($$update public.calendar_notes set workspace_id = %L$$, (select id from ids where name = 'ws_bob')),
  '42501', null, 'workspace_id n''est pas modifiable');
select lives_ok($$update public.calendar_notes set text = 'Appeler le comptable à 14 h', day = '2026-11-13'$$,
  'owner : peut modifier le texte et le jour');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.calendar_notes), 0, 'étranger : ne voit pas les notes d''Alice');

select * from finish();
rollback;
