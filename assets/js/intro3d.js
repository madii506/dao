// The way in: a corridor lit red at 23:58, a keycard on the reader, ACCESS GRANTED, the doors of room 00 run into
// the wall and the strip lights wake down an aisle of servers. From the doorway your scroll walks the aisle: the power
// cuts out once, someone is standing at the end, the lights come back. At the end the beige PC boots. Enter dives in.
import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { EffectComposer } from './vendor/EffectComposer.js';
import { RenderPass } from './vendor/RenderPass.js';
import { UnrealBloomPass } from './vendor/UnrealBloomPass.js';
import { OutputPass } from './vendor/OutputPass.js';
import { ShaderPass } from './vendor/ShaderPass.js';

let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hsh = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const BEIGE = 0xd2c6a6, BEIGE2 = 0xc2b590;
const SCREEN_C = new THREE.Vector3(0, .595, .07);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = k => Math.max(0, Math.min(1, k));
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeIn = k => k * k * k;
const easeOut = k => 1 - Math.pow(1 - k, 3);
// the building: floor, ceiling, the door wall of room 00, the two rows of racks and the end row behind the bench
const F = -.78, CEIL = 2.18, CORR = 2.0, DOOR_Z = 11.2, WT = .2, OW = .75, OH = 2.2;
const RW = .6, RD = 1.05, RH = 2.0, AISLE = .9, ROW_Z0 = 2.3, ROW_N = 14, END_Z = -.74, END_N = 8, ROOM_X = 2.7, BACK_Z = -1.85;
const STRIPS = 7, STRIP_Z = i => 10.15 - i * 1.18;
// the film, in seconds: the card, the reader, the doors, the lights, the lamp, the CRT, the boot
const TL = { cardIn: 1.7, tap: 2.2, verify: 2.5, cardOut: 2.6, grant: 3.2, door: 3.45, strips: 4.25, gap: .36 };
const DEAD = 3, BAD = 5;   // one tube never catches, one never settles
const LAYERS = [['01', 'site', 'no trackers, no cookies'], ['02', 'connect', 'optional, never required'], ['03', 'key', 'creator key born here'],
  ['04', 'launcher', 'fresh wallet, every launch'], ['05', 'gas', 'claims paid by the treasury'], ['06', 'files', 'image metadata stripped']];
const C = { ink: '#e9e1cb', ok: '#62f0c8', gold: '#f2b84b', dim: '#6f8a83', red: '#ff6b5b', white: '#ffffff' };

