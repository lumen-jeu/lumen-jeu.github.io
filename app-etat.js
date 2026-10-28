/* LUMEN — interface (1/8) : raccourcis, icônes SVG, sauvegarde lumen.save2, thème et couleurs.
   Scripts classiques en portée globale partagée, chargés dans l'ordre de index.html (voir ARCHITECTURE.md, 1 bis). */
'use strict';
  var E = window.LumenEngine, P = window.LumenProgress, A = window.LumenAudio, D = window.Defi, I = window.I18N;
  var tr = I.t, trn = I.tn; // textes : français dans le code, anglais dans i18n.js
  I.apply(document);
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
  // Mode calme : aucune série affichée ni partagée (classe `calm` sur <html>, voir style.css)
  function applyCalm() { document.documentElement.classList.toggle('calm', !!S.set.calm); }
  function serieDefi(jour) { return S.set.calm ? 0 : D.serie('lumen', jour); }
  applyCalm();
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

