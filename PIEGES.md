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