function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const grain = (g, w, h, n, a) => { for (let i = 0; i < n; i++) { const k = rnd() * a; g.fillStyle = rnd() < .5 ? `rgba(255,255,255,${k})` : `rgba(0,0,0,${k * 1.6})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 1 + rnd() * 2.5); } };

// ---------------------------------------------------------------- the CRT: a real terminal drawn into a texture
const GLYPHS = {
  d: ['....XX', '....XX', '....XX', '.XXXXX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXXX'],
  a: ['......', '......', '......', '.XXXX.', '....XX', '.XXXXX', 'XX..XX', 'XX..XX', '.XXXXX'],
  o: ['......', '......', '......', '.XXXX.', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXX.'],
};
class Terminal {
  constructor() {
    this.W = 1024; this.H = 768;
    this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = this.H; this.g = this.c.getContext('2d');
    this.b = document.createElement('canvas'); this.b.width = this.W; this.b.height = this.H; this.bg = this.b.getContext('2d');
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 8;
    this.lines = []; this.input = ''; this.prompt = false; this.logo = 0; this.power = 0; this.dirty = true; this.blink = true;
    this.LH = 38; this.X = 58; this.Y = 48; this.max = 18; this.mode = 'term'; this.tunnel = 0; this.wobble = 0; this.flick = 0; this.glitch = 0; this.off = true;
  }
  push(runs) { this.lines.push(runs); while (this.lines.length > this.max) this.lines.shift(); this.dirty = true; return this.lines.length - 1; }
  set(i, runs) { this.lines[i] = runs; this.dirty = true; }
  clear() { this.lines = []; this.dirty = true; this.flick = 1; }
  get busy() { return this.power < 1 || this.wobble > 0 || this.mode === 'tunnel' || (this.logo > 0 && this.logo < 1) || this.flick > 0 || this.glitch > 0; }
  draw(now, dt) {
    const blink = Math.floor(now / 530) % 2 === 0;
    if (!this.dirty && blink === this.blink && !this.busy && !this.first) return;
    this.blink = blink; this.dirty = false; this.first = false;
    const g = this.bg, W = this.W, H = this.H;
    if (this.off) { g.fillStyle = '#030505'; g.fillRect(0, 0, W, H); this.glass(g); return this.compose(0); }
    if (this.power < 1) {                                  // CRT power-on: a dot, a line of light, then the picture opens
      const k = this.power; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const hh = Math.max(2, H * Math.max(0, (k - .3) / .7)), ww = W * Math.min(1, k / .3);
      g.fillStyle = `rgba(225,255,242,${k < .3 ? .4 + k * 2 : 1 - (k - .3) * .7})`; g.shadowColor = '#bfffe9'; g.shadowBlur = 30;
      g.fillRect(W / 2 - ww / 2, H / 2 - hh / 2, ww, hh); g.shadowBlur = 0;
      return this.compose(dt);
    }
    const r = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * .7); r.addColorStop(0, '#0b2a24'); r.addColorStop(1, '#020a08');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    if (this.mode === 'tunnel') this.drawTunnel(g); else this.drawText(g, blink);
    this.glass(g);
    this.compose(dt);
  }
  drawText(g, blink) {
    g.textBaseline = 'top'; g.font = `${this.LH}px VT, monospace`;
    let y = this.Y;
    const run = (runs, x0, yy) => { let x = x0; for (const [s, c] of runs) { g.fillStyle = c || C.ink; g.shadowColor = g.fillStyle; g.shadowBlur = 10; g.fillText(s, x, yy); x += g.measureText(s).width; } g.shadowBlur = 0; return x; };
    if (this.logo) {
      const px = 21, rows = Array(9).fill('');
      for (const ch of 'dao') GLYPHS[ch].forEach((row, i) => rows[i] += row + '..');
      const k = Math.min(1, this.logo), x0 = this.X + 6, y0 = y + 6;
      g.shadowColor = C.gold; g.shadowBlur = 22;
      rows.forEach((row, ry) => [...row].forEach((c, rx) => {
        if (c !== 'X') return;
        const on = k >= 1 || Math.random() < k * 1.4 - rx / row.length * .45;
        g.fillStyle = on ? C.gold : 'rgba(242,184,75,.35)';
        if (on) g.fillRect(x0 + rx * px, y0 + ry * px, px - 1, px - 1); else g.fillText('░▒▓#%'[(Math.random() * 5) | 0], x0 + rx * px, y0 + ry * px - 8);
      }));
      g.shadowBlur = 0; y += 9 * px + 30;
      if (this.logo < 1) this.dirty = true;
    }
    for (const ln of this.lines) { run(ln, this.X, y); y += this.LH; }
    if (this.prompt) {
      const x = run([['C:\\DAO> ', C.ok], [this.input, C.white]], this.X, y);
      if (blink) { g.fillStyle = C.ink; g.fillRect(x + 2, y + 6, 15, this.LH - 8); }
    }
  }
  drawTunnel(g) {                                          // six layers rushing past, the last thing you see before the desktop
    const W = this.W, H = this.H, k = this.tunnel;
    g.fillStyle = '#010605'; g.fillRect(0, 0, W, H);
    g.textBaseline = 'top';
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      const z = 1.1 + i * .62 - k * 4.9; if (z <= .06) continue;
      const s = .3 / z, w = W * s, h = H * s, a = Math.min(1, (4.4 - z) / 2) * Math.min(1, z / .3);
      if (a <= 0) continue;
      const col = i % 2 ? '98,240,200' : '242,184,75';
      g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = Math.max(2, 5 / z); g.shadowColor = `rgb(${col})`; g.shadowBlur = 26;
      g.strokeRect(W / 2 - w, H / 2 - h, w * 2, h * 2);
      g.font = `${Math.round(Math.max(16, 30 / z))}px VT, monospace`; g.fillStyle = `rgba(${col},${a})`;
      g.fillText(`${LAYERS[i][0]} ${LAYERS[i][1]}`, W / 2 - w + 10 / z, H / 2 - h + 8 / z);
    }
    g.shadowBlur = 0;
    if (k > .82) { g.fillStyle = `rgba(232,255,246,${(k - .82) / .18})`; g.fillRect(0, 0, W, H); }
  }
  glass(g) {
    const W = this.W, H = this.H;
    g.fillStyle = 'rgba(0,0,0,.22)'; for (let yy = 0; yy < H; yy += 3) g.fillRect(0, yy, W, 1);
    const v = g.createRadialGradient(W / 2, H / 2, W * .32, W / 2, H / 2, W * .74); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.72)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    const gl = g.createLinearGradient(0, 0, W * .55, H * .7); gl.addColorStop(0, 'rgba(255,255,255,.07)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    if (this.flick > 0) { g.fillStyle = `rgba(0,0,0,${this.flick * .7})`; g.fillRect(0, 0, W, H); }
  }
  compose(dt) {                                            // copy the buffer to the screen, bent by the degauss wobble and the odd glitch
    const g = this.g, W = this.W, H = this.H;
    if (this.wobble > 0 || this.glitch > 0) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const t = performance.now() / 1000, band = 6;
      for (let y = 0; y < H; y += band) {
        let dx = Math.sin(y * .035 + t * 38) * this.wobble * 26;
        if (this.glitch > 0 && Math.random() < .06) dx += (Math.random() - .5) * 90 * this.glitch;
        g.drawImage(this.b, 0, y, W, band, dx, y, W, band);
      }
    } else g.drawImage(this.b, 0, 0);
    this.wobble = Math.max(0, this.wobble - (dt || 0) * 1.5); this.flick = Math.max(0, this.flick - (dt || 0) * 5); this.glitch = Math.max(0, this.glitch - (dt || 0) * 2.2);
    this.t.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- the reader by the door: its little screen
const panelState = ft => ft < TL.tap ? 'idle' : ft < TL.verify ? 'read' : ft < TL.grant ? 'verify' : 'granted';
class Panel {
  constructor() {
    this.W = 320; this.H = 240; this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = this.H; this.g = this.c.getContext('2d');
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 8; this.key = '';
  }
  draw(ft) {
    const state = panelState(ft), blink = Math.floor(ft * 2.4) % 2 === 0;
    const lines = state === 'verify' ? Math.min(3, Math.floor((ft - TL.verify) / .16) + 1) : 0;
    const prog = state === 'read' ? clamp01((ft - TL.tap) / (TL.verify - TL.tap)) : 0, gf = state === 'granted' ? Math.min(3, Math.floor((ft - TL.grant) / .07)) : 0;
    const key = state + lines + (state === 'idle' ? blink : '') + (state === 'read' ? Math.round(prog * 12) : '') + gf;
    if (key === this.key) return; this.key = key;
    const g = this.g, W = this.W, H = this.H;
    const r = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * .7); r.addColorStop(0, state === 'granted' ? '#0d3a2b' : '#0a1d18'); r.addColorStop(1, '#020806');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    g.textBaseline = 'top'; g.font = '26px VT, monospace';
    g.fillStyle = C.gold; g.fillText('DAO', 16, 10); g.fillStyle = C.dim; const rt = 'ROOM 00'; g.fillText(rt, W - 16 - g.measureText(rt).width, 10);
    g.fillStyle = 'rgba(98,240,200,.28)'; g.fillRect(16, 40, W - 32, 2);
    const mid = (s, y, px, col, blur = 14) => { g.font = `${px}px VT, monospace`; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = blur; g.fillText(s, (W - g.measureText(s).width) / 2, y); g.shadowBlur = 0; };
    if (state === 'idle') { if (blink) mid('TAP CARD', 78, 64, C.ink); mid('v', 156, 52, blink ? C.red : 'rgba(255,107,91,.3)'); }
    else if (state === 'read') { mid('READING', 74, 56, C.gold); g.fillStyle = 'rgba(242,184,75,.18)'; g.fillRect(44, 160, W - 88, 16); g.fillStyle = C.gold; g.fillRect(44, 160, (W - 88) * prog, 16); }
    else if (state === 'verify') {
      mid('VERIFYING', 52, 46, C.gold);
      g.font = '25px VT, monospace';
      [['card', 'dao-00'], ['name', 'not required'], ['signature', 'none']].slice(0, lines).forEach(([a, b], i) => {
        const y = 118 + i * 32, lab = a + ' ' + '.'.repeat(11 - a.length) + ' ';
        g.fillStyle = C.dim; g.fillText(lab, 26, y); g.fillStyle = C.ok; g.fillText(b, 26 + g.measureText(lab).width, y);
      });
    } else {
      if (gf < 2) { g.fillStyle = 'rgba(98,240,200,.4)'; g.fillRect(0, 0, W, H); }
      mid('ACCESS', 56, 62, C.ok, 18); mid('GRANTED', 114, 62, C.ok, 18); mid('welcome, nobody.', 188, 26, C.dim, 6);
    }
    g.fillStyle = 'rgba(0,0,0,.24)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    this.t.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- the racks: four kinds of front, every LED recorded where it is painted
function rackFront() {
  const W = 384, H = 1280, U = 28.4, TOP = 43, R = 22, leds = [];
  const led = (x, y, k) => leds.push([x / W, y / H, k]);
  const shade = v => `rgb(${v},${v + 2},${v + 5})`;
  const bezel = (g, x, y, w, h, c) => {
    g.fillStyle = c; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(x, y, w, 1); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y + h - 1, w, 1);
    g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(x, y, 9, h); g.fillRect(x + w - 9, y, 9, h);
    g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(x + 4.5, y + h / 2, 2, 0, 7); g.arc(x + w - 4.5, y + h / 2, 2, 0, 7); g.fill();
  };
  const hole = (g, x, y) => { g.fillStyle = '#030303'; g.fillRect(x - 2, y - 1, 7, 5); };
  const unit = (g, k, x, y, w, h) => {
    if (k === 'gap') {
      g.fillStyle = '#030304'; g.fillRect(x, y, w, h);
      if (rnd() < .7) { g.strokeStyle = rnd() < .5 ? '#1c3557' : '#2c2c2e'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w * rnd(), y); g.quadraticCurveTo(x + w * rnd(), y + h * 1.3, x + w * rnd(), y + h); g.stroke(); }
      return;
    }
    if (k === 'blank') { bezel(g, x, y, w, h, shade(14)); g.fillStyle = 'rgba(0,0,0,.5)'; for (let yy = y + 5; yy < y + h - 4; yy += 4) g.fillRect(x + 14, yy, w - 28, 1); return; }
    if (k === 'patch') {
      bezel(g, x, y, w, h, shade(46)); const n = 24, s = (w - 40) / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle = '#0a0b0d'; g.fillRect(x + 20 + i * s + 1, y + 9, s - 3, h - 15);
        if (rnd() < .72) {
          g.strokeStyle = ['#2b62c4', '#e2bd3c', '#9ba1a9', '#c9473a', '#3aa465'][rnd() * 5 | 0]; g.lineWidth = 2.4; g.beginPath();
          const cx = x + 20 + i * s + s / 2; g.moveTo(cx, y + h - 7); g.quadraticCurveTo(cx + (rnd() - .5) * 10, y + h + 12, cx + (rnd() - .2) * 36, y + h + 24 + rnd() * 34); g.stroke();
        }
      }
      return;
    }
    if (k === 'sw') {
      bezel(g, x, y, w, h, shade(25)); const cols = 24, s = (w - 72) / cols;
      for (let r = 0; r < 2; r++) for (let i = 0; i < cols; i++) { const px = x + 14 + i * s, py = y + 4 + r * 11; g.fillStyle = '#040405'; g.fillRect(px, py + 3, s - 3, 7); if (r === 0) { hole(g, px + s / 2 - 2, py); led(px + s / 2 - 1.5, py + 1, rnd() < .82 ? 'link' : 'off'); } }
      g.fillStyle = '#0a0b0d'; g.fillRect(x + w - 52, y + 6, 38, h - 12); hole(g, x + w - 58, y + 9); led(x + w - 56, y + 10, 'pwr');
      return;
    }
    if (k === 'srv1') {
      bezel(g, x, y, w, h, shade(30 + rnd() * 10 | 0)); g.fillStyle = 'rgba(0,0,0,.5)';
      for (let xx = x + 12; xx < x + w * .32; xx += 3) g.fillRect(xx, y + 5, 1, h - 10);
      const bays = 8, bx0 = x + w * .36, s = (w * .54) / bays;
      for (let i = 0; i < bays; i++) { g.fillStyle = shade(54); g.fillRect(bx0 + i * s, y + 5, s - 3, h - 10); g.fillStyle = '#121316'; g.fillRect(bx0 + i * s + 2, y + 7, s - 8, h - 14); hole(g, bx0 + i * s + s - 7, y + 8); led(bx0 + i * s + s - 6, y + 9, 'act'); }
      hole(g, x + w - 17, y + h / 2 - 2); led(x + w - 16, y + h / 2 - 1, 'pwr');
      return;
    }
    if (k === 'srv2') {
      bezel(g, x, y, w, h, shade(28 + rnd() * 10 | 0)); const bays = 12, bx0 = x + 16, s = (w - 62) / bays;
      for (let i = 0; i < bays; i++) {
        g.fillStyle = shade(57); g.fillRect(bx0 + i * s, y + 5, s - 3, h - 10); g.fillStyle = '#101114';
        for (let yy = y + 9; yy < y + h - 14; yy += 3) g.fillRect(bx0 + i * s + 3, yy, s - 9, 1);
        hole(g, bx0 + i * s + s / 2 - 3, y + h - 11); led(bx0 + i * s + s / 2 - 2.5, y + h - 10, 'act');
      }
      g.fillStyle = '#0b0c0e'; g.fillRect(x + w - 42, y + 6, 28, h - 12);
      hole(g, x + w - 34, y + 12); led(x + w - 33, y + 13, 'pwr'); hole(g, x + w - 34, y + 26); led(x + w - 33, y + 27, rnd() < .18 ? 'id' : 'stat');
      return;
    }
    if (k === 'jbod') {
      bezel(g, x, y, w, h, shade(23)); const cols = 4, rows = 3, s = (w - 30) / cols, r = (h - 12) / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const px = x + 15 + i * s, py = y + 6 + j * r;
        g.fillStyle = shade(50); g.fillRect(px, py, s - 4, r - 4); g.fillStyle = '#0e0f12'; g.fillRect(px + 4, py + 4, s - 32, r - 12);
        g.fillStyle = 'rgba(0,0,0,.45)'; for (let xx = px + 6; xx < px + s - 36; xx += 4) g.fillRect(xx, py + 6, 2, r - 16);
        hole(g, px + s - 19, py + 6); led(px + s - 18, py + 7, 'act'); hole(g, px + s - 19, py + 17); led(px + s - 18, py + 18, 'stat');
      }
    }
  };
  const t = tex(W, H, g => {
    g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#16181d'; g.fillRect(0, 0, R, H); g.fillRect(W - R, 0, R, H);
    g.fillStyle = '#040506'; for (let y = TOP; y < H - TOP; y += U / 3) { g.fillRect(8, y + 3, 6, 5); g.fillRect(W - 14, y + 3, 6, 5); }
    g.fillStyle = '#121419'; g.fillRect(0, 0, W, TOP - 4); g.fillRect(0, H - TOP + 4, W, TOP - 4);
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, TOP - 5, W, 1); g.fillRect(0, H - TOP + 4, W, 1);
    g.fillStyle = '#e9e4d6'; g.fillRect(W / 2 - 30, 12, 60, 16); g.fillStyle = '#16181d'; g.font = '14px monospace'; g.textBaseline = 'top';   // the rack's label
    g.fillText('DAO-' + String(10 + (rnd() * 89 | 0)), W / 2 - 25, 13);
    let u = 0;
    while (u < 42) {
      const p = rnd(); let h, k;
      if (p < .24) { h = 1; k = 'srv1'; } else if (p < .47) { h = 2; k = 'srv2'; } else if (p < .56) { h = 4; k = 'jbod'; } else if (p < .67) { h = 1; k = 'sw'; }
      else if (p < .73) { h = 1; k = 'patch'; } else if (p < .86) { h = 1 + (rnd() * 2 | 0); k = 'blank'; } else { h = 1 + (rnd() * 3 | 0); k = 'gap'; }
      if (u + h > 42) { h = 42 - u; k = 'blank'; }
      unit(g, k, R + 2, H - TOP - (u + h) * U + 1, W - 2 * R - 4, h * U - 2);
      u += h;
    }
    grain(g, W, H, 5000, .05);
  });
  return { t, leds };
}
// how each kind of LED behaves: colour, then 0 steady · 1 blink · 2 disk/network activity
function ledLook(k) {
  const G = [.3, 2.4, .75], B = [.42, 1.05, 2.9], A = [2.5, 1.35, .22], Rd = [2.6, .22, .16];
  const r = rnd();
  if (k === 'pwr') return { c: r < .72 ? G : B, m: 0 };
  if (k === 'act') return { c: r < .78 ? G : B, m: 2, rate: 7 + rnd() * 14, duty: .3 + rnd() * .45 };
  if (k === 'link') return r < .62 ? { c: [.26, 2.1, .6], m: 0 } : { c: r < .8 ? A : G, m: 2, rate: 5 + rnd() * 10, duty: .4 + rnd() * .4 };
  if (k === 'stat') return r < .9 ? { c: [.1, .07, .02], m: 0 } : r < .975 ? { c: A, m: 0 } : { c: Rd, m: 1, rate: .9, duty: .5 };
  if (k === 'id') return { c: B, m: 1, rate: .45, duty: .5 };
  return { c: [.05, .05, .055], m: 0 };
}

// ---------------------------------------------------------------- the building
function build(scene, mobile) {
  const std = o => new THREE.MeshStandardMaterial(o);
  const SH = !mobile;
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene, cast = false, recv = false) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast && SH; m.receiveShadow = recv && SH; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent = scene, cast, recv) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent, cast, recv);
  const plane = (w, h, mat, x, y, z, rx = 0, ry = 0, parent = scene) => { const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent); m.rotation.set(rx, ry, 0); return m; };
  // the desk things cast and catch the lamp's shadows
  const pmesh = (geo, mat, x, y, z, parent) => mesh(geo, mat, x, y, z, parent, true, true);
  const plastic = std({ color: BEIGE, roughness: .55 }), plastic2 = std({ color: BEIGE2, roughness: .6 }), dark = std({ color: 0x2a2a26, roughness: .7 }), black = std({ color: 0x0b0b0c, roughness: .5 });
  const steel = std({ color: 0x4b5058, roughness: .42, metalness: .55 }), steelDark = std({ color: 0x15171b, roughness: .55, metalness: .4 });

  // ---- surfaces
  const concrete = (base, rep) => tex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); grain(g, w, h, 26000, .07);
    for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(0,0,0,${.05 + rnd() * .08})`; g.lineWidth = 1; g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (rnd() - .5) * 40; y += rnd() * 30; g.lineTo(x, y); } g.stroke(); } }, rep);
  const tiles = (perf, rep) => tex(512, 512, (g, w, h) => {
    const s = w / 2;
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      const x = tx * s, y = ty * s, v = 40 + rnd() * 7 | 0;
      g.fillStyle = `rgb(${v},${v + 3},${v + 8})`; g.fillRect(x, y, s, s);
      for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .035})`; g.fillRect(x + rnd() * s, y + rnd() * s, 2, 2); }
      if (perf) { g.fillStyle = 'rgba(4,5,7,.9)'; const m = 26, n = 12, st = (s - 2 * m) / n; for (let iy = 0; iy <= n; iy++) for (let ix = 0; ix <= n; ix++) { g.beginPath(); g.arc(x + m + ix * st, y + m + iy * st, 3.4, 0, 7); g.fill(); } }
      g.fillStyle = '#0b0c0f'; g.fillRect(x, y, s, 3); g.fillRect(x, y, 3, s);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 3, y + 3, s - 3, 1); g.fillRect(x + 3, y + 3, 1, s - 3);
    }
  }, rep);
  // raised floor, the perforated cold aisle down the middle, the ceiling and its beams, the walls
  const glossy = (perf, w, d) => std({ map: tiles(perf, [w / 1.2, d / 1.2]), roughness: .3, metalness: .15, transparent: true, opacity: .8 });
  const floors = [];
  const fl = (w, d, x, z, perf) => { const m = plane(w, d, glossy(perf, w, d), x, F, z, -Math.PI / 2); m.receiveShadow = SH; m.renderOrder = -2; floors.push(m); return m; };
  const aisleLen = DOOR_Z - .1 - ROW_Z0;
  fl(ROOM_X * 2, ROW_Z0 - BACK_Z, 0, (ROW_Z0 + BACK_Z) / 2, false);
  fl(ROOM_X - AISLE, aisleLen, -(AISLE + ROOM_X) / 2, ROW_Z0 + aisleLen / 2, false); fl(ROOM_X - AISLE, aisleLen, (AISLE + ROOM_X) / 2, ROW_Z0 + aisleLen / 2, false);
  fl(AISLE * 2, aisleLen, 0, ROW_Z0 + aisleLen / 2, true);
  const ceilMat = std({ map: concrete('#15171b', [4, 8]), roughness: .95 });
  plane(ROOM_X * 2, DOOR_Z - BACK_Z, ceilMat, 0, CEIL, (DOOR_Z + BACK_Z) / 2, Math.PI / 2);
  for (const z of [.6, 3.6, 6.6, 9.6]) box(ROOM_X * 2, .16, .2, steelDark, 0, CEIL - .08, z);
  const wallIn = std({ map: concrete('#1e2125', [5, 1.5]), roughness: .95 });
  plane(DOOR_Z - BACK_Z, CEIL - F, wallIn, -ROOM_X, (F + CEIL) / 2, (DOOR_Z + BACK_Z) / 2, 0, Math.PI / 2);
  plane(DOOR_Z - BACK_Z, CEIL - F, wallIn, ROOM_X, (F + CEIL) / 2, (DOOR_Z + BACK_Z) / 2, 0, -Math.PI / 2);
  plane(ROOM_X * 2, CEIL - F, wallIn, 0, (F + CEIL) / 2, BACK_Z);

  // ---- the racks: bodies, fronts and LEDs, all instanced
  const fronts = [rackFront(), rackFront(), rackFront(), rackFront()];
  const racks = [];   // [x, z, facing] facing: +1 → front looks +x, -1 → -x, 0 → +z
  for (let j = 0; j < ROW_N; j++) { const z = ROW_Z0 + (j + .5) * RW; racks.push([-AISLE - RD / 2, z, 1], [AISLE + RD / 2, z, -1]); }
  for (let j = 0; j < END_N; j++) racks.push([(j - (END_N - 1) / 2) * RW, END_Z - RD / 2, 0]);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(), P1 = new THREE.Vector3(), up = V(0, 1, 0);
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steelDark, racks.length);
  const frontMats = fronts.map(f => std({ map: f.t, roughness: .62, metalness: .25 }));
  const frontMesh = fronts.map((f, v) => new THREE.InstancedMesh(new THREE.PlaneGeometry(RW, RH), frontMats[v], racks.length));
  const fCount = [0, 0, 0, 0], ledList = [];
  racks.forEach(([x, z, face], i) => {
    const side = face !== 0;
    Q.setFromAxisAngle(up, 0); S1.set(side ? RD : RW, RH, side ? RW : RD); P1.set(x, F + RH / 2, z);
    bodies.setMatrixAt(i, M.compose(P1, Q, S1));
    const v = (i * 7 + (i >> 2)) % 4, fv = fronts[v];
    const yaw = face === 1 ? Math.PI / 2 : face === -1 ? -Math.PI / 2 : 0;
    Q.setFromAxisAngle(up, yaw); S1.set(1, 1, 1);
    const fx = face === 1 ? -AISLE + .003 : face === -1 ? AISLE - .003 : x, fz = face === 0 ? END_Z + .003 : z;
    P1.set(fx, F + RH / 2, fz); frontMesh[v].setMatrixAt(fCount[v]++, M.compose(P1, Q, S1));
    for (const [u, w, k] of fv.leds) {          // u across the front, w down it, as painted
      const lx = (u - .5) * RW, ly = F + RH - w * RH;
      const p = face === 1 ? V(-AISLE + .006, ly, z - lx) : face === -1 ? V(AISLE - .006, ly, z + lx) : V(x + lx, ly, END_Z + .006);
      const L = ledLook(k); if (face === 0) L.c = L.c.map(c => c * .5);
      L.side = face !== 0; ledList.push([p, yaw, L]);
    }
  });
  frontMesh.forEach((m, v) => { m.count = fCount[v]; m.instanceMatrix.needsUpdate = true; scene.add(m); });
  bodies.instanceMatrix.needsUpdate = true; scene.add(bodies);
  const nL = ledList.length;
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(.0075, .005, .004), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), nL);
  const LD = { n: nL, c: new Float32Array(nL * 3), m: new Uint8Array(nL), rate: new Float32Array(nL), duty: new Float32Array(nL), ph: new Float32Array(nL), z: new Float32Array(nL), side: new Uint8Array(nL) };
  const col = new THREE.Color();
  const ledsM = new THREE.InstancedMesh(new THREE.BoxGeometry(.0075, .026, .004), new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, .3, .3), toneMapped: false }), nL);
  ledList.forEach(([p, yaw, L], i) => {
    Q.setFromAxisAngle(up, yaw); S1.set(1, 1, 1); leds.setMatrixAt(i, M.compose(p, Q, S1));
    P1.set(p.x, 2 * F - p.y, p.z); ledsM.setMatrixAt(i, M.compose(P1, Q, S1));
    LD.c.set(L.c, i * 3); LD.m[i] = L.m; LD.rate[i] = L.rate || 1; LD.duty[i] = L.duty || .5; LD.ph[i] = rnd(); LD.z[i] = p.z; LD.side[i] = L.side ? 1 : 0;
    leds.setColorAt(i, col.setRGB(L.c[0], L.c[1], L.c[2]));
  });
  leds.instanceMatrix.needsUpdate = true; scene.add(leds);
  ledsM.instanceColor = leds.instanceColor; ledsM.instanceMatrix.needsUpdate = true; scene.add(ledsM);

  // ---- overhead: yellow fibre runs dropping into each rack, black ladder trays with cable, the strip lights
  const fibre = std({ color: 0xd8a512, roughness: .55 }), cable = std({ color: 0x101114, roughness: .8 });
  for (const sx of [-1, 1]) {
    box(.13, .1, ROW_N * RW, fibre, sx * (AISLE + .5), 1.6, ROW_Z0 + ROW_N * RW / 2);
    for (let j = 0; j < ROW_N; j += 2) box(.07, .34, .07, fibre, sx * (AISLE + .5), 1.38, ROW_Z0 + (j + .5) * RW);
    box(.34, .025, ROW_N * RW, steelDark, sx * (AISLE + .12), 1.92, ROW_Z0 + ROW_N * RW / 2);
    for (let c = 0; c < 3; c++) { const cy = mesh(new THREE.CylinderGeometry(.03, .03, ROW_N * RW, 10), cable, sx * (AISLE + .04 + c * .08), 1.955, ROW_Z0 + ROW_N * RW / 2); cy.rotation.x = Math.PI / 2; }
  }
  box(END_N * RW, .1, .13, fibre, 0, 1.6, END_Z - .5);
  for (let j = 0; j < END_N; j += 2) box(.07, .34, .07, fibre, (j - (END_N - 1) / 2) * RW, 1.38, END_Z - .5);
  const housing = std({ color: 0x23262b, roughness: .5, metalness: .5 });
  const stripMats = [], shaftMats = [];
  const shaftT = tex(64, 128, (g, w, h) => { const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(255,255,255,.95)'); v.addColorStop(.35, 'rgba(255,255,255,.35)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    const e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(0,0,0,1)'); e.addColorStop(.3, 'rgba(0,0,0,0)'); e.addColorStop(.7, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = e; g.fillRect(0, 0, w, h); });
  function wedge(tw, bw, ty, by, len) {          // a light shaft: open at the top, wide at the floor, both ends capped
    const a = tw / 2, b = bw / 2, z = len / 2, Pp = [], U = [];
    const quad = (q, uv) => { [0, 1, 2, 0, 2, 3].forEach(k => { Pp.push(...q[k]); U.push(...uv[k]); }); };
    const side = [[0, 1], [1, 1], [1, 0], [0, 0]], cap = [[.35, 1], [.65, 1], [1, 0], [0, 0]];
    quad([[-a, ty, -z], [-a, ty, z], [-b, by, z], [-b, by, -z]], side); quad([[a, ty, z], [a, ty, -z], [b, by, -z], [b, by, z]], side);
    quad([[-a, ty, z], [a, ty, z], [b, by, z], [-b, by, z]], cap); quad([[a, ty, -z], [-a, ty, -z], [-b, by, -z], [b, by, -z]], cap);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); return g;
  }
  for (let i = 0; i < STRIPS; i++) {
    const z = STRIP_Z(i);
    box(.15, .05, 1.08, housing, 0, CEIL - .2, z);
    const m = new THREE.MeshBasicMaterial({ color: 0x0b0d10, toneMapped: false }); stripMats.push(m);
    mesh(new THREE.BoxGeometry(.1, .012, 1.03), m, 0, CEIL - .229, z);
    mesh(new THREE.BoxGeometry(.1, .05, 1.03), m, 0, 2 * F - (CEIL - .229), z);
    for (const dz of [-.44, .44]) mesh(new THREE.CylinderGeometry(.004, .004, .15, 4), housing, 0, CEIL - .1, z + dz);
    const sm = new THREE.MeshBasicMaterial({ map: shaftT, color: new THREE.Color(.55, .7, 1), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const sh = mesh(wedge(.1, 1.75, CEIL - .24, F + .04, 1.02), sm, 0, 0, z); sh.renderOrder = 2; shaftMats.push(sm);
  }

  // ---- the end wall: two red beacons for when the power goes, a board that counts who is in the room
  const beacon = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .02, .02), toneMapped: false });
  for (const bx of [-1.7, 1.7]) { box(.16, .1, .08, steelDark, bx, 1.86, BACK_Z + .05); mesh(new THREE.BoxGeometry(.12, .07, .02), beacon, bx, 1.86, BACK_Z + .1); }
  const board = { W: 640, H: 200, key: '' }; board.c = document.createElement('canvas'); board.c.width = board.W; board.c.height = board.H; board.g = board.c.getContext('2d');
  board.t = new THREE.CanvasTexture(board.c); board.t.colorSpace = THREE.SRGBColorSpace; board.t.anisotropy = 8;
  const bd = new THREE.Group(); bd.position.set(.1, 1.7, -.42); scene.add(bd);
  box(1.06, .36, .05, steelDark, 0, 0, -.03, bd); mesh(new THREE.PlaneGeometry(1.0, .3125), new THREE.MeshBasicMaterial({ map: board.t, toneMapped: false, color: new THREE.Color(1.2, 1.2, 1.2) }), 0, 0, 0, bd);
  for (const cx of [-.4, .4]) mesh(new THREE.CylinderGeometry(.005, .005, CEIL - 1.88, 6), steelDark, cx, (CEIL - 1.7 + .18) / 2, -.03, bd);
  // the cameras: a white body on a dark mount, the lens at +z so lookAt aims it; they turn to follow you
  const camBody = std({ color: 0xd9d6cc, roughness: .5 }), cams = [];
  const cctvAt = (x, y, z, ledOn) => {
    const base = new THREE.Group(); base.position.set(x, y, z); scene.add(base);
    box(.035, .07, .035, steelDark, 0, .035, 0, base);
    const head = new THREE.Group(); base.add(head);
    box(.075, .075, .17, camBody, 0, 0, .06, head); box(.09, .012, .19, camBody, 0, .045, .07, head);
    mesh(new THREE.CylinderGeometry(.024, .024, .012, 16), black, 0, 0, .148, head).rotation.x = Math.PI / 2;
    const lensGlint = mesh(new THREE.SphereGeometry(.012, 12, 8), std({ color: 0x0a0f14, roughness: .05, metalness: .6 }), 0, 0, .15, head);
    const led = new THREE.MeshBasicMaterial({ color: 0x150404, toneMapped: false }); mesh(new THREE.BoxGeometry(.008, .008, .004), led, .026, .026, .147, head);
    const c = { base, head, led, ledOn, rest: new THREE.Quaternion() }; cams.push(c); return c;
  };
  // the one nobody signed in: a hooded shape, backlit, only there while the power is out
  const figT = tex(256, 704, (g, w, h) => {
    const X = v => w * v, Y = v => h * v;
    const path = () => { g.beginPath(); g.moveTo(X(.52), Y(.035));
      g.bezierCurveTo(X(.66), Y(.03), X(.72), Y(.1), X(.69), Y(.17));                    // hood, right
      g.bezierCurveTo(X(.68), Y(.19), X(.72), Y(.2), X(.86), Y(.225));                    // into the shoulder
      g.bezierCurveTo(X(.97), Y(.25), X(.99), Y(.33), X(.97), Y(.45));                    // right arm
      g.bezierCurveTo(X(.96), Y(.52), X(.95), Y(.56), X(.93), Y(.58));                    // hand
      g.bezierCurveTo(X(.9), Y(.6), X(.87), Y(.56), X(.86), Y(.5));
      g.bezierCurveTo(X(.85), Y(.62), X(.84), Y(.8), X(.88), Y(.97));                     // coat, right
      g.lineTo(X(.8), Y(.995)); g.lineTo(X(.7), Y(.975)); g.lineTo(X(.58), Y(.998)); g.lineTo(X(.45), Y(.978)); g.lineTo(X(.32), Y(.996)); g.lineTo(X(.2), Y(.975));
      g.bezierCurveTo(X(.16), Y(.8), X(.15), Y(.62), X(.14), Y(.5));                      // coat, left
      g.bezierCurveTo(X(.13), Y(.56), X(.1), Y(.6), X(.07), Y(.58));
      g.bezierCurveTo(X(.05), Y(.56), X(.04), Y(.52), X(.03), Y(.45));                    // left arm
      g.bezierCurveTo(X(.01), Y(.33), X(.04), Y(.25), X(.15), Y(.225));
      g.bezierCurveTo(X(.29), Y(.2), X(.33), Y(.19), X(.32), Y(.17));
      g.bezierCurveTo(X(.29), Y(.1), X(.36), Y(.04), X(.52), Y(.035)); g.closePath(); };
    g.filter = 'blur(10px)'; g.fillStyle = 'rgba(255,52,34,.42)'; path(); g.fill();
    g.filter = 'blur(3px)'; g.fillStyle = 'rgba(255,90,60,.35)'; path(); g.fill();
    g.filter = 'blur(1.5px)'; g.fillStyle = '#020203'; g.save(); g.translate(X(.5), Y(.6)); g.scale(.955, .975); g.translate(-X(.5), -Y(.6)); path(); g.fill(); g.restore(); g.filter = 'none';
    const fade = g.createLinearGradient(0, Y(.82), 0, h); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, Y(.82), w, h); g.globalCompositeOperation = 'source-over';
  });
  const figure = new THREE.Sprite(new THREE.SpriteMaterial({ map: figT, transparent: true, depthWrite: false })); figure.scale.set(.74, 1.84, 1); figure.visible = false; scene.add(figure);

  // ---- the end of the aisle: a UPS cabinet, the gas bottle, the bench with the PC
  const ups = new THREE.Group(); ups.position.set(-ROOM_X + .46, F, 1.0); scene.add(ups);
  box(.9, 1.9, .7, std({ color: 0x1b1d21, roughness: .6, metalness: .3 }), 0, .95, 0, ups).rotation.y = Math.PI / 2;
  const lcd = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .7, 1.4), toneMapped: false });
  mesh(new THREE.PlaneGeometry(.16, .06), lcd, .36, 1.42, 0, ups).rotation.y = Math.PI / 2;
  const upsLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, 2.4, .7), toneMapped: false });
  for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(.004, .01, .01), upsLed, .356, 1.3, -.05 + i * .05, ups);
  for (let i = 0; i < 5; i++) box(.002, .5, .6, std({ color: 0x0c0d0f, roughness: .7 }), .352, .5 + i * .004, 0, ups);
  const gas = new THREE.Group(); gas.position.set(ROOM_X - .35, F, 1.55); scene.add(gas);
  const red = std({ color: 0x9a1f17, roughness: .38, metalness: .2 });
  mesh(new THREE.CylinderGeometry(.17, .17, 1.3, 32), red, 0, .65, 0, gas); mesh(new THREE.SphereGeometry(.17, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), red, 0, 1.3, 0, gas);
  mesh(new THREE.CylinderGeometry(.04, .05, .14, 16), steel, 0, 1.52, 0, gas);
  mesh(new THREE.CylinderGeometry(.045, .045, .02, 20), std({ color: 0xe8e4d8, roughness: .5 }), -.13, 1.45, .1, gas).rotation.x = Math.PI / 2;
  box(.5, .03, .08, steelDark, 0, 1.0, -.16, gas);

  // the bench: a steel workbench, legs, a shelf with a UPS brick under it
  const benchTop = std({ map: concrete('#4d535b', [2, 1]), color: 0xc4c9d0, roughness: .42, metalness: .3 });
  pmesh(new THREE.BoxGeometry(2.6, .05, 1.3), benchTop, 0, -.025, 0);
  pmesh(new THREE.BoxGeometry(2.62, .07, .03), steel, 0, -.035, .665);
  for (const lx of [-1.25, 1.25]) for (const lz of [-.6, .6]) box(.05, -.05 - F, .05, steel, lx, (F - .05) / 2, lz);
  box(2.5, .03, 1.15, steelDark, 0, F + .2, 0);
  box(.46, .24, .5, black, .75, F + .335, -.05); mesh(new THREE.BoxGeometry(.01, .01, .004), upsLed, .65, F + .4, .202);
  box(.6, .16, .4, std({ color: 0x23262b, roughness: .8 }), -.7, F + .295, .05);
  // the PC
  const pc = new THREE.Group(); scene.add(pc);
  pmesh(new RoundedBoxGeometry(.98, .2, .78, 4, .02), plastic, 0, .1, -.12, pc);
  const front = (w, h, x, y, m = black) => pmesh(new THREE.BoxGeometry(w, h, .01), m, x, y, .272, pc);
  front(.3, .016, .2, .12); front(.3, .016, .2, .07); front(.12, .03, -.3, .1, dark);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x0b2614, toneMapped: false }), hddMat = new THREE.MeshBasicMaterial({ color: 0x2a1c08, toneMapped: false });
  mesh(new THREE.BoxGeometry(.014, .014, .01), ledMat, -.42, .06, .274, pc); mesh(new THREE.BoxGeometry(.014, .014, .01), hddMat, -.39, .06, .274, pc);
  for (let i = 0; i < 7; i++) front(.004, .1, -.15 + i * .018, .1, dark);
  const mon = new THREE.Group(); mon.position.set(0, .26, -.05); pc.add(mon);
  pmesh(new THREE.CylinderGeometry(.16, .2, .05, 32), plastic2, 0, -.035, -.05, mon);
  pmesh(new RoundedBoxGeometry(.8, .64, .1, 5, .03), plastic, 0, .32, .06, mon);
  const back = new THREE.BoxGeometry(.74, .58, .5); const p = back.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * .66); p.setY(i, p.getY(i) * .7 + .02); }
  back.computeVertexNormals(); pmesh(back, plastic2, 0, .32, -.2, mon);
  pmesh(new THREE.BoxGeometry(.64, .49, .02), std({ color: 0x1a1a18, roughness: .4 }), 0, .335, .105, mon);
  const monLed = new THREE.MeshBasicMaterial({ color: 0x2a1c08, toneMapped: false }); mesh(new THREE.BoxGeometry(.012, .012, .01), monLed, .23, .045, .116, mon);
  const term = new Terminal(); term.first = true;
  const sg = new THREE.PlaneGeometry(.6, .45, 24, 18); const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i) / .3, y = sp.getY(i) / .225; sp.setZ(i, .016 * (1 - .5 * (x * x + y * y))); }
  sg.computeVertexNormals();
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: term.t, toneMapped: false, color: new THREE.Color(1.45, 1.45, 1.45) })); screen.position.set(0, .335, .118); mon.add(screen);
  // keyboard, with every key its own instance so typing can press it
  const kb = new THREE.Group(); kb.position.set(0, .018, .43); kb.rotation.x = .05; scene.add(kb);
  pmesh(new RoundedBoxGeometry(.86, .03, .27, 3, .01), plastic, 0, 0, 0, kb);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(.034, .014, .034), plastic2, 120); let n = 0; const base = [], kidx = {};
  for (let r = 0; r < 6; r++) for (let c = 0; c < 20; c++) { if (r === 5 && c > 3 && c < 12) continue; M.makeTranslation(-.38 + c * .04, .021, -.1 + r * .042); keys.setMatrixAt(n, M); base[n] = M.clone(); kidx[r + ':' + c] = n; n++; }
  M.makeScale(8, 1, 1).setPosition(-.06, .021, .11); keys.setMatrixAt(n, M); base[n] = M.clone(); kidx.space = n; n++;
  keys.count = n; keys.castShadow = keys.receiveShadow = SH; kb.add(keys);
  pmesh(new RoundedBoxGeometry(.12, .05, .2, 4, .024), plastic, .72, .025, .47);
  for (const sx of [-.66, .66]) { const g = new THREE.Group(); g.position.set(sx, 0, -.12); g.rotation.y = -sx * .35; scene.add(g);
    pmesh(new RoundedBoxGeometry(.17, .28, .18, 3, .015), plastic2, 0, .14, 0, g);
    pmesh(new THREE.CylinderGeometry(.052, .052, .01, 28), std({ color: 0x1c1c1c, roughness: .8 }), 0, .17, .092, g).rotation.x = Math.PI / 2; }
  const mug = new THREE.Group(); mug.position.set(-.8, 0, .28); mug.scale.setScalar(1.9); scene.add(mug);
  pmesh(new THREE.CylinderGeometry(.045, .042, .1, 32, 1, true), std({ color: 0x6b2a24, roughness: .45, side: THREE.DoubleSide }), 0, .05, 0, mug);
  pmesh(new THREE.CylinderGeometry(.042, .042, .004, 32), std({ color: 0x1a0d08, roughness: .2 }), 0, .085, 0, mug);
  pmesh(new THREE.TorusGeometry(.028, .008, 10, 24, Math.PI), std({ color: 0x6b2a24, roughness: .45 }), .045, .05, 0, mug).rotation.z = -Math.PI / 2;
  [0x1b1c22, 0x23407a, 0x8a8c94].forEach((c, i) => { const f = pmesh(new THREE.BoxGeometry(.18, .007, .18), std({ color: c, roughness: .5 }), -.62 + i * .01, .004 + i * .007, .5 - i * .006); f.rotation.y = .3 - i * .12; pmesh(new THREE.BoxGeometry(.13, .002, .085), std({ color: 0xe9e4d8, roughness: .9 }), 0, .0045, .035, f); });
  const books = new THREE.Group(); books.position.set(-1.0, 0, -.3); books.rotation.y = .12; scene.add(books);
  [[0x5a1f22, .5, .07], [0x1d2a4a, .46, .06], [0x7a5a22, .52, .05]].reduce((y, [c, w, h], i) => { pmesh(new THREE.BoxGeometry(w, h, .34), std({ color: c, roughness: .8 }), (i % 2) * .02, y + h / 2, 0, books).rotation.y = (i - 1) * .06; return y + h; }, 0);
  const tapes = new THREE.Group(); tapes.position.set(1.02, 0, -.28); tapes.rotation.y = -.2; scene.add(tapes);
  for (let i = 0; i < 4; i++) { pmesh(new THREE.BoxGeometry(.105, .022, .1), std({ color: i % 2 ? 0x1f4f8a : 0x17191d, roughness: .5 }), (rnd() - .5) * .01, .011 + i * .023, 0, tapes).rotation.y = (rnd() - .5) * .15; }
  // the bench lamp: an enamel shade on a cord, its bulb, its light
  const head = V(-.22, 1.42, .64), aim = V(.04, .2, .12);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0x241a0c, toneMapped: false });
  const shade = new THREE.Group(); shade.position.set(head.x, head.y + .06, head.z); shade.quaternion.setFromUnitVectors(V(0, -1, 0), aim.clone().sub(head).normalize()); scene.add(shade);
  mesh(new THREE.CylinderGeometry(.05, .19, .15, 32, 1, true), std({ color: 0x1d3a2c, roughness: .45, metalness: .3, side: THREE.DoubleSide }), 0, 0, 0, shade);
  mesh(new THREE.SphereGeometry(.034, 16, 12), bulbMat, 0, -.05, 0, shade);
  mesh(new THREE.CylinderGeometry(.004, .004, CEIL - head.y - .12, 6), cable, head.x, (CEIL + head.y + .12) / 2, head.z);

  // ---- the door wall of room 00, its two leaves sliding into it, the reader, the sign
  const wallMat = std({ map: concrete('#2a2d33', [3, 1.5]), roughness: .9 });
  box(ROOM_X - OW, CEIL - F, WT, wallMat, -(OW + (ROOM_X - OW) / 2), (F + CEIL) / 2, DOOR_Z);
  box(ROOM_X - OW, CEIL - F, WT, wallMat, OW + (ROOM_X - OW) / 2, (F + CEIL) / 2, DOOR_Z);
  box(OW * 2, CEIL - F - OH, WT, wallMat, 0, (F + OH + CEIL) / 2, DOOR_Z);
  box(OW * 2, .012, WT + .1, steel, 0, F + .006, DOOR_Z);
  const under = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 1.3, 1.5), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glowT = tex(256, 64, (g, w, h) => { const r = g.createLinearGradient(0, h, 0, 0); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    const s = g.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(.12, 'rgba(0,0,0,0)'); s.addColorStop(.88, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = s; g.fillRect(0, 0, w, h); });
  under.map = glowT;
  const underGlow = plane(OW * 2, .07, under, 0, F + .035, DOOR_Z + WT / 2 + .075);
  plane(OW * 2, .5, new THREE.MeshBasicMaterial({ map: glowT, color: new THREE.Color(.04, .12, .14), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 0, F + .003, DOOR_Z + WT / 2 + .25, -Math.PI / 2);
  box(.05, .05, .12, steelDark, -.62, F + OH + .5, DOOR_Z + WT / 2 + .06);
  cctvAt(-.62, F + OH + .42, DOOR_Z + WT / 2 + .14, 'door'); cctvAt(.7, CEIL - .3, DOOR_Z - .5, 'room'); cctvAt(-.78, CEIL - .3, ROW_Z0 + .25, 'room');
  const LW = .77, PXM = 256 / LW, PYM = 732 / OH;
  const leafTex = (left, faceFront) => tex(256, 732, (g, w, h) => {
    g.fillStyle = faceFront ? '#8e959d' : '#767c84'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { const y = rnd() * h, a = rnd() * .07; g.fillStyle = rnd() < .5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; g.fillRect(0, y, w, 1); }
    const kp = .3 * PYM; g.fillStyle = 'rgba(28,31,36,.55)'; g.fillRect(0, h - kp, w, kp);
    g.fillStyle = 'rgba(255,255,255,.07)'; for (let y = h - kp + 6; y < h; y += 12) for (let x = (y / 12 % 2) * 6; x < w; x += 12) g.fillRect(x, y, 6, 2);
    const gr = g.createLinearGradient(0, h * .55, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const seamRight = left === faceFront, wc = (seamRight ? .185 : -.185) + LW / 2;
    const wx = (wc - .065) * PXM, ww = .13 * PXM, wy = (OH / 2 - .38 - .31) * PYM, wh = .62 * PYM;
    g.fillStyle = '#23272c'; g.fillRect(wx - 7, wy - 7, ww + 14, wh + 14);
    g.fillStyle = '#0b0c0e'; g.fillRect(seamRight ? w - 5 : 0, 0, 5, h);
    if (faceFront) {
      const cx = ((left ? .12 : -.12) + LW / 2) * PXM, cy = (OH / 2 + .33) * PYM;   // a stencilled 0 on each leaf: shut, they read 00
      g.strokeStyle = 'rgba(214,168,36,.9)'; g.lineWidth = .06 * PXM; g.beginPath(); g.ellipse(cx, cy, .1 * PXM, .19 * PYM, 0, 0, 7); g.stroke();
      g.fillStyle = faceFront ? '#8e959d' : '#767c84'; g.fillRect(cx - 4, cy - .19 * PYM - 14, 8, 28); g.fillRect(cx - 4, cy + .19 * PYM - 14, 8, 28);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(142,149,157,${.5 + rnd() * .5})`; g.fillRect(cx - 50 + rnd() * 100, cy - 80 + rnd() * 160, 1 + rnd() * 3, 1 + rnd() * 2); }
      if (!left) {
        const px = (.12 + LW / 2) * PXM - 36, py = (OH / 2 - .62) * PYM - 16;
        g.fillStyle = '#d6b23a'; g.fillRect(px, py, 72, 34); g.fillStyle = '#16140f'; g.font = '13px VT, monospace'; g.textBaseline = 'top';
        g.fillText('NO NAMES', px + 9, py + 4); g.fillText('NO LOGS', px + 12, py + 18);
      }
    }
    g.clearRect(wx, wy, ww, wh);
  });
  const glass = std({ color: 0x0e161d, roughness: .06, metalness: .1, transparent: true, opacity: .3, depthWrite: false });
  const leaves = [true, false].map(left => {
    const gp = new THREE.Group(); gp.position.set(left ? -LW / 2 : LW / 2, F + OH / 2, DOOR_Z); scene.add(gp);
    const mk = ft => std({ map: leafTex(left, ft), roughness: .38, metalness: .5, alphaTest: .5 });
    plane(LW, OH, mk(true), 0, 0, .026, 0, 0, gp);
    plane(LW, OH, mk(false), 0, 0, -.026, 0, Math.PI, gp);
    box(.012, OH, .052, steelDark, left ? -LW / 2 : LW / 2, 0, 0, gp);
    box(LW, .012, .052, steelDark, 0, OH / 2, 0, gp); box(LW, .012, .052, steelDark, 0, -OH / 2, 0, gp);
    plane(.13, .62, glass, left ? .185 : -.185, .38, 0, 0, 0, gp);
    return gp;
  });
  const hazard = tex(64, 512, (g, w, h) => { g.fillStyle = '#c8a334'; g.fillRect(0, 0, w, h); g.fillStyle = '#141414';
    for (let y = -64; y < h + 64; y += 56) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y - 40); g.lineTo(w, y - 12); g.lineTo(0, y + 28); g.closePath(); g.fill(); } grain(g, w, h, 900, .2); }, [1, 3]);
  const jamb = std({ map: hazard, roughness: .7 });
  for (const sx of [-1, 1]) box(.09, OH + .09, .07, jamb, sx * (OW + .045), F + (OH + .09) / 2, DOOR_Z + WT / 2 + .035);
  box(OW * 2 + .18, .09, .07, steelDark, 0, F + OH + .045, DOOR_Z + WT / 2 + .035);
  const signT = tex(512, 128, (g, w, h) => { g.fillStyle = '#04100c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(98,240,200,.45)'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    g.font = '80px VT, monospace'; g.textBaseline = 'middle'; g.fillStyle = '#c9fff0'; g.shadowColor = '#62f0c8'; g.shadowBlur = 18; const s = 'ROOM 00'; g.fillText(s, (w - g.measureText(s).width) / 2, h / 2 + 4); });
  box(.66, .18, .05, steelDark, 0, F + OH + .33, DOOR_Z + WT / 2 + .025);
  plane(.62, .155, new THREE.MeshBasicMaterial({ map: signT, toneMapped: false, color: new THREE.Color(1.5, 1.5, 1.5) }), 0, F + OH + .33, DOOR_Z + WT / 2 + .052);
  // the reader: a dark box, its screen, the tap target, a LED, the card that swipes in from your hand
  const reader = new THREE.Group(); reader.position.set(1.06, .52, DOOR_Z + WT / 2); scene.add(reader);
  mesh(new RoundedBoxGeometry(.2, .33, .036, 3, .008), std({ color: 0x1a1c20, roughness: .45, metalness: .4 }), 0, 0, .018, reader);
  const panel = new Panel();
  mesh(new THREE.PlaneGeometry(.16, .12), new THREE.MeshBasicMaterial({ map: panel.t, toneMapped: false }), 0, .07, .0365, reader);
  const tapT = tex(128, 128, (g, w, h) => { g.fillStyle = '#121418'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(214,220,226,.7)'; g.lineWidth = 6;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(40, 64, 16 + i * 16, -.8, .8); g.stroke(); } g.strokeStyle = 'rgba(214,220,226,.25)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20); });
  mesh(new THREE.PlaneGeometry(.085, .085), std({ map: tapT, roughness: .5 }), 0, -.085, .0365, reader);
  const panelLed = new THREE.MeshBasicMaterial({ color: 0xff2010, toneMapped: false });
  mesh(new THREE.BoxGeometry(.014, .008, .006), panelLed, 0, .148, .037, reader);
  const panelLight = new THREE.PointLight(0xff3020, .12, 1.2, 2); panelLight.position.set(0, -.02, .3); reader.add(panelLight);
  const cardT = tex(344, 216, (g, w, h) => {
    g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ece3cb'); gr.addColorStop(1, '#cdbf9c'); g.fillStyle = gr;
    g.beginPath(); g.roundRect ? g.roundRect(0, 0, w, h, 18) : g.rect(0, 0, w, h); g.fill();
    let x0 = 24; for (const ch of 'dao') { GLYPHS[ch].forEach((row, ry) => [...row].forEach((c, rx) => { if (c === 'X') { g.fillStyle = '#1d1a14'; g.fillRect(x0 + rx * 7, 22 + ry * 7, 6, 6); } })); x0 += 8 * 7; }
    g.fillStyle = '#c4a24c'; g.fillRect(w - 88, 30, 56, 44); g.strokeStyle = 'rgba(80,60,20,.6)'; g.lineWidth = 2; g.strokeRect(w - 88, 30, 56, 44); g.beginPath(); g.moveTo(w - 60, 30); g.lineTo(w - 60, 74); g.moveTo(w - 88, 52); g.lineTo(w - 32, 52); g.stroke();
    g.textBaseline = 'top'; g.fillStyle = '#5a5340'; g.font = '22px VT, monospace'; g.fillText('ROOM 00 · ACCESS', 24, 108);
    g.fillStyle = '#1d1a14'; g.font = '30px VT, monospace'; g.fillText('HOLDER: NOBODY', 24, 140);
    g.fillStyle = '#6d6650'; g.font = '19px VT, monospace'; g.fillText('no name · no photo · no log', 24, 180);
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(.086, .054), std({ map: cardT, roughness: .42, alphaTest: .5, emissive: 0xffffff, emissiveMap: cardT, emissiveIntensity: .05, side: THREE.DoubleSide }));
  card.visible = false; scene.add(card);

  // ---- the corridor: concrete, a painted dado, a red night light, pipes, an extinguisher
  const corrWall = tex(512, 512, (g, w, h) => { g.fillStyle = '#3b3e44'; g.fillRect(0, 0, w, h); const d = h * (1 - 1.15 / (CORR - F)); g.fillStyle = '#1e2a2b'; g.fillRect(0, d, w, h - d);
    g.fillStyle = '#b89324'; g.fillRect(0, d - 6, w, 6); grain(g, w, h, 20000, .08); }, [2.2, 1]);
  const cw = std({ map: corrWall, roughness: .85 });
  for (const sx of [-1, 1]) plane(6.4, CORR - F, cw, sx * 1.5, (F + CORR) / 2, DOOR_Z + WT / 2 + 3.2, 0, -sx * Math.PI / 2);
  const cfloor = plane(3, 6.4, std({ map: concrete('#2b2c2f', [2, 4]), roughness: .34, metalness: .1 }), 0, F, DOOR_Z + WT / 2 + 3.2, -Math.PI / 2);
  plane(3, 6.4, std({ map: concrete('#17181b', [2, 4]), roughness: .9 }), 0, CORR, DOOR_Z + WT / 2 + 3.2, Math.PI / 2);
  const band = tex(512, 128, (g, w, h) => { g.fillStyle = '#c8a334'; g.fillRect(0, 0, w, h); g.fillStyle = '#121212';
    for (let x = -128; x < w + 128; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 0); g.lineTo(x - 32 + 64, h); g.lineTo(x - 64 + 32, h); g.closePath(); g.fill(); }
    for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(43,44,47,${rnd() * .9})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 3); } });
  plane(1.7, .32, std({ map: band, roughness: .6 }), 0, F + .003, DOOR_Z + WT / 2 + .2, -Math.PI / 2);
  const nightLens = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, .25, .12), toneMapped: false });
  box(.34, .06, .12, steelDark, 0, CORR - .03, 12.45); mesh(new THREE.BoxGeometry(.28, .02, .08), nightLens, 0, CORR - .07, 12.45);
  for (const [y, r] of [[1.42, .03], [1.52, .022]]) { const pp = mesh(new THREE.CylinderGeometry(r, r, 6.4, 12), steel, -1.45, y, DOOR_Z + WT / 2 + 3.2); pp.rotation.x = Math.PI / 2; }
  const ext = new THREE.Group(); ext.position.set(-1.38, F + .3, 11.9); scene.add(ext);
  mesh(new THREE.CylinderGeometry(.075, .075, .5, 24), red, 0, .25, 0, ext); mesh(new THREE.CylinderGeometry(.03, .045, .07, 12), black, 0, .53, 0, ext);
  box(.03, .02, .16, steelDark, -.06, .4, 0, ext);
  box(.14, .2, .06, steelDark, 1.47, .35, 12.2);

  // ---- light
  const hemi = new THREE.HemisphereLight(0x1b2536, 0x060504, .1); scene.add(hemi);
  const aisle = [[0, 1], [2, 3, 4], [5, 6]].map(ix => { const z = ix.reduce((a, i) => a + STRIP_Z(i), 0) / ix.length; const l = new THREE.PointLight(0xd3e4ff, 0, 7.5, 2); l.position.set(0, CEIL - .5, z); scene.add(l); return { l, ix }; });
  const spill = new THREE.SpotLight(0xcfe2ff, 0, 9, .55, .7, 2); spill.position.set(0, 1.12, DOOR_Z - .9); spill.target.position.set(0, F, DOOR_Z + 3.4); scene.add(spill, spill.target);
  const night = new THREE.PointLight(0xff2a16, 2.3, 9.5, 2); night.position.set(0, CORR - .22, 12.45); scene.add(night);
  const lamp = new THREE.SpotLight(0xffc06a, 0, 0, .66, .9, 2); lamp.position.copy(head).add(aim.clone().sub(head).normalize().multiplyScalar(.06)); lamp.target.position.copy(aim);
  lamp.castShadow = SH; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -.0015; lamp.shadow.radius = 4; scene.add(lamp, lamp.target);
  const glow = new THREE.PointLight(0x62f0c8, 0, 0, 2); glow.position.set(0, .52, .95); scene.add(glow);
  const fill = new THREE.SpotLight(0xffd9a8, 0, 0, .32, .9, 2); fill.position.set(-1.4, 1.5, 1.9); fill.target.position.set(.05, .45, 0); scene.add(fill, fill.target);

  // ---- air: cold haze down the aisle, warm dust in the lamp, a little steam off the mug
  const puff = tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const HN = mobile ? 70 : 150, hzp = new Float32Array(HN * 3);
  for (let i = 0; i < HN; i++) { hzp[i * 3] = (rnd() - .5) * 1.7; hzp[i * 3 + 1] = F + .25 + rnd() * 2.2; hzp[i * 3 + 2] = 1 + rnd() * 10; }
  const hzg = new THREE.BufferGeometry(); hzg.setAttribute('position', new THREE.BufferAttribute(hzp, 3));
  const hazeMat = new THREE.PointsMaterial({ map: puff, color: 0x7f9cc4, size: 1.35, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const haze = new THREE.Points(hzg, hazeMat); haze.renderOrder = 3; scene.add(haze);
  const mistT = tex(512, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 140, a = .04 + rnd() * .2;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } } });
  const mist = [[.03, .2], [.13, .13], [.26, .08]].map(([y, k], i) => {
    const t = mistT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6 + i * .4, 3.6 + i * .7); t.needsUpdate = true;
    const m = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(.55, .66, .82), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const pl = plane(ROOM_X * 2 - .2, DOOR_Z - .2 - (END_Z + .1), m, 0, F + y, (DOOR_Z - .2 + END_Z + .1) / 2, -Math.PI / 2); pl.renderOrder = 1; return { m, t, k, i };
  });
  const dg = new THREE.BufferGeometry(), N = mobile ? 60 : 170, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - .5) * 1.6 - .2; pos[i * 3 + 1] = rnd() * 1.2; pos[i * 3 + 2] = (rnd() - .5) * 1.2 + .1; }
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffe2b0, size: .006, transparent: true, opacity: 0, depthWrite: false }); const dust = new THREE.Points(dg, dustMat); scene.add(dust);
  const steam = Array.from({ length: 6 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, opacity: 0, depthWrite: false, color: 0xd8d2c4 })); s.userData.o = i / 6; scene.add(s); return s; });
  return { floors, ledsM, shaftMats, beacon, board, cams, figure, mist, underGlow, term, panel, panelLed, panelLight, card, leaves, stripMats, aisle, spill, night, hemi, hazeMat, haze, leds, LD, ledMat, hddMat, monLed, glow, dust, dustMat, steam, lamp, bulbMat, fill, keys, base, kidx, screen, lcd };
}

