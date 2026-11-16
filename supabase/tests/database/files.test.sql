-- Tests des fichiers (item_files, Storage). Lancer : npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

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
values ('aaaaaaaa-0000-0000-0000-000000000001', (select id from ids where name = 'ws_alice'),
        '11111111-1111-1111-1111-111111111111', 'file', 'rapport.pdf');

select is(
  (select public from storage.buckets where id = 'files'), false, 'l''espace de stockage files est privé');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- ── item_files ──
select lives_ok(
  format($$insert into public.item_files (workspace_id, item_id, name, mime_type, size_bytes, storage_path)
    values (%L, 'aaaaaaaa-0000-0000-0000-000000000001', 'rapport.pdf', 'application/pdf', 1024, %L)$$,
    (select id from ids where name = 'ws_alice'),
    (select id from ids where name = 'ws_alice') || '/aaaaaaaa-0000-0000-0000-000000000001/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e6f'),
  'owner : peut rattacher un fichier à son item');
select throws_ok(
  format($$insert into public.item_files (workspace_id, item_id, name, size_bytes, storage_path)
    values (%L, 'aaaaaaaa-0000-0000-0000-000000000001', 'x', 1, %L)$$,
    (select id from ids where name = 'ws_alice'),
    (select id from ids where name = 'ws_bob') || '/aaaaaaaa-0000-0000-0000-000000000001/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e70'),
  '23514', null, 'le chemin doit désigner le workspace et l''item du fichier');
select throws_ok(
  format($$insert into public.item_files (workspace_id, item_id, name, size_bytes, storage_path)
    values (%L, 'aaaaaaaa-0000-0000-0000-000000000001', 'gros', 52428801, 'x')$$,
    (select id from ids where name = 'ws_alice')),
  '23514', null, 'plus de 50 Mo est refusé');

-- ── Objets Storage ──
select lives_ok(
  format($$insert into storage.objects (bucket_id, name)
    values ('files', %L)$$,
    (select id from ids where name = 'ws_alice') || '/aaaaaaaa-0000-0000-0000-000000000001/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e6f'),
  'owner : peut déposer un objet dans son workspace');
select throws_ok(
  format($$insert into storage.objects (bucket_id, name)
    values ('files', %L)$$,
    (select id from ids where name = 'ws_bob') || '/aaaaaaaa-0000-0000-0000-000000000001/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e71'),
  '42501', null, 'impossible de déposer dans le workspace d''un autre');
select throws_ok(
  format($$insert into storage.objects (bucket_id, name)
    values ('files', %L)$$,
    (select id from ids where name = 'ws_alice') || '/bbbbbbbb-0000-0000-0000-000000000009/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e72'),
  '42501', null, 'impossible de déposer pour un item inexistant');

-- ── Bob (étranger) ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.item_files), 0, 'étranger : ne voit pas les fichiers d''Alice');
select is((select count(*)::int from storage.objects where bucket_id = 'files'), 0,
  'étranger : ne voit pas les objets stockés d''Alice');

-- ── Suppression en cascade ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
delete from public.items where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is((select count(*)::int from public.item_files), 0, 'item_files est supprimé avec l''item');

select * from finish();
rollback;
