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

### Modèle de données

- Toute donnée appartient à un **workspace**. À l'inscription, un workspace « Personnel » est créé automatiquement, avec l'utilisateur comme `owner`.
- **RLS sur toutes les tables** : la lecture est ouverte aux membres du workspace, l'écriture est réservée aux rôles `owner` et `editor`.
- **Garde-fous** :
  - `workspace_id` et `created_by` ne sont pas modifiables par le client ;
  - des clés étrangères composites empêchent de relier des éléments de workspaces différents.
- `items` est la table centrale commune à tous les types. Elle contient la colonne `search_vector` (générée automatiquement, avec un index GIN) et la colonne `embedding`, réservée à la recherche sémantique.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Types de routes Next + `tsc --noEmit` |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Vitest en mode watch |

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