// ---------------------------------------------------------------- camera: marks in time, joined by a monotone cubic so it never overshoots
function track(K) {
  const T = K.map(k => k[0]), n = K.length;
  const chan = get => {
    const y = K.map(get), m = new Float64Array(n);
    for (let i = 1; i < n - 1; i++) {
      const h0 = T[i] - T[i - 1], h1 = T[i + 1] - T[i], s0 = (y[i] - y[i - 1]) / h0, s1 = (y[i + 1] - y[i]) / h1;
      if (s0 * s1 <= 0) continue;
      const pp = (s0 * h1 + s1 * h0) / (h0 + h1); m[i] = 2 * Math.sign(s0) * Math.min(Math.abs(s0), Math.abs(s1), .5 * Math.abs(pp));
    }
    return t => {
      if (t <= T[0]) return y[0]; if (t >= T[n - 1]) return y[n - 1];
      let i = 0; while (t > T[i + 1]) i++;
      const h = T[i + 1] - T[i], u = (t - T[i]) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (3 * u2 - 2 * u3) * y[i + 1] + (u3 - u2) * h * m[i + 1];
    };
  };
  const px = chan(k => k[1].x), py = chan(k => k[1].y), pz = chan(k => k[1].z), lx = chan(k => k[2].x), ly = chan(k => k[2].y), lz = chan(k => k[2].z), fv = chan(k => k[3]);
  const last = K[n - 1];
  return { at: t => ({ pos: V(px(t), py(t), pz(t)), look: V(lx(t), ly(t), lz(t)), fov: fv(t) }), end: [last[1], last[2]], fov1: last[3], T: last[0] };
}
// two tracks: the access film (corridor, reader, the doorway), then the walk down the aisle, which your scroll drives
const A_END = 5.9;
function shots(portrait) {
  const K = portrait ? {
    a: [[0, V(.36, .92, 16.2), V(.36, .5, 11.2), 58], [1.0, V(.55, .86, 15.0), V(.62, .52, 11.2), 56], [2.15, V(1.0, .66, 12.6), V(1.05, .52, 11.2), 50],
      [3.3, V(.97, .68, 12.5), V(1.02, .54, 11.2), 50], [4.6, V(.3, .86, 12.4), V(0, .72, 9), 58], [A_END, V(.02, .92, 10.85), V(0, .72, 6), 60]],
    w: [[A_END, V(.02, .92, 10.85), V(0, .72, 6), 60], [8.9, V(.04, .96, 7.8), V(0, .6, 2), 56], [11.9, V(.03, .95, 5.1), V(0, .5, .2), 50], [15.3, V(0, .86, 2.78), V(0, .5, 0), 46]],
  } : {
    a: [[0, V(.42, .9, 15.3), V(.4, .56, 11.2), 44], [1.0, V(.55, .85, 14.2), V(.62, .54, 11.2), 42], [2.15, V(.78, .74, 12.48), V(.98, .52, 11.2), 40],
      [3.3, V(.72, .75, 12.32), V(.86, .55, 11.2), 40], [4.6, V(.2, .86, 12.0), V(0, .72, 9), 45], [A_END, V(.02, .92, 10.55), V(0, .72, 6), 48]],
    w: [[A_END, V(.02, .92, 10.55), V(0, .72, 6), 48], [8.9, V(.05, .95, 7.2), V(0, .6, 2), 46], [11.9, V(.04, .93, 4.2), V(-.12, .52, .2), 38], [15.3, V(.04, .84, 2.5), V(-.32, .5, .02), 31]],   // the pc sits right of centre so the last panel can sit left of it
  };
  const a = track(K.a), w = track(K.w), d = K.a[K.a.length - 1];
  return { a, w, door: [d[1], d[2], d[3]], end: w.end, fov1: w.fov1, T: w.T };
}
// where the walk sets things off, as a share of the scroll: the power cut, the lamp, the CRT, hurrying the boot, the prompt
const P_BO = .2, P_LAMP = .3, P_CRT = .4, P_RUSH = .93, P_END = .985, BO_LEN = .72;

