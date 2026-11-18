// Correctifs de l'audit du 18/11/2026 : plateau qui ne se fige plus (cell ≥ 1, rayon ≥ 0, boucle protégée)
// et bouton Retour du téléphone (une entrée d'historique hors de l'accueil, Retour en partie = pause).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const lire = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const fonction = (src, nom) => { const i = src.indexOf('function ' + nom + '('); assert.ok(i >= 0, nom); let n = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}' && !--n) return src.slice(i, k + 1); } };

test('layout() : cell jamais nul ni négatif quand le plateau est masqué (0 × 0)', () => {
  const code = fonction(lire('app-partie.js'), 'layout');
  const env = { board: { getBoundingClientRect: () => ({ width: 0, height: 0 }) }, COLS: 6, ROWS: 8, window: { devicePixelRatio: 3 } };
  const r = new Function(...Object.keys(env), 'var W, H, DPR, cell, ox, oy, orbSize, spriteCache;' + code + '; layout(); return cell;')(...Object.values(env));
  assert.ok(r >= 1, 'cell = ' + r);
});

test('roundRect() : un rayon négatif ou trop grand est ramené dans les bornes (arcTo ne lève plus d\'erreur)', () => {
  const code = fonction(lire('app-rendu.js'), 'roundRect');
  const rayons = [];
  const g = { beginPath() {}, moveTo() {}, closePath() {}, arcTo(a, b, c, d, r) { if (r < 0) throw new RangeError('IndexSizeError'); rayons.push(r); } };
  const roundRect = new Function(code + '; return roundRect;')();
  roundRect(g, 0, 0, 10, 10, -5);
  roundRect(g, 0, 0, 10, 4, 9);
  assert.ok(rayons.every((r) => r >= 0 && r <= 2));
});

test('boucle : requestAnimationFrame en tête et dessin protégé par try/catch', () => {
  const loop = fonction(lire('app.js'), 'loop');
  assert.match(loop, /^function loop\(now\) \{\s*requestAnimationFrame\(loop\);/);
  assert.match(loop, /try \{[\s\S]*draw\(now\)[\s\S]*\} catch/);
});

test('bouton Retour : en partie il ouvre la pause, dans la pause il reprend, et l\'appli n\'est jamais quittée', () => {
  const src = lire('app.js');
  const bloc = src.slice(src.indexOf('var hist = '), src.indexOf("document.addEventListener('pointerdown', function () { histSync(); }, true);"));
  const pile = [], clics = [], ecoute = {};
  const veils = { giftVeil: { hidden: true }, levelVeil: { hidden: true }, pauseVeil: { hidden: true }, overVeil: { hidden: true } };
  const env = {
    $: (id) => veils[id] || { click() { clics.push(id); } },
    document: { querySelector: (s) => ({ click() { clics.push(s); if (s.includes('pause]')) veils.pauseVeil.hidden = false; if (s.includes('resume')) veils.pauseVeil.hidden = true; } }) },
    history: { pushState() { pile.push(1); }, back() { pile.pop(); setImmediate(() => ecoute.popstate()); } },
    navigator: {}, window: { addEventListener: (t, f) => { ecoute[t] = f; } },
    showScreen: (n) => { etat.current = n; }, back: () => { etat.current = 'home'; },
  };
  const etat = { current: 'game', game: { over: false } };
  const api = new Function(...Object.keys(env), 'etat', 'with (etat) {' + bloc + '} return { histSync };')(...Object.values(env), etat);
  api.histSync();
  assert.equal(pile.length, 1, 'une entrée posée en partie');
  pile.pop(); ecoute.popstate(); // Retour du téléphone
  assert.equal(veils.pauseVeil.hidden, false, 'Retour en partie → pause');
  assert.equal(pile.length, 1, 'entrée reposée : un 2e Retour ne quitte pas');
  pile.pop(); ecoute.popstate();
  assert.equal(veils.pauseVeil.hidden, true, 'Retour dans la pause → reprise');
  assert.equal(pile.length, 1);
  etat.current = 'home'; api.histSync();
  assert.equal(pile.length, 0, 'retour à l\'accueil : l\'entrée est retirée');
});
