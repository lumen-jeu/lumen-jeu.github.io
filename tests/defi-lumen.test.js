// Défi du jour, partie propre à LUMEN : date de Paris, graine, texte partagé.
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const P = require('../progress.js');
const Defi = require('../defi.js');

test('le défi du 24/10/2026 donne deux fois la même grille de départ', () => {
  const t = P.dailyFor(Date.parse('2026-10-24T10:00:00Z'));
  assert.equal(t.seed, Defi.seed('lumen', '2026-10-24'));
  assert.equal(t.seed, 208002005);
  const a = E.newGame('daily', t.seed), b = E.newGame('daily', t.seed);
  assert.deepEqual(a.grid, b.grid);
  assert.equal(a.movesLeft, 40);
  assert.notDeepEqual(E.newGame('daily', P.dailyFor(Date.parse('2026-10-25T10:00:00Z')).seed).grid, a.grid, 'le lendemain diffère');
});

test('todaySeed et P.today() suivent la date de Paris (23h30 UTC = lendemain à Paris)', () => {
  const d = new Date('2026-10-24T23:30:00Z');
  assert.equal(P.dailyFor(d).num, 20261025);
  assert.equal(P.today(d), P.dayNumber(2026, 10, 25));
  assert.equal(P.dayFromSeed(P.dailyFor(d).num), P.today(d), 'S.daily.seed et le jour du jeu concordent');
  assert.equal(P.puzzleNumber(P.today(d)), 25);
  assert.equal(P.today(new Date('2026-10-24T21:59:00Z')), P.dayNumber(2026, 10, 24));
});

test('prochain défi : minuit heure de Paris, été comme hiver', () => {
  assert.equal(P.msToNextDaily(Date.parse('2026-10-24T18:48:00Z')), (3 * 60 + 12) * 60000, 'heure d\'été : minuit = 22:00 UTC');
  assert.equal(P.msToNextDaily(Date.parse('2026-10-25T18:00:00Z')), 5 * 3600000, 'jour du passage à l\'heure d\'hiver');
  assert.equal(P.msToNextDaily(Date.parse('2026-12-31T22:59:00Z')), 60000);
  assert.equal(P.msToNextDaily(Date.parse('2027-03-28T12:00:00Z')), 10 * 3600000, 'jour du passage à l\'heure d\'été');
});

test('P.shareDaily : grille de carrés, série, lien canonique', () => {
  const day = P.dayNumber(2026, 10, 24), hist = [2, 3, 4, 5, 6, 7, 9, 11, 2, 3];
  const sans = P.shareDaily(day, 7420, hist, 9, 6, 1).split('\n');
  assert.match(sans[0], /^LUMEN #24 ✨ 7\s420$/);
  assert.equal(sans[1], '🟫🟥🟧🟨🟩🟦🟪⬜');
  assert.equal(sans[2], '🟫🟥');
  assert.equal(sans[3], 'Niveau max 9, chaîne de 6');
  assert.equal(sans[4], 'https://lumen-jeu.github.io/');
  assert.equal(sans.length, 5, 'pas de ligne série sous 2 jours');
  const avec = P.shareDaily(day, 7420, Array(40).fill(12), 12, 9, 4);
  const l = avec.split('\n');
  assert.equal(l.length, 1 + 5 + 1 + 1 + 1, '40 coups = 5 lignes de 8');
  assert.equal(l[7], '🔥 4 jours de suite');
  assert.equal(l[8], P.URL);
  assert.ok(avec.length <= 280);
});
