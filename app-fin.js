/* LUMEN — interface (5/8) : orbes spéciales, boosters, fin de partie, partage.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
  /* ================= Orbes spéciales : présentation contextuelle ================= */
  var INTROS = {
    stone: ['Pierre', 'Elle bloque le passage et tombe avec les orbes. Fusionnez juste à côté (haut, bas, gauche, droite) pour la briser.', STONE],
    ice: ['Glace', 'Cette orbe est gelée : impossible de la relier. Une fusion voisine la libère. La glace épaisse demande deux fusions.', 'ice'],
    prism: ['Prisme', 'Le joker. Il rejoint n\'importe quelle chaîne et prend sa couleur.', PRISM],
    bomb: ['Bombe', 'Une très longue chaîne a créé cette orbe-bombe. Reliez-la à nouveau : elle souffle tout autour d\'elle.', 'bomb']
  };
  function checkIntro() {
    if (!game || game.over || current !== 'game' || !$('introCard').hidden || !$('overVeil').hidden || !$('pauseVeil').hidden) return;
    var found = {};
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var v = game.grid[r][c], m = game.mods[r][c];
      if (v === STONE) found.stone = 1; if (v === PRISM) found.prism = 1;
      if (E.isFrozen(m)) found.ice = 1; if (m === E.BOMB) found.bomb = 1;
    }
    for (var k in INTROS) if (found[k] && S.seen.indexOf(k) < 0) { showIntro(k); return; }
  }
  function showIntro(k) {
    S.seen.push(k); save();
    var it = INTROS[k], cv = $('introIco');
    $('introName').textContent = tr(it[0]); $('introText').textContent = tr(it[1]);
    var g = cv.getContext('2d'); g.clearRect(0, 0, 120, 120);
    if (it[2] === 'ice') paintGoalIcon(cv, 'ice');
    else if (it[2] === 'bomb') { paintOrbIcon(cv, 6, 0.7); g.strokeStyle = '#ff6a4a'; g.lineWidth = 4; g.setLineDash([6, 6]); g.beginPath(); g.arc(60, 60, 46, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
    else paintOrbIcon(cv, it[2], 0.75);
    $('introCard').hidden = false;
  }

  /* ================= Boosters ================= */
  function useBooster(b) {
    if (!game || game.over || dragging || gameCtx.mode === 'tutorial') return;
    if (b === 'pulse') {
      var free = !game.pulseUsed;
      if (!free && !S.inv.pulse) return offerShop('pulse');
      if (!E.pulse(game, !free)) return;
      if (!free) { S.inv.pulse--; save(); }
      sfx.pulse(); vibrate([10, 30, 10, 30, 40]);
      var now = performance.now();
      syncVis();
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) vis[r][c].pop = now + (Math.abs(r - 3.5) + Math.abs(c - 2.5)) * 30;
      rings.push({ x: W / 2, y: H / 2, col: '#a46bff', t0: now, big: true, wide: true });
      lastAction = now; hint = null;
      updateHud(false);
      return;
    }
    if (b === 'moves') {
      if (game.movesLeft < 0) return;
      if (!S.inv.moves) return offerShop('moves');
      S.inv.moves--; E.addMoves(game, 5); save();
      sfx.coin(); toast(tr('+5 coups')); updateHud(true);
      return;
    }
    if (!S.inv[b]) return offerShop(b);
    targeting = targeting === b ? null : b;
    $('targetBar').hidden = !targeting;
    $('targetText').textContent = tr(b === 'hammer' ? 'Marteau : touchez la case à retirer' : 'Étincelle : touchez l\'orbe à faire monter');
    renderBoosters();
  }
  function offerShop(b) {
    var names = { pulse: 'Pulse', hammer: 'Marteau', spark: 'Étincelle', moves: '+5 coups' };
    toast(tr('Plus de {0}. La boutique en vend contre des éclats.', tr(names[b])));
  }
  function useTarget(hit) {
    var b = targeting, res = null, gref = game;
    if (b === 'hammer') res = E.hammer(game, hit.r, hit.c);
    else if (b === 'spark') res = E.spark(game, hit.r, hit.c);
    if (!res) { sfx.deny(); return; }
    S.inv[b]--; save();
    targeting = null; $('targetBar').hidden = true;
    var now = performance.now(), x = cx(hit.c), y = cy(hit.r);
    if (b === 'hammer') {
      burst(x, y, res.level === STONE ? '#a49cb4' : res.level === PRISM ? '#ffffff' : lvColor(res.level)[1], 22, true);
      rings.push({ x: x, y: y, col: '#ff9a5a', t0: now, big: true });
      shake = now; sfx.stone(); vibrate([30, 20, 40]);
      animateFalls(res.falls, 60);
    } else {
      syncVis(); vis[hit.r][hit.c].pop = now;
      burst(x, y, '#ffe066', 20, true);
      rings.push({ x: x, y: y, col: '#ffe066', t0: now, big: true });
      sfx.merge(res.level, 3); vibrate(30);
    }
    updateHud(true); renderGoals(true);
    if (game.over) setTimeout(function () { if (game === gref) endGame(); }, 700);
  }

  /* ================= Fin de partie ================= */
  function endGame() {
    if (!game || finalized) return;
    var mode = game.mode;
    if (mode === 'tutorial') return;
    // proposer de continuer avant de comptabiliser
    if (!game.won) {
      var outOfMoves = game.movesLeft === 0;
      var canMoves = outOfMoves && mode === 'adventure' && S.inv.moves > 0;
      var canPulse = !outOfMoves && S.inv.pulse > 0;
      if (canMoves || canPulse) return showContinue(canMoves ? 'moves' : 'pulse');
    }
    finalize();
  }
  var pendingContinue = null;
  function showContinue(kind) {
    pendingContinue = kind;
    $('introCard').hidden = true;
    sfx.over();
    $('overTitle').textContent = tr(kind === 'moves' ? 'Plus de coups' : 'Plus aucune chaîne possible');
    $('overStars').hidden = true;
    $('finalScore').textContent = fmt(game.score);
    $('newBest').hidden = true;
    $('gains').innerHTML = game.level ? E.goalProgress(game).map(function (q) { return '<span>' + goalLabel(q.type, q.target) + ' <b>' + (q.type === 'level' ? (q.done ? '✓' : '–') : fmt(q.value) + '/' + fmt(q.target)) + '</b></span>'; }).join('') : '';
    $('sharePreview').hidden = true;
    $('shareBtn').hidden = true;
    resetShare();
    $('replayBtn').textContent = kind === 'moves' ? tr('+5 coups') + ' (' + S.inv.moves + ')' : 'Pulse (' + S.inv.pulse + ')';
    $('replayBtn').setAttribute('data-act', 'continue');
    $('leaveBtn').textContent = tr('Abandonner');
    $('leaveBtn').setAttribute('data-act', 'giveup');
    paintOrbIcon($('overOrb'), game.bestLevel);
    $('overBest').textContent = game.movesLeft >= 0 ? game.movesLeft : fmt(S.best);
    $('overBestLbl').textContent = tr(game.movesLeft >= 0 ? 'Coups' : 'Record');
    $('overMoves').textContent = game.movesPlayed;
    $('overVeil').hidden = false;
  }
  function doContinue() {
    var kind = pendingContinue; pendingContinue = null;
    $('overVeil').hidden = true;
    if (kind === 'moves') { S.inv.moves--; E.addMoves(game, 5); sfx.coin(); toast(tr('+5 coups')); }
    else { S.inv.pulse--; E.pulse(game, true); sfx.pulse(); syncVis(); var now = performance.now(); for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) vis[r][c].pop = now + (Math.abs(r - 3.5) + Math.abs(c - 2.5)) * 30; }
    save(); updateHud(true);
  }
  function goalLabel(type, target) {
    return { level: tr('Orbe {0}', target), score: 'Score', stone: tr('Pierres'), ice: tr('Glace'), prism: tr('Prismes') }[type];
  }

  var lastShare = '';
  function finalize() {
    if (finalized) return;
    finalized = true;
    $('introCard').hidden = true;
    pendingContinue = null;
    var dSeed = gameCtx.defi ? gameCtx.defi.num : todaySeed; // défi figé au lancement (partie commencée avant minuit)
    var mode = game.mode, isNew = false, prevBest = S.best, prevDaily = S.daily.seed === dSeed ? S.daily.best : 0;
    var prevEv = gameCtx.ev && S.ev.week === gameCtx.ev.week ? S.ev.best : 0;
    var res = P.onGameEnd(S, DAY, { mode: mode, score: game.score, peak: game.peak, won: game.won, stars: game.stars || 0, levelN: gameCtx.levelN, dailySeed: dSeed });
    save();
    if (mode === 'daily') D.record('lumen', gameCtx.defi, game.score);
    if (game.won) sfx.win(); else sfx.over();
    vibrate([30, 60, 30]);
    var title = tr('Plus aucune chaîne possible'), bestVal = 0, bestLbl = tr('Record');
    if (mode === 'daily') { title = game.movesLeft === 0 ? tr('Défi du jour terminé') : title; isNew = game.score > prevDaily && prevDaily > 0; bestVal = S.daily.best; bestLbl = tr('Meilleur du jour'); }
    else if (mode === 'event') { title = gameCtx.ev.name; isNew = game.score > prevEv && prevEv > 0; bestVal = S.ev.best; bestLbl = tr('Record semaine'); }
    else if (mode === 'adventure') { title = tr(game.won ? 'Niveau {0} réussi' : 'Niveau {0} manqué', gameCtx.levelN); bestVal = (S.adv[gameCtx.levelN - 1] || 0); bestLbl = tr('Étoiles max'); }
    else { isNew = game.score > prevBest && prevBest > 0; bestVal = S.best; }
    $('overTitle').textContent = title;
    var st = $('overStars');
    if (mode === 'adventure') { st.hidden = false; st.innerHTML = [1, 2, 3].map(function (i) { return STAR(game.won && game.stars >= i, i === 2 ? 'mid' : ''); }).join(''); if (game.won) [0, 1, 2].forEach(function (i) { if (game.stars > i) setTimeout(function () { sfx.star(i); }, 300 + i * 250); }); }
    else st.hidden = true;
    $('finalScore').textContent = fmt(game.score);
    $('newBest').hidden = !isNew;
    $('newBest').textContent = tr(mode === 'daily' ? 'Meilleur score du jour' : mode === 'event' ? 'Record de la semaine' : 'Nouveau record');
    $('overBest').textContent = fmt(bestVal);
    $('overBestLbl').textContent = bestLbl;
    $('overMoves').textContent = game.movesPlayed;
    var gains = '';
    if (res.ec) gains += '<span>' + SHARD + '<b>+' + res.ec + '</b> ' + tr('éclats') + '</span>';
    if (res.xp) gains += '<span><b>+' + res.xp + '</b> ' + tr('lueur') + '</span>';
    if (res.newStars) gains += '<span><b>+' + res.newStars + '</b> ★</span>';
    $('gains').innerHTML = gains;
    // partage
    $('shareBtn').hidden = mode === 'adventure' && !game.won;
    $('shareLbl').textContent = tr(mode === 'daily' ? 'Partager le résultat' : 'Partager');
    $('shareImgBtn').hidden = mode !== 'daily';
    $('overVeil').querySelector('.actions').classList.toggle('defi', mode === 'daily');
    resetShare();
    lastShare = shareText();
    var prev = $('sharePreview');
    prev.hidden = mode !== 'daily';
    $('defiLine').hidden = mode !== 'daily';
    if (mode === 'daily') {
      prev.textContent = lastShare;
      D.record('lumen', gameCtx.defi, game.score, lastShare);
      var ds = D.load('lumen'), sr = D.serie('lumen', gameCtx.defi);
      prev.setAttribute('aria-label', tr('Défi {0} terminé, score {1}', gameCtx.defi.n, fmt(game.score)) + (sr >= 2 ? tr(', série de {0} jours', sr) : ''));
      var left = P.msToNextDaily(), h = Math.floor(left / 3600000), mn = Math.floor(left / 60000) % 60;
      $('defiLine').innerHTML = '<span class="defi-serie' + (sr >= 2 ? ' hot' : '') + '">' + FLAME + tr('Série du défi : ') + '<b>' + trn(sr, '{0} jour', '{0} jours') + '</b> ' + tr('(record {0})', ds.best) + '</span>' +
        '<span>' + tr('Prochain défi dans ') + '<b>' + h + ' h ' + (mn < 10 ? '0' : '') + mn + '</b></span>';
    }
    // boutons
    var rb = $('replayBtn'), lb = $('leaveBtn');
    if (mode === 'adventure' && game.won) { rb.textContent = tr('Niveau suivant'); rb.setAttribute('data-act', 'nextLevel'); lb.textContent = tr('Voir la carte'); lb.setAttribute('data-act', 'map'); }
    else if (mode === 'adventure') { rb.textContent = tr('Réessayer'); rb.setAttribute('data-act', 'replay'); lb.textContent = tr('Voir la carte'); lb.setAttribute('data-act', 'map'); }
    else { rb.textContent = tr('Rejouer'); rb.setAttribute('data-act', 'replay'); lb.textContent = tr('Retour à l\'accueil'); lb.setAttribute('data-act', 'home'); }
    paintOrbIcon($('overOrb'), game.bestLevel);
    $('overVeil').hidden = false;
    if (res.events.length) setTimeout(function () { ticker(res.events); }, 900);
    refreshEc(true);
  }

  function shareText() {
    if (game.mode === 'daily') return P.shareDaily(gameCtx.defi.day, game.score, game.history, game.peak, game.st.longest, D.serie('lumen', gameCtx.defi));
    return otherShare() + '\n' + P.URL;
  }
  function otherShare() {
    if (game.mode === 'adventure') return tr('LUMEN ✨ Niveau {0} réussi avec {1} ({2})', gameCtx.levelN, '★★★'.slice(0, game.stars), chapterOf(gameCtx.levelN).name);
    if (game.mode === 'event') return tr('LUMEN ✨ {0} : {1} points', gameCtx.ev.name, fmt(game.score));
    return tr('J\'ai fait {0} sur LUMEN ✨ niveau max {1}', fmt(game.score), game.bestLevel);
  }
  function share() {
    // le lien est dans le texte (pas de champ url à part : WhatsApp/Discord en feraient deux messages)
    var text = lastShare || shareText();
    D.share(text).then(function (r) {
      if (r === 'partage') $('shareStatus').textContent = tr('Résultat partagé');
      else if (r === 'copie') $('shareStatus').textContent = tr('Résultat copié, collez-le où vous voulez');
      else if (r === 'manuel') manualCopy(text);
    });
  }
  function manualCopy(text) {
    var box = $('shareManual'), ta = $('shareManualText');
    box.hidden = false; ta.value = text; $('sharePreview').hidden = true; // l'aperçu ferait doublon
    $('shareStatus').textContent = tr('Copiez le texte ci-dessous');
    ta.focus(); ta.select();
  }
  /** Carte image 1080×1920 du défi (carte.js) : partage natif avec fichier, sinon téléchargement du PNG. */
  function shareImage() {
    if (!game || game.mode !== 'daily') return;
    var m = window.LumenCarte.model({ n: gameCtx.defi.n, score: fmt(game.score), history: game.history, peak: game.peak, longest: game.st.longest,
      serie: D.serie('lumen', gameCtx.defi), url: P.URL, t: tr, tn: trn });
    window.LumenCarte.share(m, { theme: THEME, orb: orbSprite, text: lastShare || shareText() }).then(function (r) {
      if (r === 'partage') $('shareStatus').textContent = tr('Image partagée');
      else if (r === 'fichier') $('shareStatus').textContent = tr('Image enregistrée dans vos téléchargements');
    });
  }
  function resetShare() { $('shareStatus').textContent = ''; $('shareManual').hidden = true; }
  function toastAny(msg) {
    ticker([{ kind: 'info', text: msg }]);
  }

