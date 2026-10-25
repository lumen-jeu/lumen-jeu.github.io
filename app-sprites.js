/* LUMEN — interface (2/8) : sprites canvas des orbes et icônes DOM.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
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

