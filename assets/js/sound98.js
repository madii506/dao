// DAO sound: an original night track written in code with the Web Audio API, plus the server room's noises.
// Nothing is downloaded. Browsers only allow sound after a click or a key, so it starts on the first one.
const PROG = [                                            // Dm9 · Gm9 · Bbmaj7 · A7sus4, two bars each, 72 bpm
  { bass: 38, pad: [50, 57, 60, 64, 65], arp: [62, 65, 69, 72, 74, 76] },
  { bass: 43, pad: [55, 58, 62, 65, 69], arp: [62, 65, 67, 70, 74, 77] },
  { bass: 34, pad: [46, 57, 62, 65, 69], arp: [62, 65, 69, 70, 74, 77] },
  { bass: 33, pad: [45, 52, 57, 62, 67], arp: [64, 67, 69, 71, 74, 76] },
];
const BPM = 72, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

export function createSound(store) {
  const get = (k, d) => { try { const v = store.get(k); return v == null ? d : v; } catch { return d; } };
  let ctx = null, master, musicBus, sfxBus, verb, echo, noiseBuf, started = false, timer = 0, analyser = null;
  let muted = get('dao:mute', '0') === '1', vol = Math.max(0, Math.min(1, parseFloat(get('dao:vol', '.7')) || .7)), scene = 'intro';
  let step = 0, nextT = 0, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const listeners = new Set();
  const running = () => !!ctx && started && ctx.state === 'running';
  const emit = () => listeners.forEach(f => f({ muted, vol, on: running() }));

  function impulse(sec, decay) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch { return false; }
    ctx.onstatechange = () => { emit(); if (ctx.state === 'running' && humLevel > 0) applyHum(2.5); };
    master = ctx.createGain(); master.gain.value = muted ? 0 : vol;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; master.connect(comp).connect(ctx.destination);
    analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .78; comp.connect(analyser);   // the cd player's visualizer listens here
    verb = ctx.createConvolver(); verb.buffer = impulse(2.2, 3.2); const vg = ctx.createGain(); vg.gain.value = .14; verb.connect(vg).connect(master);
    echo = ctx.createDelay(1.5); echo.delayTime.value = BEAT * .75; const fb = ctx.createGain(); fb.gain.value = .18; const eg = ctx.createGain(); eg.gain.value = .16;
    echo.connect(fb).connect(echo); echo.connect(eg).connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master); musicBus.connect(verb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master); sfxBus.connect(verb);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }
  // ---------------------------------------------------------------- instruments
  const env = (g, t, a, peak, d, sus, r, end) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(sus, t + a, d); g.gain.setTargetAtTime(0, end, r); };
  function pad(notes, t, len, level) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .3;
    const g = ctx.createGain(); env(g, t, 1.6, level, 1.5, level * .85, .9, t + len); lp.connect(g).connect(musicBus);
    notes.forEach(m => [-3, 3].forEach(cents => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = cents; const og = ctx.createGain(); og.gain.value = .16; o.connect(og).connect(lp); o.start(t); o.stop(t + len + 4); }));
  }
  function pluck(m, t, level) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + 1.6);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz(m) * 2; const g2 = ctx.createGain(); g2.gain.value = .18;
    o.connect(g); o2.connect(g2).connect(g); g.connect(musicBus); g.connect(echo);
    o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
  }
  function bass(m, t, len, level) {
    const g = ctx.createGain(); env(g, t, .06, level, .5, level * .6, .25, t + len - .1);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m); o.connect(g).connect(musicBus); o.start(t); o.stop(t + len + 1);
  }
  function noise(t, dur, type, freq, q, level, bus = musicBus) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.loopStart = rnd(); const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(.0004, t + dur);
    s.connect(f).connect(g).connect(bus); s.start(t, rnd() * 1.5); s.stop(t + dur + .05); return g;
  }
  function kick(t, level) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(118, t); o.frequency.exponentialRampToValueAtTime(42, t + .22); g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(.0006, t + .38); o.connect(g).connect(musicBus); o.start(t); o.stop(t + .4); }
  // ---------------------------------------------------------------- the sequencer: sixteenth steps, scheduled a little ahead
  function schedule() {
    const ahead = ctx.currentTime + .25;
    while (nextT < ahead) {
      const t = nextT, s16 = step % 16, bar = Math.floor(step / 16), ch = PROG[Math.floor(bar / 2) % 4], desk = scene === 'desk';
      if (step % 32 === 0) pad(ch.pad, t, BAR * 2, desk ? .05 : .06);
      if (desk && s16 === 0) bass(ch.bass, t, BAR, .16);
      if (desk && s16 === 8 && rnd() < .5) bass(ch.bass + 12, t, BEAT * 1.5, .08);
      if (s16 % 2 === 0) { const p = desk ? .34 : .2; if (rnd() < p) pluck(ch.arp[Math.floor(rnd() * ch.arp.length)], t + (rnd() - .5) * .02, desk ? .05 : .045); }
      if (desk) {
        if (s16 === 0 || (s16 === 10 && rnd() < .55)) kick(t, .2);
      }
      nextT += BEAT / 4; step++;
    }
  }
  // the server room: fans, airflow and mains hum, faded in when the doors open and nearly gone on the desktop
  let hum = null, humLevel = 0;
  function startHum() {
    if (hum || !ctx) return;
    const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = .4;
    const fg = ctx.createGain(); fg.gain.value = .55; s.connect(lp).connect(fg).connect(out); s.start();
    const s2 = ctx.createBufferSource(); s2.buffer = noiseBuf; s2.loop = true; s2.playbackRate.value = .93;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2300; bp.Q.value = .7;
    const ag = ctx.createGain(); ag.gain.value = .045; s2.connect(bp).connect(ag).connect(out); s2.start();
    [[60, .05], [120, .03], [180, .01], [43.6, .045], [46.2, .035]].forEach(([f, a]) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = a; o.connect(g).connect(out); o.start(); });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = .14; lfo.connect(lg).connect(fg.gain); lfo.start();
    hum = { out };
  }
  function applyHum(sec) { if (!running()) return; startHum(); const k = scene === 'desk' ? .12 : 1; hum.out.gain.setTargetAtTime(humLevel * k * .12, ctx.currentTime, (sec || 2) / 3); }
  function startMusic() {
    if (timer) return;
    nextT = ctx.currentTime + .15; step = 0;
    musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime); musicBus.gain.linearRampToValueAtTime(scene === 'desk' ? .44 : .55, ctx.currentTime + 3);
    timer = setInterval(schedule, 60); schedule();
  }
  // ---------------------------------------------------------------- the room's noises
  const SFX = {
    beep: t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 988; g.gain.setValueAtTime(.05, t); g.gain.setValueAtTime(0, t + .13); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .15); },
    power: t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + .3); g.gain.setValueAtTime(.28, t); g.gain.exponentialRampToValueAtTime(.001, t + .45); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .5); },
    click: t => { noise(t, .025, 'bandpass', 2400, 1.2, .16, sfxBus); noise(t + .05, .02, 'bandpass', 1600, 1.2, .08, sfxBus); },
    hdd: t => { for (let i = 0; i < 3; i++) noise(t + i * (.03 + rnd() * .04), .008, 'bandpass', 3400 + rnd() * 1200, 3, .02, sfxBus); },
    key: t => { noise(t, .035, 'bandpass', 2600 + rnd() * 900, 1.4, .09, sfxBus); const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 150 + rnd() * 40; g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .06); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .07); },
    card: t => { noise(t, .025, 'bandpass', 1900, 1.4, .06, sfxBus); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 2093;
      g.gain.setValueAtTime(0, t + .03); g.gain.linearRampToValueAtTime(.045, t + .035); g.gain.setValueAtTime(.045, t + .11); g.gain.exponentialRampToValueAtTime(.0005, t + .17); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .2); },
    grant: t => { [[1318.5, 0], [1760, .12]].forEach(([f, d]) => { const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'square'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 2800;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.03, t + d + .006); g.gain.setValueAtTime(.03, t + d + .09); g.gain.exponentialRampToValueAtTime(.0005, t + d + .16); o.connect(lp).connect(g).connect(sfxBus); o.start(t + d); o.stop(t + d + .18); }); },
    door: t => {                                           // the bolt, the leaves running into the wall, the stop
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(72, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.001, t + .26); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .3);
      noise(t, .05, 'bandpass', 1500, 2, .07, sfxBus);
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .8;
      f.frequency.setValueAtTime(280, t + .1); f.frequency.linearRampToValueAtTime(640, t + .7); f.frequency.linearRampToValueAtTime(240, t + 1.3);
      const sg = ctx.createGain(); sg.gain.setValueAtTime(0, t + .08); sg.gain.linearRampToValueAtTime(.075, t + .35); sg.gain.setValueAtTime(.075, t + .95); sg.gain.exponentialRampToValueAtTime(.001, t + 1.35);
      s.connect(f).connect(sg).connect(sfxBus); s.start(t + .08); s.stop(t + 1.4);
      const m = ctx.createOscillator(), mg = ctx.createGain(), ml = ctx.createBiquadFilter(); m.type = 'sawtooth'; ml.type = 'lowpass'; ml.frequency.value = 560;
      m.frequency.setValueAtTime(92, t + .1); m.frequency.linearRampToValueAtTime(136, t + .6); m.frequency.linearRampToValueAtTime(88, t + 1.25);
      mg.gain.setValueAtTime(0, t + .1); mg.gain.linearRampToValueAtTime(.014, t + .4); mg.gain.setValueAtTime(.014, t + 1.0); mg.gain.exponentialRampToValueAtTime(.0005, t + 1.3);
      m.connect(ml).connect(mg).connect(sfxBus); m.start(t + .1); m.stop(t + 1.35);
      const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.frequency.setValueAtTime(90, t + 1.24); o2.frequency.exponentialRampToValueAtTime(44, t + 1.42);
      g2.gain.setValueAtTime(0, t + 1.23); g2.gain.linearRampToValueAtTime(.1, t + 1.245); g2.gain.exponentialRampToValueAtTime(.001, t + 1.48); o2.connect(g2).connect(sfxBus); o2.start(t + 1.22); o2.stop(t + 1.5); },
    zap: t => { for (let i = 0; i < 9; i++) noise(t + i * .018 + rnd() * .01, .012 + rnd() * .02, 'bandpass', 2500 + rnd() * 3500, 2, .05 + rnd() * .05, sfxBus);
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(60, t + .18); g.gain.setValueAtTime(.02, t); g.gain.exponentialRampToValueAtTime(.0005, t + .2); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .22); },
    brown: t => {                                          // the power goes: a heavy relay, everything winding down
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(30, t + .4); g.gain.setValueAtTime(.26, t); g.gain.exponentialRampToValueAtTime(.001, t + .5); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .55);
      noise(t, .06, 'bandpass', 900, 1.5, .1, sfxBus);
      const w = ctx.createOscillator(), wg = ctx.createGain(), lp = ctx.createBiquadFilter(); w.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 900;
      w.frequency.setValueAtTime(320, t); w.frequency.exponentialRampToValueAtTime(38, t + .7); wg.gain.setValueAtTime(.03, t); wg.gain.exponentialRampToValueAtTime(.0005, t + .75); w.connect(lp).connect(wg).connect(sfxBus); w.start(t); w.stop(t + .8); },
    restore: t => {                                        // and comes back: a clack, the fans spinning up
      noise(t, .04, 'bandpass', 1300, 1.8, .09, sfxBus);
      const w = ctx.createOscillator(), wg = ctx.createGain(), lp = ctx.createBiquadFilter(); w.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 700;
      w.frequency.setValueAtTime(45, t); w.frequency.exponentialRampToValueAtTime(240, t + .8); wg.gain.setValueAtTime(.0005, t); wg.gain.exponentialRampToValueAtTime(.02, t + .5); wg.gain.exponentialRampToValueAtTime(.0005, t + .95); w.connect(lp).connect(wg).connect(sfxBus); w.start(t); w.stop(t + 1); },
    light: t => {                                          // a strip light catching: a tick, then a short buzz
      noise(t, .018, 'highpass', 3600, .7, .045, sfxBus);
      const o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 120; bp.type = 'bandpass'; bp.frequency.value = 880; bp.Q.value = 1.1;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.018, t + .01); g.gain.setValueAtTime(.018, t + .045); g.gain.linearRampToValueAtTime(0, t + .07); g.gain.linearRampToValueAtTime(.014, t + .12); g.gain.exponentialRampToValueAtTime(.0005, t + .34);
      o.connect(bp).connect(g).connect(sfxBus); o.start(t); o.stop(t + .36); },
    dive: t => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + 1.9); og.gain.setValueAtTime(.001, t); og.gain.exponentialRampToValueAtTime(.08, t + 1.6); og.gain.exponentialRampToValueAtTime(.001, t + 2.1); o.connect(og).connect(sfxBus); o.start(t); o.stop(t + 2.2);
      const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'triangle'; o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(1760, t + 1.9); g2.gain.setValueAtTime(.001, t); g2.gain.exponentialRampToValueAtTime(.03, t + 1.6); g2.gain.exponentialRampToValueAtTime(.001, t + 2.1); o2.connect(g2).connect(sfxBus); o2.start(t); o2.stop(t + 2.2); },
    chime: t => { [62, 69, 74, 78, 81, 86].forEach((m, i) => { const at = t + i * .085, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2.01;
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.07, at + .01); g.gain.exponentialRampToValueAtTime(.0005, at + 2.6); const g2 = ctx.createGain(); g2.gain.value = .25; o.connect(g); o2.connect(g2).connect(g); g.connect(sfxBus); o.start(at); o2.start(at); o.stop(at + 2.7); o2.stop(at + 2.7); }); },
    open: t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(990, t + .06); g.gain.setValueAtTime(.035, t); g.gain.exponentialRampToValueAtTime(.0005, t + .12); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .14); },
    close: t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(560, t); o.frequency.exponentialRampToValueAtTime(380, t + .07); g.gain.setValueAtTime(.03, t); g.gain.exponentialRampToValueAtTime(.0005, t + .12); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .14); },
    ding: t => { [76, 71].forEach((m, i) => { const at = t + i * .14, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = hz(m); g.gain.setValueAtTime(.06, at); g.gain.exponentialRampToValueAtTime(.0005, at + .9); o.connect(g).connect(sfxBus); o.start(at); o.stop(at + 1); }); },
    tick: t => { noise(t, .02, 'highpass', 4000, .7, .05, sfxBus); },
    boom: t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + .5); g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .6); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .65); },
  };
  let lastSfx = {};
  return {
    unlock() { if (!init()) return; if (ctx.state === 'suspended') ctx.resume().then(emit, () => {}); if (!started) { started = true; startMusic(); emit(); } },
    // the off button: if the browser is still holding the sound back, a press means "play"; otherwise it mutes or unmutes
    toggle() { if (!running()) { this.unlock(); if (muted) this.setMuted(false); return; } this.setMuted(!muted); },
    scene(name) {
      scene = name; if (!ctx) return;
      const t = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t); musicBus.gain.linearRampToValueAtTime(name === 'desk' ? .44 : .55, t + 2.5);
      applyHum(2.5);
    },
    sfx(name, arg) {
      if (!running() || muted || !SFX[name]) return;
      const now = performance.now(); if (lastSfx[name] && now - lastSfx[name] < 40) return; lastSfx[name] = now;
      try { SFX[name](ctx.currentTime + .005, arg); } catch {}
    },
    setMuted(v) { muted = !!v; try { store.set('dao:mute', muted ? '1' : '0'); } catch {} if (ctx) { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(muted ? 0 : vol, t, .08); } emit(); },
    setVolume(v) { vol = Math.max(0, Math.min(1, v)); try { store.set('dao:vol', String(vol)); } catch {} if (ctx && !muted) master.gain.setTargetAtTime(vol, ctx.currentTime, .05); emit(); },
    get muted() { return muted; }, get volume() { return vol; }, get on() { return running(); },
    room(level, sec) { humLevel = level; applyHum(sec); },
    analyser: () => analyser, sceneName: () => scene,
    onChange(f) { listeners.add(f); f({ muted, vol, on: running() }); return () => listeners.delete(f); },
  };
}