// what the room looks like at room time ft: the card in your hand, the leaves, each strip catching, the lamp
const CARD_A = V(1.34, .16, 12.3), CARD_B = V(1.06, .44, DOOR_Z + WT / 2 + .06), CARD_C = V(1.4, .1, 12.32);
function cardPose(ft, o) {
  if (ft < TL.cardIn || ft > TL.cardOut + .55) return false;
  if (ft < TL.tap) { const k = easeOut((ft - TL.cardIn) / (TL.tap - TL.cardIn)); o.p.copy(CARD_A).lerp(CARD_B, k); o.rx = -.9 * (1 - k); o.rz = .55 * (1 - k) + .05; }
  else if (ft < TL.cardOut) { const k = (ft - TL.tap) / (TL.cardOut - TL.tap); o.p.copy(CARD_B); o.p.z += .005 * Math.sin(k * Math.PI); o.rx = 0; o.rz = .05; }
  else { const k = easeIn(clamp01((ft - TL.cardOut) / .55)); o.p.copy(CARD_B).lerp(CARD_C, k); o.rx = -.8 * k; o.rz = .05 + .45 * k; }
  return true;
}
const doorK = ft => { const a = (ft - TL.door - .06) / 1.2; return a <= 0 ? 0 : a >= 1 ? 1 : ease(a); };
const flicker = ft => { const s = Math.floor(ft * 13); return hsh(5, s) < .06 ? .1 : hsh(6, Math.floor(ft * 2.1)) < .2 ? (hsh(7, s) < .5 ? .25 : 1) : 1; };
function stripK(i, ft, bo) {
  const a = ft - (TL.strips + i * TL.gap); if (a < 0) return 0;
  let v = a < .04 ? .85 : a < .1 ? .04 : a < .13 ? .6 : a < .21 ? .08 : Math.min(1, .75 + (a - .21) * 2.5);
  if (i === DEAD) v = a < .5 ? v * (hsh(9, Math.floor(a * 30)) < .55 ? 1 : .08) : a < .64 ? (hsh(11, Math.floor(a * 45)) < .5 ? 1.25 : 0) : 0;
  if (i === BAD && a > .3) v *= flicker(ft);
  if (bo != null) { const b = ft - bo; if (b > 0) { if (b < BO_LEN) v *= b < .05 ? .35 : 0; else { const r = b - BO_LEN - i * .05; v *= r < 0 ? 0 : r < .05 ? .9 : r < .1 ? .08 : 1; } } }
  return v;
}
function lampK(a) { if (a < 0) return 0; if (a < .06) return 1; if (a < .14) return .15; if (a < .22) return .9; if (a < .3) return .4; return Math.min(1, .7 + a); }

