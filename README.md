# MyDash

Application web personnelle qui centralise et organise liens, fichiers, documentations, notes, repos Git, outils favoris, prompts, skills et calendrier.

**Stack** : Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS v4 · [QuickadUI](https://quickadui-docs-nu.vercel.app/) · Supabase (PostgreSQL, Auth, Storage, RLS) · Zod · Vitest.

## Prérequis

- Node.js **24** (`.nvmrc`)
- npm 11
- Docker Desktop (Supabase en local)

## Installation locale

```bash
git clone https://github.com/AdouaniHoussemKhalil/mydash.git
cd mydash
npm install
npm run db:start             # Supabase local (Docker) + migrations
cp .env.example .env.local   # puis coller la clé publishable affichée par db:start
npm run dev                  # http://localhost:3000
```

### Supabase en local

Le projet utilise les ports **55320 à 55329**, ce qui lui permet de tourner en même temps qu'un autre projet Supabase local resté sur les ports par défaut (543xx).

| Service | URL |
|---|---|
| API | http://127.0.0.1:55321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Studio | http://127.0.0.1:55323 |
| Mails de test (Inbucket) | http://127.0.0.1:55324 |

| Commande | Rôle |
|---|---|
| `npm run db:start` / `db:stop` / `db:status` | Démarrer, arrêter, afficher les URL et clés locales |
| `npm run db:reset` | Recréer la base : migrations + `seed.sql` |
| `npm run db:test` | Tests RLS (pgTAP, `supabase/tests/`) |
| `npm run db:lint` | Lint du schéma |
| `npm run db:types` | Régénérer `src/lib/supabase/database.types.ts` (à faire après chaque migration) |

Nouvelle migration : `npx supabase migration new <nom>`, puis `npm run db:reset`, `npm run db:types` et `npm run db:test`.

### Authentification

L'authentification passe par Supabase Auth, par **e-mail + mot de passe** (10 caractères minimum) ou par **GitHub OAuth**.
- **Fichier `src/proxy.ts`** : rafraîchit la session à chaque requête et redirige vers `/login?next=…` toute page protégée.
- **Côté serveur**, l'utilisateur est lu via `getCurrentUser()` (`src/features/auth/session.ts`), qui valide le JWT avec `getClaims()`.
- En local, la confirmation par e-mail est désactivée. Les e-mails partent dans Inbucket.

**Activer GitHub en local**, une seule fois :
1. Créer une OAuth App sur https://github.com/settings/developers :
   - *Homepage URL* : `http://localhost:3000`
   - *Authorization callback URL* : `http://127.0.0.1:55321/auth/v1/callback`
2. Copier `supabase/.env.example` vers `supabase/.env`, puis y renseigner le *Client ID* et un *Client secret*. Ce fichier n'est pas commité.
3. Relancer Supabase : `npm run db:stop && npm run db:start`.

Sans ces valeurs, Supabase démarre quand même : seul le bouton GitHub échoue, et renvoie vers `/login?error=oauth`.

### Modèle de données

- Toute donnée appartient à un **workspace**. À l'inscription, un workspace « Personnel » est créé automatiquement, avec l'utilisateur comme `owner`.
- **RLS sur toutes les tables** : la lecture est ouverte aux membres du workspace, l'écriture est réservée aux rôles `owner` et `editor`.
- **Garde-fous** :
  - `workspace_id` et `created_by` ne sont pas modifiables par le client ;
  - des clés étrangères composites empêchent de relier des éléments de workspaces différents.
- `items` est la table centrale commune à tous les types. Elle contient la colonne `search_vector` (générée automatiquement, avec un index GIN) et la colonne `embedding`, réservée à la recherche sémantique.
- Une colonne `url` (http ou https uniquement, contrôlé en base) porte l'adresse des liens. Les données propres aux liens (statut lu / à lire) sont dans `link_meta`, en relation 1-1 avec `items`.
- **Aperçu des liens** : la route `POST /api/items/[id]/preview` lit les balises Open Graph de la page (titre, description, image, favicon) et les enregistre dans `link_meta`. Garde-fous contre le SSRF :
  - http et https uniquement, sur les ports 80, 443, 8080 et 8443 ;
  - adresses privées, locales et réservées refusées, y compris après redirection et au moment de la connexion (pas de contournement par DNS) ;
  - 5 s et 512 Ko maximum, 3 redirections au plus.
- **Fichiers** : ils sont stockés dans l'espace Supabase Storage privé `files`, au chemin `<workspace>/<item>/<uuid>`, avec 50 Mo maximum par fichier. Leurs métadonnées sont dans `item_files`.
  - Les règles d'accès Storage reprennent celles du workspace : lecture pour les membres, dépôt et suppression pour `owner` et `editor`, et seulement pour un élément existant.
  - Le navigateur envoie le fichier directement à Storage, par une URL signée. La lecture passe par des URL signées valables 10 minutes.
  - Storage n'accepte la suppression que par son API : supprimer un élément supprime donc aussi ses fichiers stockés, depuis l'action serveur.
- **Tâches** : l'état (`todo`, `doing` ou `done`) et l'échéance (type `date`) sont dans `task_details`, en relation 1-1 avec l'élément. Une ligne est créée pour chaque tâche. Le retard se calcule dans le navigateur, d'après la date locale de l'utilisateur.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Types de routes Next + `tsc --noEmit` |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Vitest en mode watch |
| `npm run test:e2e` | Tests e2e Playwright (build + démarrage automatiques) |

### Tests e2e

Prérequis : Supabase local démarré (`npm run db:start`), `.env.local` rempli et Chromium installé une fois (`npx playwright install chromium`).

`npm run test:e2e` construit l'app, la démarre sur le port 3000, puis lance les tests :
- **Projet `setup`** : crée un compte de test et enregistre sa session dans `e2e/.auth/` (non versionné).
- **Projet `desktop`** : parcours capture → recherche, dans `e2e/capture.spec.ts`.
- **Projet `mobile`** : parcours sur Pixel 7, dans `e2e/mobile.spec.ts`.

La CI les exécute dans le job `e2e`, avec un Supabase allégé (base, auth, API, stockage).

## Raccourcis clavier

| Touche | Action |
|---|---|
| `Ctrl` / `Cmd` + `K` | Palette : capturer (type détecté), aller à une page, retrouver un élément |
| `↑` `↓` `Entrée` | Choisir et valider dans la palette |
| `Échap` | Quitter le champ, puis fermer le détail ou la palette |
| `?` | Aide des raccourcis |

Dans la palette, la saisie est interprétée ainsi :
- une URL GitHub ou GitLab de dépôt donne un **repo** ;
- toute autre URL donne un **lien** ;
- un texte donne une **note** : la première ligne sert de titre.

Le nom exact d'une page, par exemple « inbox », ouvre cette page.

## Variables d'environnement

Toutes les variables sont documentées dans [`.env.example`](.env.example) et validées au démarrage par [`src/lib/env.ts`](src/lib/env.ts). `.env.local` n'est jamais commité. Aucune clé `service_role` n'est utilisée côté client.

## Structure

```
src/
├── app/            # routes (App Router), layout racine, providers
├── features/       # un dossier par module : items, tags, spaces, capture…
├── components/ui/  # réexports QuickadUI ("use client") + composants partagés
├── hooks/          # hooks génériques
└── lib/            # env, clients Supabase, utilitaires
supabase/           # config.toml, migrations SQL versionnées, tests pgTAP
```

Les composants QuickadUI ne déclarent pas `"use client"` : on les importe **toujours** depuis `@/components/ui/*`, jamais directement depuis `@quickadui/*` dans un Server Component.

## Contribuer

- Une issue = une branche (`feature/…` ou `fix/…` depuis `develop`) = une PR vers `develop`.
- Commits au format Conventional Commits, en français.
- La CI (lint, types, tests, build) doit être verte avant le merge.
- **Sous Windows**, `npm install <paquet>` peut retirer du lockfile des dépendances optionnelles propres à Linux (`@emnapi/*`), et `npm ci` échoue alors en CI. Après l'ajout d'une dépendance, régénérer le lockfile : supprimer `node_modules` et `package-lock.json`, puis relancer `npm install`.
