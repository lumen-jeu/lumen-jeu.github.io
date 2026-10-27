# LUMEN — TRD (exigences techniques)

## Pile
- HTML + CSS + JavaScript classique (scripts sans `import`, portée globale partagée), **aucune dépendance npm**, aucun outil de construction.
- Rendu : DOM pour les écrans, `<canvas>` pour le plateau, les orbes, l'anneau de rang et la carte de l'Aventure.
- Sons : WebAudio synthétisé (`audio.js`). Polices locales (Unbounded, Instrument Sans).
- Ordre de chargement imposé : `defi.js` → `i18n.js` → `engine.js` → `progress.js` → `audio.js` → `carte.js` → `autres-jeux.js` → `app-etat.js` … `app.js`.

## PWA
- Hébergement : GitHub Pages, `https://lumen-jeu.github.io/` (organisation dédiée).
- `sw.js` : cache d'abord ; constante `CACHE` (`lumen-v2.2.6` au 28/10/2026) à monter à **chaque** fichier publié modifié ; ne purge que les caches `lumen-*`.
- `manifest.webmanifest` sans `id` (id = `start_url`) : ne pas en ajouter.
- CSP en balise meta : `script-src 'self'` (aucun script en ligne exécutable ; le JSON-LD n'est pas exécuté).

## Android
- Appli Kotlin native séparée : `F:\Stream\files\JEUX\lumen\android` (hors de ce dépôt).
- Parité imposée : `engine.js` ⇄ `GameEngine.kt`, `progress.js` ⇄ `Progression.kt`, `defi.js` ⇄ `game/Defi.kt`, `EN` de `i18n.js` ⇄ `TextesEn.kt`.
- AAB signé par Olivier à la validation du compte Play Console.

## Contraintes
- `defi.js` identique octet pour octet dans les 4 jeux (empreinte vérifiée par `tests/defi.test.js`) et toujours premier `<script>`.
- JSON-LD en fin de `<body>`, jamais dans le `<head>`.
- Accessibilité : `<main>` autour des écrans (`<section class="screen">`), un seul `<h1>`, boutons-icônes avec `aria-label`, contraste AA (`--brume` ≥ #a19bc9), mouvement réduit respecté.
- Plein écran : `body` en `position: fixed`, écrans en `position: absolute`. Pas de pied de page (il serait caché sous les écrans ou casserait le plein écran) : le lien `privacy.html` est en bas des Réglages.
- Tests : `node --test` à la racine (Node 24 ; jamais `node --test tests/`).
