# Scripts historiques (mars 2026)

Ces scripts ont servi à construire le jeu de données initial : premier seed (`seed-2026-03.ts`, 1 300 lignes de littéraux),
ajouts ponctuels (centres EPSF, Ferrocampus, Lineas…), reclassements et corrections lancés directement contre la base.

Ils ne sont **plus à exécuter**. Le jeu de données de référence est désormais dans `prisma/data/*.json`, exporté depuis la
base par `scripts/export-reference-data.ts` et rechargé par `prisma/seed.ts`. Conservés pour l'historique uniquement.
