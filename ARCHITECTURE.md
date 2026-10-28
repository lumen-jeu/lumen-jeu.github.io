# LUMEN — architecture (PWA)

Rédigée le 24/10/2026 d'après le code réel (cas 1, mobile).

## 1. Modules
| Fichier | Rôle | Lignes |
|---|---|---|
| `defi.js` | Défi du jour **commun aux 4 jeux** (date de Paris, graine FNV-1a + mulberry32, série `lumen.defi.v1`, texte et partage). Copie identique octet pour octet dans ÉCHO, Fragments, Résonance. | ~150 |
| `engine.js` | Moteur pur (grille, chaînes, fusions, objectifs). Parité avec `GameEngine.kt`. | ~590 |
| `progress.js` | Progression pure : sauvegarde `LUMEN2`, économie, missions, événement, série d'ouverture, succès, thèmes, texte du défi (`shareDaily`, `dailyFor`, `msToNextDaily`). | ~490 |
| `audio.js` | Sons WebAudio synthétisés. | ~120 |
| `i18n.js` | Langue (fr/en) : choix `lumen.lang` sinon langue du navigateur ; dictionnaire anglais `EN` (clé = texte français du code) ; `t`, `tn` (pluriels), `apply` (traduit la page statique). Source unique des traductions. | ~175 |
| `carte.js` | Carte image 1080×1920 du Défi du jour : `model` (pur, testé), `draw` (canvas, orbes de app.js), `share` (`navigator.share({files,text})`, sinon téléchargement du PNG). | ~110 |
| `autres-jeux.js` | Carte « Les autres jeux d'Aulit » (Réglages) : liste `JEUX` des 4 jeux (même texte partout), affiche les 3 autres. | ~30 |
| `app-etat.js` … `app-accueil.js`, `app.js` | Interface découpée en 8 scripts (lot 18) : voir le tableau 1 bis. | 60 à 294 |
| `index.html`, `style.css`, `sw.js`, `manifest.webmanifest`, `levels.json` | Page, styles, cache hors ligne, manifeste, niveaux d'Aventure. | |
| `privacy.html` | Confidentialité + conditions d'utilisation + mentions légales (lien en bas des Réglages). URL stable pour le Play Store. | |
| `404.html`, `robots.txt`, `sitemap.xml`, `og-image.png` | Page introuvable (chemins absolus), référencement, aperçu des liens 1200×630. | |

Ordre de chargement : `defi.js` → `i18n.js` → `engine.js` → `progress.js` → `audio.js` → `carte.js` → `autres-jeux.js` → `app-etat.js` → `app-sprites.js` → `app-partie.js` → `app-chaine.js` → `app-fin.js` → `app-rendu.js` → `app-accueil.js` → `app.js`.
Écart connu : `engine.js` (586), `progress.js` (490) et `style.css` (587) dépassent encore 400 lignes (voir 1 bis, hors périmètre).

## 1 bis. Découpage de `app.js` (lot 18, 25/10/2026) — plan écrit avant de déplacer le code, appliqué tel quel
Refactorisation pure : aucun changement de comportement, de rendu, de texte, de sauvegarde (`LUMEN2`, clés `lumen.*`) ni de manifeste.
`app.js` (1 537 lignes, une seule fonction englobante) est coupé en **tranches contiguës, dans l'ordre d'origine**, chargées
l'une après l'autre. Les fichiers partagent la portée globale du navigateur (scripts classiques, sans `import`) : la
fonction englobante disparaît, chaque fichier commence par `'use strict'`. Preuve de « déplacement pur » : la concaténation
des tranches (sans leur en-tête de 2 lignes) est identique, ligne pour ligne, au corps de l'ancien `app.js`.

