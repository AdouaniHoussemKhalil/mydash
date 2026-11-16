-- Repos : l'URL capturée était rangée dans le contenu ; elle passe dans items.url.
-- Seulement quand le contenu n'est QUE l'URL d'un dépôt GitHub ou GitLab.
update public.items
set url = regexp_replace(btrim(body), '(\.git)?/?$', ''),
    body = ''
where type = 'repo'
  and url is null
  and btrim(body) ~* '^https://(www\.)?(github|gitlab)\.com/[^\s/]+/[^\s]+$'
  and char_length(btrim(body)) <= 2048;
