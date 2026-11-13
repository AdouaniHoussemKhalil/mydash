-- Tests des liens (URL, link_meta). Lancer : npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

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

-- ── URL ──
select lives_ok(
  $$insert into public.items (workspace_id, type, title, url)
    values ((select id from ids where name = 'ws_alice'), 'link', 'Next.js', 'https://nextjs.org/docs')$$,
  'un lien peut porter une URL https');
select throws_ok(
  $$insert into public.items (workspace_id, type, title, url)
    values ((select id from ids where name = 'ws_alice'), 'link', 'piège', 'javascript:alert(1)')$$,
  '23514', null, 'une URL javascript: est refusée');
select throws_ok(
  $$insert into public.items (workspace_id, type, title, url)
    values ((select id from ids where name = 'ws_alice'), 'link', 'espace', 'https://exemple.com/a b')$$,
  '23514', null, 'une URL avec espace est refusée');
select lives_ok(
  $$update public.items set url = 'http://exemple.com' where title = 'Next.js'$$,
  'owner : peut modifier l''URL');

-- ── link_meta ──
reset role;
insert into ids select 'link_alice', id from public.items where title = 'Next.js';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.link_meta (item_id, workspace_id, is_read)
    values ((select id from ids where name = 'link_alice'), (select id from ids where name = 'ws_alice'), true)$$,
  'owner : peut marquer un lien comme lu');
select throws_ok(
  $$insert into public.link_meta (item_id, workspace_id)
    values ((select id from ids where name = 'link_alice'), (select id from ids where name = 'ws_bob'))$$,
  '42501', null, 'link_meta : impossible d''écrire dans un autre workspace');
select throws_ok(
  $$update public.link_meta set workspace_id = (select id from ids where name = 'ws_bob')$$,
  '42501', null, 'link_meta : workspace_id n''est pas modifiable');

select lives_ok(
  $$update public.link_meta set page_title = 'Docs', image_url = 'https://nextjs.org/og.png',
      fetched_at = now()$$,
  'owner : peut enregistrer l''aperçu');
select throws_ok(
  $$update public.link_meta set image_url = 'javascript:alert(1)'$$,
  '23514', null, 'une image d''aperçu non http(s) est refusée');

-- ── Bob (étranger) ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.link_meta), 0, 'étranger : ne voit pas link_meta d''Alice');

-- ── Suppression en cascade ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
delete from public.items where id = (select id from ids where name = 'link_alice');
select is((select count(*)::int from public.link_meta), 0, 'link_meta est supprimé avec le lien');

select * from finish();
rollback;
