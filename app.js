/* LUMEN v2 — interface, rendu canvas, progression. Logique : engine.js + progress.js */
(function () {
  'use strict';
  var E = window.LumenEngine, P = window.LumenProgress, A = window.LumenAudio, D = window.Defi;
  var COLS = E.COLS, ROWS = E.ROWS, PRISM = E.PRISM, STONE = E.STONE;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FLAME = '<svg class="flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.4 5.5 5.6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.5-4.4 2.6-5.3.1 1.8.9 2.9 2 3.2-.4-3 .1-6.2.9-8.9z"/></svg>';
  var SHARD = '<svg class="shard" viewBox="0 0 24 24"><path d="M12 2l5 9-5 11-5-11z"/></svg>';
  var STAR = function (on, cls) { return '<svg class="' + (on ? 'on ' : '') + (cls || '') + '" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="' + (on ? '#ffd36a' : 'rgba(255,255,255,.12)') + '" stroke="' + (on ? '#fff3c8' : 'rgba(255,255,255,.1)') + '" stroke-width="1"/></svg>'; };

  /* ================= Sauvegarde ================= */
  var KEY = 'lumen.save2';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function loadSave() {
    var raw = lsGet(KEY);
    if (raw) { try { return P.normalize(JSON.parse(raw)); } catch (e) {} }
    // migration depuis la v1
    var s = P.newSave();
    try {
      var b = JSON.parse(lsGet('lumen.best') || '0'); if (b) s.best = b;
      var bl = JSON.parse(lsGet('lumen.bestLevel') || '3'); s.bestLv = bl; s.stats.maxLv = bl;
      if (JSON.parse(lsGet('lumen.mute') || 'false')) s.set.snd = 0;
      if (s.best > 0) s.tuto = 1; // ancien joueur : pas de tutoriel imposé
    } catch (e) {}
    return s;
  }
  var S = loadSave();
  function save() { lsSet(KEY, JSON.stringify(S)); }
  var DAY = P.today();
  var todaySeed = P.dailyFor().num; // date de Paris AAAAMMJJ (S.daily.seed)
  var LEVELS_DATA = null;

  /* ================= Thème & palette ================= */
  var THEME = P.themeById(S.theme);
  function lvColor(l) { return THEME.levels[Math.max(1, Math.min(12, l)) - 1]; }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function mix(hex, to, t) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    var r = Math.round(((a >> 16) * (1 - t)) + ((b >> 16) * t));
    var g = Math.round((((a >> 8) & 255) * (1 - t)) + (((b >> 8) & 255) * t));
    var bl = Math.round(((a & 255) * (1 - t)) + ((b & 255) * t));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  function applyTheme(id) {
    THEME = P.themeById(id);
    var st = document.documentElement.style;
    st.setProperty('--nuit', THEME.bg[0]); st.setProperty('--haut', THEME.bg[1]); st.setProperty('--bas', THEME.bg[2]); st.setProperty('--accent', THEME.accent);
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', THEME.bg[0]);
    spriteCache = {};
    paintIcons();
  }

  /* ================= Sprites ================= */
  var spriteCache = {};
  function orbSprite(level, size) {
    if (level === PRISM) return prismSprite(size);
    if (level === STONE) return stoneSprite(size);
    var key = level + ':' + size;
    if (spriteCache[key]) return spriteCache[key];
    var pad = Math.round(size * 0.45), S2 = size + pad * 2;
    var c = document.createElement('canvas'); c.width = c.height = S2;
    var g = c.getContext('2d'), cx = S2 / 2, R = size / 2;
    var col = lvColor(level), body = col[0], glow = col[1];
    var lv = Math.min(level, 12), glowStrength = 0.18 + lv * 0.045;
    var halo = g.createRadialGradient(cx, cx, R * 0.6, cx, cx, R + pad);
    halo.addColorStop(0, hexA(glow, glowStrength)); halo.addColorStop(0.45, hexA(glow, glowStrength * 0.35)); halo.addColorStop(1, hexA(glow, 0));
    g.fillStyle = halo; g.fillRect(0, 0, S2, S2);
    var hl = g.createRadialGradient(cx - R * 0.32, cx - R * 0.38, R * 0.05, cx, cx, R);
    hl.addColorStop(0, mix(body, '#ffffff', lv >= 11 ? 0.9 : 0.62)); hl.addColorStop(0.35, mix(body, '#ffffff', lv >= 11 ? 0.4 : 0.08));
    hl.addColorStop(0.8, body); hl.addColorStop(1, mix(body, '#10062a', 0.55));
    g.beginPath(); g.arc(cx, cx, R, 0, Math.PI * 2); g.fillStyle = hl; g.fill();
    var core = g.createRadialGradient(cx, cx + R * 0.15, 0, cx, cx + R * 0.15, R * 0.75);
    core.addColorStop(0, hexA(mix(glow, '#ffffff', 0.5), 0.35 + lv * 0.03)); core.addColorStop(1, hexA(glow, 0));
    g.fillStyle = core; g.beginPath(); g.arc(cx, cx, R, 0, Math.PI * 2); g.fill();
    g.lineWidth = Math.max(1, size * 0.025); g.strokeStyle = hexA(mix(glow, '#ffffff', 0.5), 0.5);
    g.beginPath(); g.arc(cx, cx, R - g.lineWidth / 2, Math.PI * 0.95, Math.PI * 1.85); g.stroke();
    g.save(); g.translate(cx - R * 0.34, cx - R * 0.46); g.rotate(-0.5);
    var sp = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.32);
    sp.addColorStop(0, 'rgba(255,255,255,0.85)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp; g.scale(1, 0.55); g.beginPath(); g.arc(0, 0, R * 0.32, 0, Math.PI * 2); g.fill(); g.restore();
    var dark = lum(body) > 0.62;
    g.font = '700 ' + Math.round(size * (level >= 10 ? 0.34 : 0.4)) + 'px Unbounded, "Trebuchet MS", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = dark ? 'rgba(30,12,40,0.82)' : 'rgba(255,248,236,0.95)';
    if (!dark) { g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = size * 0.06; }
    g.fillText(String(level), cx, cx + size * 0.03);
    return (spriteCache[key] = { canvas: c, pad: pad, S: S2 });
  }
  function prismSprite(size) {
    var key = 'P:' + size;
    if (spriteCache[key]) return spriteCache[key];
    var pad = Math.round(size * 0.45), S2 = size + pad * 2;
    var c = document.createElement('canvas'); c.width = c.height = S2;
    var g = c.getContext('2d'), cx = S2 / 2, R = size / 2;
    var halo = g.createRadialGradient(cx, cx, R * 0.3, cx, cx, R + pad);
    halo.addColorStop(0, 'rgba(255,255,255,.45)'); halo.addColorStop(0.5, 'rgba(200,170,255,.18)'); halo.addColorStop(1, 'rgba(200,170,255,0)');
    g.fillStyle = halo; g.fillRect(0, 0, S2, S2);
    var pts = [];
    for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * Math.PI / 3; pts.push([cx + Math.cos(a) * R * 0.98, cx + Math.sin(a) * R * 0.98]); }
    var hues = ['#ff5a6e', '#ffb23a', '#f4ff5a', '#4affb0', '#4ab8ff', '#b46bff'];
    for (i = 0; i < 6; i++) {
      var p = pts[i], q = pts[(i + 1) % 6];
      var lg = g.createLinearGradient(cx, cx, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      lg.addColorStop(0, '#ffffff'); lg.addColorStop(1, hues[i]);
      g.fillStyle = lg; g.beginPath(); g.moveTo(cx, cx); g.lineTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, size * 0.03);
    g.beginPath(); pts.forEach(function (p, k) { if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(0.5, size * 0.015);
    for (i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx, cx); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
    var sp = g.createRadialGradient(cx - R * 0.2, cx - R * 0.3, 0, cx - R * 0.2, cx - R * 0.3, R * 0.4);
    sp.addColorStop(0, 'rgba(255,255,255,.95)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp; g.fillRect(0, 0, S2, S2);
    return (spriteCache[key] = { canvas: c, pad: pad, S: S2 });
  }
  function stoneSprite(size) {
    var key = 'S:' + size;
    if (spriteCache[key]) return spriteCache[key];
    var pad = Math.round(size * 0.45), S2 = size + pad * 2;
    var c = document.createElement('canvas'); c.width = c.height = S2;
    var g = c.getContext('2d'), cx = S2 / 2, R = size / 2;
    var rng = new E.Rng(7), pts = [];
    for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2 + 0.2, rr = R * (0.84 + rng.next() * 0.16); pts.push([cx + Math.cos(a) * rr, cx + Math.sin(a) * rr * 0.94]); }
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = size * 0.12; g.shadowOffsetY = size * 0.06;
    var body = g.createRadialGradient(cx - R * 0.3, cx - R * 0.4, R * 0.1, cx, cx, R * 1.1);
    body.addColorStop(0, '#a49cb4'); body.addColorStop(0.5, '#5e5670'); body.addColorStop(1, '#2a2436');
    g.fillStyle = body; g.beginPath(); pts.forEach(function (p, k) { if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = Math.max(1, size * 0.03);
    g.beginPath(); for (i = 5; i < 9; i++) { var p = pts[i]; if (i === 5) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); } g.lineTo(pts[0][0], pts[0][1]); g.stroke();
    g.strokeStyle = 'rgba(20,12,30,.6)'; g.lineWidth = Math.max(1, size * 0.025);
    g.beginPath(); g.moveTo(cx - R * 0.1, cx - R * 0.5); g.lineTo(cx + R * 0.05, cx - R * 0.05); g.lineTo(cx - R * 0.25, cx + R * 0.3); g.moveTo(cx + R * 0.05, cx - R * 0.05); g.lineTo(cx + R * 0.45, cx + R * 0.15); g.stroke();
    return (spriteCache[key] = { canvas: c, pad: pad, S: S2 });
  }
  function iceSprite(m, size) {
    var key = 'I' + m + ':' + size;
    if (spriteCache[key]) return spriteCache[key];
    var pad = Math.round(size * 0.1), S2 = size + pad * 2;
    var c = document.createElement('canvas'); c.width = c.height = S2;
    var g = c.getContext('2d'), x = pad, w = size, r = size * 0.24;
    var thick = m === E.ICE2;
    var fill = g.createLinearGradient(x, x, x + w, x + w);
    fill.addColorStop(0, thick ? 'rgba(220,245,255,.62)' : 'rgba(210,240,255,.38)');
    fill.addColorStop(1, thick ? 'rgba(120,190,255,.5)' : 'rgba(120,200,255,.22)');
    roundRect(g, x, x, w, w, r); g.fillStyle = fill; g.fill();
    g.lineWidth = Math.max(1.5, size * 0.035); g.strokeStyle = 'rgba(230,250,255,.9)'; g.stroke();
    if (thick) { roundRect(g, x + size * 0.08, x + size * 0.08, w - size * 0.16, w - size * 0.16, r * 0.7); g.lineWidth = Math.max(1, size * 0.02); g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(1, size * 0.04); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x + w * 0.18, x + w * 0.42); g.lineTo(x + w * 0.42, x + w * 0.18); g.moveTo(x + w * 0.2, x + w * 0.6); g.lineTo(x + w * 0.6, x + w * 0.2); g.stroke();
    return (spriteCache[key] = { canvas: c, pad: pad, S: S2 });
  }

  /* ================= Icônes DOM ================= */
  function paintOrbIcon(cv, level, scale) {
    var g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    var size = Math.round(cv.width * (scale || 0.62));
    var sp = orbSprite(level, size);
    g.drawImage(sp.canvas, (cv.width - sp.S) / 2, (cv.height - sp.S) / 2);
  }
  function paintGoalIcon(cv, type, target) {
    var g = cv.getContext('2d'), w = cv.width;
    g.clearRect(0, 0, w, w);
    if (type === 'level') return paintOrbIcon(cv, target, 0.8);
    if (type === 'stone') return paintOrbIcon(cv, STONE, 0.8);
    if (type === 'prism') return paintOrbIcon(cv, PRISM, 0.8);
    if (type === 'ice') {
      var o = orbSprite(3, Math.round(w * 0.6)); g.drawImage(o.canvas, (w - o.S) / 2, (w - o.S) / 2);
      var ic = iceSprite(E.ICE1, Math.round(w * 0.78)); g.drawImage(ic.canvas, (w - ic.S) / 2, (w - ic.S) / 2); return;
    }
    // score : étoile lumineuse
    var cx = w / 2, R = w * 0.38;
    var gl = g.createRadialGradient(cx, cx, 0, cx, cx, w / 2); gl.addColorStop(0, hexA(THEME.accent, 0.6)); gl.addColorStop(1, hexA(THEME.accent, 0));
    g.fillStyle = gl; g.fillRect(0, 0, w, w);
    g.fillStyle = '#fff6dc'; g.beginPath();
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? R * 0.32 : R; g.lineTo(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }
  function paintIcons() {
    document.querySelectorAll('.orb-ico').forEach(function (cv) { paintOrbIcon(cv, +cv.getAttribute('data-level')); });
  }

  /* ================= Effets ================= */
  function vibrate(p) { if (!S.set.vib) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function syncAudio() { A.set(S.set.snd, S.set.mus); renderMute(); }
  var MUTE_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
  var MUTE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  function renderMute() {
    document.querySelectorAll('.mute-btn').forEach(function (b) {
      b.innerHTML = S.set.snd ? MUTE_ON : MUTE_OFF;
      b.setAttribute('aria-label', S.set.snd ? 'Couper le son' : 'Activer le son');
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
  function fmt(n) { return Number(n).toLocaleString('fr-FR'); }

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
    var labels = { classic: 'Classique', daily: 'Défi du jour, LUMEN #' + (gameCtx.defi ? gameCtx.defi.n : ''), adventure: 'Niveau ' + gameCtx.levelN, event: gameCtx.ev ? gameCtx.ev.name : '', tutorial: 'Tutoriel' };
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
    if (tuto) setTimeout(function () { coach(TUTO_STEPS[0].text); }, 700);
    else setTimeout(checkIntro, 900);
  }

  function levelDef(n) {
    if (n <= 120 && LEVELS_DATA) return LEVELS_DATA.levels[n - 1];
    return E.endlessLevel(n);
  }
  function chapterOf(n) {
    if (n > 120 || !LEVELS_DATA) return { n: 7, name: 'Constellations infinies', intro: 'Des niveaux sans fin, de plus en plus exigeants.', hue: '#c9b6ff', hue2: '#6fe3ff' };
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
      var el = box.children[i], txt = q.type === 'level' ? (q.done ? '' : 'Niveau ' + q.target) : fmt(q.value) + ' / ' + fmt(q.target);
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

  /* ================= Tracé de chaîne ================= */
  function cellAt(x, y, strict) {
    var c = Math.floor((x - ox) / cell), r = Math.floor((y - oy) / cell);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    if (strict) { var dx = x - cx(c), dy = y - cy(r); if (dx * dx + dy * dy > Math.pow(cell * 0.43, 2)) return null; }
    return { r: r, c: c };
  }
  function inChain(p) { for (var i = 0; i < chain.length; i++) if (chain[i].r === p.r && chain[i].c === p.c) return i; return -1; }
  function animating() {
    var now = performance.now();
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) { var v = vis[r][c]; if (now < v.t0 + v.dur) return true; }
    return false;
  }
  function pt(e) { var b = board.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function chainLv() { return chain.length ? E.chainLevel(game.grid, chain) : 0; }
  function canChain(r, c) { return E.chainable(game.grid[r][c], game.mods[r][c]); }

  board.addEventListener('pointerdown', function (e) {
    if (!game || game.over || animating() || current !== 'game') return;
    A.unlock();
    var p = pt(e), hit = cellAt(p.x, p.y, false);
    if (!hit) return;
    if (targeting) { useTarget(hit); return; }
    if (!canChain(hit.r, hit.c)) { sfx.deny(); return; }
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    dragging = true; chain = [hit]; finger = p; hint = null;
    sfx.step(0); vibrate(8);
    lastAction = performance.now();
  });
  board.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!evs.length) evs = [e];
    for (var k = 0; k < evs.length; k++) extend(pt(evs[k]));
  });
  function extend(p) {
    finger = p;
    var hit = cellAt(p.x, p.y, true);
    if (!hit) return;
    var last = chain[chain.length - 1];
    if (hit.r === last.r && hit.c === last.c) return;
    var idx = inChain(hit);
    if (chain.length >= 2 && idx === chain.length - 2) { chain.pop(); sfx.step(chain.length - 1); return; }
    if (idx !== -1 || !E.isAdjacent(last, hit) || !canChain(hit.r, hit.c)) return;
    var v = game.grid[hit.r][hit.c], lv = chainLv();
    if (v !== PRISM && lv && v !== lv) return;
    if (v === PRISM && game.grid[last.r][last.c] === PRISM && !lv) return;
    chain.push(hit);
    sfx.step(chain.length - 1);
    vibrate(chain.length >= 5 ? 14 : 8);
  }
  function release() {
    if (!dragging) return;
    dragging = false; finger = null;
    lastAction = performance.now();
    if (chain.length < 2) { chain = []; return; }
    var played = chain.slice();
    chain = [];
    if (tuto && !tutoAccepts(played)) { sfx.deny(); vibrate([10, 30, 10]); coach(TUTO_STEPS[tuto.step].text, true); return; }
    commit(played);
  }
  board.addEventListener('pointerup', release);
  board.addEventListener('pointercancel', release);

  function tutoAccepts(played) {
    var want = TUTO_STEPS[tuto.step];
    if (!want || played.length !== want.cells.length) return false;
    return want.cells.every(function (w) { return played.some(function (p) { return p.r === w[0] && p.c === w[1]; }); });
  }

  /** Anime les chutes d'après la liste des déplacements renvoyée par le moteur. */
  function animateFalls(falls, delay) {
    var now = performance.now();
    syncVis();
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) { vis[r][c].t0 = 0; vis[r][c].dur = 0; }
    falls.forEach(function (f) {
      var v = vis[f.toR][f.c];
      v.from = f.fromR; v.y = f.fromR;
      v.t0 = now + delay + (f.spawned ? 30 : 0);
      v.dur = reduceMotion ? 1 : 140 + Math.sqrt(f.toR - f.fromR) * 110;
    });
  }

  function commit(played) {
    var prismsUsed = played.filter(function (p) { return game.grid[p.r][p.c] === PRISM; }).length;
    var res = E.playChain(game, played);
    if (!res) { sfx.deny(); return; }
    var gref = game, now = performance.now();
    var ncol = lvColor(res.newLevel)[1];
    var last = played[played.length - 1];
    played.forEach(function (p, i) {
      if (i === played.length - 1) return;
      ghosts.push({ lv: res.level, x0: cx(p.c), y0: cy(p.r), x1: cx(last.c), y1: cy(last.r), t0: now + i * 18, dur: 170 });
    });
    var delay = reduceMotion ? 0 : 150 + played.length * 18;
    // éclats des impacts (avant la chute)
    res.hits.forEach(function (h) {
      if (h.kind === 'stone') { burst(cx(h.c), cy(h.r), '#a49cb4', 14, false); rings.push({ x: cx(h.c), y: cy(h.r), col: '#d8d0e8', t0: now, big: false }); }
      else burst(cx(h.c), cy(h.r), '#d8f6ff', h.kind === 'melt' ? 12 : 6, false);
    });
    if (res.hits.some(function (h) { return h.kind === 'stone'; })) setTimeout(sfx.stone, 60);
    if (res.hits.some(function (h) { return h.kind !== 'stone'; })) setTimeout(sfx.ice, 90);
    res.blasts.forEach(function (b) {
      b.cells.forEach(function (q) { burst(cx(q.c), cy(q.r), q.level === STONE ? '#a49cb4' : q.level === PRISM ? '#ffffff' : lvColor(q.level)[1], 8, true); });
      rings.push({ x: cx(b.c), y: cy(b.r), col: '#ff8a4a', t0: now, big: true, wide: false, blast: true });
      shake = now;
    });
    if (res.blasts.length) { sfx.bomb(); vibrate([40, 30, 60]); }
    animateFalls(res.falls, delay);
    vis[res.target.r][res.target.c].pop = now + delay - 40;

    // progression
    var evs = gameCtx.mode === 'tutorial' ? [] : P.onChain(S, DAY, {
      len: played.length, level: res.newLevel,
      stones: res.hits.filter(function (h) { return h.kind === 'stone'; }).length + res.blasts.reduce(function (a, b) { return a + b.cells.filter(function (q) { return q.level === STONE; }).length; }, 0),
      ice: res.hits.filter(function (h) { return h.kind === 'melt'; }).length,
      prisms: prismsUsed,
      blasts: res.blasts.length, bomb: res.bomb
    });
    save();

    var px = cx(last.c), py = cy(last.r);
    setTimeout(function () {
      if (game !== gref) return;
      burst(px, py, ncol, 14 + played.length * 4, played.length >= 5);
      rings.push({ x: px, y: py, col: ncol, t0: performance.now(), big: played.length >= 5 });
      popups.push({ x: px, y: py, text: '+' + fmt(res.points), col: ncol, t0: performance.now() });
      sfx.merge(res.newLevel, played.length);
      vibrate(played.length >= 5 ? [18, 40, 30] : 22);
      updateHud(true);
      renderGoals(true);
      if (res.bomb) combo('Bombe ×' + played.length, '#ff6a4a');
      else if (played.length >= 5) combo((played.length >= 9 ? 'Supernova' : played.length >= 7 ? 'Éblouissant' : 'Éclat') + ' ×' + played.length, ncol);
      if (evs.length) ticker(evs);
      if (tuto) tutoNext();
      else checkIntro();
    }, reduceMotion ? 0 : delay - 30);

    if (game.over) setTimeout(function () { if (game === gref) endGame(); }, delay + (game.won ? 500 : 700));
    else if (res.stuck) setTimeout(function () { if (game !== gref) return; toast('Plus aucune chaîne. Lancez un Pulse.'); renderBoosters(); }, delay + 450);
  }

  function combo(text, col) {
    var el = $('combo');
    el.textContent = text; el.style.setProperty('--combo', col);
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function burst(x, y, col, n, big) {
    if (reduceMotion) n = Math.round(n / 3);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = (big ? 2.4 : 1.6) * cell * (0.4 + Math.random());
      particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - cell * 0.6, life: 0, max: 0.5 + Math.random() * 0.5, size: 1.5 + Math.random() * (big ? 4 : 3), col: Math.random() < 0.25 ? '#ffffff' : col });
    }
  }

  /* ================= Tutoriel ================= */
  function coach(html, shakeIt) {
    var c = $('coach');
    $('coachText').innerHTML = html;
    $('coachBtn').hidden = true;
    c.hidden = false;
    if (shakeIt && !reduceMotion) { c.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
  }
  function tutoNext() {
    tuto.step++;
    if (tuto.step < TUTO_STEPS.length) { coach(TUTO_STEPS[tuto.step].text); return; }
    coach('Voilà l\'essentiel. Plus le niveau monte, plus la lumière vaut de points. Pierres, glace, prismes et bombes vous attendent dans l\'<b>Aventure</b>.');
    $('coachBtn').hidden = false;
    $('coachBtn').textContent = 'Commencer à jouer';
  }
  function finishTutorial() {
    var first = !S.tuto;
    S.tuto = 1; save();
    $('coach').hidden = true;
    game = null;
    showScreen('home');
    if (first) setTimeout(dailyCheckIn, 400);
  }

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
    $('introName').textContent = it[0]; $('introText').textContent = it[1];
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
      sfx.coin(); toast('+5 coups'); updateHud(true);
      return;
    }
    if (!S.inv[b]) return offerShop(b);
    targeting = targeting === b ? null : b;
    $('targetBar').hidden = !targeting;
    $('targetText').textContent = b === 'hammer' ? 'Marteau : touchez la case à retirer' : 'Étincelle : touchez l\'orbe à faire monter';
    renderBoosters();
  }
  function offerShop(b) {
    var names = { pulse: 'Pulse', hammer: 'Marteau', spark: 'Étincelle', moves: '+5 coups' };
    toast('Plus de ' + names[b] + '. La boutique en vend contre des éclats.');
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
    $('overTitle').textContent = kind === 'moves' ? 'Plus de coups' : 'Plus aucune chaîne possible';
    $('overStars').hidden = true;
    $('finalScore').textContent = fmt(game.score);
    $('newBest').hidden = true;
    $('gains').innerHTML = game.level ? E.goalProgress(game).map(function (q) { return '<span>' + goalLabel(q.type, q.target) + ' <b>' + (q.type === 'level' ? (q.done ? '✓' : '–') : fmt(q.value) + '/' + fmt(q.target)) + '</b></span>'; }).join('') : '';
    $('sharePreview').hidden = true;
    $('shareBtn').hidden = true;
    resetShare();
    $('replayBtn').textContent = kind === 'moves' ? '+5 coups (' + S.inv.moves + ')' : 'Pulse (' + S.inv.pulse + ')';
    $('replayBtn').setAttribute('data-act', 'continue');
    $('leaveBtn').textContent = 'Abandonner';
    $('leaveBtn').setAttribute('data-act', 'giveup');
    paintOrbIcon($('overOrb'), game.bestLevel);
    $('overBest').textContent = game.movesLeft >= 0 ? game.movesLeft : fmt(S.best);
    $('overBestLbl').textContent = game.movesLeft >= 0 ? 'Coups' : 'Record';
    $('overMoves').textContent = game.movesPlayed;
    $('overVeil').hidden = false;
  }
  function doContinue() {
    var kind = pendingContinue; pendingContinue = null;
    $('overVeil').hidden = true;
    if (kind === 'moves') { S.inv.moves--; E.addMoves(game, 5); sfx.coin(); toast('+5 coups'); }
    else { S.inv.pulse--; E.pulse(game, true); sfx.pulse(); syncVis(); var now = performance.now(); for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) vis[r][c].pop = now + (Math.abs(r - 3.5) + Math.abs(c - 2.5)) * 30; }
    save(); updateHud(true);
  }
  function goalLabel(type, target) {
    return { level: 'Orbe ' + target, score: 'Score', stone: 'Pierres', ice: 'Glace', prism: 'Prismes' }[type];
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
    var title = 'Plus aucune chaîne possible', bestVal = 0, bestLbl = 'Record';
    if (mode === 'daily') { title = game.movesLeft === 0 ? 'Défi du jour terminé' : title; isNew = game.score > prevDaily && prevDaily > 0; bestVal = S.daily.best; bestLbl = 'Meilleur du jour'; }
    else if (mode === 'event') { title = gameCtx.ev.name; isNew = game.score > prevEv && prevEv > 0; bestVal = S.ev.best; bestLbl = 'Record semaine'; }
    else if (mode === 'adventure') { title = game.won ? 'Niveau ' + gameCtx.levelN + ' réussi' : 'Niveau ' + gameCtx.levelN + ' manqué'; bestVal = (S.adv[gameCtx.levelN - 1] || 0); bestLbl = 'Étoiles max'; }
    else { isNew = game.score > prevBest && prevBest > 0; bestVal = S.best; }
    $('overTitle').textContent = title;
    var st = $('overStars');
    if (mode === 'adventure') { st.hidden = false; st.innerHTML = [1, 2, 3].map(function (i) { return STAR(game.won && game.stars >= i, i === 2 ? 'mid' : ''); }).join(''); if (game.won) [0, 1, 2].forEach(function (i) { if (game.stars > i) setTimeout(function () { sfx.star(i); }, 300 + i * 250); }); }
    else st.hidden = true;
    $('finalScore').textContent = fmt(game.score);
    $('newBest').hidden = !isNew;
    $('newBest').textContent = mode === 'daily' ? 'Meilleur score du jour' : mode === 'event' ? 'Record de la semaine' : 'Nouveau record';
    $('overBest').textContent = fmt(bestVal);
    $('overBestLbl').textContent = bestLbl;
    $('overMoves').textContent = game.movesPlayed;
    var gains = '';
    if (res.ec) gains += '<span>' + SHARD + '<b>+' + res.ec + '</b> éclats</span>';
    if (res.xp) gains += '<span><b>+' + res.xp + '</b> lueur</span>';
    if (res.newStars) gains += '<span><b>+' + res.newStars + '</b> ★</span>';
    $('gains').innerHTML = gains;
    // partage
    $('shareBtn').hidden = mode === 'adventure' && !game.won;
    $('shareLbl').textContent = mode === 'daily' ? 'Partager le résultat' : 'Partager';
    resetShare();
    lastShare = shareText();
    var prev = $('sharePreview');
    prev.hidden = mode !== 'daily';
    $('defiLine').hidden = mode !== 'daily';
    if (mode === 'daily') {
      prev.textContent = lastShare;
      D.record('lumen', gameCtx.defi, game.score, lastShare);
      var ds = D.load('lumen'), sr = D.serie('lumen', gameCtx.defi);
      prev.setAttribute('aria-label', 'Défi ' + gameCtx.defi.n + ' terminé, score ' + fmt(game.score) + (sr >= 2 ? ', série de ' + sr + ' jours' : ''));
      var left = P.msToNextDaily(), h = Math.floor(left / 3600000), mn = Math.floor(left / 60000) % 60;
      $('defiLine').innerHTML = '<span class="defi-serie' + (sr >= 2 ? ' hot' : '') + '">' + FLAME + 'Série du défi : <b>' + sr + ' jour' + (sr > 1 ? 's' : '') + '</b> (record ' + ds.best + ')</span>' +
        '<span>Prochain défi dans <b>' + h + ' h ' + (mn < 10 ? '0' : '') + mn + '</b></span>';
    }
    // boutons
    var rb = $('replayBtn'), lb = $('leaveBtn');
    if (mode === 'adventure' && game.won) { rb.textContent = 'Niveau suivant'; rb.setAttribute('data-act', 'nextLevel'); lb.textContent = 'Voir la carte'; lb.setAttribute('data-act', 'map'); }
    else if (mode === 'adventure') { rb.textContent = 'Réessayer'; rb.setAttribute('data-act', 'replay'); lb.textContent = 'Voir la carte'; lb.setAttribute('data-act', 'map'); }
    else { rb.textContent = 'Rejouer'; rb.setAttribute('data-act', 'replay'); lb.textContent = 'Retour à l\'accueil'; lb.setAttribute('data-act', 'home'); }
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
    if (game.mode === 'adventure') return 'LUMEN ✨ Niveau ' + gameCtx.levelN + ' réussi avec ' + '★★★'.slice(0, game.stars) + ' (' + chapterOf(gameCtx.levelN).name + ')';
    if (game.mode === 'event') return 'LUMEN ✨ ' + gameCtx.ev.name + ' : ' + fmt(game.score) + ' points';
    return 'J\'ai fait ' + fmt(game.score) + ' sur LUMEN ✨ niveau max ' + game.bestLevel;
  }
  function share() {
    // le lien est dans le texte (pas de champ url à part : WhatsApp/Discord en feraient deux messages)
    var text = lastShare || shareText();
    D.share(text).then(function (r) {
      if (r === 'partage') $('shareStatus').textContent = 'Résultat partagé';
      else if (r === 'copie') $('shareStatus').textContent = 'Résultat copié, collez-le où vous voulez';
      else if (r === 'manuel') manualCopy(text);
    });
  }
  function manualCopy(text) {
    var box = $('shareManual'), ta = $('shareManualText');
    box.hidden = false; ta.value = text; $('sharePreview').hidden = true; // l'aperçu ferait doublon
    $('shareStatus').textContent = 'Copiez le texte ci-dessous';
    ta.focus(); ta.select();
  }
  function resetShare() { $('shareStatus').textContent = ''; $('shareManual').hidden = true; }
  function toastAny(msg) {
    ticker([{ kind: 'info', text: msg }]);
  }

  /* ================= Rendu plateau ================= */
  function easeIn(p) { return p * p; }
  function draw(now) {
    var g = bctx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!game || !vis) return;
    if (shake) {
      var sp0 = (now - shake) / 380;
      if (sp0 < 1 && !reduceMotion) g.translate(Math.sin(now * 0.09) * 6 * (1 - sp0), Math.cos(now * 0.11) * 4 * (1 - sp0)); else if (sp0 >= 1) shake = 0;
    }
    var tint = THEME.bg[3];
    var pw = cell * COLS + cell * 0.24, ph = cell * ROWS + cell * 0.24;
    var plate = g.createLinearGradient(0, oy, 0, oy + ph);
    plate.addColorStop(0, hexA(tint, 0.055)); plate.addColorStop(1, hexA(tint, 0.015));
    g.fillStyle = plate;
    roundRect(g, ox - cell * 0.12, oy - cell * 0.12, pw, ph, cell * 0.42); g.fill();
    g.strokeStyle = hexA(tint, 0.07); g.lineWidth = 1; g.stroke();
    var r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var x = cx(c), y = cy(r);
      var grad = g.createRadialGradient(x, y - cell * 0.1, cell * 0.1, x, y, cell * 0.44);
      grad.addColorStop(0, 'rgba(10,6,30,0.0)'); grad.addColorStop(0.75, 'rgba(10,6,30,0.35)'); grad.addColorStop(1, hexA(tint, 0.045));
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, cell * 0.44, 0, Math.PI * 2); g.fill();
    }
    var sel = {};
    chain.forEach(function (p) { sel[p.r * COLS + p.c] = true; });
    var clv = chainLv();
    if (!dragging && !game.over && !tuto && now - lastAction > 8000 && !hint) hint = E.findHint(game.grid, game.mods);
    var hintSet = {};
    if (hint) hint.forEach(function (p) { hintSet[p.r * COLS + p.c] = true; });
    if (tuto && TUTO_STEPS[tuto.step] && !dragging) TUTO_STEPS[tuto.step].cells.forEach(function (p) { hintSet[p[0] * COLS + p[1]] = true; });
    var t = now / 1000;
    g.save();
    g.beginPath(); g.rect(-20, oy - cell * 0.12, W + 40, H); g.clip();
    var bombs = [];
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var v = vis[r][c];
      if (!v.lv) continue;
      var yy = r, sx = 1, sy = 1;
      if (v.dur > 0) {
        if (now < v.t0) yy = v.from;
        else if (now < v.t0 + v.dur) yy = v.from + (r - v.from) * easeIn((now - v.t0) / v.dur);
        else { yy = r; if (!v.land) v.land = v.t0 + v.dur; }
      }
      if (v.land) {
        var lp = (now - v.land) / 160;
        if (lp < 1) { var sq = Math.sin(lp * Math.PI) * 0.12; sx = 1 + sq; sy = 1 - sq; } else { v.land = 0; v.dur = 0; }
      }
      var scale = 1;
      if (v.pop) {
        var pp = (now - v.pop) / 380;
        if (pp < 0) scale = 0; else if (pp < 1) scale = 1 + Math.sin(pp * Math.PI) * 0.35 * (1 - pp) - (1 - pp) * (1 - pp) * 0.6; else v.pop = 0;
        if (scale < 0) scale = 0;
      }
      var key = r * COLS + c, isSel = !!sel[key];
      var linkOk = v.lv === PRISM || (E.isOrb(v.lv) && !E.isFrozen(v.m) && (!clv || v.lv === clv));
      if (isSel) scale *= 1.1 + Math.sin(t * 10 + chain.length) * 0.02;
      else if (hintSet[key]) scale *= 1 + Math.sin(t * 5) * 0.06;
      else if (dragging && chain.length && !linkOk) g.globalAlpha = 0.38;
      if (targeting && !(targeting === 'spark' ? E.isOrb(v.lv) : true)) g.globalAlpha = 0.38;
      if (tuto && !dragging && TUTO_STEPS[tuto.step] && !hintSet[key]) g.globalAlpha = 0.28;
      if (yy < -0.6) { g.globalAlpha = 1; continue; }
      var sp = orbSprite(v.lv, orbSize), px = cx(c), py = oy + cell * (yy + 0.5), d = sp.S / DPR;
      if (v.lv >= 8 && v.lv < PRISM && !reduceMotion) scale *= 1 + Math.sin(t * 2.2 + c + r) * 0.015;
      g.save();
      g.translate(px, py + (sy < 1 ? cell * 0.4 * (1 - sy) : 0));
      g.scale(scale * sx, scale * sy);
      if (v.lv === PRISM && !reduceMotion) g.rotate(Math.sin(t * 1.5 + c) * 0.12);
      g.drawImage(sp.canvas, -d / 2, -d / 2, d, d);
      if (E.isFrozen(v.m)) { var ic = iceSprite(v.m, Math.round(cell * 0.86 * DPR)), di = ic.S / DPR; g.drawImage(ic.canvas, -di / 2, -di / 2, di, di); }
      g.restore();
      g.globalAlpha = 1;
      if (v.m === E.BOMB) bombs.push([px, py]);
      if (isSel) { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, cell * 0.45, 0, Math.PI * 2); g.stroke(); }
    }
    // anneaux des bombes
    bombs.forEach(function (b) {
      g.save(); g.translate(b[0], b[1]); g.rotate(reduceMotion ? 0 : t * 1.4);
      g.strokeStyle = 'rgba(255,106,74,.95)'; g.lineWidth = 2.5; g.setLineDash([cell * 0.09, cell * 0.07]);
      g.beginPath(); g.arc(0, 0, cell * 0.46, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      var pulse = 0.5 + Math.sin(t * 6) * 0.5;
      g.fillStyle = 'rgba(255,220,150,' + (0.6 + pulse * 0.4) + ')';
      g.beginPath(); g.arc(0, -cell * 0.46, 3 + pulse * 2, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    g.restore();

    for (var i = ghosts.length - 1; i >= 0; i--) {
      var gh = ghosts[i], p = (now - gh.t0) / gh.dur;
      if (p >= 1) { ghosts.splice(i, 1); continue; }
      if (p < 0) p = 0;
      var e = p * p * (3 - 2 * p), gs = orbSprite(gh.lv, orbSize), gd = gs.S / DPR * (1 - e * 0.7);
      g.globalAlpha = 1 - e * 0.6; g.globalCompositeOperation = 'lighter';
      g.drawImage(gs.canvas, gh.x0 + (gh.x1 - gh.x0) * e - gd / 2, gh.y0 + (gh.y1 - gh.y0) * e - gd / 2, gd, gd);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }

    if (chain.length) {
      var lc = clv ? lvColor(clv)[1] : '#ffffff';
      var pts = chain.map(function (q) { return [cx(q.c), cy(q.r)]; });
      if (finger) pts.push([finger.x, finger.y]);
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      [[cell * 0.34, 0.12], [cell * 0.18, 0.28], [cell * 0.07, 0.9]].forEach(function (w) {
        g.lineWidth = w[0]; g.strokeStyle = w[1] > 0.5 ? mix(lc, '#ffffff', 0.6) : hexA(lc, w[1]);
        g.beginPath(); pts.forEach(function (q, k) { if (k) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();
      });
      var total = 0, segs = [];
      for (var k = 1; k < pts.length; k++) { var L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push(L); total += L; }
      if (total > 0) for (var s2 = 0; s2 < 3; s2++) {
        var dpos = ((t * cell * 3) + s2 * total / 3) % total, acc = 0;
        for (k = 0; k < segs.length; k++) {
          if (acc + segs[k] >= dpos) {
            var f = (dpos - acc) / (segs[k] || 1);
            var sxp = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, syp = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
            var sg = g.createRadialGradient(sxp, syp, 0, sxp, syp, cell * 0.2);
            sg.addColorStop(0, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = sg; g.beginPath(); g.arc(sxp, syp, cell * 0.2, 0, Math.PI * 2); g.fill();
            break;
          }
          acc += segs[k];
        }
      }
      g.restore();
      if (chain.length >= 2 && clv) {
        var nextLv = E.mergeLevel(clv, chain.length, game.rules.longAt);
        var lastP = chain[chain.length - 1];
        var bx = cx(lastP.c), by = cy(lastP.r) - cell * 0.62;
        var label = '→ ' + nextLv + '   +' + fmt(E.chainScore(clv, chain.length)) + (chain.length >= game.rules.bombAt ? '  💥' : '');
        g.font = '700 ' + Math.round(cell * 0.2) + 'px Unbounded, sans-serif';
        var tw = g.measureText(label).width + cell * 0.3;
        bx = Math.max(tw / 2 + 4, Math.min(W - tw / 2 - 4, bx));
        if (by < cell * 0.2) by = cy(lastP.r) + cell * 0.62;
        g.fillStyle = hexA(THEME.bg[0], 0.9);
        roundRect(g, bx - tw / 2, by - cell * 0.18, tw, cell * 0.36, cell * 0.18); g.fill();
        g.strokeStyle = hexA(lvColor(nextLv)[1], 0.7); g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(label, bx, by + 1);
      }
    }
    for (i = rings.length - 1; i >= 0; i--) {
      var rg = rings[i], rp = (now - rg.t0) / (rg.wide ? 700 : 500);
      if (rp >= 1) { rings.splice(i, 1); continue; }
      if (rp < 0) continue;
      if (rg.blast) { var bg = g.createRadialGradient(rg.x, rg.y, 0, rg.x, rg.y, cell * 1.8); bg.addColorStop(0, 'rgba(255,200,120,' + (1 - rp) * 0.5 + ')'); bg.addColorStop(1, 'rgba(255,120,60,0)'); g.fillStyle = bg; g.fillRect(rg.x - cell * 2, rg.y - cell * 2, cell * 4, cell * 4); }
      g.strokeStyle = hexA(rg.col, (1 - rp) * 0.8);
      g.lineWidth = (rg.big ? 5 : 3) * (1 - rp) + 0.5;
      g.beginPath(); g.arc(rg.x, rg.y, cell * (0.4 + rp * (rg.wide ? 6 : rg.big ? 2.4 : 1.4)), 0, Math.PI * 2); g.stroke();
    }
    g.globalCompositeOperation = 'lighter';
    for (i = particles.length - 1; i >= 0; i--) {
      var q = particles[i];
      if (q.life >= q.max) { particles.splice(i, 1); continue; }
      var a = 1 - q.life / q.max;
      g.fillStyle = hexA(q.col, a);
      g.beginPath(); g.arc(q.x, q.y, q.size * (0.5 + a * 0.5), 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    for (i = popups.length - 1; i >= 0; i--) {
      var pu = popups[i], up = (now - pu.t0) / 950;
      if (up >= 1) { popups.splice(i, 1); continue; }
      var yoff = -cell * 0.9 * (1 - Math.pow(1 - up, 3));
      g.globalAlpha = up < 0.7 ? 1 : 1 - (up - 0.7) / 0.3;
      g.font = '900 ' + Math.round(cell * 0.32) + 'px Unbounded, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = pu.col; g.shadowBlur = 16; g.fillStyle = '#fff';
      g.fillText(pu.text, Math.max(cell, Math.min(W - cell, pu.x)), pu.y - cell * 0.3 + yoff);
      g.shadowBlur = 0; g.globalAlpha = 1;
    }
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* ================= Accueil ================= */
  var hero = $('heroCanvas'), hctx = hero.getContext('2d'), heroOrbs = [];
  function heroLayout() {
    var r = hero.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    hero.width = Math.round(r.width * d); hero.height = Math.round(r.height * d);
    hctx.setTransform(d, 0, 0, d, 0, 0);
    hero._w = r.width; hero._h = r.height;
    var rng = new E.Rng(42);
    heroOrbs = [];
    for (var i = 0; i < 12; i++) heroOrbs.push({ lv: i + 1, a: i / 12 * Math.PI * 2 - Math.PI / 2, sz: 18 + (i + 1) * 1.8, ph: rng.next() * 6 });
  }
  function drawHero(now) {
    var w = hero._w, h = hero._h;
    if (!w) return;
    var g = hctx, t = now / 1000;
    g.clearRect(0, 0, w, h);
    var cxh = w / 2, cyh = h / 2 - 8;
    var rx = Math.min(w * 0.44, 200), ry = Math.min(rx * 0.46, h * 0.36), tilt = -0.12;
    var cs = Math.cos(tilt), sn = Math.sin(tilt);
    g.save(); g.translate(cxh, cyh); g.rotate(tilt);
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
    var pos = heroOrbs.map(function (o) {
      var a = o.a + t * 0.16, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      return { o: o, x: cxh + ex * cs - ey * sn, y: cyh + ex * sn + ey * cs + Math.sin(t * 1.3 + o.ph) * 3, z: Math.sin(a) };
    });
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var i = 1; i < pos.length; i++) {
      var A1 = pos[i - 1], B = pos[i], lg = g.createLinearGradient(A1.x, A1.y, B.x, B.y);
      lg.addColorStop(0, hexA(lvColor(A1.o.lv)[1], 0.3)); lg.addColorStop(1, hexA(lvColor(B.o.lv)[1], 0.3));
      g.strokeStyle = lg; g.lineWidth = 2; g.beginPath(); g.moveTo(A1.x, A1.y); g.lineTo(B.x, B.y); g.stroke();
    }
    g.restore();
    pos.sort(function (a, b) { return a.z - b.z; });
    pos.forEach(function (p) {
      var s = p.o.sz * (0.7 + (p.z + 1) * 0.25), sp = orbSprite(p.o.lv, 96), d = s * sp.S / 96;
      g.globalAlpha = 0.4 + (p.z + 1) * 0.25;
      g.drawImage(sp.canvas, p.x - d / 2, p.y - d / 2, d, d);
    });
    g.globalAlpha = 1;
  }

  function currentLevel() { var n = 1; while (S.adv[n - 1] > 0) n++; return n; }
  function maxUnlocked() { return currentLevel(); }
  function drawRing(cv, size) {
    var d = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = cv.height = Math.round(size * d);
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    var rank = P.rankFor(S.xp), lo = P.xpForRank(rank), hi = P.xpForRank(rank + 1), f = (S.xp - lo) / (hi - lo);
    var c = size / 2, R = size / 2 - size * 0.08;
    g.lineWidth = size * 0.07; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = THEME.accent; g.shadowColor = THEME.accent; g.shadowBlur = size * 0.12;
    g.beginPath(); g.arc(c, c, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, f)); g.stroke(); g.shadowBlur = 0;
    var core = g.createRadialGradient(c - R * 0.2, c - R * 0.25, 0, c, c, R * 0.8);
    core.addColorStop(0, '#fff8ec'); core.addColorStop(0.5, hexA(THEME.accent, 0.5)); core.addColorStop(1, hexA(THEME.accent, 0.05));
    g.fillStyle = core; g.beginPath(); g.arc(c, c, R * 0.72, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a0f2a'; g.font = '900 ' + Math.round(size * 0.3) + 'px Unbounded, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(rank), c, c + size * 0.02);
  }
  function renderMoons(box) {
    var strip = P.streakStrip(S, DAY);
    var firstNext = strip.findIndex(function (x) { return x.state === 'next'; });
    box.innerHTML = strip.map(function (m, i) {
      return '<span class="moon ' + m.state + (m.spark ? ' big' : '') + (i === firstNext ? ' first' : '') + '"><i></i><span>' + (m.state === 'today' ? '<b>+' + m.ec + '</b>' : '+' + m.ec) + '</span></span>';
    }).join('');
  }
  var EV_ICONS = {
    glace: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9M9 4.5l3 2 3-2M9 19.5l3-2 3 2"/>',
    prismes: '<path d="M12 3l8 5v8l-8 5-8-5V8zM12 3v18M4 8l16 8M20 8L4 16"/>',
    pierres: '<path d="M5 15l3-8 6-2 5 5-1 7-7 3z"/>',
    supernova: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M5 19l2.5-2.5M16.5 7.5L19 5"/>',
    bombes: '<circle cx="11" cy="14" r="6"/><path d="M15 9l3-3M17 4l1 2 2 1"/>',
    sprint: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'
  };
  function refreshHome() {
    var rank = P.rankFor(S.xp);
    $('rankTitle').textContent = P.titleFor(rank);
    $('rankSub').textContent = 'Rang ' + rank;
    drawRing($('rankRing'), 44);
    refreshEc(false);
    renderMoons($('moons'));
    var sc = S.streak.last >= DAY - 1 ? S.streak.count : 0;
    $('srN').innerHTML = sc + '<small>jour' + (sc > 1 ? 's' : '') + ' de suite</small>';
    // aventure
    var n = currentLevel(), ch = chapterOf(n);
    var ad = $('advChapter').closest('.adv-card');
    ad.style.setProperty('--ch', ch.hue);
    $('advChapter').textContent = ch.name;
    $('advSub').textContent = n > 120 ? 'Constellation ' + (n - 120) : 'Niveau ' + n + ' sur 120';
    $('advStars').innerHTML = P.starsTotal(S) + '<small> / 360</small>';
    drawAdvConst(n);
    $('homeBest').textContent = 'Record ' + fmt(S.best);
    // défi du jour : « #24 · à faire » / « #24 · fait ✓ · 7 420 » + série du défi (distincte de la série d'ouverture)
    var td = P.dailyFor(), played = D.aJoue('lumen', td), dsr = D.serie('lumen', td);
    $('homeDaily').innerHTML = '#' + td.n + ' · ' + (played ? 'fait ✓ · ' + fmt(D.load('lumen').jours[td.key].score) : 'à faire') +
      (dsr ? ' <span class="defi-serie" title="Série du défi">' + FLAME + dsr + '<span class="sr"> jour' + (dsr > 1 ? 's' : '') + ' de défi de suite</span></span>' : '');
    $('homeDaily').parentNode.classList.toggle('done', played);
    var ev = P.eventFor(DAY), evBest = S.ev.week === ev.week ? S.ev.best : 0, claimed = S.ev.week === ev.week && S.ev.claimed;
    var band = $('eventBand');
    band.style.setProperty('--ev', ev.hue);
    $('evGlyph').innerHTML = '<svg viewBox="0 0 24 24">' + EV_ICONS[ev.id] + '</svg>';
    $('evName').textContent = ev.name;
    $('evSub').textContent = claimed ? 'Objectif atteint, encore ' + ev.endsIn + ' j' : 'Objectif ' + fmt(ev.goal) + ', encore ' + ev.endsIn + ' j';
    $('evBest').innerHTML = evBest ? fmt(evBest) + '<small>record</small>' : '<small>+' + P.EVENT_REWARD + ' éclats</small>';
    var ms = P.ensureMissions(S, DAY), left = S.mis.done.filter(function (d) { return !d; }).length;
    var bd = $('misBadge'); bd.hidden = !left; bd.textContent = left;
  }
  function drawAdvConst(n) {
    var cv = $('advConst'), r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    var ch = chapterOf(n), base = n > 120 ? n - ((n - 121) % 20) : (ch.n - 1) * 20 + 1;
    var rng = new E.Rng(ch.n * 101), pts = [];
    var x0 = r.width * 0.5, w = r.width * 0.46, h = r.height;
    for (var i = 0; i < 20; i++) {
      var t = i / 19;
      pts.push([x0 + t * w + (rng.next() - 0.5) * 12, h * 0.52 - Math.sin(t * Math.PI * 1.4 + ch.n) * h * 0.2 - t * h * 0.3 + (rng.next() - 0.5) * 14]);
    }
    g.lineWidth = 1.2;
    for (i = 1; i < 20; i++) {
      var lit = base + i <= n;
      g.strokeStyle = lit ? hexA(ch.hue, 0.6) : 'rgba(255,255,255,.08)';
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
    }
    for (i = 0; i < 20; i++) {
      var lv = base + i, on = lv < n, cur = lv === n;
      var rr = cur ? 4.5 : on ? 2.6 : 1.8;
      if (on || cur) { var gl = g.createRadialGradient(pts[i][0], pts[i][1], 0, pts[i][0], pts[i][1], rr * 4); gl.addColorStop(0, hexA(ch.hue, 0.7)); gl.addColorStop(1, hexA(ch.hue, 0)); g.fillStyle = gl; g.fillRect(pts[i][0] - rr * 4, pts[i][1] - rr * 4, rr * 8, rr * 8); }
      g.fillStyle = cur ? '#ffffff' : on ? mix(ch.hue, '#ffffff', 0.5) : 'rgba(255,255,255,.22)';
      g.beginPath(); g.arc(pts[i][0], pts[i][1], rr, 0, Math.PI * 2); g.fill();
    }
  }

  /* ================= Carte de l'Aventure ================= */
  var mapNodes = [], mapH = 0, mapCv = $('mapCanvas'), mapG = mapCv.getContext('2d'), mapStars = [];
  var SP = 84, CH_GAP = 170;
  function buildMap() {
    var inner = $('mapInner'), scroll = $('mapScroll');
    var w = scroll.clientWidth || 390;
    var cur = currentLevel(), last = Math.max(120, cur) + (cur > 120 ? 3 : 1);
    var nodes = [], y = 120, labels = [];
    for (var n = 1; n <= last; n++) {
      var ch = chapterOf(n), chIdx = n > 120 ? 6 : ch.n - 1;
      if (n === 1 || (n <= 121 && (n - 1) % 20 === 0)) { labels.push({ y: y + 20, ch: ch, n: n }); y += CH_GAP; }
      var i = n - 1;
      var x = w / 2 + Math.sin(i * 0.62 + chIdx * 1.7) * w * 0.3 + Math.sin(i * 2.3 + chIdx) * w * 0.06;
      nodes.push({ n: n, x: x, yb: y, ch: ch });
      y += SP;
    }
    mapH = y + 80;
    nodes.forEach(function (nd) { nd.y = mapH - nd.yb; });
    labels.forEach(function (l) { l.y = mapH - l.y; });
    mapNodes = nodes;
    inner.style.height = mapH + 'px';
    var html = '';
    labels.forEach(function (l) {
      var locked = l.n > cur;
      html += '<div class="chapter-label' + (locked ? ' locked' : '') + (l.n > 120 ? ' endless-label' : '') + '" style="top:' + (l.y - 40) + 'px;--cc:' + l.ch.hue + '"><b>' + esc(l.ch.name) + '</b><span>' + (l.n > 120 ? 'Au-delà des 120 niveaux' : 'Chapitre ' + l.ch.n + ', niveaux ' + l.n + ' à ' + (l.n + 19)) + '</span></div>';
    });
    nodes.forEach(function (nd) {
      var st = S.adv[nd.n - 1] || 0, locked = nd.n > cur, isCur = nd.n === cur;
      var cls = 'node' + (locked ? ' locked' : '') + (isCur ? ' current' : '') + (st === 3 ? ' perfect' : '');
      html += '<button class="' + cls + '" data-act="level" data-n="' + nd.n + '" style="left:' + nd.x.toFixed(1) + 'px;top:' + nd.y.toFixed(1) + 'px;--nc:' + nd.ch.hue + ';--nc2:' + nd.ch.hue2 + '"' + (locked ? ' aria-disabled="true"' : '') + ' aria-label="Niveau ' + nd.n + (locked ? ', verrouillé' : '') + (st ? ', ' + st + ' étoiles' : '') + '">' +
        '<span class="core">' + (locked ? '' : nd.n) + '</span>' +
        (!locked ? '<span class="st">' + [1, 2, 3].map(function (i) { return '<i class="' + (st >= i ? 'on' : '') + '"></i>'; }).join('') + '</span>' : '') + '</button>';
    });
    inner.innerHTML = html;
    var rng = new E.Rng(99);
    mapStars = [];
    for (var k = 0; k < 260; k++) mapStars.push([rng.next() * w, rng.next() * mapH, rng.next() * 1.4 + 0.3, rng.next()]);
    $('mapStars').textContent = P.starsTotal(S) + ' étoiles sur 360';
    var curNode = nodes[cur - 1];
    scroll.scrollTop = Math.max(0, curNode.y - scroll.clientHeight * 0.6);
    updateMapTitle();
    sizeMapCanvas();
  }
  function sizeMapCanvas() {
    var r = mapCv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    mapCv.width = Math.round(r.width * d); mapCv.height = Math.round(r.height * d);
    mapCv._d = d; mapCv._w = r.width; mapCv._h = r.height;
  }
  function updateMapTitle() {
    var scroll = $('mapScroll'), mid = scroll.scrollTop + scroll.clientHeight / 2, best = null;
    mapNodes.forEach(function (nd) { if (!best || Math.abs(nd.y - mid) < Math.abs(best.y - mid)) best = nd; });
    if (best) $('mapChapter').textContent = best.ch.name;
  }
  function drawMap(now) {
    if (!mapCv._w) return;
    var g = mapG, d = mapCv._d, w = mapCv._w, h = mapCv._h, top = $('mapScroll').scrollTop, t = now / 1000;
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    // nébuleuse : couleur du chapitre au centre de l'écran
    var midNode = null, mid = top + h / 2;
    mapNodes.forEach(function (nd) { if (!midNode || Math.abs(nd.y - mid) < Math.abs(midNode.y - mid)) midNode = nd; });
    if (midNode) {
      var neb = g.createRadialGradient(w * 0.3, h * 0.45, 0, w * 0.3, h * 0.45, h * 0.7);
      neb.addColorStop(0, hexA(midNode.ch.hue2, 0.12)); neb.addColorStop(1, hexA(midNode.ch.hue, 0));
      g.fillStyle = neb; g.fillRect(0, 0, w, h);
      var neb2 = g.createRadialGradient(w * 0.85, h * 0.8, 0, w * 0.85, h * 0.8, h * 0.5);
      neb2.addColorStop(0, hexA(midNode.ch.hue, 0.08)); neb2.addColorStop(1, hexA(midNode.ch.hue2, 0));
      g.fillStyle = neb2; g.fillRect(0, 0, w, h);
    }
    mapStars.forEach(function (s) {
      var y = s[1] - top * 0.6; y = ((y % mapH) + mapH) % mapH;
      if (y > h) return;
      g.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + s[3] * 20))) + ')';
      g.beginPath(); g.arc(s[0], y, s[2], 0, Math.PI * 2); g.fill();
    });
    var cur = currentLevel();
    g.lineCap = 'round';
    for (var i = 1; i < mapNodes.length; i++) {
      var a = mapNodes[i - 1], b = mapNodes[i];
      var ay = a.y - top, by = b.y - top;
      if ((ay < -100 && by < -100) || (ay > h + 100 && by > h + 100)) continue;
      var lit = b.n <= cur;
      if (lit) {
        var lg = g.createLinearGradient(a.x, ay, b.x, by); lg.addColorStop(0, hexA(a.ch.hue, 0.75)); lg.addColorStop(1, hexA(b.ch.hue, 0.75));
        g.strokeStyle = lg; g.lineWidth = 3; g.shadowColor = a.ch.hue; g.shadowBlur = 12; g.setLineDash([]);
      } else { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.5; g.shadowBlur = 0; g.setLineDash([3, 7]); }
      g.beginPath(); g.moveTo(a.x, ay);
      var mx = (a.x + b.x) / 2 + (i % 2 ? 14 : -14);
      g.quadraticCurveTo(mx, (ay + by) / 2, b.x, by); g.stroke();
    }
    g.shadowBlur = 0; g.setLineDash([]);
    // éclats en croix derrière les étoiles atteintes
    g.globalCompositeOperation = 'lighter';
    mapNodes.forEach(function (nd) {
      var y = nd.y - top;
      if (y < -80 || y > h + 80 || nd.n > cur) return;
      var st = S.adv[nd.n - 1] || 0, isCur = nd.n === cur;
      var L = isCur ? 46 + Math.sin(t * 3) * 6 : 22 + st * 7;
      var gl = g.createRadialGradient(nd.x, y, 0, nd.x, y, L);
      gl.addColorStop(0, hexA(nd.ch.hue, isCur ? 0.55 : 0.35)); gl.addColorStop(1, hexA(nd.ch.hue, 0));
      g.fillStyle = gl; g.beginPath(); g.arc(nd.x, y, L, 0, Math.PI * 2); g.fill();
      var fl = mix(nd.ch.hue, '#ffffff', 0.6), FL = L * (isCur ? 1.6 : 1.1);
      [[1, 0], [0, 1]].forEach(function (dir) {
        var lg2 = g.createLinearGradient(nd.x - dir[0] * FL, y - dir[1] * FL, nd.x + dir[0] * FL, y + dir[1] * FL);
        lg2.addColorStop(0, hexA(fl, 0)); lg2.addColorStop(0.5, hexA(fl, isCur ? 0.8 : 0.45)); lg2.addColorStop(1, hexA(fl, 0));
        g.strokeStyle = lg2; g.lineWidth = isCur ? 1.6 : 1;
        g.beginPath(); g.moveTo(nd.x - dir[0] * FL, y - dir[1] * FL); g.lineTo(nd.x + dir[0] * FL, y + dir[1] * FL); g.stroke();
      });
    });
    g.globalCompositeOperation = 'source-over';
  }
  $('mapScroll').addEventListener('scroll', function () { updateMapTitle(); }, { passive: true });

  var levelPicked = 0;
  function openLevel(n) {
    if (n > currentLevel()) { sfx.deny(); return; }
    levelPicked = n;
    var lv = levelDef(n), ch = chapterOf(n), st = S.adv[n - 1] || 0;
    $('levelVeil').querySelector('.sheet').style.setProperty('--cc', ch.hue);
    $('lvChapter').textContent = ch.name;
    $('lvTitle').textContent = 'Niveau ' + n;
    $('lvStars').innerHTML = [1, 2, 3].map(function (i) { return STAR(st >= i); }).join('');
    var firstOfCh = n <= 120 ? (n - 1) % 20 === 0 : n === 121;
    $('lvIntro').textContent = firstOfCh ? ch.intro : '';
    $('lvIntro').hidden = !firstOfCh;
    $('lvGoals').innerHTML = lv.goals.map(function (q) {
      var txt = { level: 'Créer une orbe de niveau ' + q[1], score: 'Marquer ' + fmt(q[1]) + ' points', stone: 'Briser ' + q[1] + ' pierres', ice: 'Libérer ' + q[1] + ' orbes de la glace', prism: 'Utiliser ' + q[1] + ' prismes' }[q[0]];
      return '<li><canvas width="60" height="60" data-t="' + q[0] + '" data-v="' + q[1] + '"></canvas><span>' + txt + '</span></li>';
    }).join('');
    $('lvGoals').querySelectorAll('canvas').forEach(function (cv) { paintGoalIcon(cv, cv.getAttribute('data-t'), +cv.getAttribute('data-v')); });
    var pl = function (n) { return n + ' coup' + (n > 1 ? 's' : ''); };
    $('lvMoves').textContent = pl(lv.moves) + '. ★★ s\'il en reste ' + lv.st[0] + ', ★★★ s\'il en reste ' + lv.st[1] + '.';
    $('levelVeil').hidden = false;
  }

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
      return '<div class="shop-item">' + lens + '<div><b>' + b[1] + '</b><p>' + b[2] + '</p><span class="own">En réserve : ' + S.inv[b[0]] + '</span></div>' +
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
      var act = on ? '<span class="pill use">Actif</span>' : own ? '<button class="pill" data-act="useTheme" data-id="' + t.id + '">Utiliser</button>'
        : '<button class="pill" data-act="buyTheme" data-id="' + t.id + '"' + (S.ec < t.price ? ' disabled' : '') + '>' + SHARD + fmt(t.price) + '</button>';
      var sub = own ? (on ? 'Thème actuel' : 'Débloqué') : 'Offert au rang ' + t.rank + (rank < t.rank ? '' : '');
      return '<div class="theme-card' + (on ? ' on' : '') + '" style="--t-nuit:' + t.bg[0] + ';--t-haut:' + t.bg[2] + ';--t-acc:' + t.accent + '"><canvas></canvas><div><b>' + t.name + '</b><small>' + sub + '</small></div>' + act + '</div>';
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
    sc.innerHTML = '<strong>' + (S.streak.last >= DAY - 1 ? S.streak.count : 0) + ' jour' + (S.streak.count > 1 ? 's' : '') + ' de suite</strong><p>Ouvrez LUMEN chaque jour. Le 7<sup>e</sup> jour offre 150 éclats et une Étincelle. Un jour manqué, et la série repart de zéro. Record : ' + S.streak.best + ' jours.</p><div class="moons"></div>';
    renderMoons(sc.querySelector('.moons'));
    var ev = P.eventFor(DAY), evBest = S.ev.week === ev.week ? S.ev.best : 0, claimed = S.ev.week === ev.week && S.ev.claimed;
    var ec = $('eventCard'); ec.style.setProperty('--ev', ev.hue);
    ec.innerHTML = '<strong>' + ev.name + '</strong><p>' + ev.desc + ' Atteignez ' + fmt(ev.goal) + ' points en une partie pour gagner ' + P.EVENT_REWARD + ' éclats' + (claimed ? ' (déjà gagnés).' : '.') + ' Fin dans ' + ev.endsIn + ' jour' + (ev.endsIn > 1 ? 's' : '') + '.</p>' +
      '<div class="row2"><div class="stat-cell"><b>' + fmt(evBest) + '</b><span>Record de la semaine</span></div><button class="btn solid" data-act="event">Jouer</button></div>';
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
      return '<div class="ach"><div class="medal">' + MEDAL(a.tier) + '</div><div><span class="tiers"><i class="' + (a.tier >= 1 ? 't1' : '') + '"></i><i class="' + (a.tier >= 2 ? 't2' : '') + '"></i><i class="' + (a.tier >= 3 ? 't3' : '') + '"></i></span><b>' + esc(a.name) + '</b><p>' + (a.tier >= 3 ? 'Terminé : ' : '') + esc(a.desc) + ' (' + fmt(Math.min(a.value, a.next)) + ' / ' + fmt(a.next) + ')</p><div class="bar"><i style="width:' + Math.round(f * 100) + '%"></i></div></div></div>';
    }).join('');
  }
  function renderStats() {
    var rank = P.rankFor(S.xp), next = P.xpForRank(rank + 1), lo = P.xpForRank(rank);
    var nextTheme = P.THEMES.filter(function (t) { return t.rank > rank && S.themes.indexOf(t.id) < 0; })[0];
    var nextTitle = P.TITLES.filter(function (t) { return t[0] > rank; })[0];
    $('rankCard').innerHTML = '<canvas id="rankBig"></canvas><div><b>' + P.titleFor(rank) + '</b><small>Rang ' + rank + ', ' + fmt(S.xp - lo) + ' / ' + fmt(next - lo) + ' lueur</small><div class="bar"><i style="width:' + Math.round(100 * (S.xp - lo) / (next - lo)) + '%"></i></div>' +
      '<div class="unl">' + (nextTitle ? 'Rang ' + nextTitle[0] + ' : titre « ' + nextTitle[1] + ' »' : 'Tous les titres obtenus') + (nextTheme ? '<br>Rang ' + nextTheme.rank + ' : thème ' + nextTheme.name : '') + '</div></div>';
    drawRing($('rankBig'), 84);
    var st = S.stats;
    var cells = [
      [fmt(st.games), 'Parties jouées'], [fmt(S.best), 'Meilleur score'], [st.maxLv, 'Niveau d\'orbe max'], [st.longest, 'Plus longue chaîne'],
      [fmt(st.merges), 'Fusions au total'], [P.starsTotal(S) + ' ★', 'Étoiles en Aventure'], [S.streak.best + ' j', 'Record de série'], [fmt(st.stones), 'Pierres brisées'],
      [fmt(st.ice), 'Orbes dégelées'], [fmt(st.blasts), 'Bombes déclenchées']
    ];
    $('statGrid').innerHTML = cells.map(function (c) { return '<div class="stat-cell"><b>' + c[0] + '</b><span>' + c[1] + '</span></div>'; }).join('');
  }
  function renderSettings() {
    $('setSnd').checked = !!S.set.snd; $('setMus').checked = !!S.set.mus; $('setVib').checked = !!S.set.vib;
    $('saveCode').value = P.exportCode(S);
    $('importBox').hidden = true; $('importErr').hidden = true; $('importCode').value = '';
    $('resetConfirm').hidden = true; $('resetBtn').hidden = false;
  }

  /* ================= Série quotidienne ================= */
  function dailyCheckIn() {
    var r = P.checkIn(S, DAY);
    if (!r) return;
    save();
    $('giftTitle').textContent = r.broke ? 'La série repart à zéro' : 'Jour ' + r.day + ' de votre série';
    $('giftAmount').innerHTML = '+' + r.ec + ' ' + SHARD;
    $('giftText').textContent = r.spark ? 'Septième jour : une Étincelle en prime. Le cycle recommence demain.' : r.broke ? 'Un jour a été manqué. Revenez demain pour le jour 2.' : r.day < 6 ? 'Revenez demain : la récompense grandit chaque jour jusqu\'au 7e.' : 'Demain : 150 éclats et une Étincelle.';
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
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { toastAny('Code copié'); }, function () { $('saveCode').select(); toastAny('Sélectionnez et copiez le code'); });
        else { $('saveCode').select(); toastAny('Sélectionnez et copiez le code'); }
        break;
      case 'showImport': $('importBox').hidden = false; $('importCode').focus(); break;
      case 'doImport':
        var imp = P.importCode($('importCode').value);
        if (!imp) { $('importErr').hidden = false; sfx.deny(); break; }
        S = imp; save(); applyTheme(S.theme); syncAudio(); toastAny('Progression restaurée'); renderSettings(); refreshEc(false);
        break;
      case 'reset': $('resetConfirm').hidden = false; $('resetBtn').hidden = true; break;
      case 'resetCancel': $('resetConfirm').hidden = true; $('resetBtn').hidden = false; break;
      case 'resetConfirm':
        // Anti-clickjacking : GitHub Pages ne permet pas d'en-tête frame-ancestors ; pas d'effacement depuis un cadre.
        if (window.top !== window.self) { toastAny('Ouvrez LUMEN directement pour effacer'); sfx.deny(); break; }
        var keepSet = S.set; S = P.newSave(); S.set = keepSet; S.tuto = 1; save(); applyTheme('nuit'); toastAny('Progression effacée'); showScreen('home'); break;
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
  ['setSnd', 'setMus', 'setVib'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      S.set.snd = $('setSnd').checked ? 1 : 0; S.set.mus = $('setMus').checked ? 1 : 0; S.set.vib = $('setVib').checked ? 1 : 0;
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
  fetch('levels.json').then(function (r) { return r.json(); }).then(function (d) { LEVELS_DATA = d; boot(); }, function () { boot(); });
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
})();
