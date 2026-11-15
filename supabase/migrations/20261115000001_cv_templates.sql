-- CV : modèle et couleur retenus, niveau (jauge) des langues.

alter table public.profiles
  add column cv_template text not null default 'sobre' check (cv_template in ('sobre', 'colonnes')),
  -- Couleur d'accent du CV (#RRGGBB) ; null = couleur de l'app
  add column cv_color text check (cv_color ~ '^#[0-9a-fA-F]{6}$');

grant update (cv_template, cv_color) on public.profiles to authenticated;

-- Jauge facultative ; le niveau en texte libre (« C1 », « Natif ») reste.
alter table public.profile_languages
  add column score public.skill_level;

grant update (score) on public.profile_languages to authenticated;
