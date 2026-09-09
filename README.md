# Formations ferroviaires

Le guide des métiers du rail : où se former, près de chez soi, du CAP à l'ingénieur. Carte interactive des
établissements, formations et métiers ferroviaires en France, avec un back-office de gestion.

Site : https://formations-ferroviaires.vercel.app · Commanditaire : Objectif OFP, avec l'UTPF et la FIF (programme Transformeurs).

## Pile technique

Next.js 14 (App Router), React 18, Prisma 5 sur PostgreSQL (Neon), Tailwind, Leaflet + markercluster, hébergement Vercel.

## Démarrer

```bash
npm install                 # lance aussi `prisma generate`
cp .env.example .env.local  # puis renseigner DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET
npm run db:migrate          # applique les migrations (base vide ou existante)
npm run db:seed             # charge le jeu de données de référence (prisma/data/*.json)
npm run dev                 # http://localhost:3000 → redirige vers /fr
```

Build de production : `npm run build && npm start`.

## Pages

| Route | Rôle |
|---|---|
| `/fr`, `/en` | Accueil : recherche, familles de métiers, parcours, campus, réseau des régions (rendu serveur, cache 10 min) |
| `/fr/carte` | Carte et liste. Filtres portés par l'adresse : `q`, `metier`, `formation`, `region` (code), `level`, `domain`, `type`, `family`, `view`, `near=1` |
| `/fr/etablissement/<slug>` | Fiche établissement |
| `/admin` | Back-office : établissements, formations, métiers, liens, import/export Excel, enrichissement La Bonne Alternance |
| `/api/filters`, `/api/establishments` | Données publiques lues par la carte |

## Données

- **Référence versionnée** : `prisma/data/*.json` (régions, types, niveaux, domaines, formations, métiers, liens, établissements vérifiés).
  Le seed les recharge de façon idempotente (clé : slug ou code). Pour les régénérer depuis la base après des modifications
  dans le back-office : `npx tsx scripts/export-reference-data.ts`, puis commit.
- **Établissements généralistes** (`source = "api"`) : importés depuis l'API La Bonne Alternance par le back-office (onglet
  Enrichir), masqués par défaut sur la carte. Ils ne font pas partie du seed et se rejouent à la demande.
- Sources externes : ONISEP (liens), EPSF (organismes agréés), Futur en train et Avec l'industrie ferroviaire (fiches métiers).
- `scripts/legacy/` : scripts de construction de mars 2026, conservés pour l'historique, à ne plus exécuter.

## Variables d'environnement

Voir `.env.example`. `ADMIN_SECRET` est obligatoire (aucune valeur de repli). La connexion admin est limitée à cinq tentatives
par adresse puis quinze minutes d'attente.

## Exploitation

- La base Neon gratuite s'endort après inactivité : le code attend jusqu'à 20 s la première connexion et la carte réessaie
  d'elle-même en affichant un message, au lieu d'un écran blanc.
- Sécurité : contenu des fenêtres de carte échappé, en-têtes HTTP de sécurité dans `next.config.mjs`, secrets renouvelés en
  septembre 2026 après l'incident du mois d'août (historique Git purgé).
- Référencement : métadonnées par page, `robots.txt`, `sitemap.xml` (accueil, carte, fiches vérifiées), image de partage générée.

## Suite prévue (palier 2)

Pages formation et métier indexables, recherche floue avec les synonymes du secteur, comparateur et liste à emporter,
formulaire « mettre à jour ma fiche » relu par l'administrateur, tableau de bord qualité des données.
