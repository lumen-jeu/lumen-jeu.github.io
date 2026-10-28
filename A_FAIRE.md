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

- **25/10 (lot 18)** : refactorisation pure de `app.js` (1 537 lignes) en 8 scripts de 60 à 294 lignes (`app-etat`, `app-sprites`, `app-partie`, `app-chaine`, `app-fin`, `app-rendu`, `app-accueil`, `app`), tranches contiguës dans l'ordre d'origine (concaténation identique au corps de l'ancien fichier) ; `index.html` et `sw.js` mis à jour, cache `lumen-v2.2.1` ; `tests/modules-app.test.js` (3 tests, 28 au total) ; instantané Playwright avant/après identique (Défi du jour, panneaux, fr et en).

- **25/10** : contact **aulit42369@gmail.com** dans `privacy.html` (FR et EN, lien `mailto:`, tickets GitHub en second). Bouton **« Jouer »** sur l'accueil, au-dessus des cartes : lance directement l'Aventure au niveau en cours (sous-titre « Aventure · Niveau N », orbe à halo ambré qui pulse, coupé si mouvement réduit) ; carte Aventure (ouvre la carte des niveaux), Classique et Défi du jour restent dessous, carte Aventure plus basse (96 px). Même bouton dans l'appli Android 2.1.0 (`ui/Accueil.kt`, `PlayButton`). Cache `lumen-v2.2.2`. 28 tests verts ; contrôle Chromium sans tête 390×844 (fr) et 390×667 (en) : rendu, clic → partie du niveau en cours, zéro erreur console.
- **25/10** : décision d'Olivier : « Succès » se dit **Achievements** en anglais (et non Awards), partout : interface, `privacy.html`, fiche Play en-US, `TextesEn.kt`. Cache `lumen-v2.2.4`.
- **25/10** : relecture de l'anglais avec DeepL (334 textes : `i18n.js`, `privacy.html` #english, fiche Play en-US), journal `JEUX\lumen\RELECTURE-DEEPL.md`. 3 corrections mineures : « Little Dipper » → « Ursa Minor » (noms latins comme les autres chapitres), « Soft pads » → « Soft soundscapes generated live », phrase des cookies complétée dans `privacy.html`. Mêmes corrections dans `TextesEn.kt` (Android). Cache `lumen-v2.2.3`. 28 tests verts.
- **26/10** : politique conforme LCEN/RGPD : mentions légales complètes (éditeur et directeur de la publication Aulit42369, personne physique non professionnelle anonyme, identité communiquée à l'hébergeur ; GitHub, Inc. avec adresse, téléphone, page de contact), transferts hors UE (DPF / clauses types) dans « Hébergement », contact et réclamation CNIL dans « Vos droits » (FR + EN, le français fait foi). Cache `lumen-v2.2.5`.
- **28/10** : accessibilité : écrans enveloppés dans `<main>` (comme Fragments), rendu et comportement identiques (positions de tous les éléments comparées avant/après dans Chromium sans tête, 0 erreur console) ; pas de pied de page (casserait le plein écran), lien de confidentialité gardé dans les Réglages. Cache `lumen-v2.2.6`. Docs de cadrage créées dans `docs/` (PRD, TRD, APP_FLOW, DESIGN_BRIEF, BACKEND_SCHEMA, IMPLEMENTATION_PLAN).
- **28/10** : mesure d'audience **GoatCounter sans cookie** (même compte et même méthode que le Site) : chemins `/lumen/…`, comptée seulement sur `*.github.io` (jamais dans l'appli Android, une WebView, en local), opposition `skipgc` + bouton « Ne pas être compté » dans `privacy.html` (toutes les langues, texte repris du Site, liste des traceurs et date mises à jour), CSP élargie (empreinte du script, `gc.zgo.at`, `aulit42369.goatcounter.com`), cache `lumen-v2.2.7`, `tests/statistiques.test.js`. Vérifié dans Chrome sans tête (URL github.io simulée : un envoi `/lumen/` ; local et `skipgc` : aucun ; 0 erreur console/CSP).

- **28/10** : **Mode calme** (test réversible, Réglages) : `S.set.calm` ; masque la série d'ouverture (rangée d'accueil, carte « Série »), la série du défi, le « Prochain défi dans … » et la série dans le texte/l'image partagés ; la récompense du jour est créditée sans fenêtre. Pas de minuteur dans Lumen : rien d'autre à retirer. Désactivé par défaut, cache `lumen-v2.3.0`, 34 tests verts. **Publié le 28/10** (push 0ad9f35, GitHub Pages). Android : pas encore porté. À mesurer avant d'étendre (pas de mesure d'usage dans l'appli : comparer les visites GoatCounter).

