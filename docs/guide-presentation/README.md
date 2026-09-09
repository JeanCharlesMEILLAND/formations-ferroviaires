# Guide de présentation (PDF)

Sources du document `docs/Formations-ferroviaires-Guide.pdf` : à quoi sert l'outil, comment on s'en sert, ce que chacun peut y faire et y voir.

- `doc.html` : le texte et la mise en page (gabarit « guide-pdf », charte du site : Bricolage Grotesque, Manrope, pétrole, corail, jaune signal).
- `shots/` : captures d'écran (pages publiques prises en production, back-office pris en local avec un message d'exemple fictif).
- `build.js` : HTML → PDF avec Playwright (logo et captures incorporés, grilles converties en tableaux, pied de page numéroté).
- `sheet.js`, `measure.js` : planche-contact et mesure des blocs, pour contrôler la pagination.

Régénérer, avec Playwright installé hors du dépôt (par exemple dans un dossier `pw` : `npm i playwright && npx playwright install chromium-headless-shell`) :

```bash
NODE_PATH=../../../pw/node_modules node build.js --in doc.html --out ../Formations-ferroviaires-Guide.pdf --shots shots --logo logo.svg --footer "Formations ferroviaires · Guide de présentation · Objectif OFP"
```

Les chiffres (331 établissements vérifiés, 49 formations, 32 métiers, 1 464 généralistes) sont ceux du 9 septembre 2026 : les mettre à jour avec les captures.
