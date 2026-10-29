/* LUMEN — carte « Les autres jeux d'Aulit » (Réglages). Même liste et mêmes textes dans les 4 jeux. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LumenAutresJeux = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MOI = 'lumen';
  // Liens web : à remplacer par le lien Play Store quand l'appli sera publiée
  // (ids : com.aulit.echo, com.aulit.lumen, com.aulit.fragments, fr.aulit.resonance).
  var JEUX = [
    { id: 'echo', nom: 'ÉCHO', texte: 'Un labyrinthe dans le noir, guidé par l\'écho', url: 'https://echo-jeu.github.io/', teinte: '#6fe3ff' },
    { id: 'lumen', nom: 'LUMEN', texte: 'Reliez les orbes, faites monter la lumière', url: 'https://lumen-jeu.github.io/', teinte: '#ffb627' },
    { id: 'fragments', nom: 'Fragments', texte: 'Party game : chacun tient une pièce du dossier', url: 'https://fragments-jeu.github.io/', teinte: '#ff7ae6' },
    { id: 'resonance', nom: 'Résonance', texte: 'Croise les ondes, allume les nœuds', url: 'https://resonance-jeu.github.io/', teinte: '#7cff9a' }
  ];
  function autres() { return JEUX.filter(function (j) { return j.id !== MOI; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /** Remplit box (titre + 3 liens) ; t = traduction (i18n.js). */
  function render(box, t) {
    if (!box) return;
    box.innerHTML = '<h3 class="sect">' + esc(t('Les autres jeux d\'Aulit')) + '</h3><div class="set-group autres">' + autres().map(function (j) {
      return '<a class="autre" href="' + j.url + '" target="_blank" rel="noopener" style="--j:' + j.teinte + '"><i aria-hidden="true"></i>' +
        '<span><b>' + esc(j.nom) + '</b><small>' + esc(t(j.texte)) + '</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>';
    }).join('') + '</div>';
  }
  return { JEUX: JEUX, autres: autres, render: render };
});
