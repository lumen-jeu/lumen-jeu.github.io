# LUMEN — plan de mise en œuvre

## État au 28/10/2026
- PWA en ligne (cache `lumen-v2.2.6`), 28 tests `node --test` verts.
- Fait : Défi du jour commun, partage texte + image, anglais, autres jeux, lot 18 (découpage de `app.js`), bouton « Jouer »,
  politique LCEN/RGPD, CSP, `<main>` autour des écrans (28/10).
- Android 2.1.0 au même niveau (dans `JEUX\lumen\android`), pas encore publié.

## Prochaines étapes (d'après `A_FAIRE.md`)
1. Play Console : fiche « Sécurité des données » cohérente avec `privacy.html` (aucune donnée collectée).
2. Android : AAB signé par Olivier quand le compte Play Console sera validé.
3. Rebrancher les tests de parité de `JEUX\lumen` sur ce dépôt (ils pointent vers un `pwa\` vide).
4. Remplacer les liens de `autres-jeux.js` par les liens Play Store à la publication (même chose dans les 3 autres jeux).
5. Découper `engine.js`, `progress.js`, `style.css` (> 400 lignes) seulement avec leurs jumeaux Android : décision à prendre.

## Décisions en attente (Olivier)
- Mesure d'audience : rien d'installé (option sans cookie si oui).
- Traduire le manifeste et la description en anglais si un référencement anglais est voulu.
