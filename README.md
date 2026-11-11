# MyDash

Application web personnelle qui centralise et organise liens, fichiers, documentations, notes, repos Git, outils favoris, prompts, skills et calendrier.

**Stack** : Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS v4 · [QuickadUI](https://quickadui-docs-nu.vercel.app/) · Supabase (PostgreSQL, Auth, Storage, RLS) · Zod · Vitest.

## Prérequis

- Node.js **24** (`.nvmrc`)
- npm 11
- Docker Desktop (pour Supabase en local, à partir du ticket #4)

## Installation locale

```bash
git clone https://github.com/AdouaniHoussemKhalil/mydash.git
cd mydash
npm install
cp .env.example .env.local   # puis compléter les valeurs
npm run dev                  # http://localhost:3000
```

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
supabase/           # config + migrations SQL versionnées (ticket #4)
```

Les composants QuickadUI ne déclarent pas `"use client"` : on les importe **toujours** depuis `@/components/ui/*`, jamais directement depuis `@quickadui/*` dans un Server Component.

## Contribuer

- Une issue = une branche (`feature/…` ou `fix/…` depuis `develop`) = une PR vers `develop`.
- Commits au format Conventional Commits, en français.
- La CI (lint, types, tests, build) doit être verte avant le merge.
