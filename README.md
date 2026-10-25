# LUMEN

Jeu puzzle mobile : reliez les orbes de même éclat, fusionnez-les et faites monter la lumière.
PWA publiée sur https://lumen-jeu.github.io/ (GitHub Pages). L'appli Android (Kotlin natif) vit dans
`F:\Stream\files\JEUX\lumen\android` et n'est pas dans ce dépôt.

## Modes
Classique, Aventure (120 niveaux de `levels.json` + niveaux sans fin), **Défi du jour** (`LUMEN #N`, 40 coups,
même grille pour tout le monde, change à minuit heure de Paris), événement de la semaine, tutoriel.

## Tests
À la racine du dépôt : `node --test` (Node 24, aucune dépendance npm ; ne pas écrire `node --test tests/`).

## Déploiement
Pousser `main` sur GitHub (GitHub Desktop). À chaque changement de fichier publié, monter `CACHE` dans `sw.js`,
sinon les joueurs qui ont installé l'appli gardent l'ancienne version.

Voir aussi `ARCHITECTURE.md`, `A_FAIRE.md`, `PIEGES.md`.
