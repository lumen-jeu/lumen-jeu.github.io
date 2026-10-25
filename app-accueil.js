/* LUMEN — interface (7/8) : accueil et carte de l'Aventure.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
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
    $('rankSub').textContent = tr('Rang {0}', rank);
    drawRing($('rankRing'), 44);
    refreshEc(false);
    renderMoons($('moons'));
    var sc = S.streak.last >= DAY - 1 ? S.streak.count : 0;
    $('srN').innerHTML = sc + '<small>' + trn(sc, 'jour de suite', 'jours de suite') + '</small>';
    // aventure
    var n = currentLevel(), ch = chapterOf(n);
    var ad = $('advChapter').closest('.adv-card');
    ad.style.setProperty('--ch', ch.hue);
    $('advChapter').textContent = ch.name;
    $('advSub').textContent = n > 120 ? 'Constellation ' + (n - 120) : tr('Niveau {0} sur 120', n);
    $('playSub').textContent = tr('Aventure') + ' · ' + (n > 120 ? 'Constellation ' + (n - 120) : tr('Niveau {0}', n));
    $('advStars').innerHTML = P.starsTotal(S) + '<small> / 360</small>';
    drawAdvConst(n);
    $('homeBest').textContent = tr('Record {0}', fmt(S.best));
    // défi du jour : « #24 · à faire » / « #24 · fait ✓ · 7 420 » + série du défi (distincte de la série d'ouverture)
    var td = P.dailyFor(), played = D.aJoue('lumen', td), dsr = D.serie('lumen', td);
    $('homeDaily').innerHTML = '#' + td.n + ' · ' + (played ? tr('fait ✓ · ') + fmt(D.load('lumen').jours[td.key].score) : tr('à faire')) +
      (dsr ? ' <span class="defi-serie" title="' + tr('Série du défi') + '">' + FLAME + dsr + '<span class="sr">' + trn(dsr, ' jour de défi de suite', ' jours de défi de suite') + '</span></span>' : '');
    $('homeDaily').parentNode.classList.toggle('done', played);
    var ev = P.eventFor(DAY), evBest = S.ev.week === ev.week ? S.ev.best : 0, claimed = S.ev.week === ev.week && S.ev.claimed;
    var band = $('eventBand');
    band.style.setProperty('--ev', ev.hue);
    $('evGlyph').innerHTML = '<svg viewBox="0 0 24 24">' + EV_ICONS[ev.id] + '</svg>';
    $('evName').textContent = ev.name;
    $('evSub').textContent = claimed ? tr('Objectif atteint, encore {0} j', ev.endsIn) : tr('Objectif {0}, encore {1} j', fmt(ev.goal), ev.endsIn);
    $('evBest').innerHTML = evBest ? fmt(evBest) + '<small>' + tr('record') + '</small>' : '<small>+' + P.EVENT_REWARD + ' ' + tr('éclats') + '</small>';
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
      html += '<div class="chapter-label' + (locked ? ' locked' : '') + (l.n > 120 ? ' endless-label' : '') + '" style="top:' + (l.y - 40) + 'px;--cc:' + l.ch.hue + '"><b>' + esc(l.ch.name) + '</b><span>' + (l.n > 120 ? tr('Au-delà des 120 niveaux') : tr('Chapitre {0}, niveaux {1} à {2}', l.ch.n, l.n, l.n + 19)) + '</span></div>';
    });
    nodes.forEach(function (nd) {
      var st = S.adv[nd.n - 1] || 0, locked = nd.n > cur, isCur = nd.n === cur;
      var cls = 'node' + (locked ? ' locked' : '') + (isCur ? ' current' : '') + (st === 3 ? ' perfect' : '');
      html += '<button class="' + cls + '" data-act="level" data-n="' + nd.n + '" style="left:' + nd.x.toFixed(1) + 'px;top:' + nd.y.toFixed(1) + 'px;--nc:' + nd.ch.hue + ';--nc2:' + nd.ch.hue2 + '"' + (locked ? ' aria-disabled="true"' : '') + ' aria-label="' + tr('Niveau {0}', nd.n) + (locked ? tr(', verrouillé') : '') + (st ? tr(', {0} étoiles', st) : '') + '">' +
        '<span class="core">' + (locked ? '' : nd.n) + '</span>' +
        (!locked ? '<span class="st">' + [1, 2, 3].map(function (i) { return '<i class="' + (st >= i ? 'on' : '') + '"></i>'; }).join('') + '</span>' : '') + '</button>';
    });
    inner.innerHTML = html;
    var rng = new E.Rng(99);
    mapStars = [];
    for (var k = 0; k < 260; k++) mapStars.push([rng.next() * w, rng.next() * mapH, rng.next() * 1.4 + 0.3, rng.next()]);
    $('mapStars').textContent = tr('{0} étoiles sur 360', P.starsTotal(S));
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
    $('lvTitle').textContent = tr('Niveau {0}', n);
    $('lvStars').innerHTML = [1, 2, 3].map(function (i) { return STAR(st >= i); }).join('');
    var firstOfCh = n <= 120 ? (n - 1) % 20 === 0 : n === 121;
    $('lvIntro').textContent = firstOfCh ? ch.intro : '';
    $('lvIntro').hidden = !firstOfCh;
    $('lvGoals').innerHTML = lv.goals.map(function (q) {
      var txt = tr({ level: 'Créer une orbe de niveau {0}', score: 'Marquer {0} points', stone: 'Briser {0} pierres', ice: 'Libérer {0} orbes de la glace', prism: 'Utiliser {0} prismes' }[q[0]], q[0] === 'score' ? fmt(q[1]) : q[1]);
      return '<li><canvas width="60" height="60" data-t="' + q[0] + '" data-v="' + q[1] + '"></canvas><span>' + txt + '</span></li>';
    }).join('');
    $('lvGoals').querySelectorAll('canvas').forEach(function (cv) { paintGoalIcon(cv, cv.getAttribute('data-t'), +cv.getAttribute('data-v')); });
    $('lvMoves').textContent = trn(lv.moves, '{0} coup', '{0} coups') + tr('. ★★ s\'il en reste {0}, ★★★ s\'il en reste {1}.', lv.st[0], lv.st[1]);
    $('levelVeil').hidden = false;
  }

