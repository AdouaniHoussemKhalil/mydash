-- Tests RLS du schéma noyau. Lancer : npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Identifiants partagés entre rôles (lisibles par authenticated).
create temp table ids (name text primary key, id uuid not null);
grant select on ids to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test');

insert into ids
select 'ws_alice', id from public.workspaces where created_by = '11111111-1111-1111-1111-111111111111'
union all
select 'ws_bob', id from public.workspaces where created_by = '22222222-2222-2222-2222-222222222222';

-- ── Inscription ──
select is(
  (select count(*)::int from public.workspaces
   where created_by = '11111111-1111-1111-1111-111111111111' and is_personal and name = 'Personnel'),
  1, 'l''inscription crée un workspace personnel');
select is(
  (select role::text from public.workspace_members
   where user_id = '11111111-1111-1111-1111-111111111111'),
  'owner', 'l''utilisateur est owner de son workspace');

-- ── Alice (owner) ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.items (workspace_id, type, title, body)
    values ((select id from ids where name = 'ws_alice'), 'note', 'Bonjour MyDash', 'premier contenu')$$,
  'owner : peut créer un item dans son workspace');
select is((select count(*)::int from public.items), 1, 'owner : voit son item');
select is((select count(*)::int from public.workspaces), 1, 'owner : ne voit que son workspace');
select ok(
  (select search_vector @@ to_tsquery('simple', 'mydash') from public.items limit 1),
  'search_vector est alimenté automatiquement');
select is((select created_by from public.items limit 1),
  '11111111-1111-1111-1111-111111111111'::uuid, 'created_by vaut auth.uid() par défaut');

select throws_ok(
  $$insert into public.items (workspace_id, type, title, created_by)
    values ((select id from ids where name = 'ws_alice'), 'note', 'usurpation',
            '22222222-2222-2222-2222-222222222222')$$,
  '42501', null, 'created_by ne peut pas être usurpé');
select throws_ok(
  $$update public.items set workspace_id = (select id from ids where name = 'ws_bob')$$,
  '42501', null, 'workspace_id n''est pas modifiable');
select throws_ok(
  $$insert into public.items (workspace_id, type, title)
    values ((select id from ids where name = 'ws_bob'), 'note', 'intrusion')$$,
  '42501', null, 'impossible d''écrire dans le workspace d''un autre');
select throws_ok(
  $$insert into public.workspace_members (workspace_id, user_id, role)
    values ((select id from ids where name = 'ws_alice'), '22222222-2222-2222-2222-222222222222', 'editor')$$,
  '42501', null, 'ajout de membres fermé en MVP');

select lives_ok(
  $$insert into public.tags (workspace_id, name) values ((select id from ids where name = 'ws_alice'), 'Dev')$$,
  'owner : peut créer un tag');
select throws_ok(
  $$insert into public.tags (workspace_id, name) values ((select id from ids where name = 'ws_alice'), 'dev')$$,
  '23505', null, 'nom de tag unique sans tenir compte de la casse');

-- ── Bob (étranger au workspace d'Alice) ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*)::int from public.items), 0, 'étranger : ne voit pas les items d''Alice');
select is((select count(*)::int from public.tags), 0, 'étranger : ne voit pas les tags d''Alice');

insert into public.tags (workspace_id, name) values ((select id from ids where name = 'ws_bob'), 'Perso');

-- ── Bob devient viewer chez Alice ──
reset role;
insert into public.workspace_members (workspace_id, user_id, role)
values ((select id from ids where name = 'ws_alice'), '22222222-2222-2222-2222-222222222222', 'viewer');
insert into ids select 'item_alice', id from public.items limit 1;
insert into ids select 'tag_bob', id from public.tags where name = 'Perso';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*)::int from public.items), 1, 'viewer : voit les items du workspace partagé');
select throws_ok(
  $$insert into public.items (workspace_id, type, title)
    values ((select id from ids where name = 'ws_alice'), 'note', 'pas le droit')$$,
  '42501', null, 'viewer : ne peut pas créer');
update public.items set title = 'modifié';
select is((select title from public.items limit 1), 'Bonjour MyDash', 'viewer : ne peut pas modifier');

-- ── Isolation des liaisons ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.item_tags (workspace_id, item_id, tag_id)
    values ((select id from ids where name = 'ws_alice'),
            (select id from ids where name = 'item_alice'),
            (select id from ids where name = 'tag_bob'))$$,
  '23503', null, 'impossible de lier un tag d''un autre workspace');
select lives_ok(
  $$insert into public.item_tags (workspace_id, item_id, tag_id)
    select i.workspace_id, i.id, t.id from public.items i join public.tags t using (workspace_id)
    where t.name = 'Dev'$$,
  'owner : peut taguer un item de son workspace');

select * from finish();
rollback;
