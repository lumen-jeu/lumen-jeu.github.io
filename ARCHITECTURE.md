# LUMEN — architecture (PWA)

Rédigée le 24/10/2026 d'après le code réel (cas 1, mobile).

## 1. Modules
| Fichier | Rôle | Lignes |
|---|---|---|
| `defi.js` | Défi du jour **commun aux 4 jeux** (date de Paris, graine FNV-1a + mulberry32, série `lumen.defi.v1`, texte et partage). Copie identique octet pour octet dans ÉCHO, Fragments, Résonance. | ~150 |
| `engine.js` | Moteur pur (grille, chaînes, fusions, objectifs). Parité avec `GameEngine.kt`. | ~590 |
| `progress.js` | Progression pure : sauvegarde `LUMEN2`, économie, missions, événement, série d'ouverture, succès, thèmes, texte du défi (`shareDaily`, `dailyFor`, `msToNextDaily`). | ~490 |
| `audio.js` | Sons WebAudio synthétisés. | ~120 |
| `app.js` | Interface, rendu canvas, écrans. | ~1520 |
| `index.html`, `style.css`, `sw.js`, `manifest.webmanifest`, `levels.json` | Page, styles, cache hors ligne, manifeste, niveaux d'Aventure. | |

Ordre de chargement : `defi.js` → `engine.js` → `progress.js` → `audio.js` → `app.js`.
Écart connu : `app.js`, `engine.js`, `progress.js` et `style.css` dépassent 400 lignes (antérieur au 24/10).

## 2. Sources de vérité uniques
- Date du jour, numéro `#N`, graine du défi, série du défi, format du texte partagé : `defi.js`.
- Jour du jeu (série d'ouverture, missions, événement, défi) : `P.today()` = date de Paris via `defi.js`.
- URL canonique de partage : `P.URL` (`https://lumen-jeu.github.io/`), jamais `location.href`.
- Thèmes, prix, récompenses : `progress.js`. Niveaux : `levels.json`. Textes : français, dans le code.

## 3. Persistance (localStorage du navigateur)
| Clé | Contenu | Survit à une mise à jour |
|---|---|---|
| `lumen.save2` | Sauvegarde complète (JSON, exportable en code `LUMEN2.…`), dont `daily` = meilleur score du jour et `streak` = série d'ouverture | oui |
| `lumen.defi.v1` | Série du défi `{v,last,count,best,jours}` (30 derniers jours), écrite par `defi.js`, **hors** code `LUMEN2` | oui |
| `lumen.best`, `lumen.bestLevel`, `lumen.mute` | Ancienne v1, lue une fois pour migration | — |

## 4. Sécurité
Aucun secret, aucun serveur, aucun appel réseau sauf le chargement des fichiers du site. Le code `LUMEN2` se forge
(FNV sans clé) : `normalize()` borne toutes les valeurs. `lumen.defi.v1` est relu de façon défensive (objet neuf si invalide).

## 5. Identité
Domaine `lumen-jeu.github.io` (organisation dédiée). Manifeste sans `id` (donc id = `start_url`) : ne pas en ajouter.
Cache SW `lumen-v2.1.0`, le SW ne supprime que les caches `lumen-*`. Identifiant de jeu dans la graine : `'lumen'`.

## 6. Dépendances externes
Aucune. Polices et icônes locales. Partage : `navigator.share` → presse-papiers → zone de texte à copier.

## 7. Plan de tests (`node --test`)
- `tests/sauvegarde.test.js` : bornes du code `LUMEN2`.
- `tests/defi.test.js` (commun aux 4 jeux) : vecteurs FNV/graines, date de Paris = `Intl` toutes les heures 2026-2035, série, texte, partage, empreinte du fichier `defi.js`, ordre des scripts et SW.
- `tests/defi-lumen.test.js` : même grille pour la même graine, date de Paris à 23h30 UTC, prochain défi, `shareDaily`.
- Manuel : capture accueil + fin du défi, zéro erreur console, hors ligne après installation.

## 8. Risques connus
Voir `PIEGES.md`. Le défi Android (`game/Defi.kt`, 25/10) suit la même date de Paris et la même graine que `defi.js`.
