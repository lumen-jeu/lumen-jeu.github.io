# LUMEN — brief de design (identité réelle)

## Direction
Ciel de nuit violet profond, orbes lumineuses qui « montent » ; chapitres de l'Aventure = constellations (Petite Ourse, Cassiopée…).
Grain léger sur tout l'écran (`body::after`) pour éviter l'effet aplat.

## Couleurs (`style.css`, `:root`)
| Rôle | Valeur |
|---|---|
| Nuit (fond) | `--nuit` #100b29, dégradés `--haut` #1f1550 et `--bas` #2b1a5e |
| Texte | `--lin` #f1ecff ; secondaire `--brume` #a19bc9 (minimum AA, ne pas assombrir) |
| Accent | `--ambre` #ffb627 (bouton Jouer, halo) |
| Orbes / effets | `--braise` #ff7a2f, `--cyan` #2cc9f0 (contour de focus), `--violet` #9a5cff |

5 thèmes déblocables (boutique) repeignent ces variables.

## Typographie
- Titres et chiffres : **Unbounded** 400/700/900 (fichiers locaux).
- Texte : **Instrument Sans** 400/600 (fichiers locaux).

## Formes et mouvement
Cartes arrondies, boutons ronds, orbes dessinées au canvas (prisme, pierre, glace), halo ambré qui pulse sur « Jouer ».
Animations coupées si « mouvement réduit ». Carte de partage 1080×1920 dans le même style (une orbe par coup).

## Accessibilité
Contraste AA sur les 5 thèmes, contour de focus cyan, `aria-label` sur les boutons-icônes, `<main>` + un seul `<h1>`.
