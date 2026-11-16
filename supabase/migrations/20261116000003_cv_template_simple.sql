-- CV : modèle « Simple » (une colonne, sans photo ni niveaux de compétences).

alter table public.profiles drop constraint profiles_cv_template_check;
alter table public.profiles
  add constraint profiles_cv_template_check check (cv_template in ('sobre', 'colonnes', 'simple'));