| Ordre | Fichier | Responsabilité | Lignes d'origine | Dépend de |
|---|---|---|---|---|
| 1 | `app-etat.js` (60 l.) | Raccourcis (`E`, `P`, `tr`…), icônes SVG, sauvegarde `lumen.save2` (+ migration v1), jour, thème et couleurs | 4–60 | modules purs |
| 2 | `app-sprites.js` (133 l.) | Sprites canvas des orbes (prisme, pierre, glace) et icônes DOM | 61–190 | 1 |
| 3 | `app-partie.js` (193 l.) | Effets (vibration, son), bandeau de progression, état de partie, mise en page du plateau, démarrage, HUD, objectifs, spectre | 191–380 | 1, 2 |
| 4 | `app-chaine.js` (187 l.) | Tracé de chaîne au doigt, validation d'un coup (`commit`), chutes, toasts, particules, tutoriel | 381–564 | 1–3 |
| 5 | `app-fin.js` (239 l.) | Orbes spéciales (présentation), boosters, fin de partie, continuer, partage texte et image | 565–800 | 1–4 |
| 6 | `app-rendu.js` (179 l.) | Dessin du plateau (`draw`), `roundRect` | 801–976 | 1–3 |
| 7 | `app-accueil.js` (272 l.) | Accueil (orbes, anneau, lunes, bouton « Jouer » = `playSub`, tuile Aventure) et carte de l'Aventure | 977–1245 | 1–3 |
| 8 | `app.js` (294 l.) | Panneaux (boutique, missions, succès, stats, réglages), série quotidienne, écrans, clics, boucle, démarrage, `window.__lumen` | 1246–1537 | tout |

