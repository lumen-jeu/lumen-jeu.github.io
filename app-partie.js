/* LUMEN — interface (3/8) : effets, bandeau de progression, état de partie, démarrage, HUD.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
  /* ================= Effets ================= */
  function vibrate(p) { if (!S.set.vib) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function syncAudio() { A.set(S.set.snd, S.set.mus); renderMute(); }
  var MUTE_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
  var MUTE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  function renderMute() {
    document.querySelectorAll('.mute-btn').forEach(function (b) {
      b.innerHTML = S.set.snd ? MUTE_ON : MUTE_OFF;
      b.setAttribute('aria-label', tr(S.set.snd ? 'Couper le son' : 'Activer le son'));
    });
  }
  var sfx = A.sfx;

  /* ================= Bandeau de progression ================= */
  var tierCol = ['', '#d08a52', '#d8e0ec', '#ffd36a'];
  function ticker(events) {
    var box = $('ticker');
    events.forEach(function (ev, i) {
      setTimeout(function () {
        var d = document.createElement('div');
        d.className = 'tick-item ' + ev.kind;
        d.innerHTML = (ev.kind === 'ach' ? '<i style="background:' + tierCol[ev.tier] + '"></i>' : '') + '<span>' + esc(ev.text) + '</span>' + (ev.ec ? '<b>+' + ev.ec + '</b>' + SHARD : '');
        box.appendChild(d);
        if (ev.ec) sfx.coin();
        setTimeout(function () { d.remove(); }, 3500);
      }, i * 700);
    });
    if (events.length) refreshEc(true);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function refreshEc(anim) {
    document.querySelectorAll('#ecCount, .ec-live').forEach(function (b) {
      b.textContent = fmt(S.ec);
      if (anim && !reduceMotion) { var p = b.parentNode; p.classList.remove('gain'); void p.offsetWidth; p.classList.add('gain'); }
    });
  }
  function fmt(n) { return Number(n).toLocaleString(I.locale()); }

  /* ================= État de partie ================= */
  var game = null, gameCtx = null; // gameCtx = {mode, levelN, eventWeek}
  var spectrumLv = 0, vis = null, chain = [], finger = null, dragging = false;
  var ghosts = [], particles = [], popups = [], rings = [], shake = 0;
  var lastAction = performance.now(), hint = null, targeting = null, finalized = false;
  var tuto = null; // {step, expect:[cells]}

  var board = $('board'), bctx = board.getContext('2d');
  var W = 0, H = 0, DPR = 1, cell = 0, ox = 0, oy = 0, orbSize = 0;
  function layout() {
    var r = board.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 3);
    W = r.width; H = r.height;
    board.width = Math.round(W * DPR); board.height = Math.round(H * DPR);
    cell = Math.floor(Math.min((W - 8) / COLS, (H - 8) / ROWS));
    ox = (W - cell * COLS) / 2; oy = (H - cell * ROWS) / 2;
    orbSize = Math.round(cell * 0.8 * DPR);
    spriteCache = {};
  }
  function cx(c) { return ox + cell * (c + 0.5); }
  function cy(r) { return oy + cell * (r + 0.5); }
  function syncVis() {
    vis = [];
    for (var r = 0; r < ROWS; r++) {
      vis.push([]);
      for (var c = 0; c < COLS; c++) vis[r].push({ lv: game.grid[r][c], m: game.mods[r][c], y: r, from: r, t0: 0, dur: 0, pop: 0, land: 0 });
    }
  }

  /* ================= Démarrage ================= */
  var TUTO_GRID = ['114234', '425333', '243542', '532425', '354253', '425342', '343534', '222224'];
  var TUTO_STEPS = [
    { cells: [[0, 0], [0, 1]], text: 'Glissez le doigt d\'une orbe <b>1</b> à sa voisine. Deux orbes identiques suffisent.' },
    { cells: [[1, 3], [1, 4], [1, 5]], text: 'Bien. La fusion naît sur la <b>dernière</b> orbe touchée. Reliez maintenant les trois orbes <b>3</b>.' },
    { cells: [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4]], text: 'Dès <b>5 orbes</b>, la fusion saute un niveau. Tracez la longue chaîne d\'orbes <b>2</b>.' }
  ];

  function startGame(mode, opts) {
    opts = opts || {};
    var seed = (Date.now() ^ (Math.random() * 0x7fffffff)) | 0;
    gameCtx = { mode: mode, levelN: 0 };
    tuto = null;
    if (mode === 'daily') { gameCtx.defi = P.dailyFor(); todaySeed = gameCtx.defi.num; DAY = gameCtx.defi.day; game = E.newGame('daily', gameCtx.defi.seed); }
    else if (mode === 'adventure') { gameCtx.levelN = opts.n; game = E.newGame('adventure', 0, { level: levelDef(opts.n) }); }
    else if (mode === 'event') { var ev = P.eventFor(DAY); gameCtx.ev = ev; game = E.newGame('event', seed, { rules: ev.rules, moves: ev.moves || 0 }); }
    else if (mode === 'tutorial') {
      var grid = TUTO_GRID.map(function (row) { return row.split('').map(Number); });
      game = E.newGame('tutorial', 4242, { grid: grid });
      tuto = { step: 0 };
    } else game = E.newGame('classic', seed);
    finalized = false;
    chain = []; ghosts = []; particles = []; popups = []; rings = []; targeting = null;
    syncVis();
    var now = performance.now();
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var v = vis[r][c];
      v.from = r - ROWS - 1; v.y = v.from; v.t0 = now + (reduceMotion ? 0 : c * 35 + (ROWS - r) * 22); v.dur = reduceMotion ? 1 : 420;
    }
    var labels = { classic: tr('Classique'), daily: tr('Défi du jour, LUMEN #{0}', gameCtx.defi ? gameCtx.defi.n : ''), adventure: tr('Niveau {0}', gameCtx.levelN), event: gameCtx.ev ? gameCtx.ev.name : '', tutorial: tr('Tutoriel') };
    $('modeLabel').textContent = labels[mode];
    $('movesWrap').hidden = game.movesLeft < 0;
    $('bestWrap').hidden = mode === 'adventure' || mode === 'tutorial';
    $('boosters').style.visibility = mode === 'tutorial' ? 'hidden' : '';
    $('bMoves').hidden = mode !== 'adventure';
    $('boosters').classList.toggle('three', mode !== 'adventure');
    $('targetBar').hidden = true;
    $('coach').hidden = true;
    showScreen('game');
    layout();
    spectrumLv = 0;
    renderGoals(false);
    updateHud(false);
    lastAction = now; hint = null;
    if (tuto) setTimeout(function () { coach(tr(TUTO_STEPS[0].text)); }, 700);
    else setTimeout(checkIntro, 900);
  }

  function levelDef(n) {
    if (n <= 120 && LEVELS_DATA) return LEVELS_DATA.levels[n - 1];
    return E.endlessLevel(n);
  }
  function chapterOf(n) {
    if (n > 120 || !LEVELS_DATA) return { n: 7, name: tr('Constellations infinies'), intro: tr('Des niveaux sans fin, de plus en plus exigeants.'), hue: '#c9b6ff', hue2: '#6fe3ff' };
    return LEVELS_DATA.chapters[Math.floor((n - 1) / 20)];
  }

  function updateHud(bump) {
    var sc = $('score');
    sc.textContent = fmt(game.score);
    if (bump && !reduceMotion) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
    var best = 0;
    if (game.mode === 'daily') best = Math.max(S.daily.seed === gameCtx.defi.num ? S.daily.best : 0, game.score);
    else if (game.mode === 'event') best = Math.max(S.ev.week === (gameCtx.ev && gameCtx.ev.week) ? S.ev.best : 0, game.score);
    else best = Math.max(S.best, game.score);
    $('best').textContent = fmt(best);
    $('moves').textContent = game.movesLeft;
    $('movesWrap').classList.toggle('low', game.movesLeft >= 0 && game.movesLeft <= 3 && !game.over);
    if (spectrumLv !== game.bestLevel) { spectrumLv = game.bestLevel; paintSpectrum(); }
    renderBoosters();
  }
  function renderBoosters() {
    if (!game) return;
    var freePulse = game.pulseUsed ? 0 : 1;
    var counts = { pulse: freePulse + S.inv.pulse, hammer: S.inv.hammer, spark: S.inv.spark, moves: S.inv.moves };
    [['pulse', 'cPulse'], ['hammer', 'cHammer'], ['spark', 'cSpark'], ['moves', 'cMoves']].forEach(function (k) {
      var el = $(k[1]); el.textContent = counts[k[0]]; el.classList.toggle('zero', !counts[k[0]]);
      el.parentNode.classList.toggle('empty', !counts[k[0]]);
      el.parentNode.classList.toggle('armed', targeting === k[0]);
    });
    $('bPulse').classList.toggle('urgent', !!(game && !game.over && E.isStuck(game) && counts.pulse));
  }
  function renderGoals(tick) {
    var box = $('goals');
    if (!game.level) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    var prog = E.goalProgress(game);
    if (box.children.length !== prog.length) {
      box.innerHTML = prog.map(function (q, i) { return '<span class="goal" data-i="' + i + '"><canvas width="52" height="52"></canvas><span></span></span>'; }).join('');
      prog.forEach(function (q, i) { paintGoalIcon(box.children[i].querySelector('canvas'), q.type, q.target); });
    }
    prog.forEach(function (q, i) {
      var el = box.children[i], txt = q.type === 'level' ? (q.done ? '' : tr('Niveau {0}', q.target)) : fmt(q.value) + ' / ' + fmt(q.target);
      var span = el.querySelector('span');
      if (span.textContent !== txt) { span.textContent = txt; if (tick && !reduceMotion) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } }
      el.classList.toggle('done', q.done);
    });
  }
  function paintSpectrum() {
    var cv = $('spectrum'); if (!cv || !game) return;
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 3);
    if (!r.width) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    var n = 12, step = r.width / n, size = Math.min(step * 0.62, r.height * 0.8);
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(step / 2, r.height / 2); g.lineTo(r.width - step / 2, r.height / 2); g.stroke();
    var reached = Math.min(game.bestLevel, n);
    var lg = g.createLinearGradient(step / 2, 0, step * (reached - 0.5), 0);
    lg.addColorStop(0, hexA(lvColor(1)[1], 0.6)); lg.addColorStop(1, hexA(lvColor(reached)[1], 0.9));
    g.strokeStyle = lg; g.beginPath(); g.moveTo(step / 2, r.height / 2); g.lineTo(step * (reached - 0.5), r.height / 2); g.stroke();
    for (var i = 1; i <= n; i++) {
      var x = step * (i - 0.5), y = r.height / 2;
      if (i <= game.bestLevel) {
        var sp = orbSprite(i, Math.round(size * d)), dd = sp.S / d;
        g.drawImage(sp.canvas, x - dd / 2, y - dd / 2, dd, dd);
      } else {
        g.fillStyle = THEME.bg[0]; g.beginPath(); g.arc(x, y, size * 0.32, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 1.2; g.stroke();
      }
    }
  }

