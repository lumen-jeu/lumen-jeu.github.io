/* LUMEN — progression pure (aucune dépendance DOM) : sauvegarde, économie, missions,
 * événement de la semaine, série quotidienne, succès, rang, thèmes, partage.
 * Portage exact : android/.../game/Progression.kt (mêmes nombres, même code de sauvegarde).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./defi.js'));
  else root.LumenProgress = factory(root.LumenEngine, root.Defi);
})(typeof self !== 'undefined' ? self : this, function (E, D) {
  'use strict';
  /** Texte affiché : traduit par i18n.js dans la page ; tel quel (français) sous Node et dans les tests. */
  function T(fr) {
    if (typeof I18N !== 'undefined') return I18N.t.apply(null, arguments);
    var a = arguments; return String(fr).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1] == null ? m : a[+i + 1]; });
  }

  /* ================= Dates (entiers uniquement) ================= */
  /** Nombre de jours depuis le 1970-01-01 pour une date civile (algorithme de H. Hinnant). */
  function dayNumber(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function dayFromSeed(seed) { return dayNumber(Math.floor(seed / 10000), Math.floor(seed / 100) % 100, seed % 100); }
  /** Jour du jeu = date de Paris : un seul « jour » pour la série d'ouverture, les missions, l'événement et le défi. */
  function today(d) { return D.today(d).day; }
  /** Défi du jour figé au lancement : date de Paris (num AAAAMMJJ → S.daily.seed) + graine commune aux 4 jeux. */
  function dailyFor(d) { var t = D.today(d); t.seed = D.seed('lumen', t.key); return t; }
  /** Millisecondes avant le prochain défi (minuit heure de Paris, été comme hiver). */
  function msToNextDaily(d) {
    var now = d == null ? Date.now() : +d, t = D.parisDate(now), base = Date.UTC(t.y, t.m - 1, t.d + 1);
    return (D.parisDate(base - 2 * 3600000).key !== t.key ? base - 2 * 3600000 : base - 3600000) - now;
  }
  /** 0 = lundi … 6 = dimanche */
  function weekday(day) { return ((day + 3) % 7 + 7) % 7; }
  function weekStart(day) { return day - weekday(day); }
  var LUMEN_EPOCH = dayNumber(2026, 10, 1);
  /** Numéro du défi « LUMEN #N » */
  function puzzleNumber(day) { return day - LUMEN_EPOCH + 1; }

  /* ================= Économie ================= */
  var PRICES = { pulse: 90, hammer: 120, spark: 160, moves: 200 };
  var STREAK_REWARDS = [20, 30, 40, 50, 70, 90, 150]; // jour 7 : + 1 Étincelle
  /** Éclats gagnés en fin de partie. info = {mode, score, won, newStars, firstDaily} */
  function eclatsForGame(info) {
    switch (info.mode) {
      case 'adventure':
        if (!info.won) return 2;
        return info.newStars > 0 ? 8 + 6 * info.newStars : 5;
      case 'daily':
        return Math.min(60, Math.floor(info.score / 200)) + (info.firstDaily ? 15 : 0);
      case 'tutorial':
        return 0;
      default:
        return Math.min(60, Math.floor(info.score / 250));
    }
  }
  function xpForGame(info) {
    if (info.mode === 'tutorial') return 0;
    var xp = Math.min(80, Math.floor(info.score / 100));
    if (info.mode === 'adventure' && info.won) xp += 20 + 10 * info.newStars;
    return xp;
  }

  /* ================= Rang de lueur ================= */
  function xpForRank(n) { return 50 * n * (n - 1); }
  function rankFor(xp) { var n = 1; while (xp >= xpForRank(n + 1)) n++; return n; }
  var TITLES = [[1, 'Étincelle'], [3, 'Braise'], [5, 'Flammèche'], [8, 'Lanterne'], [12, 'Phare'], [16, 'Comète'], [20, 'Étoile filante'], [25, 'Nova'], [30, 'Supernova'], [40, 'Constellation']];
  function titleFor(rank) { var t = TITLES[0][1]; for (var i = 0; i < TITLES.length; i++) if (rank >= TITLES[i][0]) t = TITLES[i][1]; return T(t); }

  /* ================= Thèmes ================= */
  // levels : 12 paires [corps, lueur] ; bg : [nuit, haut, bas, plaque] ; accent
  var THEMES = [
    { id: 'nuit', name: 'Nuit Lumen', rank: 1, price: 0, accent: '#ffb627', bg: ['#100b29', '#1f1550', '#2b1a5e', '#ffffff'],
      levels: [['#6e3550', '#9c4a6a'], ['#e0482b', '#ff5a35'], ['#ff8a2a', '#ff8a2a'], ['#ffc23a', '#ffb627'], ['#b7e64a', '#a6ff4a'], ['#2fe0a6', '#2fffc0'], ['#2cc9f0', '#3fd8ff'], ['#3f7dff', '#4a8cff'], ['#9a5cff', '#a46bff'], ['#ff4fd8', '#ff5ce0'], ['#ffb3e6', '#ffd1f0'], ['#fff6e0', '#ffffff']] },
    { id: 'aurore', name: 'Aurore boréale', rank: 3, price: 400, accent: '#5cffb1', bg: ['#04161a', '#0b2b33', '#123b3a', '#c8fff0'],
      levels: [['#2b4a5a', '#556e7b'], ['#1fa37a', '#4cb595'], ['#b4e04a', '#c3e66e'], ['#2fd8d0', '#59e0d9'], ['#3f8cf0', '#65a3f3'], ['#7a5cf0', '#957df3'], ['#c05ff0', '#cd7ff3'], ['#ff6fb0', '#ff8cc0'], ['#ffd36a', '#ffdc88'], ['#5cffb1', '#7dffc1'], ['#e0d0ff', '#e6d9ff'], ['#f6fffb', '#f8fffc']] },
    { id: 'braises', name: 'Braises', rank: 6, price: 700, accent: '#ff9a3c', bg: ['#160a07', '#2a120b', '#3a1a0c', '#ffd9b8'],
      levels: [['#5a2a26', '#7b5551'], ['#c0301c', '#cd5949'], ['#ff7a1c', '#ff9549'], ['#ffc23a', '#ffce61'], ['#fff08a', '#fff3a1'], ['#ff5a6e', '#ff7b8b'], ['#d02a6a', '#d95588'], ['#8a3aa0', '#a161b3'], ['#ff9ad0', '#ffaed9'], ['#ffe0b0', '#ffe6c0'], ['#fff4dc', '#fff6e3'], ['#ffffff', '#ffffff']] },
    { id: 'abysses', name: 'Abysses', rank: 10, price: 1000, accent: '#3ff0ff', bg: ['#020a18', '#06183a', '#0a2350', '#b8f4ff'],
      levels: [['#24305e', '#50597e'], ['#1a7a96', '#4895ab'], ['#3a6cf0', '#6189f3'], ['#2fe0d0', '#59e6d9'], ['#8cf06a', '#a3f388'], ['#4a3ad0', '#6e61d9'], ['#b06cff', '#c089ff'], ['#3fd8ff', '#65e0ff'], ['#ff7ad0', '#ff95d9'], ['#ffe27a', '#ffe895'], ['#c8fff4', '#d3fff6'], ['#f2fdff', '#f5fdff']] },
    { id: 'aube', name: 'Aube rosée', rank: 15, price: 1400, accent: '#ffb3c7', bg: ['#22102a', '#3a1a3f', '#4a2140', '#ffe6ef'],
      levels: [['#6a4a6c', '#886e89'], ['#e8789a', '#ed93ae'], ['#f2a97a', '#f5ba95'], ['#f5dc8a', '#f7e3a1'], ['#a8dca0', '#b9e3b3'], ['#8ac8e8', '#a1d3ed'], ['#b4a0f0', '#c3b3f3'], ['#ff9ab8', '#ffaec6'], ['#ffc28f', '#ffcea5'], ['#d0f0c8', '#d9f3d3'], ['#fff0f6', '#fff3f8'], ['#fffaf4', '#fffbf6']] }
  ];
  function themeById(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }

  /* ================= Sauvegarde ================= */
  function newSave() {
    return {
      v: 2, ec: 0, xp: 0,
      inv: { pulse: 0, hammer: 0, spark: 0, moves: 0 },
      adv: [],
      best: 0, bestLv: 3,
      stats: { games: 0, merges: 0, longest: 0, maxLv: 3, stones: 0, ice: 0, prisms: 0, blasts: 0, bombs: 0, dailies: 0, advWins: 0 },
      streak: { last: -1, count: 0, best: 0 },
      ach: {},
      themes: ['nuit'], theme: 'nuit',
      mis: { day: -1, p: [0, 0, 0], done: [0, 0, 0] },
      ev: { week: -1, best: 0, claimed: 0 },
      daily: { seed: 0, best: 0, plays: 0 },
      set: { snd: 1, mus: 0, vib: 1 },
      tuto: 0, seen: []
    };
  }
  /** Complète une sauvegarde partielle / ancienne avec les valeurs par défaut. */
  function normalize(s) {
    var d = newSave();
    if (!s || typeof s !== 'object') return d;
    function merge(dst, src) {
      for (var k in dst) {
        if (!(k in src)) continue;
        var a = dst[k], b = src[k];
        if (a && typeof a === 'object' && !Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) {
          if (k === 'ach') { for (var x in b) if (typeof b[x] === 'number') a[x] = b[x]; }
          else merge(a, b);
        } else if (Array.isArray(a) ? Array.isArray(b) : typeof a === typeof b) dst[k] = b;
      }
    }
    merge(d, s);
    // Bornes (mêmes que Save.fromMap côté Android) : un code LUMEN2 se forge (FNV sans clé),
    // xp = 1e300 figeait rankFor, adv = ['<img…>'] finissait en innerHTML.
    (function clean(dst, def) {
      for (var k in def) {
        if (typeof def[k] === 'number') dst[k] = bound(dst[k], Math.min(0, def[k]), MAX_VAL, def[k]);
        else if (k !== 'ach' && def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) clean(dst[k], def[k]);
      }
    })(d, newSave());
    for (var x in d.ach) d.ach[x] = bound(d.ach[x], 0, 3, 0);
    d.adv = d.adv.slice(0, MAX_ADV).map(function (n) { return bound(n, 0, 3, 0); });
    d.mis.p = [0, 1, 2].map(function (i) { return bound(d.mis.p[i], 0, MAX_VAL, 0); });
    d.mis.done = [0, 1, 2].map(function (i) { return bound(d.mis.done[i], 0, 1, 0); });
    d.themes = d.themes.filter(function (t) { return typeof t === 'string'; });
    d.seen = d.seen.filter(function (t) { return typeof t === 'string'; });
    if (d.themes.indexOf('nuit') < 0) d.themes.unshift('nuit');
    return d;
  }
  var MAX_VAL = 1000000000, MAX_ADV = 10000;
  /** Entier fini dans [lo, hi], sinon d. */
  function bound(v, lo, hi, d) { return typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : d; }

  /* ---------- Codec texte (UTF-8 → base64url + somme de contrôle FNV-1a) ---------- */
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) { c = 0x10000 + ((c - 0xd800) << 10) + (str.charCodeAt(++i) - 0xdc00); }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function fromUtf8(b) {
    var s = '', i = 0;
    while (i < b.length) {
      var c = b[i++];
      if (c >= 0xf0) c = ((c & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
      else if (c >= 0xe0) c = ((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
      else if (c >= 0xc0) c = ((c & 31) << 6) | (b[i++] & 63);
      if (c >= 0x10000) { c -= 0x10000; s += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 1023)); }
      else s += String.fromCharCode(c);
    }
    return s;
  }
  function b64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
      if (i + 1 < bytes.length) s += B64[(n >> 6) & 63];
      if (i + 2 < bytes.length) s += B64[n & 63];
    }
    return s;
  }
  function unb64(s) {
    var out = [], buf = 0, bits = 0;
    for (var i = 0; i < s.length; i++) {
      var v = B64.indexOf(s[i]);
      if (v < 0) return null;
      buf = (buf << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); }
    }
    return out;
  }
  function fnv(bytes) {
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193); }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8);
  }
  function exportCode(save) {
    var bytes = utf8(JSON.stringify(save));
    return 'LUMEN2.' + b64(bytes) + '.' + fnv(bytes);
  }
  /** Retourne la sauvegarde ou null si le code est invalide. */
  function importCode(code) {
    if (typeof code !== 'string') return null;
    var m = code.replace(/\s+/g, '').split('.');
    if (m.length !== 3 || m[0] !== 'LUMEN2') return null;
    var bytes = unb64(m[1]);
    if (!bytes || fnv(bytes) !== m[2].toLowerCase()) return null;
    try {
      var o = JSON.parse(fromUtf8(bytes));
      if (!o || o.v !== 2) return null;
      return normalize(o);
    } catch (e) { return null; }
  }

  /* ================= Missions du jour ================= */
  // [id, texte (# = cible), cibles par palier, cumul (true) ou maximum (false)]
  var MISSIONS = [
    ['merges', 'Réaliser # fusions', [40, 60, 90], true],
    ['chain', 'Tracer une chaîne de # orbes', [5, 6, 7], false],
    ['level', 'Créer une orbe de niveau #', [8, 9, 10], false],
    ['score', 'Marquer # points en une partie', [2000, 3500, 5000], false],
    ['adv', 'Réussir # niveaux d\'Aventure', [2, 3, 4], true],
    ['stars', 'Gagner # étoiles', [2, 4, 6], true],
    ['daily', 'Jouer le Défi du jour', [1, 1, 1], true],
    ['games', 'Terminer # parties', [2, 3, 5], true],
    ['stones', 'Briser # pierres', [8, 15, 25], true],
    ['bomb', 'Créer # bombes', [2, 3, 4], true]
  ];
  var MISSION_REWARD = [40, 60, 80];
  function missionsFor(day) {
    var rng = new E.Rng(day * 97 + 13), out = [], used = {};
    while (out.length < 3) {
      var i = rng.int(MISSIONS.length);
      if (used[i]) continue;
      used[i] = true;
      var tier = rng.int(3), t = MISSIONS[i];
      out.push({ id: t[0], tier: tier, target: t[2][tier], sum: t[3], text: T(t[1]).replace('#', fmtInt(t[2][tier])), reward: MISSION_REWARD[tier] });
    }
    return out;
  }
  function fmtInt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* ================= Événement de la semaine ================= */
  var EVENTS = [
    { id: 'glace', name: 'Semaine de la Glace', desc: 'Des orbes gelées tombent du ciel. Fusionnez à côté pour les libérer.', rules: { ir: 70, ih: 1 }, goal: 3000, hue: '#6fe3ff' },
    { id: 'prismes', name: 'Semaine des Prismes', desc: 'Les prismes jokers sont six fois plus fréquents.', rules: { pr: 50 }, goal: 4000, hue: '#ff7ae6' },
    { id: 'pierres', name: 'Semaine des Pierres', desc: 'Des pierres tombent avec les orbes. Chacune brisée rapporte 25 points.', rules: { sr: 35 }, goal: 3000, hue: '#d6b48a' },
    { id: 'supernova', name: 'Semaine des Supernovas', desc: 'Le saut de deux niveaux arrive dès 4 orbes.', rules: { longAt: 4 }, goal: 6000, hue: '#ffd36a' },
    { id: 'bombes', name: 'Semaine des Bombes', desc: 'Une chaîne de 5 orbes crée déjà une bombe.', rules: { bombAt: 5 }, goal: 5000, hue: '#ff6a4a' },
    { id: 'sprint', name: 'Semaine du Sprint', desc: '30 coups seulement, prismes plus fréquents. Visez juste.', rules: { pr: 25 }, moves: 30, goal: 2500, hue: '#7cff9a' }
  ];
  var EVENT_REWARD = 150;
  function eventFor(day) {
    var w = weekStart(day);
    var idx = ((Math.floor(w / 7) * 5 + 3) % EVENTS.length + EVENTS.length) % EVENTS.length;
    var e = EVENTS[idx];
    return { id: e.id, name: T(e.name), desc: T(e.desc), rules: e.rules, moves: e.moves || 0, goal: e.goal, hue: e.hue, week: w, endsIn: 7 - weekday(day) };
  }

  /* ================= Succès ================= */
  // [id, nom, description (#), seuils bronze/argent/or, clé de valeur]
  var ACH = [
    ['fusions', 'Forgeron de lumière', '# fusions au total', [100, 1000, 10000]],
    ['chaine', 'Long filament', 'Une chaîne de # orbes', [6, 8, 10]],
    ['niveau', 'Vers le blanc', 'Atteindre le niveau #', [9, 11, 13]],
    ['record', 'Haute intensité', '# points en Classique', [5000, 20000, 60000]],
    ['etoiles', 'Cartographe', '# étoiles en Aventure', [30, 150, 360]],
    ['parties', 'Veilleur', '# parties jouées', [10, 100, 500]],
    ['serie', 'Fidèle au ciel', 'Une série de # jours', [3, 7, 30]],
    ['pierres', 'Tailleur de pierre', '# pierres brisées', [50, 300, 1000]],
    ['glace', 'Dégel', '# orbes libérées de la glace', [50, 300, 1000]],
    ['bombes', 'Artificier', '# bombes déclenchées', [5, 40, 150]],
    ['defis', 'Rendez-vous quotidien', '# défis du jour joués', [3, 15, 60]]
  ];
  var ACH_REWARD = [[40, 50], [100, 120], [250, 300]]; // [éclats, xp] par palier
  function starsTotal(s) { var t = 0; for (var i = 0; i < s.adv.length; i++) t += s.adv[i] || 0; return t; }
  function achValue(s, id) {
    switch (id) {
      case 'fusions': return s.stats.merges;
      case 'chaine': return s.stats.longest;
      case 'niveau': return s.stats.maxLv;
      case 'record': return s.best;
      case 'etoiles': return starsTotal(s);
      case 'parties': return s.stats.games;
      case 'serie': return s.streak.best;
      case 'pierres': return s.stats.stones;
      case 'glace': return s.stats.ice;
      case 'bombes': return s.stats.blasts;
      case 'defis': return s.stats.dailies;
    }
    return 0;
  }
  function achievements(s) {
    return ACH.map(function (a) {
      var v = achValue(s, a[0]), tier = s.ach[a[0]] || 0;
      var next = tier < 3 ? a[3][tier] : a[3][2];
      return { id: a[0], name: T(a[1]), desc: T(a[2]).replace('#', fmtInt(next)), tier: tier, value: v, next: next, tiers: a[3] };
    });
  }

  /* ================= Moteur de progression ================= */
  function addXp(s, xp, out) {
    var before = rankFor(s.xp);
    s.xp += xp;
    var after = rankFor(s.xp);
    for (var r = before + 1; r <= after; r++) {
      out.push({ kind: 'rank', rank: r, text: T('Rang {0} : {1}', r, titleFor(r)) });
      for (var i = 0; i < THEMES.length; i++)
        if (THEMES[i].rank === r && s.themes.indexOf(THEMES[i].id) < 0) {
          s.themes.push(THEMES[i].id);
          out.push({ kind: 'theme', id: THEMES[i].id, text: T('Thème débloqué : {0}', T(THEMES[i].name)) });
        }
    }
  }
  function ensureMissions(s, day) {
    if (s.mis.day !== day) s.mis = { day: day, p: [0, 0, 0], done: [0, 0, 0] };
    return missionsFor(day);
  }
  function bumpMission(s, day, id, value, out) {
    var ms = ensureMissions(s, day);
    for (var i = 0; i < 3; i++) {
      var m = ms[i];
      if (m.id !== id || s.mis.done[i]) continue;
      s.mis.p[i] = m.sum ? s.mis.p[i] + value : Math.max(s.mis.p[i], value);
      if (s.mis.p[i] >= m.target) {
        s.mis.p[i] = m.target; s.mis.done[i] = 1;
        s.ec += m.reward;
        out.push({ kind: 'mission', text: T('Mission accomplie : {0}', m.text), ec: m.reward });
        addXp(s, 50, out);
      }
    }
  }
  function checkAch(s, out) {
    for (var i = 0; i < ACH.length; i++) {
      var a = ACH[i], v = achValue(s, a[0]), tier = s.ach[a[0]] || 0;
      while (tier < 3 && v >= a[3][tier]) {
        var rw = ACH_REWARD[tier];
        tier++;
        s.ach[a[0]] = tier;
        s.ec += rw[0];
        out.push({ kind: 'ach', tier: tier, text: T(a[1]) + T(tier === 1 ? ' (bronze)' : tier === 2 ? ' (argent)' : ' (or)'), ec: rw[0] });
        addXp(s, rw[1], out);
      }
    }
  }

  /** Rattrape les succès déjà mérités (sauvegarde importée, migration). */
  function syncAch(s) { var out = []; checkAch(s, out); return out; }

  /** Après chaque chaîne. info = {len, level, stones, ice, prisms, blasts, bomb} */
  function onChain(s, day, info) {
    var out = [];
    s.stats.merges++;
    if (info.len > s.stats.longest) s.stats.longest = info.len;
    if (info.level > s.stats.maxLv) s.stats.maxLv = info.level;
    if (info.level > s.bestLv) s.bestLv = info.level;
    s.stats.stones += info.stones || 0;
    s.stats.ice += info.ice || 0;
    s.stats.prisms += info.prisms || 0;
    s.stats.blasts += info.blasts || 0;
    if (info.bomb) s.stats.bombs++;
    bumpMission(s, day, 'merges', 1, out);
    bumpMission(s, day, 'chain', info.len, out);
    bumpMission(s, day, 'level', info.level, out);
    if (info.stones) bumpMission(s, day, 'stones', info.stones, out);
    if (info.bomb) bumpMission(s, day, 'bomb', 1, out);
    checkAch(s, out);
    return out;
  }

  /**
   * Fin de partie. info = {mode, score, peak, won, stars, levelN, eventWeek, dailySeed}
   * Retourne {ec, xp, newStars, events:[...]}.
   */
  function onGameEnd(s, day, info) {
    var out = [], newStars = 0, firstDaily = false;
    s.stats.games++;
    if (info.mode === 'classic' && info.score > s.best) s.best = info.score;
    if (info.mode === 'adventure' && info.won) {
      var i = info.levelN - 1;
      while (s.adv.length <= i) s.adv.push(0);
      var prev = s.adv[i] || 0;
      if (info.stars > prev) { newStars = info.stars - prev; s.adv[i] = info.stars; }
      s.stats.advWins++;
    }
    if (info.mode === 'daily') {
      if (s.daily.seed !== info.dailySeed) s.daily = { seed: info.dailySeed, best: 0, plays: 0 };
      firstDaily = s.daily.plays === 0;
      s.daily.plays++;
      if (info.score > s.daily.best) s.daily.best = info.score;
      s.stats.dailies++;
    }
    if (info.mode === 'event') {
      var ev = eventFor(day);
      if (s.ev.week !== ev.week) s.ev = { week: ev.week, best: 0, claimed: 0 };
      if (info.score > s.ev.best) s.ev.best = info.score;
      if (!s.ev.claimed && s.ev.best >= ev.goal) {
        s.ev.claimed = 1; s.ec += EVENT_REWARD;
        out.push({ kind: 'event', text: T('{0} : objectif atteint', ev.name), ec: EVENT_REWARD });
      }
    }
    var gi = { mode: info.mode, score: info.score, won: info.won, newStars: newStars, firstDaily: firstDaily };
    var ec = eclatsForGame(gi), xp = xpForGame(gi);
    s.ec += ec;
    addXp(s, xp, out);
    if (info.mode !== 'tutorial') {
      bumpMission(s, day, 'games', 1, out);
      bumpMission(s, day, 'score', info.score, out);
      if (info.mode === 'adventure' && info.won) bumpMission(s, day, 'adv', 1, out);
      if (newStars) bumpMission(s, day, 'stars', newStars, out);
      if (info.mode === 'daily') bumpMission(s, day, 'daily', 1, out);
    }
    checkAch(s, out);
    return { ec: ec, xp: xp, newStars: newStars, events: out };
  }

  /* ================= Série quotidienne ================= */
  /** À l'ouverture de l'appli. Retourne null si déjà comptée aujourd'hui, sinon la récompense. */
  function checkIn(s, day) {
    if (s.streak.last === day) return null;
    var out = [];
    var broke = s.streak.last >= 0 && s.streak.last !== day - 1;
    s.streak.count = s.streak.last === day - 1 ? s.streak.count + 1 : 1;
    s.streak.last = day;
    if (s.streak.count > s.streak.best) s.streak.best = s.streak.count;
    var slot = (s.streak.count - 1) % 7;
    var ec = STREAK_REWARDS[slot];
    s.ec += ec;
    var bonus = slot === 6;
    if (bonus) s.inv.spark++;
    addXp(s, 20, out);
    checkAch(s, out);
    return { day: slot + 1, ec: ec, spark: bonus, broke: broke, count: s.streak.count, events: out };
  }
  /** Bandeau 7 jours : [{n, ec, state:'done'|'today'|'next'}] */
  function streakStrip(s, day) {
    var count = s.streak.last === day ? s.streak.count : s.streak.last === day - 1 ? s.streak.count : 0;
    var checkedToday = s.streak.last === day;
    var slot = checkedToday ? (count - 1) % 7 : count % 7; // position d'aujourd'hui
    var out = [];
    for (var i = 0; i < 7; i++) out.push({ n: i + 1, ec: STREAK_REWARDS[i], spark: i === 6, state: i < slot ? 'done' : i === slot ? (checkedToday ? 'today' : 'next') : 'next' });
    return out;
  }

  /* ================= Boutique ================= */
  function buy(s, item) {
    var p = PRICES[item];
    if (!p || s.ec < p) return false;
    s.ec -= p; s.inv[item]++;
    return true;
  }
  function buyTheme(s, id) {
    var t = themeById(id);
    if (t.id !== id || s.themes.indexOf(id) >= 0 || s.ec < t.price) return false;
    s.ec -= t.price; s.themes.push(id);
    return true;
  }

  /* ================= Partage du défi ================= */
  var SQUARES = ['⬛', '🟫', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
  /** niveau créé → carré : 2 brun, 3 rouge, 4 orange, 5 jaune, 6 vert, 7-8 bleu, 9-10 violet, 11+ blanc */
  function squareFor(lv) {
    if (lv <= 1) return SQUARES[0];
    if (lv === 2) return SQUARES[1];
    if (lv === 3) return SQUARES[2];
    if (lv === 4) return SQUARES[3];
    if (lv === 5) return SQUARES[4];
    if (lv === 6) return SQUARES[5];
    if (lv <= 8) return SQUARES[6];
    if (lv <= 10) return SQUARES[7];
    return SQUARES[8];
  }
  var URL = 'https://lumen-jeu.github.io/';
  /** Texte commun aux 4 jeux (defi.js) : titre, grille de carrés (8 par ligne, 5 lignes = 40 coups), détail, série, lien. */
  function shareDaily(day, score, history, peak, longest, serie) {
    var pal = {}; history.forEach(function (lv) { pal[lv] = squareFor(lv); });
    return D.shareText({ nom: 'LUMEN', n: puzzleNumber(day), emoji: '✨', score: fmtInt(score), serie: serie || 0, url: URL, libelleSerie: T('{0} jours de suite'),
      lignes: D.grid(history, pal, 8), detail: T('Niveau max {0}, chaîne de {1}', peak, longest) });
  }

  return {
    dayNumber: dayNumber, dayFromSeed: dayFromSeed, today: today, dailyFor: dailyFor, msToNextDaily: msToNextDaily, URL: URL, weekday: weekday, weekStart: weekStart, puzzleNumber: puzzleNumber,
    PRICES: PRICES, STREAK_REWARDS: STREAK_REWARDS, MISSION_REWARD: MISSION_REWARD, EVENT_REWARD: EVENT_REWARD, ACH_REWARD: ACH_REWARD,
    eclatsForGame: eclatsForGame, xpForGame: xpForGame,
    xpForRank: xpForRank, rankFor: rankFor, titleFor: titleFor, TITLES: TITLES,
    THEMES: THEMES, themeById: themeById,
    newSave: newSave, normalize: normalize, exportCode: exportCode, importCode: importCode, fnv: fnv, utf8: utf8,
    missionsFor: missionsFor, ensureMissions: ensureMissions, EVENTS: EVENTS, eventFor: eventFor,
    ACH: ACH, achievements: achievements, starsTotal: starsTotal,
    syncAch: syncAch, onChain: onChain, onGameEnd: onGameEnd, checkIn: checkIn, streakStrip: streakStrip,
    buy: buy, buyTheme: buyTheme, squareFor: squareFor, shareDaily: shareDaily, fmtInt: fmtInt
  };
});
