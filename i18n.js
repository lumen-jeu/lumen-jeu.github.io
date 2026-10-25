/* LUMEN — langue de l'interface (français / anglais). Source unique des traductions de la PWA.
 * Le texte français reste dans le code et sert de clé ; EN donne sa traduction. {0}, {1}… = valeurs insérées.
 * Langue : choix mémorisé ('lumen.lang'), sinon langue du navigateur (fr* → français, autre → anglais). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18N = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var KEY = 'lumen.lang';
  var EN = {
    // ---------- page (index.html) ----------
    'Jeu de puzzle gratuit : reliez les orbes de lumière | LUMEN': 'Free puzzle game: link the orbs of light | LUMEN',
    'Rang et statistiques': 'Rank and stats', 'Éclats et boutique': 'Shards and shop', 'Réglages': 'Settings',
    ': jeu de puzzle gratuit': ': a free puzzle game', 'Reliez. Fusionnez. Faites monter la lumière.': 'Link. Merge. Raise the light.',
    'Série de connexion': 'Daily streak', 'jours': 'days', 'Aventure': 'Adventure', 'Classique': 'Classic', 'Défi du jour': 'Daily Challenge',
    'Semaine': 'Week', 'Boutique': 'Shop', 'Succès': 'Awards', 'Thèmes': 'Themes', 'Retour': 'Back', 'Partie': 'Game',
    'Couper le son': 'Mute', 'Activer le son': 'Unmute', 'coups': 'moves', 'Continuer': 'Continue', 'Plateau de jeu': 'Game board',
    'Touchez une orbe': 'Tap an orb', 'Annuler': 'Cancel', 'Marteau': 'Hammer', 'Étincelle': 'Spark', 'Coups': 'Moves',
    'Les éclats se gagnent en jouant : fin de partie, missions, série et succès. Rien ne s\'achète avec de l\'argent réel.':
      'Shards are earned by playing: finished games, missions, streaks and awards. Nothing is bought with real money.',
    'Missions du jour': 'Daily missions', 'Nouvelles missions à minuit.': 'New missions at midnight.', 'Série': 'Streak',
    'Événement de la semaine': 'Weekly event', 'Statistiques': 'Statistics', 'Sons': 'Sounds', 'Musique d\'ambiance': 'Ambient music',
    'Nappes douces générées en direct': 'Soft pads generated live', 'Rejouer le tutoriel': 'Replay the tutorial', 'Sauvegarde': 'Backup',
    'Changement de téléphone ? Copiez ce code et collez-le dans LUMEN sur le nouvel appareil (PWA ou appli Android).':
      'New phone? Copy this code and paste it into LUMEN on the new device (web app or Android app).',
    'Code de sauvegarde': 'Save code', 'Copier le code': 'Copy code', 'Importer un code': 'Import a code',
    'Collez ici un code LUMEN2…': 'Paste a LUMEN2… code here', 'Code à importer': 'Code to import',
    'Ce code est incomplet ou abîmé. Vérifiez qu\'il commence par LUMEN2 et qu\'il a été copié en entier.':
      'This code is incomplete or damaged. Check that it starts with LUMEN2 and was copied in full.',
    'Remplacer ma progression': 'Replace my progress', 'Zone sensible': 'Danger zone', 'Réinitialiser la progression': 'Reset progress',
    'Tout sera effacé : étoiles, éclats, boosters, thèmes, succès. Exportez votre code avant si vous voulez revenir en arrière.':
      'Everything will be erased: stars, shards, boosters, themes, awards. Export your code first if you might want to go back.',
    'Garder ma progression': 'Keep my progress', 'Tout effacer': 'Erase everything',
    'LUMEN v2 · aucune donnée ne quitte votre appareil': 'LUMEN v2 · no data ever leaves your device',
    'Confidentialité, conditions et mentions légales': 'Privacy, terms and legal notice',
    'Reprendre': 'Resume', 'Recommencer': 'Restart', 'Quitter la partie': 'Quit game', 'Fin de partie': 'Game over',
    'Plus aucune chaîne possible': 'No chains left', 'Nouveau record': 'New best', 'Niveau max': 'Top level', 'Record': 'Best',
    'Fusions': 'Merges', 'Texte à copier': 'Text to copy', 'Partager': 'Share', 'Rejouer': 'Play again', 'Retour à l\'accueil': 'Back to home',
    'Niveau': 'Level', 'Fermer': 'Close', 'Jouer': 'Play', 'Récompense': 'Reward', 'Récupérer': 'Collect', 'Nouvelle orbe': 'New orb',
    'Pierre': 'Stone', 'Compris': 'Got it', 'Accueil': 'Home', 'Langue': 'Language', 'Language': 'Langue',
    // ---------- chapitres (levels.json) ----------
    'La Petite Ourse': 'Little Dipper', 'Cassiopée': 'Cassiopeia', 'La Lyre': 'Lyra', 'Le Cygne': 'Cygnus', 'Le Dragon': 'Draco',
    'Les bases : tracez, fusionnez, montez.': 'The basics: trace, merge, rise.',
    'Les pierres bloquent le passage. Fusionnez juste à côté pour les briser.': 'Stones block the way. Merge right next to them to break them.',
    'Certaines orbes sont prises dans la glace. Une fusion voisine les libère.': 'Some orbs are trapped in ice. A merge next to them sets them free.',
    'Le prisme rejoint n\'importe quelle chaîne et prend sa couleur.': 'The prism joins any chain and takes on its colour.',
    'Une chaîne de 6 orbes ou plus crée une bombe. Reliez-la pour tout souffler autour.': 'A chain of 6 orbs or more makes a bomb. Link it to blast everything around it.',
    'Glace épaisse : deux fusions voisines pour la briser. Tout ce que vous avez appris, à la fois.': 'Thick ice: two merges next to it to break it. Everything you have learned, all at once.',
    'Constellations infinies': 'Endless Constellations', 'Des niveaux sans fin, de plus en plus exigeants.': 'Endless levels, each one more demanding.',
    // ---------- partie ----------
    'Glissez le doigt d\'une orbe <b>1</b> à sa voisine. Deux orbes identiques suffisent.': 'Slide your finger from a <b>1</b> orb to its neighbour. Two matching orbs are enough.',
    'Bien. La fusion naît sur la <b>dernière</b> orbe touchée. Reliez maintenant les trois orbes <b>3</b>.': 'Nice. The merge appears on the <b>last</b> orb you touch. Now link the three <b>3</b> orbs.',
    'Dès <b>5 orbes</b>, la fusion saute un niveau. Tracez la longue chaîne d\'orbes <b>2</b>.': 'From <b>5 orbs</b> up, the merge skips a level. Trace the long chain of <b>2</b> orbs.',
    'Voilà l\'essentiel. Plus le niveau monte, plus la lumière vaut de points. Pierres, glace, prismes et bombes vous attendent dans l\'<b>Aventure</b>.':
      'That\'s the gist. The higher the level, the more the light is worth. Stones, ice, prisms and bombs await you in <b>Adventure</b>.',
    'Commencer à jouer': 'Start playing', 'Défi du jour, LUMEN #{0}': 'Daily Challenge, LUMEN #{0}', 'Niveau {0}': 'Level {0}', 'Tutoriel': 'Tutorial',
    'Bombe': 'Bomb', 'Éblouissant': 'Dazzling', 'Éclat': 'Flash', 'Plus aucune chaîne. Lancez un Pulse.': 'No chains left. Fire a Pulse.',
    'Glace': 'Ice', 'Prisme': 'Prism',
    'Elle bloque le passage et tombe avec les orbes. Fusionnez juste à côté (haut, bas, gauche, droite) pour la briser.': 'It blocks the way and falls with the orbs. Merge right next to it (up, down, left, right) to break it.',
    'Cette orbe est gelée : impossible de la relier. Une fusion voisine la libère. La glace épaisse demande deux fusions.': 'This orb is frozen, so you can\'t link it. A merge next to it sets it free. Thick ice takes two merges.',
    'Le joker. Il rejoint n\'importe quelle chaîne et prend sa couleur.': 'The wildcard. It joins any chain and takes on its colour.',
    'Une très longue chaîne a créé cette orbe-bombe. Reliez-la à nouveau : elle souffle tout autour d\'elle.': 'A very long chain created this bomb orb. Link it again and it blasts everything around it.',
    '+5 coups': '+5 moves', 'Marteau : touchez la case à retirer': 'Hammer: tap the tile to remove', 'Étincelle : touchez l\'orbe à faire monter': 'Spark: tap the orb to level up',
    'Plus de {0}. La boutique en vend contre des éclats.': 'Out of {0}. The shop sells more for shards.', 'Plus de coups': 'Out of moves', 'Abandonner': 'Give up',
    'Orbe {0}': 'Orb {0}', 'Pierres': 'Stones', 'Prismes': 'Prisms',
    // ---------- fin de partie, partage ----------
    'Défi du jour terminé': 'Daily Challenge complete', 'Meilleur du jour': 'Today\'s best', 'Record semaine': 'Week best',
    'Niveau {0} réussi': 'Level {0} cleared', 'Niveau {0} manqué': 'Level {0} failed', 'Étoiles max': 'Best stars',
    'Meilleur score du jour': 'Today\'s best score', 'Record de la semaine': 'This week\'s best', 'éclats': 'shards', 'lueur': 'glow',
    'Partager le résultat': 'Share result', 'Partager l\'image': 'Share image', 'Image partagée': 'Image shared', 'Image enregistrée dans vos téléchargements': 'Image saved to your downloads',
    'Défi {0} terminé, score {1}': 'Challenge {0} complete, score {1}', ', série de {0} jours': ', {0}-day streak',
    'Série du défi : ': 'Challenge streak: ', '{0} jour': '{0} day', '{0} jours': '{0} days', '(record {0})': '(best {0})', 'Prochain défi dans ': 'Next challenge in ',
    'Niveau suivant': 'Next level', 'Voir la carte': 'View map', 'Réessayer': 'Try again',
    'LUMEN ✨ Niveau {0} réussi avec {1} ({2})': 'LUMEN ✨ Level {0} cleared with {1} ({2})', 'LUMEN ✨ {0} : {1} points': 'LUMEN ✨ {0}: {1} points',
    'J\'ai fait {0} sur LUMEN ✨ niveau max {1}': 'I scored {0} on LUMEN ✨ top level {1}',
    'Résultat partagé': 'Result shared', 'Résultat copié, collez-le où vous voulez': 'Result copied, paste it anywhere', 'Copiez le texte ci-dessous': 'Copy the text below',
    'Défi du jour #{0}': 'Daily Challenge #{0}', 'Niveau max {0}, chaîne de {1}': 'Top level {0}, chain of {1}',
    '{0} jour de suite': '{0} day in a row', '{0} jours de suite': '{0} days in a row', 'Défi du jour LUMEN #{0}': 'LUMEN Daily Challenge #{0}',
    // ---------- accueil, carte ----------
    'Rang {0}': 'Rank {0}', 'jour de suite': 'day in a row', 'jours de suite': 'days in a row', 'Niveau {0} sur 120': 'Level {0} of 120', 'Record {0}': 'Best {0}',
    'fait ✓ · ': 'done ✓ · ', 'à faire': 'to play', 'Série du défi': 'Challenge streak', ' jour de défi de suite': ' challenge day in a row', ' jours de défi de suite': ' challenge days in a row',
    'Objectif atteint, encore {0} j': 'Goal reached, {0} d left', 'Objectif {0}, encore {1} j': 'Goal {0}, {1} d left', 'record': 'best',
    'Au-delà des 120 niveaux': 'Beyond the 120 levels', 'Chapitre {0}, niveaux {1} à {2}': 'Chapter {0}, levels {1} to {2}',
    ', verrouillé': ', locked', ', {0} étoiles': ', {0} stars', '{0} étoiles sur 360': '{0} stars out of 360',
    'Créer une orbe de niveau {0}': 'Make a level {0} orb', 'Marquer {0} points': 'Score {0} points', 'Briser {0} pierres': 'Break {0} stones',
    'Libérer {0} orbes de la glace': 'Free {0} orbs from the ice', 'Utiliser {0} prismes': 'Use {0} prisms',
    '{0} coup': '{0} move', '{0} coups': '{0} moves', '. ★★ s\'il en reste {0}, ★★★ s\'il en reste {1}.': '. ★★ with {0} left, ★★★ with {1} left.',
    // ---------- panneaux ----------
    'Mélange toutes les orbes libres. Débloque un plateau sans issue.': 'Shuffles all free orbs. Unjams a dead-end board.',
    'Retire la case de votre choix : orbe, pierre ou prisme.': 'Removes the tile of your choice: orb, stone or prism.',
    'Fait monter une orbe d\'un niveau et la libère de la glace.': 'Raises an orb by one level and frees it from the ice.',
    'Cinq coups de plus quand un niveau d\'Aventure se joue à un souffle.': 'Five extra moves when an Adventure level comes down to the wire.',
    'En réserve : {0}': 'In stock: {0}', 'Actif': 'Active', 'Utiliser': 'Use', 'Thème actuel': 'Current theme', 'Débloqué': 'Unlocked', 'Offert au rang {0}': 'Free at rank {0}',
    'Nuit Lumen': 'Lumen Night', 'Aurore boréale': 'Northern Lights', 'Braises': 'Embers', 'Abysses': 'Abyss', 'Aube rosée': 'Rosy Dawn',
    'Ouvrez LUMEN chaque jour. Le 7<sup>e</sup> jour offre 150 éclats et une Étincelle. Un jour manqué, et la série repart de zéro. Record : {0} jours.':
      'Open LUMEN every day. Day 7 brings 150 shards and a Spark. Miss a day and the streak starts over. Best: {0} days.',
    ' Atteignez {0} points en une partie pour gagner {1} éclats': ' Reach {0} points in one game to win {1} shards', ' (déjà gagnés).': ' (already won).',
    ' Fin dans {0} jour.': ' Ends in {0} day.', ' Fin dans {0} jours.': ' Ends in {0} days.', 'Terminé : ': 'Completed: ',
    'Rang {0}, {1} / {2} lueur': 'Rank {0}, {1} / {2} glow', 'Rang {0} : titre « {1} »': 'Rank {0}: “{1}” title', 'Tous les titres obtenus': 'All titles earned', 'Rang {0} : thème {1}': 'Rank {0}: {1} theme',
    'Parties jouées': 'Games played', 'Meilleur score': 'Best score', 'Niveau d\'orbe max': 'Highest orb level', 'Plus longue chaîne': 'Longest chain',
    'Fusions au total': 'Total merges', 'Étoiles en Aventure': 'Adventure stars', 'Record de série': 'Best streak', '{0} j': '{0} d',
    'Pierres brisées': 'Stones broken', 'Orbes dégelées': 'Orbs thawed', 'Bombes déclenchées': 'Bombs set off',
    'La série repart à zéro': 'Your streak starts over', 'Jour {0} de votre série': 'Day {0} of your streak',
    'Septième jour : une Étincelle en prime. Le cycle recommence demain.': 'Day seven: a bonus Spark. The cycle starts again tomorrow.',
    'Un jour a été manqué. Revenez demain pour le jour 2.': 'You missed a day. Come back tomorrow for day 2.',
    'Revenez demain : la récompense grandit chaque jour jusqu\'au 7e.': 'Come back tomorrow: the reward grows every day until day 7.',
    'Demain : 150 éclats et une Étincelle.': 'Tomorrow: 150 shards and a Spark.',
    'Code copié': 'Code copied', 'Sélectionnez et copiez le code': 'Select and copy the code', 'Progression restaurée': 'Progress restored',
    'Ouvrez LUMEN directement pour effacer': 'Open LUMEN directly to erase', 'Progression effacée': 'Progress erased',
    'Les autres jeux d\'Aulit': 'Aulit\'s other games',
    'Un labyrinthe dans le noir, guidé par l\'écho': 'A maze in the dark, guided by echoes', 'Reliez les orbes, faites monter la lumière': 'Link the orbs, raise the light',
    'Party game : chacun tient une pièce du dossier': 'Party game: everyone holds a piece of the case', 'Croise les ondes, allume les nœuds': 'Cross the waves, light up the nodes',
    // ---------- progression (progress.js) ----------
    'Braise': 'Ember', 'Flammèche': 'Flicker', 'Lanterne': 'Lantern', 'Phare': 'Lighthouse', 'Comète': 'Comet', 'Étoile filante': 'Shooting Star',
    'Réaliser # fusions': 'Make # merges', 'Tracer une chaîne de # orbes': 'Draw a chain of # orbs', 'Créer une orbe de niveau #': 'Make a level # orb',
    'Marquer # points en une partie': 'Score # points in one game', 'Réussir # niveaux d\'Aventure': 'Clear # Adventure levels', 'Gagner # étoiles': 'Earn # stars',
    'Jouer le Défi du jour': 'Play the Daily Challenge', 'Terminer # parties': 'Finish # games', 'Briser # pierres': 'Break # stones', 'Créer # bombes': 'Make # bombs',
    'Semaine de la Glace': 'Ice Week', 'Semaine des Prismes': 'Prism Week', 'Semaine des Pierres': 'Stone Week',
    'Semaine des Supernovas': 'Supernova Week', 'Semaine des Bombes': 'Bomb Week', 'Semaine du Sprint': 'Sprint Week',
    'Des orbes gelées tombent du ciel. Fusionnez à côté pour les libérer.': 'Frozen orbs fall from the sky. Merge next to them to set them free.',
    'Les prismes jokers sont six fois plus fréquents.': 'Wildcard prisms are six times more common.',
    'Des pierres tombent avec les orbes. Chacune brisée rapporte 25 points.': 'Stones fall with the orbs. Each one you break is worth 25 points.',
    'Le saut de deux niveaux arrive dès 4 orbes.': 'The two-level jump kicks in from just 4 orbs.',
    'Une chaîne de 5 orbes crée déjà une bombe.': 'A chain of only 5 orbs already makes a bomb.',
    '30 coups seulement, prismes plus fréquents. Visez juste.': 'Only 30 moves, more prisms. Make every move count.',
    'Forgeron de lumière': 'Lightsmith', '# fusions au total': '# merges in total', 'Long filament': 'Long Filament', 'Une chaîne de # orbes': 'A chain of # orbs',
    'Vers le blanc': 'Into the White', 'Atteindre le niveau #': 'Reach level #', 'Haute intensité': 'High Intensity', '# points en Classique': '# points in Classic',
    'Cartographe': 'Cartographer', '# étoiles en Aventure': '# Adventure stars', 'Veilleur': 'Night Watch', '# parties jouées': '# games played',
    'Fidèle au ciel': 'Faithful to the Sky', 'Une série de # jours': 'A #-day streak', 'Tailleur de pierre': 'Stonecutter', '# pierres brisées': '# stones broken',
    'Dégel': 'Thaw', '# orbes libérées de la glace': '# orbs freed from the ice', 'Artificier': 'Fireworks Master', '# bombes déclenchées': '# bombs set off',
    'Rendez-vous quotidien': 'Daily Ritual', '# défis du jour joués': '# Daily Challenges played',
    'Rang {0} : {1}': 'Rank {0}: {1}', 'Thème débloqué : {0}': 'Theme unlocked: {0}', 'Mission accomplie : {0}': 'Mission complete: {0}',
    ' (bronze)': ' (bronze)', ' (argent)': ' (silver)', ' (or)': ' (gold)', '{0} : objectif atteint': '{0}: goal reached'
  };

  /** Langue retenue : choix mémorisé, sinon première langue du navigateur (fr* → 'fr', autre → 'en', inconnue → 'fr'). */
  function choose(saved, langs) {
    if (saved === 'fr' || saved === 'en') return saved;
    var first = langs && langs.length ? String(langs[0]) : '';
    if (!first) return 'fr';
    return /^fr\b/i.test(first) ? 'fr' : 'en';
  }
  function lsGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  var nav = typeof navigator !== 'undefined' ? navigator : {};
  var lang = choose(lsGet(), nav.languages && nav.languages.length ? nav.languages : nav.language ? [nav.language] : []);

  function fill(s, args) { return String(s).replace(/\{(\d)\}/g, function (m, i) { return args[+i] == null ? m : args[+i]; }); }
  /** Traduit un texte français (clé), puis remplace {0}, {1}… par les arguments suivants. */
  function t(fr) {
    var args = Array.prototype.slice.call(arguments, 1);
    return fill(lang === 'en' && Object.prototype.hasOwnProperty.call(EN, fr) ? EN[fr] : fr, args);
  }
  /** Pluriel : français « 0 ou 1 → singulier », anglais « 1 seul → singulier ». */
  function tn(n, un, plusieurs) { return t((lang === 'en' ? n === 1 : n <= 1) ? un : plusieurs, n); }
  function set(l) { if (l !== 'fr' && l !== 'en') return; lang = l; try { localStorage.setItem(KEY, l); } catch (e) { /* stockage bloqué */ } }

  /** Traduit la page statique : textes, aria-label, placeholder, title, <html lang>. */
  function apply(doc) {
    doc.documentElement.lang = lang;
    if (lang === 'fr') return;
    doc.title = t(doc.title);
    var w = doc.createTreeWalker(doc.body, 4), n;
    while ((n = w.nextNode())) {
      var s = n.nodeValue, k = s.trim();
      if (k && Object.prototype.hasOwnProperty.call(EN, k)) n.nodeValue = s.replace(k, EN[k]);
    }
    doc.querySelectorAll('[aria-label],[placeholder],[title]').forEach(function (el) {
      ['aria-label', 'placeholder', 'title'].forEach(function (a) { var v = el.getAttribute(a); if (v) el.setAttribute(a, t(v)); });
    });
  }

  return { t: t, tn: tn, set: set, apply: apply, choose: choose, EN: EN, get lang() { return lang; }, locale: function () { return lang === 'en' ? 'en-US' : 'fr-FR'; } };
});
