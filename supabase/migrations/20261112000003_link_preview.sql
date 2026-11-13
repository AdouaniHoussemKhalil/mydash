-- Phase 1 — Aperçu des liens (balises Open Graph lues côté serveur).

alter table public.link_meta
  add column page_title  text check (char_length(page_title) <= 500),
  add column description text check (char_length(description) <= 1000),
  add column site_name   text check (char_length(site_name) <= 200),
  -- rendues dans <img src> : http(s) uniquement
  add column image_url   text check (image_url ~* '^https?://[^\s]+$' and char_length(image_url) <= 2048),
  add column favicon_url text check (favicon_url ~* '^https?://[^\s]+$' and char_length(favicon_url) <= 2048),
  -- dernière tentative (réussie ou non) ; null = jamais récupéré
  add column fetched_at  timestamptz,
  add column fetch_error text check (char_length(fetch_error) <= 200);

grant update (page_title, description, site_name, image_url, favicon_url, fetched_at, fetch_error)
  on public.link_meta to authenticated;
