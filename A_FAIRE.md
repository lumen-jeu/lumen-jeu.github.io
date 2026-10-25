# LUMEN — à faire

## Fait
- **24/10** : code de sauvegarde `LUMEN2` validé et borné + `tests/sauvegarde.test.js`.
- **24/10** : Défi du jour commun aux 4 jeux (idée 14) : `defi.js`, jour à minuit heure de Paris, graine
  `Defi.seed('lumen', date)`, série du défi (`lumen.defi.v1`) sur l'accueil et l'écran de fin, « Prochain défi dans … »,
  texte partagé avec série et lien fixe, bouton « Partager le résultat » (partage natif → copie → zone à copier),
  cache `lumen-v2.1.0`, 15 tests ajoutés (19 au total). `defi.js` et `tests/defi.test.js` repris à l'identique des 3 autres jeux (empreinte 1049909846).
- **24/10** : README, ARCHITECTURE, A_FAIRE, PIEGES créés d'après le code.

- **25/10** : checklist « avant lancement » : `privacy.html` créée (confidentialité exacte d'après le code, cookies, conditions d'utilisation, mentions légales), lien en bas des Réglages, titre + description + Open Graph + `og-image.png` 1200×630, `404.html`, `robots.txt` + `sitemap.xml`, icônes recompressées sans perte (−45 Ko), `--brume` #8d86b5 → #a19bc9 (contraste AA sur les 5 thèmes), cache `lumen-v2.1.1` (+ `privacy.html` hors ligne).
- **25/10** : passe SEO éditoriale (requête « jeu de puzzle gratuit ») : `<title>`, description, Open Graph alignés ; `<h1>` « LUMEN » complété d'un texte masqué « jeu de puzzle gratuit » + paragraphe `<noscript>` ; données structurées `VideoGame` en fin de `<body>` ; cache `lumen-v2.1.2`.

- **25/10 (soir)** : lots 4, 6, 7 : partage du Défi du jour **en image** (`carte.js`, carte 1080×1920 : orbe, LUMEN, « Défi du jour #N », score, une orbe par coup, détail, série, lien ; partage natif avec fichier, sinon téléchargement), bouton « Partager l'image » à côté de « Partager le résultat » ; carte « Les autres jeux d'Aulit » dans les Réglages (`autres-jeux.js`) ; **anglais** (`i18n.js`, langue du navigateur + sélecteur Français/English mémorisé `lumen.lang`, titre de page, chapitres, missions, succès, événements, texte partagé) ; `privacy.html` : section anglaise `#english` + image, avis Play, liens ; cache `lumen-v2.2.0` ; `tests/i18n-carte.test.js` (6 tests, 25 au total).

## En cours
- Rien.

## À faire
- Android : AAB signé par Olivier quand le compte Play Console sera validé. (25/10 : `JEUX\lumen\android` 2.0.1 a le même Défi du jour, `game/Defi.kt`, testé contre `defi.js`.)
- Les tests de parité de `JEUX\lumen` pointent vers un `pwa\` vide : les faire pointer vers ce dépôt.
- Découper `app.js` (> 1 500 lignes).
- Remplacer les liens web de `autres-jeux.js` par les liens Play Store quand les applis seront publiées (même chose dans les 3 autres jeux).
- Manifeste et `<meta description>` restent en français (référencement visé en France) : à traduire si une version anglaise du référencement est voulue.

- Ajouter une adresse e-mail de contact publique dans `privacy.html` si souhaité (aujourd'hui : tickets GitHub). URL à donner au Play Store : `https://lumen-jeu.github.io/privacy.html`.
- Mesure d'audience : rien d'installé (à décider ; option sans cookie si oui).
- Accueil : plusieurs entrées de même poids (Aventure, Classique, Défi du jour) ; la carte Aventure est la plus grande, pas de bouton unique « Jouer » (à décider si besoin).

## Décisions prises
- **25/10** : langue par défaut = navigateur (`fr*` → français, toute autre langue → anglais) ; changer de langue recharge la page (plus simple et sûr que de tout redessiner).
- **25/10** : la carte « autres jeux » va dans les **Réglages** (l'accueil est déjà plein) ; la carte image dessine une orbe par coup (même information que les carrés du texte, dans le style du jeu).
- **25/10** : contact = page « Issues » du dépôt GitHub (aucune adresse personnelle publiée sans accord) ; CGU et mentions légales dans `privacy.html`.
- **24/10** : le défi change à **minuit heure de Paris** pour tout le monde (Q1, option sûre appliquée en attendant ta réponse).
- **24/10** : série du défi **séparée** de la série d'ouverture, sans récompense (Q2, option sûre). Libellés : « jours de suite » (ouverture) / « Série du défi ».
- **24/10** : un défi compte dans la série quand la partie se termine (feuille de fin, y compris « Abandonner » une fois bloqué) ; quitter en cours de partie ne compte pas.
- **24/10** : `S.daily` (meilleur du jour dans la sauvegarde) inchangé ; la tuile d'accueil lit `lumen.defi.v1`.
