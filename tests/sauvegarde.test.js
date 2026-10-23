// Bornes du code de sauvegarde LUMEN2 (mêmes règles que Save.fromMap côté Android).
// node --test tests/sauvegarde.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../progress.js');

// Fabrique un code accepté au contenu arbitraire, comme un tiers (le FNV se recalcule).
function forge(o) {
  const bytes = Buffer.from(JSON.stringify(o), 'utf8');
  let h = 0x811c9dc5;
  for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193); }
  return 'LUMEN2.' + bytes.toString('base64url') + '.' + (h >>> 0).toString(16).padStart(8, '0');
}

test('code forgé : xp énorme ou infini borné, rankFor termine', () => {
  const s = P.importCode(forge({ v: 2, xp: 1e300, ec: -5, best: 1.5, streak: { last: -9 } }));
  assert.equal(s.xp, 1e9);
  assert.equal(s.ec, 0);
  assert.equal(s.best, 1);
  assert.equal(s.streak.last, -1);
  assert.ok(P.rankFor(s.xp) < 5000);
  assert.equal(P.normalize(JSON.parse('{"v":2,"xp":1e400}')).xp, 0, 'Infinity → défaut');
});

test('code forgé : adv ne garde que des étoiles 0 à 3 (pas de HTML)', () => {
  const s = P.importCode(forge({ v: 2, adv: ['<img src=x onerror=alert(1)>', 3, 7, -1, null, 2.9] }));
  assert.deepEqual(s.adv, [0, 3, 3, 0, 0, 2]);
  assert.equal(P.starsTotal(s), 8);
});

test('code forgé : succès, missions, listes bornés', () => {
  const s = P.importCode(forge({ v: 2, ach: { fusions: -1, chaine: 99 }, mis: { day: 3, p: ['x'], done: [5, 1, 0, 1] }, themes: ['aube', 7], seen: [{}, 'stone'] }));
  assert.deepEqual(s.ach, { fusions: 0, chaine: 3 });
  assert.deepEqual(s.mis, { day: 3, p: [0, 0, 0], done: [1, 1, 0] });
  assert.deepEqual(s.themes, ['nuit', 'aube']);
  assert.deepEqual(s.seen, ['stone']);
  assert.doesNotThrow(() => P.syncAch(s));
});

test('sauvegarde normale inchangée', () => {
  const s = P.newSave();
  s.ec = 1234; s.xp = 5678; s.adv = [3, 2, 1, 3]; s.streak.last = 20000; s.ach.fusions = 2; s.mis.p = [12, 0, 40];
  assert.deepEqual(P.importCode(P.exportCode(s)), s);
});
