# LUMEN — PRD (cahier des charges produit)

Rédigé le 28/10/2026 d'après le code et les docs du dépôt (`README.md`, `ARCHITECTURE.md`, `A_FAIRE.md`).

## Concept
Jeu de puzzle mobile : on relie au doigt des orbes de même éclat, elles fusionnent et la lumière monte.
Gratuit, hors ligne, sans compte, sans achat en argent réel (les éclats se gagnent en jouant).

## Joueurs visés
- Joueurs mobiles occasionnels qui cherchent un « jeu de puzzle gratuit » (requête SEO visée).
- Communauté du stream d'Aulit42369 (Défi du jour commun aux 4 jeux, partage du résultat).
- Profil estimé : 13 ans et plus, surtout France et pays francophones, anglophones via la langue anglaise du jeu (proposé par Claude le 29/10/2026, à corriger si besoin).

## Fonctions (présentes dans le code)
| Fonction | Détail |
|---|---|
| Tutoriel | Lancé au premier démarrage, rejouable dans les Réglages |
| Bouton « Jouer » | Lance l'Aventure au niveau en cours |
| Aventure | 120 niveaux (`levels.json`, chapitres = constellations) + niveaux sans fin, 360 étoiles |
| Classique | Partie libre, record |
| Défi du jour | `LUMEN #N`, 40 coups, même grille pour tous, change à minuit heure de Paris, série du défi |
| Événement de la semaine | Bandeau sur l'accueil |
| Progression | Éclats, boutique (boosters, thèmes), missions du jour, série d'ouverture, 33 succès, rangs, statistiques |
| Partage | Texte (partage natif → copie → zone à copier) et image 1080×1920 |
| Sauvegarde | Code `LUMEN2.…` exportable / importable (PWA ⇄ Android) |
| Langues | Français, anglais (langue du navigateur, choix dans les Réglages) |
| Autres jeux | Carte « Les autres jeux d'Aulit » dans les Réglages |

## Hors périmètre
- Pas de serveur, de compte, de classement en ligne ni de multijoueur.
- Pas d'achat intégré ni de publicité.
- Pas de mesure d'audience (non décidé, voir `IMPLEMENTATION_PLAN.md`).

## Critères de réussite
À confirmer par Olivier (ex. : installations Play Store, joueurs quotidiens du Défi du jour).
