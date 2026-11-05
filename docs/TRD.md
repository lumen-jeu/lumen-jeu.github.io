# LUMEN — TRD (exigences techniques)

## Pile
- HTML + CSS + JavaScript classique (scripts sans `import`, portée globale partagée), **aucune dépendance npm**, aucun outil de construction.
- Rendu : DOM pour les écrans, `<canvas>` pour le plateau, les orbes, l'anneau de rang et la carte de l'Aventure.
- Sons : WebAudio synthétisé (`audio.js`). Polices locales (Unbounded, Instrument Sans).
- Ordre de chargement imposé : `defi.js` → `i18n.js` → `engine.js` → `progress.js` → `audio.js` → `carte.js` → `autres-jeux.js` → `app-etat.js` … `app.js`.

## PWA
- Hébergement : adresse officielle `https://lumen.aulit42369.fr/` (serveur d'Olivier, copie de `main` toutes les 5 min, depuis le 05/11/2026) ; GitHub Pages `https://lumen-jeu.github.io/` en secours.
- `sw.js` : cache d'abord ; constante `CACHE` (`lumen-v2.2.7` au 28/10/2026) à monter à **chaque** fichier publié modifié ; ne purge que les caches `lumen-*`.
- `manifest.webmanifest` sans `id` (id = `start_url`) : ne pas en ajouter.
- CSP en balise meta sur **toutes** les pages (`index`, `privacy`, `404`), vérifiée par `tests/csp.test.js` : `script-src 'self' https://gc.zgo.at` (aucun script en ligne : compteur dans `stats.js`, code de la confidentialité dans `privacy.js`), `connect-src`/`img-src` + `https://aulit42369.goatcounter.com`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'` ; `style-src` garde `'unsafe-inline'` (attributs `style`). `frame-ancestors` est impossible en meta (en-tête Caddy).

## Traceurs (28/10/2026)
- Aucun cookie. Seul traceur : **GoatCounter**, mesure d'audience sans cookie (compte `aulit42369.goatcounter.com`, le même que le Site et la vitrine de La Cabane), chemins préfixés `/lumen/…` (option `path`) pour distinguer le jeu dans le tableau de bord.
- Script d'une ligne en fin de `index.html` : charge `count.v4.js` (version figée + SRI `sha384`, comme le Site) **seulement** si `location.hostname` se termine par `github.io` ou `aulit42369.fr` (jamais dans une appli Android, une WebView, `file://` ni en local) et si `localStorage.skipgc` ≠ `'t'`.
- CSP : `https://gc.zgo.at` dans `script-src`, `https://aulit42369.goatcounter.com` dans `connect-src` et `img-src` ; le script est le fichier `stats.js` (plus d'empreinte à recalculer).
- Le SW ignore les requêtes d'autres origines : `count.js` et les envois ne sont jamais mis en cache.
- Opposition : bouton « Ne pas être compté » de `privacy.html` (toutes les langues), clé locale `skipgc` ; bouton masqué hors `github.io` / `aulit42369.fr`.

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
