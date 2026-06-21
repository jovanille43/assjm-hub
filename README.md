<div align="center">

# ⚽ ASSJM HUB

**La plateforme qui fait vivre l'AS Saint-Just-Malmont**

Le cœur numérique du club amateur : actualités, résultats, équipes, calendrier,
cartes joueurs et communauté — réunis dans une seule application moderne.

`Next.js 15` · `React 18` · `TypeScript` · `Tailwind CSS` · `Prisma` · `Three.js` · `Framer Motion`

</div>

---

## 🚀 Démarrage rapide

```bash
npm install        # installe les dépendances (+ génère le client Prisma)
npm run db:push    # crée la base SQLite (prisma/dev.db)
npm run db:seed    # injecte les données de démonstration
npm run dev        # lance le serveur sur http://localhost:3000
```

> La base est en **SQLite** : zéro configuration, tout fonctionne immédiatement.
> Pour repartir d'une base propre : `npm run db:reset`.

## 🎨 Identité visuelle

L'identité est dérivée du logo officiel du club :

| Couleur | Usage | Hex |
|---|---|---|
| **Bleu marine** | Structure, prestige | `#0E1E46` |
| **Rouge club** | Action, énergie | `#E11D2A` |
| **Blanc / crème** | Respiration | `#F6F2EA` |

Des références discrètes au **patrimoine passementier** de Saint-Just-Malmont sont
intégrées : motifs de rubans animés, lignes tissées, transitions fluides.
Polices : **Oswald** (titres condensés sportifs) + **Inter** (texte).

## 🧩 Stack technique

- **Next.js 15** (App Router) + **React 18.3** + **TypeScript**
- **Tailwind CSS 3.4** + design system maison (tokens shadcn/ui)
- **Prisma 6** + **SQLite** (compatible PostgreSQL en production)
- **Framer Motion** (animations d'interface) + **Three.js** (ballon 3D)
- **Recharts**, **React Hook Form**, **Zod**, **date-fns**, **next-themes**

### Choix d'architecture notables

- **React 18.3** (et non 19) pour garantir la compatibilité de tout l'écosystème
  et un `npm install` sans conflit.
- **Three.js « vanilla »** (rendu impératif) plutôt que `@react-three/fiber` : le
  reconciler de R3F est incompatible avec le bundling de Next 15 (erreur
  `ReactCurrentOwner`). La version vanilla est plus robuste et tout aussi belle.
  La boucle de rendu se met en pause hors écran (perf / batterie / Lighthouse).
- **Ballon 3D = vraie géométrie de ballon** : icosaèdre tronqué construit
  programmatiquement (12 pentagones marine + 20 hexagones crème, panneaux
  subdivisés projetés sur la sphère, rainures de couture) — le motif
  « Telstar » classique, sans texture plaquée ni distorsion aux pôles.
- **Mode sombre par défaut** (premium), bascule clair/sombre disponible.

## 📁 Structure

```
src/
├── app/
│   ├── layout.tsx          # Layout racine (polices, thème, header/footer)
│   ├── page.tsx            # Page d'accueil (assemble les sections)
│   ├── globals.css         # Design system (tokens, utilitaires, rubans)
│   ├── manifest.ts         # Manifeste PWA
│   ├── icon.svg            # Favicon (blason)
│   ├── connexion/          # Connexion (Auth.js v5, comptes démo express)
│   ├── inscription/        # Création de compte sur l'app
│   └── dashboard/          # Espace membre (packs, votes, admin, événements…)
├── components/
│   ├── ui/                 # Primitives shadcn (button, card, badge)
│   ├── brand/crest.tsx     # Blason ASSJM en SVG animé
│   ├── three/ball-three.tsx# Ballon 3D interactif (Three.js)
│   ├── motion/reveal.tsx   # Animations au scroll (Framer Motion)
│   ├── home/               # Sections de la page d'accueil
│   ├── site-header.tsx     # En-tête (nav, thème, menu mobile)
│   └── site-footer.tsx     # Pied de page
└── lib/
    ├── db.ts               # Client Prisma (singleton)
    ├── data.ts             # Requêtes vitrine (avec replis)
    ├── enums.ts            # Valeurs/libellés (SQLite n'a pas d'enums)
    └── utils.ts            # Helpers (cn, initials, overall FUT…)
prisma/
├── schema.prisma          # Schéma complet (24 modèles)
└── seed.ts                # Données de démonstration
```

## 🗄️ Modèle de données

Le schéma couvre l'ensemble du projet (même les modules à venir) : `User` (6 rôles),
`Team`, `Player` (avec stats type FUT), `Match`, `MatchStat`, `Convocation`,
`Event`, `Post`/`Comment`/`Like`, `Vote` (MVP & joueur du mois), `Badge`,
`NewsArticle`, `Sponsor`, `Album`/`GalleryItem`, `Standing`, et les modèles
NextAuth (`Account`, `Session`).

## 👥 Comptes de démonstration

Mot de passe commun : **`assjm2026`** *(connexion fonctionnelle — Auth.js v5)*.
On peut aussi **créer son propre compte** directement sur `/inscription`
(rôle Supporter par défaut, badge de bienvenue offert).

| Rôle | Email |
|---|---|
| Administrateur | `admin@assjm.fr` |
| Coach | `coach@assjm.fr` |
| Dirigeant | `dirigeant@assjm.fr` |
| Joueur | `leo@assjm.fr` |
| Parent | `parent@assjm.fr` |
| Supporter | `supporter@assjm.fr` |

## 🗺️ Feuille de route

- [x] **Phase 1 — Fondation** : design system, schéma Prisma, données de démo,
      page d'accueil spectaculaire (hero + ballon 3D), PWA, mode sombre.
- [x] **Phase 2 — Auth & Dashboard** : Auth.js v5 multi-rôles, connexion réelle, espace membre protégé, carte joueur FUT.
- [x] **Phase 3 — Outils du club** : équipes & effectifs, calendrier central,
      convocations interactives (coach ↔ joueurs). *(Messagerie regroupée avec le réseau social en Phase 4.)*
- [x] **Phase 4 — Fun & engagement** : statistiques animées, réseau social
      (publier / liker / commenter), pack opening + badges & points, galerie de
      cartes FUT, vote MVP & Joueur du mois, messagerie par canaux.
- [x] **Phase 5 — Musée, galerie, PWA & admin** : musée numérique, galerie
      médias, PWA installable + offline, back-office admin. *(Boutique non incluse.)*
- [x] **Version finale** : création de compte sur l'app (`/inscription`),
      ballon 3D en vraie géométrie d'icosaèdre tronqué, système d'amélioration
      des cartes FUT (4 niveaux : Common → Rare → Épique → Légendaire),
      gestion des événements par le staff (coach / dirigeant / admin),
      éditeur de stats joueurs dans le back-office.
- [x] **Badges au mérite & moments du club** : les badges récompensent
      exclusivement de vraies prestations (buts, passes, triplé, MVP,
      présences, votes des coéquipiers, vie du club) via un moteur de règles
      avec progression visible (« Buteur — 3/5 buts ») ; les packs
      (Standard 3×/semaine · Pro · Élite) droppent désormais des cartes
      souvenirs « Moments du club » à collectionner — les doublons sont
      convertis en points.

## 📜 Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run db:push` | Synchronise le schéma avec la base |
| `npm run db:seed` | Injecte les données de démo |
| `npm run db:studio` | Ouvre Prisma Studio |
| `npm run db:reset` | Réinitialise + re-seed la base |

---

<div align="center">
Fait avec ❤️ pour l'AS Saint-Just-Malmont
</div>
