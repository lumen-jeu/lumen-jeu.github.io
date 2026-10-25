// Langue (i18n.js), carte image du défi (carte.js), autres jeux (autres-jeux.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const I = require('../i18n.js');
const C = require('../carte.js');
const J = require('../autres-jeux.js');
const racine = path.join(__dirname, '..');

test('langue : choix mémorisé, sinon langue du navigateur', () => {
  assert.equal(I.choose('en', ['fr-FR']), 'en');
  assert.equal(I.choose('fr', ['en-US']), 'fr');
  assert.equal(I.choose(null, ['fr-CA', 'en']), 'fr');
  assert.equal(I.choose(null, ['fr']), 'fr');
  assert.equal(I.choose(null, ['en-GB', 'fr']), 'en');
  assert.equal(I.choose(null, ['de-DE']), 'en', 'autre langue → anglais');
  assert.equal(I.choose('xx', []), 'fr', 'rien de connu → français');
  assert.equal(I.choose(null, ['frisian']), 'en', 'fr suivi d\'une lettre n\'est pas le français');
});

test('traduction : clé française, valeurs insérées, pluriels', () => {
  assert.equal(I.lang, 'fr', 'sous Node : français par défaut');
  assert.equal(I.t('Niveau {0}', 7), 'Niveau 7');
  assert.equal(I.tn(0, '{0} jour', '{0} jours'), '0 jour');
  I.set('en');
  try {
    assert.equal(I.t('Niveau {0}', 7), 'Level 7');
    assert.equal(I.t('texte inconnu {0}', 2), 'texte inconnu 2', 'clé absente → texte français');
    assert.equal(I.tn(1, '{0} jour', '{0} jours'), '1 day');
    assert.equal(I.tn(0, '{0} jour', '{0} jours'), '0 days');
    assert.equal(I.locale(), 'en-US');
  } finally { I.set('fr'); }
});

test('chaque texte passé à tr()/trn()/T() dans le code a sa traduction anglaise', () => {
  const manquants = [];
  for (const f of ['app.js', 'progress.js', 'carte.js', 'autres-jeux.js']) {
    const src = fs.readFileSync(path.join(racine, f), 'utf8');
    for (const m of src.matchAll(/\b(?:tr|trn\([^,]+,|T|t)\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      const k = m[1].replace(/\\'/g, '\'');
      if (!Object.prototype.hasOwnProperty.call(I.EN, k)) manquants.push(f + ' : ' + k);
    }
  }
  // textes des données : missions, succès, événements, thèmes, titres, chapitres
  const P = require('../progress.js');
  P.EVENTS.forEach((e) => { [e.name, e.desc].forEach((k) => { if (!I.EN[k]) manquants.push('événement : ' + k); }); });
  P.THEMES.forEach((t) => { if (!I.EN[t.name]) manquants.push('thème : ' + t.name); });
  P.TITLES.forEach((t) => { if (!I.EN[t[1]] && !['Nova', 'Supernova', 'Constellation'].includes(t[1])) manquants.push('titre : ' + t[1]); });
  JSON.parse(fs.readFileSync(path.join(racine, 'levels.json'), 'utf8')).chapters.forEach((c) => {
    [c.name, c.intro].forEach((k) => { if (!I.EN[k] && k !== 'Orion') manquants.push('chapitre : ' + k); });
  });
  assert.deepEqual(manquants, []);
});

test('carte du défi : mêmes informations que le texte partagé', () => {
  const hist = Array.from({ length: 43 }, (_, i) => (i % 11) + 2);
  const m = C.model({ n: 25, score: '7 420', history: hist, peak: 9, longest: 6, serie: 3, url: 'https://lumen-jeu.github.io/' });
  assert.equal(m.titre, 'LUMEN');
  assert.equal(m.kicker, 'Défi du jour #25');
  assert.equal(m.score, '7 420');
  assert.equal(m.rows.length, 5, '5 lignes au plus');
  assert.ok(m.rows.every((r) => r.length === 8), '8 coups par ligne');
  assert.deepEqual(m.rows[0], hist.slice(0, 8));
  assert.equal(m.detail, 'Niveau max 9, chaîne de 6');
  assert.equal(m.serie, '3 jours de suite');
  assert.equal(m.url, 'https://lumen-jeu.github.io/');
  assert.equal(m.fichier, 'lumen-defi-25.png');
  assert.equal(C.W, 1080); assert.equal(C.H, 1920);
  const court = C.model({ n: 3, score: '120', history: [2, 3, 4], peak: 4, longest: 3, serie: 1, url: 'u' });
  assert.deepEqual(court.rows, [[2, 3, 4]]);
  assert.equal(court.serie, '', 'série affichée dès 2 jours, comme le texte');
  I.set('en');
  try {
    const en = C.model({ n: 25, score: '7,420', history: [2], peak: 9, longest: 6, serie: 1, url: 'u', t: I.t, tn: I.tn });
    assert.equal(en.kicker, 'Daily Challenge #25');
    assert.equal(en.detail, 'Top level 9, chain of 6');
  } finally { I.set('fr'); }
});

test('autres jeux : les 3 autres, liens web en https', () => {
  assert.equal(J.JEUX.length, 4);
  assert.deepEqual(J.autres().map((j) => j.id), ['echo', 'fragments', 'resonance']);
  J.JEUX.forEach((j) => assert.match(j.url, /^https:\/\/[a-z0-9.-]+\.github\.io\//));
  assert.equal(J.JEUX.find((j) => j.id === 'echo').texte, 'Un labyrinthe dans le noir, guidé par l\'écho');
});

test('sw.js met en cache les nouveaux modules ; index.html les charge avant app.js', () => {
  const sw = fs.readFileSync(path.join(racine, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
  for (const f of ['i18n.js', 'carte.js', 'autres-jeux.js']) {
    assert.ok(sw.includes("'" + f + "'"), f + ' absent du cache');
    assert.ok(html.indexOf('<script src="' + f + '">') < html.indexOf('<script src="app.js">'), f + ' après app.js');
  }
  assert.ok(html.indexOf('<script src="i18n.js">') < html.indexOf('<script src="progress.js">'));
});
