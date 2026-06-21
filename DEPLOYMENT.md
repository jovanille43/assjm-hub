# Déploiement — ASSJM HUB

Application **Next.js 15 (App Router) + Prisma + Auth.js**.

## 1. Prérequis

- Node.js 18+
- Une base de données (SQLite en dev, **PostgreSQL en production**)

## 2. Configuration

```bash
cp .env.example .env
npx auth secret          # génère un AUTH_SECRET sûr (à coller dans .env)
```

Renseigne dans `.env` :
- `DATABASE_URL`
- `AUTH_SECRET` (secret généré)
- `NEXT_PUBLIC_SITE_URL` (URL réelle, ex. `https://assjm.fr`)

## 3. Passer de SQLite à PostgreSQL (production)

Le dev local reste en **SQLite** (zéro-config). La bascule vers **PostgreSQL**
est **automatique au build de production** : `npm run build:netlify` exécute
`scripts/use-postgres.mjs` (provider `sqlite` → `postgresql`), génère le client,
applique le schéma (`prisma db push`) puis build. Rien à modifier à la main.

Pour un autre hébergeur (hors Netlify), même logique : `node scripts/use-postgres.mjs`
puis `npx prisma db push` (ou `migrate deploy`) avec `DATABASE_URL` sur Postgres.
Le schéma est déjà 100 % compatible Postgres (aucune fonctionnalité SQLite-only).

**Données initiales (une seule fois, après le 1er déploiement)** — la prod
démarre vide ; il faut au minimum l'admin, les équipes et les catalogues
(badges, salons). Avec `DATABASE_URL` pointé sur la prod :
```bash
node scripts/use-postgres.mjs   # bascule le schéma en postgres (local, temporaire)
npx prisma generate
npm run db:clean                # admin@assjm.fr + équipes + catalogues (démarrage propre)
# puis remets le schéma en SQLite pour le dev local : reviens à provider = "sqlite"
```
(`npm run db:seed` à la place de `db:clean` pour des données de démo complètes.)

## 4. Build & lancement

```bash
npm install
npm run icons        # génère les icônes d'app depuis public/icon-source.png
npm run og           # génère l'image Open Graph
npm run build
npm run start        # production (port 3000)
```

## 5. Comptes & rôles

- Le 1er admin : compte `admin@assjm.fr` (seed/clean) — **change le mot de passe**.
- Les membres s'inscrivent sur `/inscription` (rôle Supporter, carte FUT créée automatiquement).
- Un admin attribue les rôles dans **Back-office → Utilisateurs & rôles**.

## 6. Uploads de photos

Le stockage est abstrait dans `src/lib/storage.ts` et piloté par la variable
`MEDIA_STORAGE` :
- **Non définie (défaut)** : disque local `public/uploads/`, servi en statique.
  ✅ OK en dev et en auto-hébergé (VPS / Docker avec volume persistant).
- **`MEDIA_STORAGE=blobs`** : **Netlify Blobs** (provisionné automatiquement,
  aucune config), servi via la route `/api/media/[key]`. C'est le mode à activer
  sur Netlify et tout hébergement au système de fichiers **éphémère** (sinon les
  photos sont perdues à chaque redéploiement). Aucun code à modifier.

## 7. Qualité

```bash
npm run test         # tests unitaires (logique pronos / duels / skins)
npm run lint
```

## 8. PWA

`public/manifest.webmanifest` + `public/sw.js` sont prêts. Les **push natives**
sont supportées (web-push/VAPID) : renseigne `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY` et `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (via
`npx web-push generate-vapid-keys`). Sans ces clés, les notifications restent
in-app. L'utilisateur active les push depuis **Mon profil**.

## 9. Déploiement sur Netlify (recommandé)

Le runtime Next.js est géré par `@netlify/plugin-nextjs` (ajouté
automatiquement). `netlify.toml` est déjà présent (build, Node 20, plugin).

1. **Pousser le projet sur GitHub** (le dossier n'est pas encore un dépôt git :
   `git init` puis premier commit), puis **« Add new site → Import from Git »**
   sur Netlify. Build détecté tout seul.
2. **Base de données Postgres** (le FS Netlify est éphémère → SQLite exclu) :
   - *Option A — Netlify DB* : provisionne un Postgres (Neon) automatiquement et
     expose `NETLIFY_DATABASE_URL`. Pointe `DATABASE_URL` dessus.
   - *Option B — Postgres externe* (Neon, Supabase…) : colle l'URL dans
     `DATABASE_URL`.
   Dans les deux cas, passe le datasource Prisma en `postgresql` (section 3) puis
   applique le schéma : `npx prisma db push` (ou `migrate deploy` si tu génères
   des migrations). Démarrage propre : `npm run db:clean`.
3. **Variables d'environnement** (Site settings → Environment variables) :
   - `DATABASE_URL` — connexion Postgres
   - `AUTH_SECRET` — `npx auth secret`
   - `AUTH_TRUST_HOST` — `true`
   - `NEXT_PUBLIC_SITE_URL` — l'URL Netlify (ou le domaine custom)
   - `MEDIA_STORAGE` — `blobs` (stockage des uploads, cf. section 6)
   - *(optionnel)* `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` /
     `NEXT_PUBLIC_VAPID_PUBLIC_KEY` pour les push
4. **Uploads** : `MEDIA_STORAGE=blobs` → Netlify Blobs, zéro config (cf. §6).
5. `sharp` (compression d'images) tourne nativement sur le runtime Linux Netlify.

> ⚠️ Choix à arbitrer : garder **SQLite en dev** (zéro-config) avec Postgres en
> prod implique de basculer le `provider` du schéma au build (ou via un schéma
> dédié) ; ou passer **Postgres partout** pour une parité dev = prod totale.
