/* LUMEN — interface (4/8) : tracé de chaîne, validation d'un coup, toasts, tutoriel.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
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
    if (tuto && !tutoAccepts(played)) { sfx.deny(); vibrate([10, 30, 10]); coach(tr(TUTO_STEPS[tuto.step].text), true); return; }
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
      if (res.bomb) combo(tr('Bombe') + ' ×' + played.length, '#ff6a4a');
      else if (played.length >= 5) combo(tr(played.length >= 9 ? 'Supernova' : played.length >= 7 ? 'Éblouissant' : 'Éclat') + ' ×' + played.length, ncol);
      if (evs.length) ticker(evs);
      if (tuto) tutoNext();
      else checkIntro();
    }, reduceMotion ? 0 : delay - 30);

    if (game.over) setTimeout(function () { if (game === gref) endGame(); }, delay + (game.won ? 500 : 700));
    else if (res.stuck) setTimeout(function () { if (game !== gref) return; toast(tr('Plus aucune chaîne. Lancez un Pulse.')); renderBoosters(); }, delay + 450);
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
    if (tuto.step < TUTO_STEPS.length) { coach(tr(TUTO_STEPS[tuto.step].text)); return; }
    coach(tr('Voilà l\'essentiel. Plus le niveau monte, plus la lumière vaut de points. Pierres, glace, prismes et bombes vous attendent dans l\'<b>Aventure</b>.'));
    $('coachBtn').hidden = false;
    $('coachBtn').textContent = tr('Commencer à jouer');
  }
  function finishTutorial() {
    var first = !S.tuto;
    S.tuto = 1; save();
    $('coach').hidden = true;
    game = null;
    showScreen('home');
    if (first) setTimeout(dailyCheckIn, 400);
  }

