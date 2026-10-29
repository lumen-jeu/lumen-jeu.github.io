# LUMEN — pièges

- **`defi.js` doit rester identique dans les 4 jeux.** `tests/defi.test.js` compare son empreinte FNV à une constante :
  modifier le fichier = le recopier dans ÉCHO, Fragments, Résonance et changer la constante `EMPREINTE` dans les 4 tests.
- **Fins de ligne** : `core.autocrlf=true` convertit en CRLF sous Windows ; l'empreinte est calculée après conversion en LF, ne pas retirer ce `replace`.
- **`404.html` est servie à n'importe quelle profondeur** (`/a/b/c`) : tous ses liens, polices et icônes en chemin absolu (`/…`), jamais relatif. Elle n'est pas mise en cache par le SW.
- **Aperçus de liens** : `og:image` doit rester une URL absolue (`https://lumen-jeu.github.io/og-image.png`) ; après modification de l'image, Facebook/Discord gardent l'ancienne en cache plusieurs jours.
- **`--brume`** sert au texte secondaire : ne pas l'assombrir sous #a19bc9 (contraste AA sur le fond `--bas` de tous les thèmes).
- **Ne pas écrire `node --test tests/`** sous Node 24 (échoue) : lancer `node --test` à la racine.
- **Version du cache** : tout fichier publié modifié → monter `CACHE` dans `sw.js` (le SW sert le cache d'abord).
- **Date** : ne plus utiliser `E.dateSeed()` (heure locale) dans l'appli ; il reste dans `engine.js` pour la parité Android.
  Le jour du jeu passe par `P.today()` / `P.dailyFor()` (heure de Paris).
- **Défi figé au lancement** : en partie de défi, utiliser `gameCtx.defi` (pas `DAY`/`todaySeed`, qui changent à minuit).
- **Partage** : le lien est dans le texte, ne pas remettre `url:` dans `navigator.share` (deux messages dans WhatsApp/Discord),
  ni `location.href` (donnerait `file://` dans une appli WebView).
- **Jour du déploiement** : la grille du défi change ce jour-là pour ceux qui l'ont déjà joué (graine différente) ; le record du jour reste.
- **JSON-LD en fin de `<body>`** (25/10) : `tests/defi.test.js` exige que `defi.js` soit le **premier** `<script>` de `index.html` ; un bloc `application/ld+json` dans le `<head>` fait échouer le test.

- **Traductions (25/10)** : le texte français du code **est** la clé de `EN` (`i18n.js`). Modifier un texte français = modifier aussi sa clé, sinon l'anglais retombe sur le français ; `tests/i18n-carte.test.js` le détecte pour les appels `tr('…')`/`T('…')` littéraux (pas pour les textes passés en variable : tableaux `INTROS`, `BOOSTERS`, données de `progress.js` — les vérifier à la main).
- **Tests et langue** : Node 21+ a un `navigator` (langue du système, anglais sur GitHub Actions) : `i18n.js` peut démarrer en anglais sous Node ; les tests fixent la langue avec `I.set()` avant de vérifier.
- **`progress.js` reste pur** : il appelle `T()`, qui n'utilise `I18N` que s'il existe (sous Node : français tel quel, pour les tests de parité Android).
- **Partage d'image** : `navigator.share` exige un geste récent de l'utilisateur ; la carte est dessinée juste après le clic (attente des polices courte). Sans `canShare({files})` (ordinateur), le PNG est téléchargé.

- **Fichier `google9ad7f8bd44912903.html` (25/10)** : validation Google Search Console (propriété + sitemap envoyé). Ne jamais le supprimer ni le renommer, sinon la propriété perd sa validation.

- **Interface en 8 scripts (lot 18)** : `app-etat.js` … `app.js` partagent la portée globale (pas de fonction englobante). Un nom de premier niveau (`var`, `function`) déclaré deux fois s'écrase en silence, et un nom comme `name`/`top`/`status` écraserait `window` : `tests/modules-app.test.js` le refuse. Le code qui s'exécute **au chargement** d'un fichier ne doit appeler que des fichiers déjà chargés (les appels dans les fonctions, eux, peuvent viser n'importe quel fichier). Nouveau fichier = l'ajouter dans `index.html`, `sw.js` et `MODULES` du test, dans le même ordre.

- **Anglais partagé avec Android (25/10)** : `TextesEn.kt` (appli) doit garder les mêmes traductions que `EN` ; le test Android `memes_traductions_que_la_pwa` lit ce `i18n.js` et échoue au moindre écart. Corriger un anglais ici = le corriger aussi dans `TextesEn.kt`.

- **Compteur GoatCounter (28/10)** : script en ligne d'une ligne en fin de `index.html`, son empreinte `sha256` est dans la CSP : le modifier = recalculer l'empreinte (`tests/statistiques.test.js`). Ne jamais retirer la garde `github.io` : compter dans une appli Android obligerait à déclarer des analytics sur le Play Store. Garder `count.v4.js` + `integrity` (pas `count.js`), comme le Site.

## Identités d'appli (manifest `id`) — NE JAMAIS CHANGER (29/10)
Chrome identifie une PWA installée par son `id` ; en changer = une autre appli, l'ancienne reste orpheline. Valeurs en ligne des 5 apps :
ÉCHO `/Echo/` (aulit42369.github.io/Echo/) · LUMEN `/` (lumen-jeu.github.io) · Fragments `/fragments/` (fragments-jeu.github.io, volontairement différent de `/`) · Résonance `/` (resonance-jeu.github.io) · CRA `/Cra/` (cra-aulit.github.io/Cra/).
`tests/manifest-sw.test.js` (identique dans les 5 projets) fige ces valeurs : si tu le modifies, copie-le à l'identique dans les 4 autres.

- **Zoom** : le viewport n'interdit plus le zoom (accessibilité) ; `touch-action: none` sur `#board` empêche le pincement pendant le jeu. Ne pas le retirer.
