/* LUMEN — interface (6/8) : dessin du plateau.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
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

