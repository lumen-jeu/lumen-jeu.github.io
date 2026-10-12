/* LUMEN — sons synthétisés (WebAudio) + musique d'ambiance générative douce. Aucun fichier audio. */
(function () {
  'use strict';
  var actx = null, master = null, sfxBus = null, musicBus = null;
  var state = { snd: true, mus: false };
  function ctx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { actx = new AC(); } catch (e) { return null; }
      master = actx.createGain(); master.gain.value = 1; master.connect(actx.destination);
      sfxBus = actx.createGain(); sfxBus.connect(master);
      musicBus = actx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    }
    if (actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  function noteHz(semi) { return 392 * Math.pow(2, semi / 12); }
  function tone(freq, dur, type, vol, when, slideTo) {
    if (!state.snd) return;
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var o = a.createOscillator(), gn = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, when, hp) {
    if (!state.snd) return;
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var src = a.createBufferSource(); src.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
    var g = a.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(sfxBus); src.start(t);
  }

  var sfx = {
    step: function (i) { tone(noteHz(PENTA[Math.max(0, Math.min(i, PENTA.length - 1))]), 0.16, 'triangle', 0.09); },
    merge: function (lv, len) {
      var base = noteHz(PENTA[Math.min(lv, PENTA.length - 1)] - 12);
      tone(base, 0.45, 'sine', 0.14);
      tone(base * 1.5, 0.4, 'triangle', 0.06, 0.03);
      tone(base * 2, 0.5, 'sine', 0.05, 0.06);
      if (len >= 5) tone(base * 3, 0.6, 'sine', 0.05, 0.1);
    },
    pulse: function () { tone(140, 0.6, 'sawtooth', 0.05, 0, 900); tone(280, 0.5, 'sine', 0.08, 0.05, 1400); },
    over: function () { [7, 4, 0, -5].forEach(function (s, i) { tone(noteHz(s), 0.5, 'triangle', 0.08, i * 0.14); }); },
    win: function () { [0, 4, 7, 12, 16].forEach(function (s, i) { tone(noteHz(s), 0.6, 'sine', 0.1, i * 0.09); tone(noteHz(s + 12), 0.4, 'triangle', 0.03, i * 0.09 + 0.02); }); },
    star: function (i) { tone(noteHz(12 + i * 4), 0.5, 'sine', 0.12); tone(noteHz(24 + i * 4), 0.3, 'triangle', 0.04, 0.02); },
    deny: function () { tone(180, 0.12, 'square', 0.03); },
    stone: function () { noise(0.18, 0.18, 0, 500); tone(110, 0.18, 'triangle', 0.08, 0, 70); },
    ice: function () { noise(0.12, 0.08, 0, 3000); tone(noteHz(26), 0.25, 'sine', 0.05); tone(noteHz(31), 0.2, 'sine', 0.04, 0.04); },
    bomb: function () { noise(0.5, 0.25, 0, 120); tone(90, 0.5, 'sine', 0.2, 0, 40); },
    coin: function () { tone(noteHz(19), 0.12, 'square', 0.03); tone(noteHz(24), 0.25, 'triangle', 0.06, 0.06); },
    tap: function () { tone(noteHz(12), 0.07, 'triangle', 0.05); }
  };

  /* ---------- Musique générative : nappes lentes sur une gamme pentatonique ---------- */
  var musTimer = null, chordIdx = 0;
  var CHORDS = [[-12, -5, 0, 4, 7], [-10, -3, 2, 7, 9], [-15, -8, -3, 4, 7], [-8, -1, 4, 9, 11]];
  function pad(freq, t, dur, vol) {
    var a = actx;
    var o1 = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    o1.type = 'sine'; o2.type = 'triangle';
    o1.frequency.value = freq; o2.frequency.value = freq * 1.003;
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o1.connect(g); o2.connect(g); g.connect(f).connect(musicBus);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  function bar() {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + 0.05, ch = CHORDS[chordIdx++ % CHORDS.length];
    ch.forEach(function (s, i) { pad(196 * Math.pow(2, s / 12), t + i * 0.25, 9, 0.022); });
    // quelques notes cristallines
    for (var k = 0; k < 3; k++) {
      if (Math.random() < 0.6) {
        var semi = ch[Math.floor(Math.random() * ch.length)] + 24;
        var tt = t + 1 + Math.random() * 6;
        var o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = 196 * Math.pow(2, semi / 12);
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.018, tt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, tt + 2.4);
        o.connect(g).connect(musicBus); o.start(tt); o.stop(tt + 2.5);
      }
    }
  }
  function startMusic() {
    var a = ctx(); if (!a || musTimer) return;
    musicBus.gain.cancelScheduledValues(a.currentTime);
    musicBus.gain.setTargetAtTime(1, a.currentTime, 1.5);
    bar();
    musTimer = setInterval(bar, 8000);
  }
  function stopMusic() {
    if (musTimer) { clearInterval(musTimer); musTimer = null; }
    if (actx) musicBus.gain.setTargetAtTime(0, actx.currentTime, 0.5);
  }

  window.LumenAudio = {
    sfx: sfx,
    unlock: function () { ctx(); if (state.mus) startMusic(); },
    set: function (snd, mus) {
      state.snd = !!snd;
      var was = state.mus;
      state.mus = !!mus;
      if (state.mus && !was && actx) startMusic();
      if (!state.mus) stopMusic();
    },
    suspend: function () { if (actx) actx.suspend(); },
    resume: function () { if (actx && (state.snd || state.mus)) actx.resume(); },
    get musicOn() { return !!musTimer; }
  };
})();