## En cours
- Rien.

## À faire
- Play Console (à la publication) : fiche « Sécurité des données » cohérente avec `privacy.html` (appli : aucune donnée collectée ; GoatCounter ne tourne que sur la version web, rien à déclarer pour l'appli).
- Android : AAB signé par Olivier quand le compte Play Console sera validé. (25/10 : `JEUX\lumen\android` 2.0.1 a le même Défi du jour, `game/Defi.kt`, testé contre `defi.js`.)
- Les tests de parité de `JEUX\lumen` pointent vers un `pwa\` vide : les faire pointer vers ce dépôt.
- `engine.js` (586), `progress.js` (490), `style.css` (587) dépassent 400 lignes : à découper seulement avec leurs jumeaux Android (`GameEngine.kt`, `Progression.kt`) et l'API `require` des tests (décision à prendre).
- Remplacer les liens web de `autres-jeux.js` par les liens Play Store quand les applis seront publiées (même chose dans les 3 autres jeux).
- Manifeste et `<meta description>` restent en français (référencement visé en France) : à traduire si une version anglaise du référencement est voulue.

- Décision d'Olivier : garder « Awards » pour Succès ou passer à « Achievements » (plus courant, plus long ; à changer partout, fiche Play comprise).

- Mesure d'audience : vérifier dans le tableau de bord `aulit42369.goatcounter.com` que les visites arrivent sous `/lumen/` (quelques minutes après une visite).

## Décisions prises
- **25/10** : langue par défaut = navigateur (`fr*` → français, toute autre langue → anglais) ; changer de langue recharge la page (plus simple et sûr que de tout redessiner).
- **25/10** : la carte « autres jeux » va dans les **Réglages** (l'accueil est déjà plein) ; la carte image dessine une orbe par coup (même information que les carrés du texte, dans le style du jeu).
- **25/10** (décision d'Olivier) : contact public = **aulit42369@gmail.com** (lien `mailto:` dans `privacy.html`, toutes les langues), les tickets GitHub restent proposés en second. CGU et mentions légales dans `privacy.html` (URL Play Store : `https://lumen-jeu.github.io/privacy.html`).
- **25/10** (décision d'Olivier) : un bouton « Jouer » unique et dominant sur l'accueil = Aventure au niveau en cours (le mode principal), sans passer par la carte ni la fiche du niveau ; les autres modes restent dessous, plus discrets.
- **24/10** : le défi change à **minuit heure de Paris** pour tout le monde (Q1, option sûre appliquée en attendant ta réponse).
- **24/10** : série du défi **séparée** de la série d'ouverture, sans récompense (Q2, option sûre). Libellés : « jours de suite » (ouverture) / « Série du défi ».
- **24/10** : un défi compte dans la série quand la partie se termine (feuille de fin, y compris « Abandonner » une fois bloqué) ; quitter en cours de partie ne compte pas.
- **24/10** : `S.daily` (meilleur du jour dans la sauvegarde) inchangé ; la tuile d'accueil lit `lumen.defi.v1`.
- **28/10** : bouton **Mode calme** ajouté sur l'accueil (sous le titre, synchronisé avec Réglages), cache `lumen-v2.3.1`. **Publié le 28/10** (push ce14e30). Cause du « je ne le vois pas » : il n'était que dans Réglages.
