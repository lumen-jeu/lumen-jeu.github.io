/* LUMEN — carte image du Défi du jour (1080×1920, format story) : contenu pur + dessin canvas + partage.
 * Le texte partagé reste celui de defi.js ; la carte reprend les mêmes informations en image. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LumenCarte = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 1080, H = 1920, COLS = 8, LIGNES = 5;

  function brut(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1] == null ? m : a[+i + 1]; }); }
  function brutN(n, un, plus) { return brut(n <= 1 ? un : plus, n); }

  /**
   * Contenu de la carte (pur, testé). o = { n, score (texte déjà formaté), history: [niveaux créés], peak, longest, serie, url, t?, tn? }.
   * Mêmes informations que le texte partagé : #N, score, grille (8 par ligne, 5 lignes), détail, série (dès 2 jours), lien.
   */
  function model(o) {
    var t = o.t || brut, tn = o.tn || brutN, h = (o.history || []).slice(0, COLS * LIGNES), rows = [];
    for (var i = 0; i < h.length; i += COLS) rows.push(h.slice(i, i + COLS));
    return {
      titre: 'LUMEN',
      kicker: t('Défi du jour #{0}', o.n),
      score: String(o.score),
      rows: rows,
      detail: t('Niveau max {0}, chaîne de {1}', o.peak, o.longest),
      serie: o.serie >= 2 ? tn(o.serie, '{0} jour de suite', '{0} jours de suite') : '',
      url: String(o.url || ''),
      fichier: 'lumen-defi-' + o.n + '.png'
    };
  }

  /* ---------- dessin ---------- */
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function pill(g, x, y, w, h) { var r = h / 2; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function flamme(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s / 24, s / 24); g.fillStyle = col;
    g.fill(new Path2D('M12 2.5c.6 3.4 5.5 5.6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.5-4.4 2.6-5.3.1 1.8.9 2.9 2 3.2-.4-3 .1-6.2.9-8.9z'));
    g.restore();
  }
  /** opts = { theme: {bg, accent}, orb: function (niveau, taillePx) → {canvas, S} } */
  function draw(g, m, opts) {
    var th = opts.theme, acc = th.accent, DISP = 'Unbounded, "Trebuchet MS", sans-serif', BODY = '"Instrument Sans", system-ui, sans-serif';
    var fond = g.createLinearGradient(0, 0, 0, H);
    fond.addColorStop(0, th.bg[0]); fond.addColorStop(0.55, th.bg[1]); fond.addColorStop(1, th.bg[2]);
    g.fillStyle = fond; g.fillRect(0, 0, W, H);
    var halo = g.createRadialGradient(W / 2, 360, 0, W / 2, 360, 760);
    halo.addColorStop(0, hexA(acc, 0.32)); halo.addColorStop(1, hexA(acc, 0));
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    var a = 7; // ciel étoilé fixe (même carte pour le même score)
    for (var i = 0; i < 140; i++) {
      a = (a * 16807) % 2147483647; var x = a % W; a = (a * 16807) % 2147483647; var y = a % H; a = (a * 16807) % 2147483647;
      g.fillStyle = 'rgba(255,255,255,' + (0.1 + (a % 40) / 100) + ')'; g.beginPath(); g.arc(x, y, 1 + (a % 3) * 0.8, 0, Math.PI * 2); g.fill();
    }
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    // orbe de tête : le plus haut niveau atteint
    var top = Math.max(1, Math.min(12, m.rows.reduce(function (mx, r) { return Math.max(mx, Math.max.apply(null, r)); }, 1)));
    var big = opts.orb(top, 230); g.drawImage(big.canvas, W / 2 - big.S / 2, 300 - big.S / 2);
    g.shadowColor = hexA(acc, 0.85); g.shadowBlur = 50; g.fillStyle = '#fff8ec';
    g.font = '900 150px ' + DISP; g.fillText(m.titre, W / 2, 610);
    g.shadowBlur = 0;
    g.font = '700 42px ' + DISP; var kw = g.measureText(m.kicker.toUpperCase()).width + 80;
    pill(g, W / 2 - kw / 2, 650, kw, 78); g.fillStyle = hexA(acc, 0.16); g.fill(); g.lineWidth = 3; g.strokeStyle = hexA(acc, 0.6); g.stroke();
    g.fillStyle = acc; g.fillText(m.kicker.toUpperCase(), W / 2, 704);
    g.shadowColor = hexA(acc, 0.6); g.shadowBlur = 60; g.fillStyle = '#fff8ec';
    g.font = '900 ' + (m.score.length > 6 ? 170 : 200) + 'px ' + DISP; g.fillText(m.score, W / 2, 960);
    g.shadowBlur = 0;
    // grille : une orbe par coup, emplacements vides en pointillé jusqu'à 40
    var cell = 104, x0 = (W - cell * COLS) / 2, y0 = 1030;
    for (var r = 0; r < LIGNES; r++) for (var c = 0; c < COLS; c++) {
      var cx = x0 + cell * (c + 0.5), cy = y0 + cell * (r + 0.5), lv = m.rows[r] && m.rows[r][c];
      if (lv) { var o = opts.orb(Math.min(12, lv), 82); g.drawImage(o.canvas, cx - o.S / 2, cy - o.S / 2); }
      else { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.stroke(); }
    }
    g.fillStyle = '#d6d0f2'; g.font = '600 46px ' + BODY; g.fillText(m.detail, W / 2, 1640);
    if (m.serie) {
      g.font = '700 44px ' + DISP; var sw = g.measureText(m.serie).width;
      flamme(g, W / 2 - sw / 2 - 64, 1678, 52, acc); g.fillStyle = acc; g.textAlign = 'left'; g.fillText(m.serie, W / 2 - sw / 2, 1722); g.textAlign = 'center';
    }
    g.font = '700 36px ' + DISP; var uw = g.measureText(m.url).width + 72;
    pill(g, W / 2 - uw / 2, 1786, uw, 74); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.22)'; g.stroke();
    g.fillStyle = '#f1ecff'; g.fillText(m.url, W / 2, 1836);
  }

  function telecharger(blob, nom) {
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    return 'fichier';
  }
  /** Promesse 'partage' | 'fichier' | null (annulé). opts = draw() + { text } (texte de defi.js joint à l'image). */
  function share(m, opts) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var polices = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('900 100px Unbounded'), document.fonts.load('700 40px Unbounded'), document.fonts.load('600 40px "Instrument Sans"')]).catch(function () {}) : Promise.resolve();
    return polices.then(function () {
      draw(c.getContext('2d'), m, opts);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    }).then(function (blob) {
      if (!blob) return null;
      var f = typeof File === 'function' ? new File([blob], m.fichier, { type: 'image/png' }) : null, nav = navigator;
      if (f && nav.share && nav.canShare && nav.canShare({ files: [f] })) {
        return nav.share({ files: [f], text: opts.text }).then(function () { return 'partage'; },
          function (e) { return e && e.name === 'AbortError' ? null : telecharger(blob, m.fichier); });
      }
      return telecharger(blob, m.fichier);
    });
  }

  return { W: W, H: H, model: model, draw: draw, share: share };
});
