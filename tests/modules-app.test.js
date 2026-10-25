// Interface découpée en scripts classiques (lot 18) : ordre de chargement, cache hors ligne, portée globale partagée.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const racine = path.join(__dirname, '..');

// Ordre exigé : chaque fichier n'utilise au chargement que les précédents (voir ARCHITECTURE.md, 1 bis).
const MODULES = ['app-etat.js', 'app-sprites.js', 'app-partie.js', 'app-chaine.js', 'app-fin.js', 'app-rendu.js', 'app-accueil.js', 'app.js'];
const AVANT = ['defi.js', 'i18n.js', 'engine.js', 'progress.js', 'audio.js', 'carte.js', 'autres-jeux.js'];
// Les fichiers partagent la portée globale : un nom de premier niveau ne doit pas écraser une propriété de window.
const RESERVES = ['name', 'top', 'parent', 'self', 'status', 'length', 'origin', 'location', 'history', 'event', 'close',
  'open', 'print', 'stop', 'focus', 'blur', 'scroll', 'screen', 'frames', 'opener', 'closed', 'external', 'navigator',
  'document', 'window', 'performance', 'crypto', 'find', 'alert', 'confirm', 'prompt', 'fetch', 'caches', 'localStorage',
  'requestAnimationFrame', 'setTimeout', 'clearTimeout', 'Image', 'Audio', 'I18N', 'Defi', 'LumenEngine', 'LumenProgress',
  'LumenAudio', 'LumenCarte', 'LumenAutresJeux', '__lumen'];

function nomsDePremierNiveau(src) {
  const noms = [];
  for (const ligne of src.split(/\r?\n/)) {
    let m = /^ {0,2}function ([A-Za-z_$][\w$]*)/.exec(ligne);
    if (m) { noms.push(m[1]); continue; }
    if (!/^ {0,2}var /.test(ligne)) continue;
    for (const d of ligne.matchAll(/(?:^ {0,2}var |,\s*)([A-Za-z_$][\w$]*)\s*(?==|,|;)/g)) noms.push(d[1]);
  }
  return noms;
}

test('index.html charge les modules de l\'interface dans l\'ordre, après les modules purs', () => {
  const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(scripts, AVANT.concat(MODULES));
});

test('sw.js met en cache chaque module de l\'interface', () => {
  const sw = fs.readFileSync(path.join(racine, 'sw.js'), 'utf8');
  for (const f of AVANT.concat(MODULES)) assert.ok(sw.includes("'" + f + "'"), f + ' absent du cache');
});

test('modules de l\'interface : mode strict, aucun nom global en double ni réservé', () => {
  const vus = new Map(), doublons = [], reserves = [];
  for (const f of MODULES) {
    const src = fs.readFileSync(path.join(racine, f), 'utf8');
    assert.ok(src.includes("'use strict';"), f + ' sans mode strict');
    for (const n of nomsDePremierNiveau(src)) {
      if (vus.has(n)) doublons.push(n + ' (' + vus.get(n) + ', ' + f + ')'); else vus.set(n, f);
      if (RESERVES.includes(n)) reserves.push(f + ' : ' + n);
    }
  }
  assert.ok(vus.size > 150, 'balayage des noms cassé (' + vus.size + ')');
  assert.deepEqual(doublons, []);
  assert.deepEqual(reserves, []);
});
