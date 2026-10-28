/* LUMEN v2 — interface (8/8) : panneaux, écrans, clics, boucle, démarrage. Logique : engine.js + progress.js
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
  /* ================= Panneaux ================= */
  var BOOSTERS = [
    ['pulse', 'Pulse', 'Mélange toutes les orbes libres. Débloque un plateau sans issue.'],
    ['hammer', 'Marteau', 'Retire la case de votre choix : orbe, pierre ou prisme.'],
    ['spark', 'Étincelle', 'Fait monter une orbe d\'un niveau et la libère de la glace.'],
    ['moves', '+5 coups', 'Cinq coups de plus quand un niveau d\'Aventure se joue à un souffle.']
  ];
  function renderShop() {
    $('shopList').innerHTML = BOOSTERS.map(function (b) {
      var lens = b[0] === 'pulse' ? '<span class="lens pulse"></span>' : document.querySelector('.boost[data-b=' + b[0] + '] .lens').outerHTML;
      var price = P.PRICES[b[0]];
      return '<div class="shop-item">' + lens + '<div><b>' + tr(b[1]) + '</b><p>' + tr(b[2]) + '</p><span class="own">' + tr('En réserve : {0}', S.inv[b[0]]) + '</span></div>' +
        '<button class="price" data-act="buy" data-b="' + b[0] + '"' + (S.ec < price ? ' disabled' : '') + '>' + SHARD + price + '</button></div>';
    }).join('');
    renderThemeCards($('shopThemes'), true);
    refreshEc(false);
  }
  function themeCanvas(t, cv) {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    var w = r.width || 120, h = r.height || 40;
    cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    var save = THEME; THEME = t; var cache = spriteCache; spriteCache = {};
    var n = 6, lvls = [1, 3, 5, 7, 9, 11], step = w / n, size = Math.min(step * 0.62, h * 0.5);
    lvls.forEach(function (lv, i) {
      var sp = orbSprite(lv, Math.round(size * d)), dd = sp.S / d;
      g.drawImage(sp.canvas, step * (i + 0.5) - dd / 2, h / 2 - dd / 2, dd, dd);
    });
    THEME = save; spriteCache = cache;
  }
  function renderThemeCards(box, compact) {
    var rank = P.rankFor(S.xp);
    box.innerHTML = P.THEMES.map(function (t) {
      var own = S.themes.indexOf(t.id) >= 0, on = S.theme === t.id;
      var act = on ? '<span class="pill use">' + tr('Actif') + '</span>' : own ? '<button class="pill" data-act="useTheme" data-id="' + t.id + '">' + tr('Utiliser') + '</button>'
        : '<button class="pill" data-act="buyTheme" data-id="' + t.id + '"' + (S.ec < t.price ? ' disabled' : '') + '>' + SHARD + fmt(t.price) + '</button>';
      var sub = own ? tr(on ? 'Thème actuel' : 'Débloqué') : tr('Offert au rang {0}', t.rank);
      return '<div class="theme-card' + (on ? ' on' : '') + '" style="--t-nuit:' + t.bg[0] + ';--t-haut:' + t.bg[2] + ';--t-acc:' + t.accent + '"><canvas></canvas><div><b>' + tr(t.name) + '</b><small>' + sub + '</small></div>' + act + '</div>';
    }).join('');
    box.querySelectorAll('canvas').forEach(function (cv, i) { themeCanvas(P.THEMES[i], cv); });
  }
  function renderMissions() {
    var ms = P.ensureMissions(S, DAY);
    $('misList').innerHTML = ms.map(function (m, i) {
      var p = S.mis.p[i], done = S.mis.done[i];
      return '<div class="mission' + (done ? ' done' : '') + '"><b>' + esc(m.text) + '</b><span class="rw">+' + m.reward + ' ' + SHARD + '</span><div class="bar"><i style="width:' + Math.round(100 * Math.min(1, p / m.target)) + '%"></i></div><span class="val">' + fmt(Math.min(p, m.target)) + ' / ' + fmt(m.target) + '</span></div>';
    }).join('');
    var sc = $('streakCard');
    var scn = S.streak.last >= DAY - 1 ? S.streak.count : 0;
    sc.innerHTML = '<strong>' + trn(scn, '{0} jour de suite', '{0} jours de suite') + '</strong><p>' + tr('Ouvrez LUMEN chaque jour. Le 7<sup>e</sup> jour offre 150 éclats et une Étincelle. Un jour manqué, et la série repart de zéro. Record : {0} jours.', S.streak.best) + '</p><div class="moons"></div>';
    renderMoons(sc.querySelector('.moons'));
    var ev = P.eventFor(DAY), evBest = S.ev.week === ev.week ? S.ev.best : 0, claimed = S.ev.week === ev.week && S.ev.claimed;
    var ec = $('eventCard'); ec.style.setProperty('--ev', ev.hue);
    ec.innerHTML = '<strong>' + ev.name + '</strong><p>' + ev.desc + tr(' Atteignez {0} points en une partie pour gagner {1} éclats', fmt(ev.goal), P.EVENT_REWARD) + (claimed ? tr(' (déjà gagnés).') : '.') + trn(ev.endsIn, ' Fin dans {0} jour.', ' Fin dans {0} jours.') + '</p>' +
      '<div class="row2"><div class="stat-cell"><b>' + fmt(evBest) + '</b><span>' + tr('Record de la semaine') + '</span></div><button class="btn solid" data-act="event">' + tr('Jouer') + '</button></div>';
  }
  var MEDAL = function (tier) {
    var cols = [['#3a3358', '#2a2448'], ['#f0b07a', '#a8602c'], ['#f4f8ff', '#9aa6ba'], ['#fff1b0', '#e0a020']][tier];
    return '<svg viewBox="0 0 48 48"><path d="M16 4h6l-3 14h-6zM26 4h6l1 14h-6z" fill="' + (tier ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)') + '"/><circle cx="24" cy="29" r="14" fill="url(#m' + tier + ')"/><defs><radialGradient id="m' + tier + '" cx=".35" cy=".3"><stop offset="0" stop-color="' + cols[0] + '"/><stop offset="1" stop-color="' + cols[1] + '"/></radialGradient></defs>' +
      (tier ? '<path d="M24 21l2.4 5 5.4.6-4 3.7 1.1 5.4-4.9-2.8-4.9 2.8 1.1-5.4-4-3.7 5.4-.6z" fill="rgba(40,20,10,.35)"/>' : '<circle cx="24" cy="29" r="9" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/>') + '</svg>';
  };
  function renderAch() {
    var list = P.achievements(S), total = 0;
    list.forEach(function (a) { total += a.tier; });
    $('achTotal').textContent = total + ' / ' + list.length * 3;
    $('achList').innerHTML = list.map(function (a) {
      var prev = a.tier ? a.tiers[a.tier - 1] : 0, f = a.tier >= 3 ? 1 : Math.max(0, Math.min(1, (a.value - prev) / (a.next - prev)));
      return '<div class="ach"><div class="medal">' + MEDAL(a.tier) + '</div><div><span class="tiers"><i class="' + (a.tier >= 1 ? 't1' : '') + '"></i><i class="' + (a.tier >= 2 ? 't2' : '') + '"></i><i class="' + (a.tier >= 3 ? 't3' : '') + '"></i></span><b>' + esc(a.name) + '</b><p>' + (a.tier >= 3 ? tr('Terminé : ') : '') + esc(a.desc) + ' (' + fmt(Math.min(a.value, a.next)) + ' / ' + fmt(a.next) + ')</p><div class="bar"><i style="width:' + Math.round(f * 100) + '%"></i></div></div></div>';
    }).join('');
  }
  function renderStats() {
    var rank = P.rankFor(S.xp), next = P.xpForRank(rank + 1), lo = P.xpForRank(rank);
    var nextTheme = P.THEMES.filter(function (t) { return t.rank > rank && S.themes.indexOf(t.id) < 0; })[0];
    var nextTitle = P.TITLES.filter(function (t) { return t[0] > rank; })[0];
    $('rankCard').innerHTML = '<canvas id="rankBig"></canvas><div><b>' + P.titleFor(rank) + '</b><small>' + tr('Rang {0}, {1} / {2} lueur', rank, fmt(S.xp - lo), fmt(next - lo)) + '</small><div class="bar"><i style="width:' + Math.round(100 * (S.xp - lo) / (next - lo)) + '%"></i></div>' +
      '<div class="unl">' + (nextTitle ? tr('Rang {0} : titre « {1} »', nextTitle[0], tr(nextTitle[1])) : tr('Tous les titres obtenus')) + (nextTheme ? '<br>' + tr('Rang {0} : thème {1}', nextTheme.rank, tr(nextTheme.name)) : '') + '</div></div>';
    drawRing($('rankBig'), 84);
    var st = S.stats;
    var cells = [
      [fmt(st.games), 'Parties jouées'], [fmt(S.best), 'Meilleur score'], [st.maxLv, 'Niveau d\'orbe max'], [st.longest, 'Plus longue chaîne'],
      [fmt(st.merges), 'Fusions au total'], [P.starsTotal(S) + ' ★', 'Étoiles en Aventure'], [tr('{0} j', S.streak.best), 'Record de série'], [fmt(st.stones), 'Pierres brisées'],
      [fmt(st.ice), 'Orbes dégelées'], [fmt(st.blasts), 'Bombes déclenchées']
    ];
    $('statGrid').innerHTML = cells.map(function (c) { return '<div class="stat-cell"><b>' + c[0] + '</b><span>' + tr(c[1]) + '</span></div>'; }).join('');
  }
  function renderSettings() {
    $('setSnd').checked = !!S.set.snd; $('setMus').checked = !!S.set.mus; $('setVib').checked = !!S.set.vib; $('setCalm').checked = !!S.set.calm;
    $('saveCode').value = P.exportCode(S);
    $('importBox').hidden = true; $('importErr').hidden = true; $('importCode').value = '';
    $('resetConfirm').hidden = true; $('resetBtn').hidden = false;
    document.querySelectorAll('[data-act=lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === I.lang)); });
  }

  /* ================= Série quotidienne ================= */
  function dailyCheckIn() {
    var r = P.checkIn(S, DAY);
    if (!r) return;
    save();
    if (S.set.calm) { refreshEc(true); refreshHome(); if (r.events.length) ticker(r.events); return; } // récompense créditée sans fenêtre « série »
    $('giftTitle').textContent = r.broke ? tr('La série repart à zéro') : tr('Jour {0} de votre série', r.day);
    $('giftAmount').innerHTML = '+' + r.ec + ' ' + SHARD;
    $('giftText').textContent = tr(r.spark ? 'Septième jour : une Étincelle en prime. Le cycle recommence demain.' : r.broke ? 'Un jour a été manqué. Revenez demain pour le jour 2.' : r.day < 6 ? 'Revenez demain : la récompense grandit chaque jour jusqu\'au 7e.' : 'Demain : 150 éclats et une Étincelle.');
    var cv = $('giftMoon'), g = cv.getContext('2d');
    g.clearRect(0, 0, 240, 240);
    var gl = g.createRadialGradient(120, 120, 10, 120, 120, 120); gl.addColorStop(0, 'rgba(255,215,122,.6)'); gl.addColorStop(1, 'rgba(255,215,122,0)');
    g.fillStyle = gl; g.fillRect(0, 0, 240, 240);
    var mg = g.createRadialGradient(100, 96, 4, 120, 120, 64); mg.addColorStop(0, '#fffaf0'); mg.addColorStop(0.5, '#ffd77a'); mg.addColorStop(1, '#e08a20');
    g.fillStyle = mg; g.beginPath(); g.arc(120, 120, 60, 0, Math.PI * 2); g.fill();
    $('giftVeil').hidden = false;
    pendingEvents = r.events;
    refreshHome();
  }
  var pendingEvents = [];

  /* ================= Écrans ================= */
  var current = 'home', stack = [];
  var SCREENS = ['home', 'map', 'game', 'shop', 'missions', 'ach', 'themes', 'stats', 'settings'];
  function showScreen(name, push) {
    if (push && current !== name) stack.push(current); else if (!push) stack = [];
    current = name;
    SCREENS.forEach(function (s) { $(s).hidden = s !== name; });
    $('overVeil').hidden = true; $('pauseVeil').hidden = true; $('levelVeil').hidden = true; $('introCard').hidden = true;
    if (name === 'home') { refreshHome(); requestAnimationFrame(function () { heroLayout(); drawAdvConst(currentLevel()); }); }
    if (name === 'map') requestAnimationFrame(buildMap);
    if (name === 'shop') renderShop();
    if (name === 'missions') renderMissions();
    if (name === 'ach') renderAch();
    if (name === 'themes') renderThemeCards($('themeList'));
    if (name === 'stats') renderStats();
    if (name === 'settings') renderSettings();
  }
  function back() { var to = stack.pop() || 'home'; showScreen(to, false); if (to === 'game') { /* rien */ } }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    A.unlock();
    switch (act) {
      case 'classic': startGame('classic'); break;
      case 'daily': startGame('daily'); break;
      case 'event': startGame('event'); break;
      case 'play': startGame('adventure', { n: currentLevel() }); break;
      case 'map': showScreen('map'); break;
      case 'level': openLevel(+b.getAttribute('data-n')); break;
      case 'closeLevel': $('levelVeil').hidden = true; break;
      case 'playLevel': $('levelVeil').hidden = true; startGame('adventure', { n: levelPicked }); break;
      case 'nextLevel': openLevelFromGame(gameCtx.levelN + 1); break;
      case 'open': showScreen(b.getAttribute('data-to'), true); break;
      case 'back': back(); break;
      case 'mute': S.set.snd = S.set.snd ? 0 : 1; save(); syncAudio(); if (S.set.snd) sfx.step(4); break;
      case 'boost': useBooster(b.getAttribute('data-b')); break;
      case 'cancelTarget': targeting = null; $('targetBar').hidden = true; renderBoosters(); break;
      case 'pause':
        if (!game || game.over) break;
        $('pauseScore').textContent = fmt(game.score);
        $('pauseGoals').innerHTML = $('goals').innerHTML;
        $('pauseGoals').querySelectorAll('canvas').forEach(function (cv, i) { var q = E.goalProgress(game)[i]; if (q) paintGoalIcon(cv, q.type, q.target); });
        $('pauseVeil').hidden = false; break;
      case 'resume': $('pauseVeil').hidden = true; lastAction = performance.now(); break;
      case 'restart': restart(); break;
      case 'replay': restart(); break;
      case 'quit': quit(); break;
      case 'continue': doContinue(); break;
      case 'giveup': $('overVeil').hidden = true; finalize(); break;
      case 'share': share(); break;
      case 'shareImg': shareImage(); break;
      case 'lang': if (b.getAttribute('data-lang') !== I.lang) { I.set(b.getAttribute('data-lang')); location.reload(); } break;
      case 'home': showScreen('home'); break;
      case 'leave': showScreen('home'); break;
      case 'coachNext': finishTutorial(); break;
      case 'closeIntro': $('introCard').hidden = true; setTimeout(checkIntro, 300); break;
      case 'closeGift': $('giftVeil').hidden = true; sfx.coin(); refreshEc(true); if (pendingEvents.length) ticker(pendingEvents); pendingEvents = []; break;
      case 'buy':
        if (P.buy(S, b.getAttribute('data-b'))) { save(); sfx.coin(); vibrate(15); renderShop(); refreshEc(true); }
        break;
      case 'buyTheme':
        if (P.buyTheme(S, b.getAttribute('data-id'))) { S.theme = b.getAttribute('data-id'); save(); applyTheme(S.theme); sfx.coin(); showScreen(current, false); }
        break;
      case 'useTheme': S.theme = b.getAttribute('data-id'); save(); applyTheme(S.theme); sfx.tap(); showScreen(current, false); break;
      case 'replayTuto': startGame('tutorial'); break;
      case 'exportSave':
        var code = P.exportCode(S); $('saveCode').value = code;
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { toastAny(tr('Code copié')); }, function () { $('saveCode').select(); toastAny(tr('Sélectionnez et copiez le code')); });
        else { $('saveCode').select(); toastAny(tr('Sélectionnez et copiez le code')); }
        break;
      case 'showImport': $('importBox').hidden = false; $('importCode').focus(); break;
      case 'doImport':
        var imp = P.importCode($('importCode').value);
        if (!imp) { $('importErr').hidden = false; sfx.deny(); break; }
        S = imp; save(); applyCalm(); applyTheme(S.theme); syncAudio(); toastAny(tr('Progression restaurée')); renderSettings(); refreshEc(false);
        break;
      case 'reset': $('resetConfirm').hidden = false; $('resetBtn').hidden = true; break;
      case 'resetCancel': $('resetConfirm').hidden = true; $('resetBtn').hidden = false; break;
      case 'resetConfirm':
        // Anti-clickjacking : GitHub Pages ne permet pas d'en-tête frame-ancestors ; pas d'effacement depuis un cadre.
        if (window.top !== window.self) { toastAny(tr('Ouvrez LUMEN directement pour effacer')); sfx.deny(); break; }
        var keepSet = S.set; S = P.newSave(); S.set = keepSet; S.tuto = 1; save(); applyTheme('nuit'); toastAny(tr('Progression effacée')); showScreen('home'); break;
    }
  });
  function openLevelFromGame(n) { showScreen('map'); setTimeout(function () { openLevel(n); }, 350); }
  function restart() {
    if (!game) return;
    if (!finalized && game.movesPlayed > 0 && game.mode !== 'tutorial') { game.over = true; finalizeSilently(); }
    if (gameCtx.mode === 'adventure') startGame('adventure', { n: gameCtx.levelN }); else startGame(gameCtx.mode);
  }
  function quit() {
    if (game && !finalized && game.movesPlayed > 0 && game.mode !== 'tutorial') finalizeSilently();
    if (gameCtx && gameCtx.mode === 'adventure') showScreen('map'); else showScreen('home');
  }
  /** Partie abandonnée : on compte la partie sans afficher la feuille de fin. */
  function finalizeSilently() {
    finalized = true;
    var res = P.onGameEnd(S, DAY, { mode: game.mode, score: game.score, peak: game.peak, won: false, stars: 0, levelN: gameCtx.levelN, dailySeed: gameCtx.defi ? gameCtx.defi.num : todaySeed });
    save();
    if (res.events.length) setTimeout(function () { ticker(res.events); }, 400);
  }
  ['setSnd', 'setMus', 'setVib', 'setCalm'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      S.set.snd = $('setSnd').checked ? 1 : 0; S.set.mus = $('setMus').checked ? 1 : 0; S.set.vib = $('setVib').checked ? 1 : 0; S.set.calm = $('setCalm').checked ? 1 : 0; applyCalm();
      save(); A.unlock(); syncAudio(); if (id === 'setVib' && S.set.vib) vibrate(30);
    });
  });

  /* ================= Boucle ================= */
  var lastT = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    for (var i = 0; i < particles.length; i++) { var q = particles[i]; q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += cell * 5 * dt; q.vx *= 0.97; }
    if (current === 'game') draw(now);
    else if (current === 'home') drawHero(reduceMotion ? 0 : now);
    else if (current === 'map') drawMap(reduceMotion ? 0 : now);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', function () {
    if (current === 'game') { layout(); paintSpectrum(); }
    else if (current === 'map') { sizeMapCanvas(); buildMap(); }
    else if (current === 'home') { heroLayout(); drawAdvConst(currentLevel()); }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) A.suspend();
    else {
      A.resume();
      var d = P.today();
      if (d !== DAY) { DAY = d; todaySeed = P.dailyFor().num; if (current === 'home') { refreshHome(); if (S.tuto) dailyCheckIn(); } }
    }
  });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  // le corps de page ne défile jamais (un focus sur un élément masqué peut le décaler)
  function pinBody() { if (document.body.scrollTop) document.body.scrollTop = 0; if (document.documentElement.scrollTop) document.documentElement.scrollTop = 0; }
  document.body.addEventListener('scroll', pinBody); window.addEventListener('scroll', pinBody);
  document.addEventListener('pointerdown', function () { A.unlock(); }, { once: true });

  /* ================= Init ================= */
  function init() {
    spriteCache = {};
    applyTheme(S.theme);
    syncAudio();
    if (current === 'home') { refreshHome(); heroLayout(); }
  }
  function boot() {
    var evs = P.syncAch(S); if (evs.length) { save(); setTimeout(function () { ticker(evs); }, 1500); }
    init();
    if (!S.tuto) startGame('tutorial');
    else { showScreen('home'); setTimeout(dailyCheckIn, 500); }
  }
  fetch('levels.json').then(function (r) { return r.json(); }).then(function (d) {
    d.chapters.forEach(function (c) { c.name = tr(c.name); c.intro = tr(c.intro); });
    LEVELS_DATA = d; boot();
  }, function () { boot(); });
  window.LumenAutresJeux.render($('autresJeux'), tr);
  if (I.lang === 'en') document.querySelectorAll('a[href="privacy.html"]').forEach(function (a) { a.href = 'privacy.html#english'; });
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 20px Unbounded'), document.fonts.load('900 20px Unbounded')]).then(function () { spriteCache = {}; paintIcons(); if (current === 'home') refreshHome(); }, function () {});
  }
  requestAnimationFrame(loop);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  // accès pour les tests automatisés
  window.__lumen = {
    get game() { return game; },
    get save() { return S; },
    get screen() { return current; },
    playChain: function (c) { if (tuto && !tutoAccepts(c)) return false; commit(c); return true; },
    cellCenter: function (r, c) { var b = board.getBoundingClientRect(); return { x: b.left + cx(c), y: b.top + cy(r) }; },
    endNow: function () { game.over = true; endGame(); },
    setSave: function (o) { S = P.normalize(o); save(); applyTheme(S.theme); refreshHome(); },
    setDay: function (d) { DAY = d; },
    refresh: function () { syncVis(); updateHud(false); renderGoals(false); checkIntro(); }
  };