Règles : (a) aucun nom de premier niveau en double entre ces fichiers et aucun nom réservé de `window` (`name`, `top`,
`status`…) — vérifié par `tests/modules-app.test.js` ; (b) le code exécuté au chargement d'un fichier n'utilise que les
fichiers déjà chargés (les appels croisés se font à l'exécution, après le chargement de tous) ; (c) `index.html` et `sw.js`
listent les 8 fichiers dans cet ordre, après `autres-jeux.js` ; `defi.js` reste le premier script.
Hors périmètre : `engine.js` (~590) et `progress.js` (~490), modules purs testés et portés à l'identique sous Android
(parité ligne à ligne avec `GameEngine.kt`/`Progression.kt`) ; `style.css` (~590, une feuille, pas de logique).

Accessibilité (28/10) : les 8 `<section class="screen">` sont dans un `<main>` sans style (élément statique : les écrans restent positionnés par rapport à `body`) ; feuilles, carte d'intro et bandeau restent hors du `<main>`. Pas de pied de page (plein écran) : lien `privacy.html` en bas des Réglages.
Documents de cadrage dans `docs/` : `PRD.md`, `TRD.md`, `APP_FLOW.md`, `DESIGN_BRIEF.md`, `BACKEND_SCHEMA.md`, `IMPLEMENTATION_PLAN.md`.

## 2. Sources de vérité uniques
- Date du jour, numéro `#N`, graine du défi, série du défi, format du texte partagé : `defi.js`.
- Jour du jeu (série d'ouverture, missions, événement, défi) : `P.today()` = date de Paris via `defi.js`.
- URL canonique de partage : `P.URL` (`https://lumen-jeu.github.io/`), jamais `location.href`.
- Thèmes, prix, récompenses : `progress.js`. Niveaux : `levels.json`.
- Textes : français dans le code (= clés) ; anglais **uniquement** dans `EN` de `i18n.js`. `app.js` appelle `tr()`/`trn()`, `progress.js` appelle `T()` (identité sous Node), la page statique est traduite par `I18N.apply`, les chapitres de `levels.json` au chargement.
- Liens des autres jeux : `JEUX` de `autres-jeux.js` (à remplacer par les liens Play Store une fois publiés).

## 3. Persistance (localStorage du navigateur)
| Clé | Contenu | Survit à une mise à jour |
|---|---|---|
| `lumen.save2` | Sauvegarde complète (JSON, exportable en code `LUMEN2.…`), dont `daily` = meilleur score du jour et `streak` = série d'ouverture | oui |
| `lumen.defi.v1` | Série du défi `{v,last,count,best,jours}` (30 derniers jours), écrite par `defi.js`, **hors** code `LUMEN2` | oui |
| `lumen.lang` | `fr` / `en` choisi dans les Réglages (absent = langue du navigateur), hors code `LUMEN2` | oui |
| `lumen.best`, `lumen.bestLevel`, `lumen.mute` | Ancienne v1, lue une fois pour migration | — |

## 4. Sécurité
Aucun secret, aucun serveur, aucun appel réseau sauf le chargement des fichiers du site. Le code `LUMEN2` se forge
(FNV sans clé) : `normalize()` borne toutes les valeurs. `lumen.defi.v1` est relu de façon défensive (objet neuf si invalide).

## 5. Identité
Domaine `lumen-jeu.github.io` (organisation dédiée). Manifeste sans `id` (donc id = `start_url`) : ne pas en ajouter.
Cache SW `lumen-v2.3.2 (installation sans cache HTTP, rechargement auto de l accueil au changement de SW)`, le SW ne supprime que les caches `lumen-*`. Identifiant de jeu dans la graine : `'lumen'`.

## 6. Dépendances externes
Aucune. Polices et icônes locales. Partage texte : `navigator.share` → presse-papiers → zone de texte à copier. Partage image : `navigator.share` avec fichier si `canShare({files})`, sinon téléchargement du PNG. Liens sortants vers les 3 autres jeux (nouvel onglet).

## 7. Plan de tests (`node --test`)
- `tests/sauvegarde.test.js` : bornes du code `LUMEN2`.
- `tests/defi.test.js` (commun aux 4 jeux) : vecteurs FNV/graines, date de Paris = `Intl` toutes les heures 2026-2035, série, texte, partage, empreinte du fichier `defi.js`, ordre des scripts et SW.
- `tests/defi-lumen.test.js` : même grille pour la même graine, date de Paris à 23h30 UTC, prochain défi, `shareDaily`.
- `tests/modules-app.test.js` (lot 18) : ordre exact des `<script>` (modules purs puis les 8 scripts de l'interface), chaque fichier en cache dans `sw.js`, mode strict, aucun nom global en double ni réservé (`name`, `top`…).
- `tests/i18n-carte.test.js` : choix de la langue, `t`/`tn`, **chaque texte passé à `tr`/`trn`/`T` a sa traduction** (balaye `app.js` et tous les `app-*.js`), missions/événements/thèmes/titres/chapitres traduits, contenu de la carte du défi, liste des autres jeux, nouveaux modules en cache et chargés avant `app.js`.
- Manuel / sans tête (Playwright de `F:\GITHUB\Site\tests`, 390×844, fr-FR et en-US) : accueil, fin du défi, carte PNG, Réglages, zéro erreur console.
  Lot 18 : instantané avant/après (horloge figée, `Math.random` à graine, mouvement réduit) du texte et du HTML de 16 états par langue
  (tutoriel, accueil, 6 panneaux, carte, Défi du jour joué et terminé, Classique, export du code) : identiques, sauf la partie Classique
  (graine `Date.now() ^ Math.random()`, dépend du nombre d'images déjà dessinées, varie déjà d'un lancement à l'autre).

## 8. Risques connus
Voir `PIEGES.md`. Le défi Android (`game/Defi.kt`, 25/10) suit la même date de Paris et la même graine que `defi.js`.

## Statistiques de visite (28/10/2026)
GoatCounter sans cookie, chemins `/lumen/…`, chargé par le script d'une ligne en fin de `index.html` uniquement sur `*.github.io` et sans `skipgc` (détail : `docs/TRD.md`, section Traceurs). `privacy.html` le déclare dans toutes ses langues, avec le bouton « Ne pas être compté ». Test : `tests/statistiques.test.js` (identique dans les 4 jeux, seul `PREFIXE` change).
