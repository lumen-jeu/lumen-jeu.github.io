# LUMEN — schéma des données

**Aucun serveur, aucune base de données, aucun compte.** Tout est stocké sur l'appareil du joueur (localStorage du navigateur,
ou stockage de l'appli Android). Aucun appel réseau en dehors du chargement des fichiers du site.

## Stockage local (localStorage)
| Clé | Contenu | Écrit par |
|---|---|---|
| `lumen.save2` | Sauvegarde complète (JSON) : Aventure, éclats, boosters, thèmes, succès, missions, `daily` (meilleur du jour), `streak` (série d'ouverture), réglages | `app-etat.js` / `progress.js` |
| `lumen.defi.v1` | Série du Défi du jour `{v, last, count, best, jours}` (30 derniers jours) | `defi.js` |
| `lumen.lang` | `fr` / `en` (absent = langue du navigateur) | `i18n.js` |
| `lumen.best`, `lumen.bestLevel`, `lumen.mute` | Ancienne v1, lue une fois pour migration | — |

## Code de sauvegarde
`LUMEN2.…` : export de `lumen.save2` (somme FNV sans clé, donc falsifiable) ; `normalize()` borne toutes les valeurs à l'import.
`lumen.defi.v1` et `lumen.lang` n'en font pas partie.

## Données fixes
- `levels.json` : 120 niveaux d'Aventure (chapitres, objectifs, coups).
- Thèmes, prix, récompenses, missions : `progress.js`.

## Cache hors ligne
Cache du service worker `lumen-v2.2.6` : copie des fichiers du site, aucune donnée de joueur.

## Données partagées
Texte et image du Défi du jour, envoyés seulement quand le joueur appuie sur « Partager » (numéro, score, coups, série, lien fixe).