// ---------------------------------------------------------------- the film grade, after tone mapping
const FilmShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: .05 }, ca: { value: .0011 }, vig: { value: .45 }, red: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, grain, ca, vig, red; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - .5; float r = length(d);
      vec2 o = d * ca * (1.0 + 7.0 * r * r);
      vec3 c = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      c *= 1.0 - vig * smoothstep(.32, .95, r * 1.32);
      c = mix(c, c * vec3(1.35, .5, .45), red);
      float n = h(gl_FragCoord.xy + fract(time * 7.13) * 431.0) - .5;
      c += n * grain * (1.0 - .6 * c);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

// ---------------------------------------------------------------- run
// One clock drives the room. It advances at most 1/24 s a frame, so a slow frame slows the film instead of tearing it.
// The access film plays by itself; after the doorway the camera follows your scroll, smoothed, and the room reacts as you pass.
export async function run({ canvas, onEnter, onReady, onLeave, onWalk, onGlide, mobile, status, audio }) {
  try { await Promise.race([document.fonts.load('34px VT'), new Promise(r => setTimeout(r, 1500))]); } catch {}
  const $ = s => document.querySelector(s);
  const intro = $('#intro'), skipBtn = $('#iskip');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const dpr = Math.min(mobile ? 1.3 : 1.5, devicePixelRatio || 1);
  renderer.setPixelRatio(dpr); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !mobile; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030406); scene.fog = new THREE.FogExp2(0x04060a, .05);
  const P = build(scene, mobile), term = P.term;
  const cam = new THREE.PerspectiveCamera(44, 1, .02, 60);
  const rt = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: mobile ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .62, .55, .88); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass(FilmShader); composer.addPass(film);
  const portrait = () => innerWidth / innerHeight < .9;
  let S = shots(portrait()), lastW = 0, lastH = 0;
  function resize(force) {
    const w = innerWidth, h = innerHeight;
    if (force !== true && mobile && w === lastW && Math.abs(h - lastH) < 160) return;   // a phone's address bar coming and going is not a resize
    lastW = w; lastH = h; renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w / 3, h / 3); cam.aspect = w / h; cam.updateProjectionMatrix(); S = shots(portrait());
  }
  resize(true); addEventListener('resize', resize);
  // compile every material once, hidden ones included, so nothing hitches the first time it appears
  try {
    const hid = [P.figure, P.card]; hid.forEach(o => { o.visible = true; }); cam.position.set(0, 1, 9); cam.lookAt(0, .6, 0); cam.updateMatrixWorld();
    if (renderer.compileAsync) await Promise.race([renderer.compileAsync(scene, cam), new Promise(r => setTimeout(r, 3000))]); else renderer.compile(scene, cam);
    hid.forEach(o => { o.visible = false; });
  } catch {}

  const st = { t0: 0, clock: 0, phase: 'film', skip: false, blend: null, diveT: 0, diveDur: 2000, cmd: '', done: false, pending: undefined, lamp: 0, crtOn: false,
    px: 0, py: 0, mx: 0, my: 0, pressed: [], look: null, posted: false, freeze: null, status: null, hover: false, lean: 0, hddT: 0, lk: 1, lampK: 1, flick: null,
    skipAt: 0, skipFt: 0, ftOff: 0, red: 0, egg: 0, p: 0, ps: 0, boT: null, lampT: null, crtT: null, rush: false };
  const TMP = new THREE.Object3D();
  const sfx = (n, a) => { try { audio && audio.sfx(n, a); } catch {} };
  const room = (k, s) => { try { audio && audio.room && audio.room(k, s); } catch {} };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(9, 9);
  const onScreen = () => { ray.setFromCamera(ndc, cam); return ray.intersectObject(P.screen, false).length > 0; };
  let NOW = performance.now();
  Promise.resolve(status).then(s => { st.status = s; }).catch(() => {});
  const say = runs => term.push(Array.isArray(runs[0]) ? runs : [[runs[0], runs[1]]]);
  const hdd = on => { P.hddMat.color.setHex(on ? 0xffb648 : 0x2a1c08); if (on && NOW - st.hddT > 260) { st.hddT = NOW; sfx('hdd'); } };
  function drawBoard(occ, alarm, blink) {                 // ROOM 00 · LIVE: how many are in here, and who
    const B = P.board, key = occ + '|' + alarm + '|' + (alarm ? Math.floor(NOW / 90) : blink); if (key === B.key) return; B.key = key;
    const g = B.g, W = B.W, H = B.H, hot = alarm ? C.red : C.ok;
    g.fillStyle = alarm ? '#170303' : '#020a08'; g.fillRect(0, 0, W, H);
    g.textBaseline = 'top'; g.font = '30px VT, monospace';
    g.fillStyle = alarm ? C.red : C.dim; g.fillText('ROOM 00 \u00b7 LIVE', 24, 14); const rec = 'REC: OFF'; g.fillText(rec, W - 24 - g.measureText(rec).width, 14);
    g.fillStyle = alarm ? 'rgba(255,107,91,.35)' : 'rgba(98,240,200,.25)'; g.fillRect(24, 50, W - 48, 2);
    g.font = '40px VT, monospace'; g.fillStyle = C.dim; g.fillText('OCCUPANTS', 24, 72); g.fillText('IDENTITY', 24, 126);
    g.font = '66px VT, monospace'; g.fillStyle = hot; g.shadowColor = hot; g.shadowBlur = 18; g.fillText(String(occ), 300, 58); g.shadowBlur = 0;
    g.font = '40px VT, monospace'; g.fillStyle = alarm ? C.red : C.ink; g.fillText(alarm ? 'none, none' : 'none', 300, 126);
    if (!alarm && blink) { g.fillStyle = C.ok; g.beginPath(); g.arc(W - 40, 92, 8, 0, 7); g.fill(); }
    if (alarm) for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(255,70,50,${.12 + Math.random() * .2})`; g.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6); }
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    B.t.needsUpdate = true;
  }

  // ---- the queue: cues at room times; later events are added to the unplayed tail, never before what already played
  const Q = []; let qi = 0;
  const ev = (ms, fn, soft) => Q.push({ ms, fn, soft });
  const add = items => { const tail = Q.splice(qi).concat(items); tail.sort((a, b) => a.ms - b.ms); Q.push(...tail); };
  const later = (sec, fn, soft) => add([{ ms: NOW - st.t0 + sec * 1000, fn, soft }]);
  function flush() {
    const t = NOW - st.t0; let n = 0;
    while (qi < Q.length && (st.skip || Q[qi].ms <= t || (st.rush && n < 2))) { const e = Q[qi++]; if (Q[qi - 1].ms > t) n++; if (!((st.skip || st.rush) && e.soft && e.ms > t)) e.fn(); }
  }
  const cue = (sec, name, arg) => ev(sec * 1000, () => sfx(name, arg), true);
  // the access film: the card, the reader, the doors, the strips catching one by one
  cue(TL.tap, 'card'); cue(TL.verify + .02, 'tick'); cue(TL.verify + .18, 'tick'); cue(TL.verify + .34, 'tick'); cue(TL.grant, 'grant');
  cue(TL.door, 'door'); ev(TL.door * 1000, () => room(1));
  for (let i = 0; i < STRIPS; i++) cue(TL.strips + i * TL.gap, 'light', i);
  cue(TL.strips + DEAD * TL.gap + .5, 'zap');

  // the power cut, set off by walking far enough in
  function brownout(ft) {
    if (st.boT != null) return; st.boT = ft;
    sfx('brown'); room(.25, .3);
    later(BO_LEN, () => { sfx('restore'); room(1, 1.2); }, false);
    for (let i = 0; i < STRIPS; i++) if (i !== DEAD) later(BO_LEN + i * .05 + .02, () => sfx('tick'), true);
  }
  // the CRT: power, then the boot, queued from this moment
  function power(fast) {
    if (st.crtT != null) { if (fast) st.rush = true; return; }
    const base = st.crtT = NOW - st.t0, items = [];
    const at0 = (ms, fn) => items.push({ ms: base + ms, fn });
    at0(0, () => { sfx('power'); st.crtOn = true; P.ledMat.color.setHex(0x3dff8a); P.monLed.color.setHex(0xffb648); term.off = false; term.power = 0; term.dirty = true; });
    for (let i = 1; i <= 20; i++) at0(i * 23, () => { term.power = i / 20; term.dirty = true; });
    at0(21 * 23, () => { term.power = 1; term.wobble = st.rush ? 0 : 1; term.dirty = true; });
    let T = 700; const at = (d, fn) => { T += d; at0(T, fn); };
    at(0, () => { hdd(true); sfx('beep'); say([['DAO BIOS v1.98  ', C.ink], ['(c) nobody', C.dim]]); });
    at(130, () => say([['cpu: ', C.dim], ['anonymous @ 33 MHz', C.ink]]));
    let mi; at(110, () => { mi = term.push([['memory test: ', C.dim], ['0K', C.ok]]); });
    for (let m = 8192; m <= 65536; m += 8192) at(24, () => term.set(mi, [['memory test: ', C.dim], [m + 'K' + (m === 65536 ? ' ok' : ''), C.ok]]));
    at(50, () => { say(['', C.ink]); hdd(false); });
    for (const [a, b, col, fix] of [['detecting room 00', '36 racks', C.ink], ['detecting occupants', '2', C.red, '1'], ['detecting your name', 'not found', C.ok]]) {
      const dots = '.'.repeat(Math.max(3, 30 - a.length)) + ' '; let i;
      at(80, () => { i = term.push([[a + ' ', C.ink], [dots, C.dim]]); hdd(true); });
      at(170, () => { term.set(i, [[a + ' ', C.ink], [dots, C.dim], [b, col]]); hdd(false); });
      if (fix) at(360, () => { term.set(i, [[a + ' ', C.ink], [dots, C.dim], [fix, C.ok]]); term.glitch = st.rush ? 0 : .35; });
    }
    at(100, () => { say(['', C.ink]); say([['press ', C.dim], ['DEL', C.ink], [' to enter setup. nobody ever does.', C.dim]]); });
    at(480, () => term.clear());
    at(180, () => say([['starting dao …', C.ink]]));
    at(320, () => { say(['', C.ink]); say([['C:\\> ', C.ok], ['load layers', C.white]]); });
    for (const [num, name, what] of LAYERS) {
      const label = ` ${num} ${name} `.padEnd(13, '.') + ' ', text = what.padEnd(29, ' '); let i;
      at(200, () => { i = term.push([[label, C.ink], [text, C.dim], ['[    ]', C.dim]]); });
      for (let s = 0; s < 4; s++) at(50, () => { term.set(i, [[label, C.ink], [text, C.dim], ['[ ' + '|/-\\'[s % 4] + '  ]', C.gold]]); hdd(s % 2 === 0); });
      at(50, () => { term.set(i, [[label, C.ink], [text, C.dim], ['[ ', C.dim], ['ok', C.ok], [' ]', C.dim]]); hdd(false); });
      T -= 150;
    }
    at(220, () => { say(['', C.ink]); say([[' 6/6 layers up.', C.ok], [' nothing here knows your name.', C.dim]]); });
    at(700, () => { term.clear(); term.glitch = st.rush ? 0 : 1; });
    for (let k = 1; k <= 22; k++) at(k === 1 ? 140 : 18, () => { term.logo = Math.min(1, k / 22); term.dirty = true; });
    at(30, () => { term.logo = 1; term.glitch = st.rush ? 0 : .5; });
    let tag; at(40, () => { tag = term.push([['', C.ink]]); });
    const T1 = 'every launch is a ', T2 = 'a privacy layer for pump.fun.';
    for (let i = 1; i <= T1.length; i++) at(20, () => term.set(tag, [[T1.slice(0, i), C.ink]]));
    at(80, () => term.set(tag, [[T1, C.ink], ['dao.', C.gold]]));
    let tag2; at(70, () => { tag2 = term.push([['', C.ink]]); });
    for (let i = 1; i <= T2.length; i++) at(18, () => term.set(tag2, [[T2.slice(0, i), C.dim]]));
    at(340, () => {
      say(['', C.ink]);
      say([['type ', C.dim], ['launch', C.gold], [', ', C.dim], ['coins', C.gold], [', ', C.dim], ['claim', C.gold], [', ', C.dim], ['help', C.gold], [' or press enter.', C.dim]]);
      say(['', C.ink]);
      term.prompt = true; st.posted = true; st.rush = false;
    });
    add(items);
    if (fast) st.rush = true;
  }

  // ---- phases: film (the access) → walk (your scroll) ⇄ ready (at the PC, booted) → dive
  function enterWalk(ft) {
    if (st.phase !== 'film') return;
    if (st.skip) { st.ftOff = Math.max(0, ft - st.clock); st.skip = false; }
    st.blend = null; st.phase = 'walk'; intro.classList.add('walk');
    try { onWalk && onWalk(); } catch {}
    if (st.pending !== undefined) { const c = st.pending; st.pending = undefined; dive(c); }
  }
  function ready() { if (st.phase !== 'walk') return; st.phase = 'ready'; intro.classList.add('ready'); try { onReady && onReady(); } catch {} }
  function unready() { if (st.phase !== 'ready') return; st.phase = 'walk'; intro.classList.remove('ready'); try { onLeave && onLeave(); } catch {} }
  // skip: only the access film skips. the room fast-forwards and the camera glides to the doorway
  function skip() {
    if (st.skip || st.phase !== 'film') return;
    st.skip = true; st.skipAt = NOW; st.skipFt = st.clock;
    const from = cam.position.clone(), d = S.door;
    st.blend = { t: NOW, from, look: (st.look || d[1]).clone(), fov: cam.fov, dur: 650 + from.distanceTo(d[0]) * 160, to: d[0], toLook: d[1], toFov: d[2] };
    room(1);
  }

  // ---- typing presses the 3D keys
  const ROWS = { 1: '`1234567890-=', 2: '\tqwertyuiop[]\\', 3: "\u0000asdfghjkl;'", 4: '\u0000zxcvbnm,./' };
  function keyCell(k) {
    if (k === ' ') return 'space'; if (k === 'Enter') return '3:13'; if (k === 'Backspace') return '1:13'; if (k === 'Escape') return '0:0'; if (k === 'Shift') return '4:0';
    const ch = (k || '').toLowerCase(); if (ch.length !== 1) return null;
    for (const r in ROWS) { const c = ROWS[r].indexOf(ch); if (c >= 0) return r + ':' + c; }
    return null;
  }
  function press(k) { const id = keyCell(k); const i = id && (id === 'space' ? P.kidx.space : P.kidx[id]); if (i != null) st.pressed.push([i, NOW]); sfx('key'); }

  function command(raw) {
    const c = raw.trim().toLowerCase();
    say([['C:\\DAO> ', C.ok], [raw, C.white]]); term.input = '';
    hdd(true); setTimeout(() => hdd(false), 120);
    if (!c || ['enter', 'exit', 'go', 'cd dao', 'win', 'dao'].includes(c)) return dive('');
    if (['launch', 'coins', 'claim', 'layers', 'docs'].includes(c)) return dive(c);
    if (c === 'help' || c === '?' || c === 'dir') { [[['launch ', C.gold], ['launch a coin, free', C.dim]], [['coins  ', C.gold], ['every coin launched on dao', C.dim]], [['claim  ', C.gold], ['claim creator fees, no gas', C.dim]], [['layers ', C.gold], ['what stays private, and what does not', C.dim]], [['lights ', C.gold], ['the aisle lights, on or off', C.dim]], [['who    ', C.gold], ['who is in room 00', C.dim]], [['enter  ', C.gold], ['go in', C.dim]]].forEach(h => say(h)); return; }
    if (c === 'whoami') { say(['nobody', C.ok]); return; }
    if (c === 'ver') { say(['dao [version 4.10.1998]', C.ink]); return; }
    if (c === 'date' || c === 'time') { say([new Date().toString().slice(0, 24), C.ink]); return; }
    if (c === 'cls' || c === 'clear') { term.clear(); term.logo = 1; return; }
    if (c === 'sudo' || c.startsWith('sudo ')) { say(['nice try. there is no root here, only nobody.', C.dim]); return; }
    if (c === 'lights') { st.lightsOff = !st.lightsOff; sfx(st.lightsOff ? 'brown' : 'restore'); say([st.lightsOff ? 'aisle lights off.' : 'aisle lights on.', C.dim]); if (st.lightsOff) setTimeout(() => { if (st.lightsOff && st.phase === 'ready') say(['occupants: 2', C.red]); }, 1600); return; }
    if (c === 'who' || c === 'w' || c === 'users') { say([['occupants: ', C.dim], [st.lightsOff ? '2' : '1', st.lightsOff ? C.red : C.ok]]); say([['identity: ', C.dim], ['none', C.ink]]); return; }
    if (c === 'lamp') { st.lampOff = !st.lampOff; sfx('click'); say([st.lampOff ? 'lamp off.' : 'lamp on.', C.dim]); return; }
    if (c === 'racks' || c === 'room') { say([['room 00: ', C.dim], ['36 racks. no logs. no names.', C.ink]]); return; }
    if (c === 'logs' || c === 'log') { say(['there are no logs. that is the point.', C.dim]); return; }
    say(['bad command or file name. type help.', C.dim]);
  }
  // the dive works from anywhere past the doors: from the aisle it is a rush down it and into the screen
  function dive(cmd) {
    if (st.phase === 'dive' || st.done) return;
    if (st.phase === 'film') { st.pending = cmd; skip(); return; }
    if (!st.crtOn) { power(true); st.crtOn = true; term.off = false; term.power = 1; term.dirty = true; }
    if (st.lampT == null) st.lampT = st.clock + st.ftOff;
    st.freeze = null; st.phase = 'dive'; st.cmd = cmd; st.diveT = NOW; st.diveFrom = cam.position.clone(); st.diveLook = (st.look || S.end[1]).clone(); term.prompt = false;
    st.diveDur = Math.min(3200, 2000 + st.diveFrom.distanceTo(SCREEN_C) * 110);
    say([['entering dao', C.gold], [' …', C.dim]]); hdd(true); sfx('dive'); canvas.style.cursor = 'default';
    intro.classList.add('diving');
  }
  function key(e) {
    if (st.done) return;
    if (st.phase === 'film') { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } return; }
    if (st.phase === 'walk') { if (e.key === 'Enter') { e.preventDefault(); try { onGlide && onGlide(); } catch {} } return; }
    if (st.phase !== 'ready') return;
    if (e.key === 'Escape') { e.preventDefault(); dive(''); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); press(e.key); command(term.input); }
    else if (e.key === 'Backspace') { e.preventDefault(); press(e.key); term.input = term.input.slice(0, -1); term.dirty = true; }
    else if (e.key.length === 1) { e.preventDefault(); press(e.key); if (term.input.length < 34) { term.input += e.key; term.dirty = true; } }
  }
  addEventListener('keydown', key);
  const pm = e => { st.px = e.clientX / innerWidth * 2 - 1; st.py = e.clientY / innerHeight * 2 - 1; ndc.set(st.px, -st.py); };
  addEventListener('pointermove', pm, { passive: true });
  canvas.addEventListener('click', e => {             // in the film a click skips; past the doors, clicking the screen pulls you in
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
    if (st.phase === 'film') return skip();
    if ((st.phase === 'ready' || st.phase === 'walk') && onScreen()) dive('');
  });
  if (skipBtn) skipBtn.onclick = e => { e.stopPropagation(); skip(); };
  // trying to scroll during the film means "let me in": it fast-forwards to the doorway, where scrolling takes over
  const wheel = e => { if (st.phase === 'film' && Math.abs(e.deltaY) > 3) skip(); };
  let ty0 = null; const ts = e => { ty0 = e.touches[0] ? e.touches[0].clientY : null; };
  const tm = e => { if (st.phase === 'film' && ty0 != null && e.touches[0] && Math.abs(e.touches[0].clientY - ty0) > 24) skip(); };
  addEventListener('wheel', wheel, { passive: true }); addEventListener('touchstart', ts, { passive: true }); addEventListener('touchmove', tm, { passive: true });

  let last = performance.now(), started = false;
  const CP = { p: new THREE.Vector3(), rx: 0, rz: 0 };
  const PANEL = { idle: [2.4, .16, .1, 0xff3020], read: [2.4, 1.3, .2, 0xffa030], verify: [2.4, 1.3, .2, 0xffa030], granted: [.3, 2.4, .9, 0x40ffb0] };
  // seek/shot/walk are for checking single frames; the site never calls them
  const api = { go: c => dive(c), phase: () => st.phase, alarm: () => st.red > .4, skip, scroll: p => { st.p = clamp01(p); }, camZ: () => cam.position.z, posted: () => st.posted,
    seek: (sec, freeze) => { st.clock = sec; st.freeze = freeze ? sec : null; }, hold: ms => { st.hold = ms == null ? null : st.diveT + ms; },
    walk: p => { st.p = st.ps = clamp01(p); },
    pause: v => { st.paused = !!v; }, view: (p, l, f) => { st.view = p ? { p: V(...p), l: V(...l), f } : null; },
    shot: (sec, q = .93) => { if (sec != null) st.freeze = sec; step(performance.now()); return canvas.toDataURL('image/jpeg', q); },
    termShot: (sec, q = .93) => { st.noRender = true; if (sec != null) st.freeze = sec; step(performance.now()); st.noRender = false; return term.c.toDataURL('image/jpeg', q); },
    diveShot: (ms, q = .93) => { st.hold = st.diveT + ms; step(performance.now()); return st.done ? null : canvas.toDataURL('image/jpeg', q); } };
  const perf = { n: 0, sum: 0, prev: 0, down: false };
  function degrade() {                                    // a slower GPU: fewer pixels, no multisampling, no shadows
    perf.down = true; renderer.setPixelRatio(1); composer.setPixelRatio(1);
    for (const r of [composer.renderTarget1, composer.renderTarget2]) { r.samples = 0; r.dispose(); }
    renderer.shadowMap.autoUpdate = false; P.lamp.castShadow = false; resize(true);
  }
  function frame(now) {
    if (st.done) return;
    requestAnimationFrame(frame);
    if (st.paused) return;
    if (!perf.down && perf.prev) { const d = now - perf.prev; if (d < 250) { perf.n++; if (perf.n > 20) perf.sum += d; if (perf.n === 110 && perf.sum / 90 > 27) degrade(); } }
    perf.prev = now;
    step(now);
  }
  function step(now) {
    if (!started) { started = true; st.t0 = now; last = now; }
    const rdt = Math.min(.25, Math.max(0, (now - last) / 1000)); last = now;
    if (st.freeze != null) st.clock = st.freeze; else if (st.hold == null) st.clock += Math.min(rdt, 1 / 24);
    NOW = st.hold != null ? st.hold : st.t0 + st.clock * 1000;
    const dt = Math.min(.05, rdt), t = st.clock;
    flush();
    let ft = st.skip ? Math.min(60, Math.max(t, st.skipFt + (NOW - st.skipAt) * .02)) : t + st.ftOff;   // after a skip the room runs at 20x
    // camera: the access marks (or a glide to the doorway when skipped), then the aisle at your scroll, a slow breath, the mouse
    let pos, look, fov;
    if (st.phase === 'film') {
      const K = S.a.at(t); pos = K.pos; look = K.look; fov = K.fov;
      if (st.blend) {
        const b = ease(clamp01((NOW - st.blend.t) / st.blend.dur));
        pos = st.blend.from.clone().lerp(st.blend.to, b); look = st.blend.look.clone().lerp(st.blend.toLook, b); fov = st.blend.fov + (st.blend.toFov - st.blend.fov) * b;
        if (b >= 1 && ft > TL.door + 1.3) { enterWalk(ft); ft = st.clock + st.ftOff; }
      } else if (t >= A_END) enterWalk(ft);
    } else {
      st.ps += (st.p - st.ps) * (st.freeze != null ? 1 : 1 - Math.exp(-dt * 4.2));
      const K = S.w.at(A_END + st.ps * (S.T - A_END)); pos = K.pos; look = K.look; fov = K.fov;
    }
    // walking in sets the room off: the power cut, the lamp, the CRT; at the PC, the prompt
    if (st.phase === 'walk' || st.phase === 'ready') {
      if (st.boT == null && st.ps > P_BO) brownout(ft);
      if (st.lampT == null && (st.ps > P_LAMP || (st.boT != null && ft > st.boT + BO_LEN + .3))) { st.lampT = ft; sfx('click'); }
      if (st.crtT == null && st.ps > P_CRT) power(false);
      if (!st.posted && st.ps > P_RUSH) power(true);
      if (st.phase === 'walk' && st.posted && st.ps > P_END) ready();
      else if (st.phase === 'ready' && st.ps < P_END - .03) unready();
    }
    if (Math.abs(cam.fov - fov) > .001) { cam.fov = fov; cam.updateProjectionMatrix(); }
    st.mx += (st.px - st.mx) * .04; st.my += (st.py - st.my) * .04;
    const settle = st.phase === 'film' ? clamp01((t - A_END + 1.2) / 1.2) : 1;
    if (st.phase === 'ready' || st.phase === 'walk') { const h = onScreen(); if (h !== st.hover) { st.hover = h; canvas.style.cursor = h ? 'pointer' : 'default'; } }
    st.lean += ((st.phase === 'ready' && st.hover ? 1 : 0) - st.lean) * .05;
    pos.x += Math.sin(t * .35) * .014 + st.mx * .05 * settle; pos.y += Math.sin(t * .5) * .008 - st.my * .025 * settle;
    if (st.lean > .001) { pos.lerp(SCREEN_C, st.lean * .16); look.lerp(SCREEN_C, st.lean * .3); }
    if (st.phase === 'dive') {
      const dd = st.diveDur, d = clamp01((NOW - st.diveT) / dd), e = easeIn(d);
      pos = st.diveFrom.clone().lerp(V(SCREEN_C.x, SCREEN_C.y, SCREEN_C.z + .16), e); look = st.diveLook.clone().lerp(SCREEN_C, Math.min(1, e * 2));
      if (NOW - st.diveT > dd - 1120) { term.mode = 'tunnel'; term.tunnel = clamp01((NOW - st.diveT - (dd - 1120)) / 1080); }
      bloom.strength = .62 + e * 2.2; renderer.toneMappingExposure = 1.05 + e * 1.6; film.uniforms.grain.value = .05 * (1 - e);
      if (d >= 1 && !st.done) { st.done = true; cleanup(); onEnter(st.cmd); return; }
    }
    if (st.view) { pos = st.view.p.clone(); look = st.view.l.clone(); if (st.view.f) { cam.fov = st.view.f; cam.updateProjectionMatrix(); } }
    st.look = look; cam.position.copy(pos); cam.lookAt(look);

    // the reader and the card
    P.panel.draw(ft);
    const ps = PANEL[panelState(ft)], on = panelState(ft) === 'granted' || Math.floor(ft * (panelState(ft) === 'idle' ? 1.6 : 6)) % 2 === 0;
    P.panelLed.color.setRGB(ps[0] * (on ? 1 : .15), ps[1] * (on ? 1 : .15), ps[2] * (on ? 1 : .15)); P.panelLight.color.setHex(ps[3]); P.panelLight.intensity = on ? .13 : .05;
    if (!st.skip && cardPose(ft, CP)) { P.card.visible = true; P.card.position.copy(CP.p); P.card.rotation.set(CP.rx, 0, CP.rz); } else P.card.visible = false;
    // the leaves, with a little jolt when the bolt lets go
    const dk = doorK(ft), jolt = ft > TL.door && ft < TL.door + .12 ? .005 * Math.sin((ft - TL.door) / .12 * Math.PI) : 0;
    P.leaves[0].position.x = -.385 - dk * .8 - jolt; P.leaves[1].position.x = .385 + dk * .8 + jolt; P.underGlow.visible = dk < .02;
    // the strips catch one after another; the lights under them follow
    st.lk += ((st.lightsOff ? 0 : 1) - st.lk) * Math.min(1, dt * 5);
    if (st.phase === 'ready' && !st.flick && Math.random() < dt / 24) st.flick = { i: Math.random() * STRIPS | 0, t: NOW };
    const lv = []; let sum = 0;
    for (let i = 0; i < STRIPS; i++) {
      let v = stripK(i, ft, st.boT) * st.lk;
      if (st.flick && st.flick.i === i) { const a = (NOW - st.flick.t) / 1000; if (a > .5) st.flick = null; else v *= [1, .2, .9, .35, 1][Math.floor(a / .1)] ?? 1; }
      lv[i] = v; sum += v; P.stripMats[i].color.setRGB(.045 + v * 2.3, .05 + v * 2.6, .06 + v * 3.0);
    }
    const avg = sum / STRIPS;
    for (const { l, ix } of P.aisle) l.intensity = 10 * ix.reduce((a, i) => a + lv[i], 0) / ix.length;
    for (let i = 0; i < STRIPS; i++) P.shaftMats[i].opacity = .026 * Math.min(1, lv[i]);
    // the power cut, and the same red when you switch the aisle off yourself
    const bo = st.boT != null && ft > st.boT && ft < st.boT + BO_LEN ? 1 : 0, egg = st.phase !== 'film' && st.lk < .35 ? 1 : 0, alarm = Math.max(bo, egg);
    const boRed = st.boT == null ? 0 : clamp01((ft - st.boT) / .06) * (1 - clamp01((ft - st.boT - BO_LEN) / .18));
    st.egg += ((egg ? 1 : 0) - st.egg) * Math.min(1, dt * (egg ? 10 : 4)); st.red = Math.max(boRed, st.egg);
    const pulse = .72 + .28 * Math.sin(t * 7.5);
    P.spill.intensity = 9 * lv[0] * dk; P.hemi.intensity = (.09 + .16 * avg) * (1 - .7 * st.red);
    P.hazeMat.opacity = .005 + .017 * avg + .01 * st.red;
    if (ft < 6.6) { P.night.position.set(0, CORR - .22, 12.45); P.night.intensity = 2.3 * (.88 + .12 * Math.sin(t * 1.7)); }
    else { P.night.position.set(0, 1.8, -.55); P.night.intensity = 7 * st.red * pulse; }
    P.beacon.color.setRGB(.25 + 3.6 * st.red * pulse, .02 + .25 * st.red * pulse, .02 + .15 * st.red * pulse);
    film.uniforms.red.value = .32 * st.red; film.uniforms.time.value = t;
    // whoever it is stands where the aisle meets the bench while the power is out, and behind the bench when you turn the lights off
    const showFig = bo && ft > st.boT + .1 && ft < st.boT + BO_LEN - .03 && cam.position.z > 5.2;   // only ever far down the aisle
    P.figure.visible = !!(showFig || (egg && st.lk < .2));
    if (showFig) P.figure.position.set(-.1, F + .92, 1.3); else if (egg) P.figure.position.set(.98, F + .92, -.52);
    drawBoard(alarm ? 2 : 1, alarm, Math.floor(t * 1.4) % 2 === 0);
    // the cameras turn to follow you; the one at the door stops recording once you are let in
    for (const c of P.cams) {
      TMP.position.copy(c.base.position); TMP.lookAt(cam.position);
      c.head.quaternion.slerp(TMP.quaternion, st.freeze != null ? 1 : Math.min(1, dt * 2.5));
      const lon = c.ledOn === 'door' ? ft < TL.grant && Math.floor(t * 2) % 2 === 0 : false;
      c.led.color.setRGB(lon ? 2.6 : .08, lon ? .15 : .01, lon ? .1 : .01);
    }
    for (const mm of P.mist) { mm.m.opacity = mm.k * (.12 + .88 * avg) * (1 - .5 * st.red); mm.t.offset.set(t * .006 * (mm.i + 1), -t * .012 * (1 + mm.i * .6)); }
    // the bench lamp
    const L = st.lampT == null ? 0 : lampK(ft - st.lampT); st.lampK += ((st.lampOff ? 0 : 1) - st.lampK) * Math.min(1, dt * 6); st.lamp = L * st.lampK;
    P.lamp.intensity = st.lamp * 4.6; P.fill.intensity = st.lamp * 1.1; P.bulbMat.color.setRGB(.14 + st.lamp * 1.6, .1 + st.lamp * 1.15, .05 + st.lamp * .45);
    P.dustMat.opacity = .5 * st.lamp;
    // every LED on its own rhythm (time-based, so a frozen frame is always the same frame); red in the dark; a scan line runs ahead of you
    const D = P.LD, ca = P.leds.instanceColor.array, red = st.red, scan = (st.phase === 'film' || st.phase === 'walk') && !st.skip && ft > 4.9 && st.ps < .8 ? 1 - red : 0, sz = cam.position.z - .4 - ((ft * 4.2) % 7);
    for (let i = 0; i < D.n; i++) {
      let l = 1; const m = D.m[i];
      if (m === 1) l = (t * D.rate[i] + D.ph[i]) % 1 < D.duty[i] ? 1 : .07;
      else if (m === 2) { const busy = hsh(i, Math.floor(t * .45 + D.ph[i] * 9)) < .72; l = busy && hsh(i + 77, Math.floor(t * D.rate[i] + D.ph[i] * 50)) < D.duty[i] ? 1 : .06; }
      const j = i * 3; let r = D.c[j] * l, g = D.c[j + 1] * l, b = D.c[j + 2] * l;
      let k = red * (.55 + .45 * (l > .5 ? 1 : .4));
      if (scan && D.side[i]) { const q = (D.z[i] - sz) / .22; if (q > -3 && q < 3) k = Math.max(k, scan * Math.exp(-q * q)); }
      if (k > .01) { r += (2.6 * (.4 + .6 * l) - r) * k; g += (.2 - g) * k; b += (.12 - b) * k; }
      ca[j] = r; ca[j + 1] = g; ca[j + 2] = b;
    }
    P.leds.instanceColor.needsUpdate = true;
    P.haze.rotation.y = Math.sin(t * .05) * .01; P.haze.position.y = Math.sin(t * .17) * .05; P.haze.position.x = Math.sin(t * .11) * .06;
    if (st.crtOn) P.ledMat.color.setHex(Math.sin(t * 9) > .3 ? 0x3dff8a : 0x0f4a26);
    else P.monLed.color.setRGB(.16 + .5 * Math.max(0, Math.sin(t * 2.4)) ** 3, .1 + .26 * Math.max(0, Math.sin(t * 2.4)) ** 3, .03);   // standby, breathing amber
    const screenLight = term.off ? 0 : term.power < 1 ? term.power * .5 : .2 + (term.mode === 'tunnel' ? term.tunnel * 2.5 : 0);
    P.glow.intensity += (screenLight + Math.sin(t * 13) * .015 - P.glow.intensity) * .2;
    P.dust.rotation.y += dt * .03; P.dust.position.y = Math.sin(t * .2) * .02;
    P.steam.forEach(s => { const a = ((t * .22 + s.userData.o) % 1); s.position.set(-.8 + Math.sin(a * 6 + s.userData.o * 9) * .02, .2 + a * .34, .28 + Math.cos(a * 5) * .015); s.scale.setScalar(.035 + a * .08); s.material.opacity = Math.sin(a * Math.PI) * .032 * (.3 + st.lamp * .7); });
    // pressed keys sink for a moment
    if (st.pressed.length) {
      st.pressed = st.pressed.filter(([i, t1]) => { const a = (NOW - t1) / 130; const m = P.base[i].clone(); if (a < 1) m.elements[13] -= .008 * Math.sin(a * Math.PI); P.keys.setMatrixAt(i, m); return a < 1; });
      P.keys.instanceMatrix.needsUpdate = true;
    }
    term.draw(NOW, dt);
    if (!st.noRender) composer.render();
  }
  function cleanup() { removeEventListener('keydown', key); removeEventListener('resize', resize); removeEventListener('pointermove', pm); removeEventListener('wheel', wheel); removeEventListener('touchstart', ts); removeEventListener('touchmove', tm); setTimeout(() => { renderer.dispose(); composer.dispose && composer.dispose(); }, 1200); }
  step(performance.now());                                 // one frame first, so the film starts on a drawn picture
  requestAnimationFrame(frame);
  return api;
}
