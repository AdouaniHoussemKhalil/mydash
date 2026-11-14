-- Tests du profil (Moi). Lancer : npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test');

select is(
  (select contact_email from public.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'alice@example.test', 'l''inscription crée le profil avec l''e-mail de contact');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from public.profiles), 1, 'ne voit que son propre profil');
select lives_ok(
  $$update public.profiles set full_name = 'Alice Martin', headline = 'Développeuse', linkedin = 'https://linkedin.com/in/alice'$$,
  'peut modifier son profil');
select throws_ok(
  $$update public.profiles set website = 'javascript:alert(1)'$$,
  '23514', null, 'lien non http(s) refusé');
select throws_ok(
  $$update public.profiles set user_id = '22222222-2222-2222-2222-222222222222'$$,
  '42501', null, 'user_id n''est pas modifiable');
select throws_ok(
  $$update public.profiles set photo_path = '22222222-2222-2222-2222-222222222222/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e6f.png'$$,
  '23514', null, 'la photo doit être dans son propre dossier');

-- ── Listes ──
select lives_ok(
  $$insert into public.profile_skills (name, category, level) values ('TypeScript', 'Frontend', 'expert')$$,
  'peut ajouter une compétence (user_id = soi par défaut)');
select throws_ok(
  $$insert into public.profile_skills (name, level) values ('SQL', 'champion')$$,
  '22P02', null, 'niveau inconnu refusé');
select throws_ok(
  $$insert into public.profile_skills (user_id, name) values ('22222222-2222-2222-2222-222222222222', 'Usurpation')$$,
  '42501', null, 'impossible d''écrire pour un autre utilisateur');
select throws_ok(
  $$insert into public.profile_experiences (title, start_date, end_date) values ('Dev', '2024-06-01', '2023-01-01')$$,
  '23514', null, 'une expérience ne peut pas finir avant de commencer');
select lives_ok(
  $$insert into public.profile_experiences (title, organization, start_date) values ('Dev', 'Acme', '2024-06-01')$$,
  'expérience en cours (sans fin)');

-- ── Bob ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.profile_skills) + (select count(*)::int from public.profile_experiences), 0,
  'étranger : ne voit pas les compétences ni les expériences d''Alice');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e6f.png')$$,
  '42501', null, 'impossible de déposer une photo dans le dossier d''un autre');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', '22222222-2222-2222-2222-222222222222/0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e6f.png')$$,
  'peut déposer sa propre photo');

select * from finish();
rollback;
