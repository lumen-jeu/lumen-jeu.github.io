/* LUMEN — moteur de jeu pur (aucune dépendance DOM).
 * Utilisable dans le navigateur (window.LumenEngine) et dans Node (require).
 * Toute la logique doit rester identique à android/.../GameEngine.kt.
 *
 * Grille : grid[r][c] = niveau d'orbe (1..), 0 = vide, PRISM = joker, STONE = pierre.
 * Modificateurs : mods[r][c] = 0, ICE1 / ICE2 (orbe prise dans la glace), BOMB (orbe-bombe).
 * Sans orbes spéciales, le tirage aléatoire est identique à la v1 (défi du jour inchangé).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LumenEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLS = 6;
  var ROWS = 8;
  var DAILY_MOVES = 40;
  var SPAWN_WEIGHTS = [64, 40, 25, 16, 10, 6, 4, 3];
  var MIN_SPAWN = 4;
  var MAX_SPAWN = 8;

  var PRISM = 90;
  var STONE = 91;
  var ICE1 = 1, ICE2 = 2, BOMB = 3;
  var STONE_POINTS = 25;
  var CLASSIC_PRISM_RATE = 8; // pour mille : prismes rares en Classique

  /* ---------- RNG déterministe : mulberry32 ---------- */
  function Rng(seed) { this.state = seed | 0; }
  Rng.prototype.next = function () {
    var a = (this.state = (this.state + 0x6d2b79f5) | 0);
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Rng.prototype.int = function (n) { return Math.floor(this.next() * n); };

  function dateSeed(d) {
    d = d || new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  /* ---------- Règles de base ---------- */
  function maxSpawnFor(bestLevel) { return Math.max(MIN_SPAWN, Math.min(MAX_SPAWN, bestLevel - 2)); }

  function spawnLevel(rng, maxSpawn) {
    var total = 0, i;
    for (i = 0; i < maxSpawn; i++) total += SPAWN_WEIGHTS[i];
    var r = rng.int(total);
    for (i = 0; i < maxSpawn; i++) {
      if (r < SPAWN_WEIGHTS[i]) return i + 1;
      r -= SPAWN_WEIGHTS[i];
    }
    return 1;
  }

  function isAdjacent(a, b) {
    var dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c);
    return (dr | dc) !== 0 && dr <= 1 && dc <= 1;
  }

  function isOrb(v) { return v >= 1 && v < PRISM; }
  function modAt(mods, r, c) { return mods ? mods[r][c] : 0; }
  function isFrozen(m) { return m === ICE1 || m === ICE2; }
  /** Une case peut-elle entrer dans une chaîne ? */
  function chainable(v, m) { return (isOrb(v) && !isFrozen(m)) || v === PRISM; }
  /** Deux cases voisines peuvent-elles être reliées ? */
  function linkable(a, ma, b, mb) {
    if (!chainable(a, ma) || !chainable(b, mb)) return false;
    if (a === PRISM && b === PRISM) return false;
    return a === PRISM || b === PRISM || a === b;
  }

  /** Niveau d'une chaîne (premier non-prisme), 0 si aucune orbe réelle. */
  function chainLevel(grid, chain) {
    for (var i = 0; i < chain.length; i++) {
      var v = grid[chain[i].r][chain[i].c];
      if (isOrb(v)) return v;
    }
    return 0;
  }

  /** Vérifie qu'une chaîne [{r,c},...] est jouable sur la grille. */
  function isValidChain(grid, chain, mods) {
    if (!chain || chain.length < 2) return false;
    var level = 0, seen = {};
    for (var i = 0; i < chain.length; i++) {
      var p = chain[i];
      if (p.r < 0 || p.r >= ROWS || p.c < 0 || p.c >= COLS) return false;
      var key = p.r * COLS + p.c;
      if (seen[key]) return false;
      seen[key] = true;
      var v = grid[p.r][p.c];
      if (!chainable(v, modAt(mods, p.r, p.c))) return false;
      if (v !== PRISM) {
        if (!level) level = v;
        else if (v !== level) return false;
      }
      if (i > 0 && !isAdjacent(chain[i - 1], p)) return false;
    }
    return level > 0;
  }

  function mergeLevel(level, length, longAt) {
    return length >= (longAt || 5) ? level + 2 : level + 1;
  }
  function lengthMultiplier100(length) { return 100 + (length - 2) * 50; }
  function chainScore(level, length) {
    return Math.floor((length * Math.pow(2, level) * lengthMultiplier100(length)) / 100);
  }

  function hasMoves(grid, mods) {
    for (var r = 0; r < ROWS; r++)
      for (var c = 0; c < COLS; c++) {
        var v = grid[r][c], m = modAt(mods, r, c);
        if (!chainable(v, m)) continue;
        if (c + 1 < COLS && linkable(v, m, grid[r][c + 1], modAt(mods, r, c + 1))) return true;
        if (r + 1 < ROWS) {
          if (linkable(v, m, grid[r + 1][c], modAt(mods, r + 1, c))) return true;
          if (c + 1 < COLS && linkable(v, m, grid[r + 1][c + 1], modAt(mods, r + 1, c + 1))) return true;
          if (c - 1 >= 0 && linkable(v, m, grid[r + 1][c - 1], modAt(mods, r + 1, c - 1))) return true;
        }
      }
    return false;
  }

  /** Trouve une paire jouable (indice). Retourne [{r,c},{r,c}] ou null. */
  function findHint(grid, mods) {
    for (var r = 0; r < ROWS; r++)
      for (var c = 0; c < COLS; c++) {
        var v = grid[r][c], m = modAt(mods, r, c);
        if (!chainable(v, m)) continue;
        for (var dr = -1; dr <= 1; dr++)
          for (var dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            var rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && linkable(v, m, grid[rr][cc], modAt(mods, rr, cc))) {
              // la paire doit contenir une vraie orbe en tête si possible
              if (v === PRISM) return [{ r: rr, c: cc }, { r: r, c: c }];
              return [{ r: r, c: c }, { r: rr, c: cc }];
            }
          }
      }
    return null;
  }

  /**
   * Chaîne gloutonne déterministe : depuis chaque case (ordre ligne par ligne), on avance
   * vers le premier voisin compatible (ordre fixe des 8 directions). Garde la plus longue.
   * Sert d'indice "riche" et de référence de parité JS/Kotlin.
   */
  var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  function greedyChain(grid, mods) {
    var best = null;
    for (var r = 0; r < ROWS; r++)
      for (var c = 0; c < COLS; c++) {
        var v = grid[r][c];
        if (!isOrb(v) || isFrozen(modAt(mods, r, c))) continue;
        var ch = [{ r: r, c: c }], seen = {}, cur = { r: r, c: c };
        seen[r * COLS + c] = true;
        for (;;) {
          var nx = null;
          for (var k = 0; k < 8 && !nx; k++) {
            var rr = cur.r + DIRS[k][0], cc = cur.c + DIRS[k][1];
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || seen[rr * COLS + cc]) continue;
            var w = grid[rr][cc], wm = modAt(mods, rr, cc);
            if (chainable(w, wm) && (w === v || w === PRISM)) nx = { r: rr, c: cc };
          }
          if (!nx) break;
          ch.push(nx); seen[nx.r * COLS + nx.c] = true; cur = nx;
        }
        if (ch.length >= 2 && (!best || ch.length > best.length)) best = ch;
      }
    return best;
  }

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) {
      g.push([]);
      for (var c = 0; c < COLS; c++) g[r].push(0);
    }
    return g;
  }
  function cloneGrid(g) { return g.map(function (row) { return row.slice(); }); }

  /**
   * Tirage d'une nouvelle case. opts = {sr, pr, ir, ih} (taux pour mille : pierre, prisme, glace ; ih = coups de glace).
   * Les tirages supplémentaires n'ont lieu que si le taux correspondant est > 0.
   */
  function spawnCell(rng, maxSpawn, opts) {
    if (opts) {
      if (opts.sr > 0 && rng.int(1000) < opts.sr) return [STONE, 0];
      if (opts.pr > 0 && rng.int(1000) < opts.pr) return [PRISM, 0];
    }
    var lv = spawnLevel(rng, maxSpawn), m = 0;
    if (opts && opts.ir > 0 && rng.int(1000) < opts.ir) m = opts.ih === 2 ? ICE2 : ICE1;
    return [lv, m];
  }

  /**
   * Gravité + remplissage. Les cases vides valent 0. Les pierres et la glace tombent aussi.
   * Retourne les déplacements {c, fromR, toR, level, mod, spawned}.
   * Ordre de tirage : colonne 0→5, et dans chaque colonne de haut en bas.
   */
  function applyGravity(grid, rng, maxSpawn, mods, opts) {
    var moves = [];
    for (var c = 0; c < COLS; c++) {
      var write = ROWS - 1;
      for (var r = ROWS - 1; r >= 0; r--) {
        var v = grid[r][c];
        if (v) {
          if (write !== r) {
            grid[write][c] = v; grid[r][c] = 0;
            var m = 0;
            if (mods) { m = mods[r][c]; mods[write][c] = m; mods[r][c] = 0; }
            moves.push({ c: c, fromR: r, toR: write, level: v, mod: m, spawned: false });
          }
          write--;
        }
      }
      var missing = write + 1;
      for (var k = 0; k < missing; k++) {
        var cellv = spawnCell(rng, maxSpawn, opts);
        grid[k][c] = cellv[0];
        if (mods) mods[k][c] = cellv[1];
        moves.push({ c: c, fromR: k - missing, toR: k, level: cellv[0], mod: cellv[1], spawned: true });
      }
    }
    return moves;
  }

  /* ---------- Partie ---------- */
  function defaultRules() {
    return { longAt: 5, bombAt: 7, sr: 0, pr: 0, ir: 0, ih: 1 };
  }

  /**
   * mode : 'classic' | 'daily' | 'adventure' | 'event' | 'tutorial'
   * opts (facultatif) :
   *   - level : définition d'un niveau d'Aventure {n, seed, moves, goals:[[type,n]], st:[t2,t3], cfg:{...}}
   *   - rules : surcharge des règles (événement de la semaine)
   *   - moves : limite de coups
   *   - grid  : grille imposée (tutoriel)
   */
  function newGame(mode, seed, opts) {
    opts = opts || {};
    var level = opts.level || null;
    if (level) seed = level.seed;
    var rules = defaultRules();
    var k;
    if (mode === 'classic' || mode === 'event') rules.pr = CLASSIC_PRISM_RATE;
    var cfg = level ? level.cfg || {} : null;
    if (cfg) { rules.sr = cfg.sr || 0; rules.pr = cfg.pr || 0; rules.ir = cfg.ir || 0; rules.ih = cfg.ih || 1; if (cfg.ba) rules.bombAt = cfg.ba; }
    if (opts.rules) for (k in opts.rules) rules[k] = opts.rules[k];
    var moves = -1;
    if (mode === 'daily') moves = DAILY_MOVES;
    if (level) moves = level.moves;
    if (opts.moves) moves = opts.moves;
    var g = {
      mode: mode,
      seed: seed,
      rng: new Rng(seed),
      grid: emptyGrid(),
      mods: emptyGrid(),
      rules: rules,
      level: level,
      score: 0,
      bestLevel: 3,
      peak: 0,
      movesPlayed: 0,
      movesLeft: moves,
      pulseUsed: false,
      over: false,
      won: false,
      st: { stones: 0, ice: 0, prisms: 0, bombs: 0, blasts: 0, longest: 0, merges: 0 },
      history: []
    };
    if (opts.grid) {
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) g.grid[r][c] = opts.grid[r][c];
      if (opts.mods) for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) g.mods[r][c] = opts.mods[r][c];
    } else {
      fillFresh(g);
      if (cfg) placeSpecials(g, cfg);
    }
    return g;
  }

  function spawnOpts(g) {
    var R = g.rules;
    return R.sr || R.pr || R.ir ? R : null;
  }

  function fillFresh(g) {
    var tries = 0;
    do {
      for (var r = 0; r < ROWS; r++)
        for (var c = 0; c < COLS; c++) g.grid[r][c] = spawnLevel(g.rng, maxSpawnFor(g.bestLevel));
      tries++;
    } while (!hasMoves(g.grid) && tries < 50);
  }

  /** Place les obstacles initiaux d'un niveau : pierres (moitié basse), glace, prismes. */
  function placeSpecials(g, cfg) {
    var n, r, c, guard;
    var put = function (count, minRow, fn) {
      for (n = 0, guard = 0; n < count && guard < 500; guard++) {
        r = minRow + g.rng.int(ROWS - minRow); c = g.rng.int(COLS);
        if (isOrb(g.grid[r][c]) && !g.mods[r][c]) { fn(r, c); n++; }
      }
    };
    put(cfg.stones || 0, 3, function (r, c) { g.grid[r][c] = STONE; });
    put(cfg.ice || 0, 1, function (r, c) { g.mods[r][c] = cfg.ih === 2 ? ICE2 : ICE1; });
    put(cfg.prisms || 0, 0, function (r, c) { g.grid[r][c] = PRISM; });
    if (!hasMoves(g.grid, g.mods)) unstick(g);
  }

  /** Dernier recours : rend une paire jouable. */
  function unstick(g) {
    if (isOrb(g.grid[ROWS - 1][0]) && !g.mods[ROWS - 1][0] && isOrb(g.grid[ROWS - 1][1]) && !g.mods[ROWS - 1][1]) {
      g.grid[ROWS - 1][1] = g.grid[ROWS - 1][0];
      return;
    }
    for (var r = ROWS - 1; r >= 0; r--)
      for (var c = 0; c < COLS - 1; c++) {
        if (isOrb(g.grid[r][c]) && !g.mods[r][c] && isOrb(g.grid[r][c + 1]) && !g.mods[r][c + 1]) {
          g.grid[r][c + 1] = g.grid[r][c];
          return;
        }
      }
  }

  /* ---------- Objectifs ---------- */
  function goalValue(g, type) {
    switch (type) {
      case 'level': return g.peak;
      case 'score': return g.score;
      case 'stone': return g.st.stones;
      case 'ice': return g.st.ice;
      case 'prism': return g.st.prisms;
    }
    return 0;
  }
  /** [{type, target, value, done}] */
  function goalProgress(g) {
    if (!g.level) return [];
    return g.level.goals.map(function (q) {
      var v = goalValue(g, q[0]);
      return { type: q[0], target: q[1], value: Math.min(v, q[1]), done: v >= q[1] };
    });
  }
  function goalsDone(g) {
    if (!g.level) return false;
    for (var i = 0; i < g.level.goals.length; i++) if (goalValue(g, g.level.goals[i][0]) < g.level.goals[i][1]) return false;
    return true;
  }
  /** Étoiles : 1 pour la réussite, puis selon les coups restants (seuils st = [t2, t3]). */
  function starsFor(level, movesLeft) {
    if (!level) return 0;
    var st = level.st || [0, 0];
    return movesLeft >= st[1] ? 3 : movesLeft >= st[0] ? 2 : 1;
  }

  function checkEnd(g) {
    if (g.level && goalsDone(g)) { g.won = true; g.over = true; g.stars = starsFor(g.level, g.movesLeft); return; }
    var stuck = !hasMoves(g.grid, g.mods);
    if (g.movesLeft === 0 || (stuck && g.pulseUsed)) g.over = true;
  }

  /**
   * Joue une chaîne. Retourne null si invalide, sinon :
   * {level, newLevel, length, points, merged, target, removed, falls, hits:[{r,c,kind}], blasts:[{r,c,cells}], bomb, stuck, over, won}
   */
  function playChain(g, chain) {
    if (g.over || !isValidChain(g.grid, chain, g.mods)) return null;
    var grid = g.grid, mods = g.mods, R = g.rules;
    var level = chainLevel(grid, chain);
    var len = chain.length;
    var newLevel = mergeLevel(level, len, R.longAt);
    var points = chainScore(level, len);
    var last = chain[len - 1];
    var i, r, c, k;

    // bombes présentes dans la chaîne + prismes utilisés
    var bombs = [];
    for (i = 0; i < len; i++) {
      var p = chain[i];
      if (mods[p.r][p.c] === BOMB) bombs.push({ r: p.r, c: p.c });
      if (grid[p.r][p.c] === PRISM) g.st.prisms++;
    }

    // fusion
    var inChain = {};
    for (i = 0; i < len; i++) { inChain[chain[i].r * COLS + chain[i].c] = true; grid[chain[i].r][chain[i].c] = 0; mods[chain[i].r][chain[i].c] = 0; }
    grid[last.r][last.c] = newLevel;
    var makesBomb = len >= R.bombAt;
    if (makesBomb) { mods[last.r][last.c] = BOMB; g.st.bombs++; }

    // impacts orthogonaux : pierres brisées, glace fissurée (une fois par case)
    var hits = [], hitSeen = {};
    var ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (i = 0; i < len; i++) {
      for (k = 0; k < 4; k++) {
        r = chain[i].r + ORTHO[k][0]; c = chain[i].c + ORTHO[k][1];
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        var key = r * COLS + c;
        if (inChain[key] || hitSeen[key]) continue;
        if (grid[r][c] === STONE) {
          hitSeen[key] = true; grid[r][c] = 0; g.st.stones++; points += STONE_POINTS;
          hits.push({ r: r, c: c, kind: 'stone' });
        } else if (isFrozen(mods[r][c])) {
          hitSeen[key] = true;
          if (mods[r][c] === ICE2) { mods[r][c] = ICE1; hits.push({ r: r, c: c, kind: 'crack' }); }
          else { mods[r][c] = 0; g.st.ice++; hits.push({ r: r, c: c, kind: 'melt' }); }
        }
      }
    }

    // explosions 3×3
    var blasts = [];
    for (i = 0; i < bombs.length; i++) {
      var b = bombs[i], cells = [];
      g.st.blasts++;
      for (var dr = -1; dr <= 1; dr++)
        for (var dc = -1; dc <= 1; dc++) {
          r = b.r + dr; c = b.c + dc;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
          if (r === last.r && c === last.c) continue;
          var v = grid[r][c];
          if (!v) continue;
          if (v === STONE) { g.st.stones++; points += STONE_POINTS; }
          else if (v === PRISM) { g.st.prisms++; points += 16; }
          else {
            if (isFrozen(mods[r][c])) g.st.ice++;
            points += Math.pow(2, v) * 2;
          }
          cells.push({ r: r, c: c, level: v });
          grid[r][c] = 0; mods[r][c] = 0;
        }
      blasts.push({ r: b.r, c: b.c, cells: cells });
    }

    g.score += points;
    if (newLevel > g.bestLevel) g.bestLevel = newLevel;
    if (newLevel > g.peak) g.peak = newLevel;
    g.movesPlayed++;
    g.st.merges++;
    if (len > g.st.longest) g.st.longest = len;
    g.history.push(newLevel);
    if (g.movesLeft > 0) g.movesLeft--;

    var falls = applyGravity(grid, g.rng, maxSpawnFor(g.bestLevel), mods, spawnOpts(g));

    var target = { r: last.r, c: last.c };
    for (k = 0; k < falls.length; k++) {
      var f = falls[k];
      if (!f.spawned && f.c === last.c && f.fromR === last.r) { target = { r: f.toR, c: f.c }; break; }
    }

    checkEnd(g);
    var stuck = !hasMoves(grid, mods);

    return {
      level: level, newLevel: newLevel, length: len, points: points,
      merged: { r: last.r, c: last.c }, target: target,
      removed: chain.slice(0, len - 1), falls: falls,
      hits: hits, blasts: blasts, bomb: makesBomb,
      stuck: stuck, over: g.over, won: g.won
    };
  }

  /** Pulse : mélange les orbes libres. Gratuit une fois par partie ; booster=true pour un Pulse de l'inventaire. */
  function pulse(g, booster) {
    if (g.won || (g.over && !booster)) return false;
    if (!booster && g.pulseUsed) return false;
    if (booster && g.movesLeft === 0) return false;
    if (!booster) g.pulseUsed = true;
    g.over = false;
    var cells = [], flat = [], r, c, i;
    for (r = 0; r < ROWS; r++)
      for (c = 0; c < COLS; c++)
        if (g.grid[r][c] !== STONE && !g.mods[r][c]) { cells.push(r * COLS + c); flat.push(g.grid[r][c]); }
    var tries = 0;
    do {
      for (i = flat.length - 1; i > 0; i--) {
        var j = g.rng.int(i + 1);
        var t = flat[i]; flat[i] = flat[j]; flat[j] = t;
      }
      for (i = 0; i < flat.length; i++) g.grid[Math.floor(cells[i] / COLS)][cells[i] % COLS] = flat[i];
      tries++;
    } while (!hasMoves(g.grid, g.mods) && tries < 30);
    if (!hasMoves(g.grid, g.mods)) unstick(g);
    return true;
  }

  /** Marteau : retire une case (orbe, prisme ou pierre). Ne consomme pas de coup. */
  function hammer(g, r, c) {
    if (g.over || !g.grid[r][c]) return null;
    var v = g.grid[r][c];
    if (v === STONE) g.st.stones++;
    else if (isFrozen(g.mods[r][c])) g.st.ice++;
    g.grid[r][c] = 0; g.mods[r][c] = 0;
    var falls = applyGravity(g.grid, g.rng, maxSpawnFor(g.bestLevel), g.mods, spawnOpts(g));
    checkEnd(g);
    return { level: v, falls: falls, over: g.over, won: g.won };
  }

  /** Étincelle : fait monter une orbe d'un niveau (libère aussi la glace). */
  function spark(g, r, c) {
    if (g.over || !isOrb(g.grid[r][c])) return null;
    if (isFrozen(g.mods[r][c])) { g.mods[r][c] = 0; g.st.ice++; }
    var lv = ++g.grid[r][c];
    if (lv > g.bestLevel) g.bestLevel = lv;
    if (lv > g.peak) g.peak = lv;
    checkEnd(g);
    return { level: lv, over: g.over, won: g.won };
  }

  /** +5 coups (Aventure). */
  function addMoves(g, n) {
    if (g.movesLeft < 0) return false;
    g.movesLeft += n;
    if (g.over && !g.won) g.over = false;
    return true;
  }

  function isStuck(g) { return !hasMoves(g.grid, g.mods); }

  /** Représentation texte : chiffres base 36, P prisme, S pierre ; suffixes glace/bombe dans gridMods. */
  function gridString(g) {
    return g.grid.map(function (row, r) {
      return row.map(function (v, c) {
        var s = v === PRISM ? 'P' : v === STONE ? 'S' : v.toString(36);
        var m = g.mods[r][c];
        return m === ICE1 ? s + 'i' : m === ICE2 ? s + 'I' : m === BOMB ? s + 'b' : s;
      }).join('');
    }).join('/');
  }

  /* ---------- Constellations infinies (niveaux > 120) ---------- */
  var ENDLESS_FROM = 121;
  /** Niveau généré de façon déterministe à partir de son numéro (même résultat en Kotlin). */
  function endlessLevel(n) {
    var rng = new Rng(n * 7919 + 104729);
    var k = n - ENDLESS_FROM;               // 0, 1, 2…
    var tier = Math.min(30, Math.floor(k / 10));
    var kind = rng.int(5);                   // mécanique dominante
    var moves = 24 + rng.int(6) - Math.min(6, Math.floor(tier / 5));
    var cfg = { stones: 0, ice: 0, prisms: 0, sr: 0, pr: 0, ir: 0, ih: 1 };
    var goals = [];
    var lvGoal = Math.min(11, 7 + Math.floor(tier / 6) + rng.int(2));
    if (kind === 0) {
      goals.push(['level', lvGoal]);
      goals.push(['score', 1500 + tier * 250 + rng.int(6) * 100]);
    } else if (kind === 1) {
      cfg.stones = 6 + Math.min(8, tier) ; cfg.sr = 20 + tier * 2;
      goals.push(['stone', 8 + Math.min(10, tier) + rng.int(3)]);
    } else if (kind === 2) {
      cfg.ice = 8 + Math.min(8, tier); cfg.ir = 30 + tier * 2; cfg.ih = tier >= 6 && rng.int(2) ? 2 : 1;
      goals.push(['ice', 9 + Math.min(10, tier) + rng.int(3)]);
    } else if (kind === 3) {
      cfg.prisms = 2; cfg.pr = 45 + tier;
      goals.push(['prism', 5 + Math.min(6, Math.floor(tier / 2)) + rng.int(2)]);
      goals.push(['level', Math.max(6, lvGoal - 1)]);
    } else {
      cfg.stones = 4 + Math.min(4, tier); cfg.ice = 4 + Math.min(6, tier); cfg.ir = 20; cfg.sr = 10; cfg.pr = 20;
      goals.push(['stone', 5 + Math.min(6, tier)]);
      goals.push(['ice', 5 + Math.min(6, tier)]);
    }
    var t3 = Math.max(4, Math.round(moves * 0.3)), t2 = Math.max(2, Math.round(moves * 0.15));
    return { n: n, ch: 7, seed: (n * 2654435761) | 0, moves: moves, goals: goals, st: [t2, t3], cfg: cfg };
  }

  return {
    COLS: COLS, ROWS: ROWS, DAILY_MOVES: DAILY_MOVES,
    PRISM: PRISM, STONE: STONE, ICE1: ICE1, ICE2: ICE2, BOMB: BOMB, ENDLESS_FROM: ENDLESS_FROM,
    Rng: Rng, dateSeed: dateSeed, maxSpawnFor: maxSpawnFor, spawnLevel: spawnLevel,
    isAdjacent: isAdjacent, isOrb: isOrb, isFrozen: isFrozen, chainable: chainable, linkable: linkable,
    chainLevel: chainLevel, isValidChain: isValidChain, mergeLevel: mergeLevel, chainScore: chainScore,
    hasMoves: hasMoves, findHint: findHint, greedyChain: greedyChain,
    emptyGrid: emptyGrid, cloneGrid: cloneGrid, applyGravity: applyGravity, spawnCell: spawnCell,
    newGame: newGame, playChain: playChain, pulse: pulse, hammer: hammer, spark: spark, addMoves: addMoves,
    isStuck: isStuck, goalProgress: goalProgress, goalsDone: goalsDone, starsFor: starsFor,
    gridString: gridString, endlessLevel: endlessLevel
  };
});
