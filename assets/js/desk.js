// DAO: the room, the boot on the CRT, then the dao os inside the pc: a home you scroll, a dock, a command bar and
// windows that all work.
import { install } from './apps98.js?v=5';
import { install as installTools } from './tools98.js?v=3';
import { createSound } from './sound98.js?v=7';
import * as WAL from './wallet98.js?v=2';
import { mountHome } from './home.js?v=4';
import { mountFx } from './fx.js?v=1';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = matchMedia('(max-width: 760px)').matches || matchMedia('(hover: none)').matches;
const NARROW = () => matchMedia('(max-width: 760px)').matches;
const LOWQ = /[?&]q=low\b/.test(location.search);   // a lighter room for slow machines (and for checking frames)
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ss = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} }, del(k) { try { sessionStorage.removeItem(k); } catch {} } };
const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
// sound plays on its own wherever the browser allows it; where it doesn't, the very first click or key starts it
const SOUND = createSound(ls);
SOUND.unlock();
const unlockOnce = () => { SOUND.unlock(); if (SOUND.on) ['pointerdown', 'keydown', 'touchend'].forEach(t => removeEventListener(t, unlockOnce, true)); };
['pointerdown', 'keydown', 'touchend'].forEach(t => addEventListener(t, unlockOnce, true));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
const ago = t => { const s = Math.max(1, (Date.now() - new Date(t).getTime()) / 1000); return s < 60 ? `${s | 0}s` : s < 3600 ? `${s / 60 | 0}m` : s < 86400 ? `${s / 3600 | 0}h` : `${s / 86400 | 0}d`; };
const usd = n => n == null ? '—' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + Math.round(n);
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1700); }
async function copy(t) { try { await navigator.clipboard.writeText(t); toast('copied'); } catch { toast('select it and copy'); } }
async function api(op, { method = 'GET', body, params } = {}) {
  const u = '/api/' + op + (params ? '?' + new URLSearchParams(params) : '');
  let r; try { r = await fetch(u, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('No connection. Check your internet and try again.'); }
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok || j.ok === false) { const e = new Error(j.error || `Request failed (${r.status}).`); e.detail = j.detail; throw e; }
  return j;
}
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(bytes) { let n = 0n; for (const b of bytes) n = n * 256n + BigInt(b); let s = ''; while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; } for (const b of bytes) { if (b === 0) s = '1' + s; else break; } return s; }
function unb58(str) { let n = 0n; for (const c of str) { const i = B58.indexOf(c); if (i < 0) throw new Error('bad'); n = n * 58n + BigInt(i); } const out = []; while (n > 0n) { out.unshift(Number(n % 256n)); n /= 256n; } for (const c of str) { if (c === '1') out.unshift(0); else break; } return new Uint8Array(out); }
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const isAddr = s => { if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s || '')) return false; try { return unb58(s).length === 32; } catch { return false; } };
const WIZ_ART = "\n\n      .+++*********##############*#+-===.\n      =###%%%%%%%%%%%%%%%%%%%%%%%###****=\n      =**+===========================++*-\n      =**-                           =**-\n      =**- ...............           +**-\n      =**- . ..............          =**-\n      =**- . ................        =**-\n      =**- . .................       +**-\n      =**- . .................       +**-\n      =**-   ..................      +**-\n      =**-    ..........:......      +**-\n      =**-    ...+--=---==-- ..      +**-\n      =**-    ...**#++*=-+==-.       +**-\n      =**-     ...::::::.::.-.       +**-\n      -**-     ............. ..      +**-\n      -**-      ..............       +**:\n      -**-       ............        +**:\n      -**-        ..........         +**:\n      -**-          ......           +**:\n      -**-                           +**:\n      -**- .  . ...........          +**:\n      -****************++++++++++++++***:\n      -*************************##*+=+**:\n      :++++++++++++++++++++++++++*+==+++:\n     .=+++++++++==++++++++++=======++=====+=\n    -+++++++++++++**#####***++==++++++++++++\n  :+*+++++++++++++*********+++++++++++++++++\n.*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%\n:******##########%%%%%%%%%%%%%%%%%%%%%%%%%%%\n:+++**********************************++++++\n:+****+++++****++++++***+=============+*****\n:++++*: .. -***++++++****============-+***++\n:++#*+++++++***+=++++***+=============+*++++\n:++#***********++++++***+=======------+*++++\n.====+++++++++++*************************+++\n.::::::::::::::::::::::::-----------------==";
const FILE = { launch: 'launch.exe', coins: 'coins.db', claim: 'claim.exe', privacy: 'privacy.cpl', strip: 'strip.exe', scan: 'scan.exe', cd: 'cdplayer.exe', readme: 'readme.txt', cmd: 'cmd.exe', pc: 'system.cpl', bin: 'recycle bin', paint: 'paint.exe', sweeper: 'sweeper.exe', display: 'display.cpl', coin: 'coin properties', run: 'run' };

// a sound switch: little bars that move while it plays
function soundButton(b) {
  if (!b) return;
  const lbl = b.querySelector('.lbl');
  SOUND.onChange(st => { const on = st.on && !st.muted; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); if (lbl) lbl.textContent = on ? 'sound on' : 'sound off'; });
  b.addEventListener('click', e => { e.stopPropagation(); SOUND.toggle(); });
}

// ================================================================ boot: the film in room 00 → the dive → the os, no loading in between
async function boot() {
  const seen = ss.get('dao:seen');
  if (seen || RM) return os('', true);
  const canvas = $('#room');
  let started = false;
  const go = cmd => { if (go.done) return; go.done = true; ss.set('dao:seen', '1'); enterOS(cmd); };
  $$('#itouch button').forEach(b => b.onclick = () => { if (window.__dao && window.__dao.go) window.__dao.go(b.dataset.go); else go(b.dataset.go); });
  soundButton($('#isound'));
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!gl) throw new Error('no webgl');
    const { run } = await import('./intro3d.js?v=16');
    const statusP = fetch('/api/status').then(r => r.json()).catch(() => null);
    window.__dao = await run({ canvas, mobile: MOBILE || LOWQ, onEnter: go, status: statusP, audio: SOUND,
      onReady: () => { $('#itouch').classList.add('on'); } });
    started = true;
    requestAnimationFrame(() => { canvas.classList.add('on'); const l = $('#iload'); if (l) l.remove(); });
  } catch (e) { const l = $('#iload'); if (l) l.remove(); if (!started) fallbackBoot(go); }
}
async function fallbackBoot(go) {
  const pre = $('#ifall'); pre.hidden = false; $('#room').remove(); $$('#intro .lb, #iskip').forEach(e => e.remove());
  const lines = ['DAO BIOS v1.98  (c) nobody', 'cpu: anonymous @ 33 MHz', 'memory test: 640K ok', '', 'detecting wallet connection ...... none', 'detecting signature request ...... none', 'detecting your name .............. not found', 'creator key ...................... born in your browser', '', 'press enter.'];
  for (const l of lines) { pre.textContent += l + '\n'; await sleep(70); }
  $('#itouch').classList.add('on');
  addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') go(''); }, { once: true });
}
// the dive ends in white; the os is already there underneath it and the white simply fades off
function enterOS(cmd) {
  const f = $('#wflash'); if (f) f.classList.add('on');
  setTimeout(() => {
    os(cmd);
    if (f) { requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add('out'))); setTimeout(() => f.remove(), 1100); }
  }, 40);
}
function os(cmd, instant) {
  const intro = $('#intro'); if (intro) intro.remove();
  if (instant) { const f = $('#wflash'); if (f) f.remove(); }
  document.body.classList.remove('booting');
  const o = $('#os'); o.hidden = false; void o.offsetWidth; o.classList.add('enter');
  SOUND.scene('desk'); if (!instant) setTimeout(() => SOUND.sfx('chime'), 220);
  initOS();
  const app = { launch: 'launch', coins: 'coins', claim: 'claim', layers: 'privacy', docs: 'readme' }[cmd];
  if (app) setTimeout(() => WM.open(app), instant ? 0 : 420);
}
function backToRoom() { ss.del('dao:seen'); location.reload(); }

// ================================================================ window manager
const WM = {
  z: 10, wins: {}, order: [],
  init() {
    $$('#wins .w[data-app]').forEach(w => {
      const app = w.dataset.app; this.wins[app] = w;
      if (!w.querySelector(':scope > .tb')) {
        const tb = document.createElement('div'); tb.className = 'tb';
        tb.innerHTML = `<svg class="ico"><use href="#i-${esc(w.dataset.icon)}"/></svg><span></span><div class="tbb"><button type="button" data-min aria-label="minimize"><i class="g-min"></i></button><button type="button" data-max aria-label="maximize"><i class="g-max"></i></button><button type="button" data-close aria-label="close"><i class="g-x"></i></button></div>`;
        w.prepend(tb); this.title(w);
      }
      const tb = w.querySelector(':scope > .tb');
      tb.addEventListener('pointerdown', e => this.drag(e, w));
      tb.addEventListener('dblclick', e => { if (!e.target.closest('button')) this.max(app); });
      w.addEventListener('pointerdown', () => this.focus(app), true);
      w.querySelector('[data-min]').onclick = e => { e.stopPropagation(); this.min(app); };
      w.querySelector('[data-max]').onclick = e => { e.stopPropagation(); this.max(app); };
      w.querySelectorAll('[data-close]').forEach(b => b.onclick = e => { e.stopPropagation(); this.close(app); });
      if (!MOBILE) { const g = document.createElement('div'); g.className = 'grip'; g.setAttribute('aria-hidden', 'true'); w.appendChild(g); g.addEventListener('pointerdown', e => this.resize(e, w)); }
    });
  },
  title(w) { const [a, ...b] = w.dataset.title.split(' — '); const s = w.querySelector(':scope > .tb > span'); if (s) s.innerHTML = `<b>${esc(a)}</b>${b.length ? `<em> — ${esc(b.join(' — '))}</em>` : ''}`; },
  place(w) {
    const area = $('#wins').getBoundingClientRect(), n = Math.max(0, $$('#wins .w.open').length - 1);
    const ww = Math.min(w.offsetWidth || parseInt(getComputedStyle(w).getPropertyValue('--ww')) || 600, area.width - 24);
    const wh = Math.min(w.offsetHeight || parseInt(getComputedStyle(w).getPropertyValue('--wh')) || 420, area.height - 24);
    let x = (area.width - ww) / 2 + ((n % 6) - 1) * 30, y = (area.height - wh) / 2 - 8 + ((n % 6) - 1) * 24;
    x = Math.max(12, Math.min(x, area.width - ww - 12)); y = Math.max(12, Math.min(y, area.height - wh - 12));
    w.style.left = x + 'px'; w.style.top = y + 'px';
  },
  rectOf(el) { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; },
  zoom(f, t) {                                             // a thin outline flies between a button and its window
    if (RM || NARROW() || !f || !t || !f.w || !t.w) return;
    $('#zoomr').animate([{ left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px', opacity: .9 }, { left: t.x + 'px', top: t.y + 'px', width: t.w + 'px', height: t.h + 'px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(.3,.7,.4,1)' });
  },
  open(app, arg, fromEl) {
    if (app === 'home') return showHome();
    if (app === 'x') { if (STATUS && STATUS.x) window.open(STATUS.x, '_blank', 'noopener,noreferrer'); return; }
    const w = this.wins[app]; if (!w) return;
    closeMenus(); closePal();
    if (w.classList.contains('leaving')) { clearTimeout(w._lt); w.classList.remove('leaving'); }
    const was = w.classList.contains('open');
    if (!was) {
      w.classList.remove('from'); w.classList.add('open'); if (!w.dataset.placed) { this.place(w); w.dataset.placed = '1'; } this.task(app, true);
      const src = fromEl || $(`#odock [data-open="${app}"]`) || $(`#tasks [data-task="${app}"]`);
      if (src && !NARROW() && !RM) { const f = src.getBoundingClientRect(), r = w.getBoundingClientRect(); w.style.transformOrigin = `${Math.round(f.left + f.width / 2 - r.left)}px ${Math.round(f.top + f.height / 2 - r.top)}px`; void w.offsetWidth; w.classList.add('from'); }
    }
    w.classList.remove('minimized'); this.focus(app);
    if (!was) { this.zoom(fromEl ? this.rectOf(fromEl) : null, this.rectOf(w)); SOUND.sfx('open'); }
    if (APPS[app] && APPS[app].open && (!was || arg !== undefined)) APPS[app].open(arg);
  },
  // windows leave with a short shrink before they go
  leave(w, fin, to) {
    if (RM || !w.classList.contains('open')) return fin();
    if (to) { const f = to.getBoundingClientRect(), r = w.getBoundingClientRect(); w.style.transformOrigin = `${Math.round(f.left + f.width / 2 - r.left)}px ${Math.round(f.top + f.height / 2 - r.top)}px`; }
    w.classList.remove('from'); w.classList.toggle('tomin', !!to); w.classList.add('leaving'); clearTimeout(w._lt); w._lt = setTimeout(() => { w.classList.remove('leaving', 'tomin'); fin(); }, to ? 240 : 170);
  },
  close(app) { const w = this.wins[app]; if (!w || w.classList.contains('leaving')) return; if (w.classList.contains('open')) SOUND.sfx('close');
    this.leave(w, () => { w.classList.remove('open', 'active', 'max', 'minimized'); this.task(app, false); APPS[app] && APPS[app].close && APPS[app].close(); this.focusTop(); }); },
  min(app, quiet) { const w = this.wins[app], b = $(`#tasks [data-task="${app}"]`) || $(`#odock [data-open="${app}"]`); if (!w || w.classList.contains('leaving')) return;
    this.leave(w, () => { w.classList.remove('open', 'active'); w.classList.add('minimized'); this.syncTasks(); if (!quiet) this.focusTop(); }, NARROW() ? null : b); },
  restore(app) {
    const w = this.wins[app], b = $(`#tasks [data-task="${app}"]`) || $(`#odock [data-open="${app}"]`);
    if (w.classList.contains('leaving')) { clearTimeout(w._lt); w.classList.remove('leaving', 'tomin'); }
    w.classList.remove('minimized', 'from'); w.classList.add('open');
    if (b && !RM && !NARROW()) { const f = b.getBoundingClientRect(), r = w.getBoundingClientRect(); w.style.transformOrigin = `${Math.round(f.left + f.width / 2 - r.left)}px ${Math.round(f.top + f.height / 2 - r.top)}px`; void w.offsetWidth; w.classList.add('from'); }
    this.focus(app); if (b) this.zoom(this.rectOf(b), this.rectOf(w));
  },
  max(app) { if (NARROW()) return; const w = this.wins[app], f = this.rectOf(w); w.classList.toggle('max'); this.zoom(f, this.rectOf(w)); },
  retitle(app, title) { const w = this.wins[app]; if (!w) return; w.dataset.title = title; this.title(w); const b = $(`#tasks [data-task="${app}"] span`); if (b) b.textContent = FILE[app] || title.split(' — ')[0]; },
  isActive(app) { const w = this.wins[app]; return !!(w && w.classList.contains('open') && w.classList.contains('active')); },
  focus(app) {
    const w = this.wins[app]; if (!w || !w.classList.contains('open')) return;
    $$('#wins .w.active').forEach(x => x !== w && x.classList.remove('active'));
    w.classList.add('active'); w.style.zIndex = ++this.z; this.order = this.order.filter(a => a !== app); this.order.push(app); this.syncTasks();
  },
  blur() { $$('#wins .w.active').forEach(x => x.classList.remove('active')); this.syncTasks(); },
  focusTop() { const open = this.order.filter(a => this.wins[a].classList.contains('open')); if (open.length) this.focus(open[open.length - 1]); else this.syncTasks(); },
  task(app, on) {
    const t = $('#tasks'); let b = t.querySelector(`[data-task="${app}"]`);
    if (on && !b) {
      const w = this.wins[app]; b = document.createElement('button'); b.type = 'button'; b.dataset.task = app;
      b.innerHTML = `<svg class="ico"><use href="#i-${esc(w.dataset.icon)}"/></svg><span>${esc(FILE[app] || w.dataset.title.split(' — ')[0])}</span>`;
      b.onclick = () => { const w2 = this.wins[app]; if (w2.classList.contains('minimized')) this.restore(app); else if (w2.classList.contains('active')) this.min(app); else this.focus(app); };
      t.appendChild(b);
    }
    if (!on && b) b.remove();
    this.syncTasks();
  },
  syncTasks() {
    const act = Object.keys(this.wins).find(a => this.isActive(a)) || null;
    $$('#tasks button').forEach(b => { const w = this.wins[b.dataset.task]; b.classList.toggle('on', w.classList.contains('active')); b.classList.toggle('mini', w.classList.contains('minimized')); });
    const live = a => this.wins[a] && (this.wins[a].classList.contains('open') || this.wins[a].classList.contains('minimized'));
    $$('#odock [data-open], #otabs [data-open]').forEach(b => { const a = b.dataset.open; b.classList.toggle('on', a !== 'home' && live(a)); b.classList.toggle('act', a === (act || 'home')); });
    const where = $('#oWhere'); if (where) where.textContent = act ? (FILE[act] || act) : 'home';
    document.body.classList.toggle('haswin', !!act);
    HOME && HOME.pause(!!act && NARROW()); WALL.covered = !!act && NARROW(); if (WALL.ctl) WALL.ctl.pause(WALL.paused || WALL.covered); FX && FX.pause(WALL.paused || WALL.covered);
  },
  // drag by the title bar. pushed against the left or right edge it snaps to that half of the screen; against the top it fills it
  drag(e, w) {
    if (e.target.closest('button') || NARROW()) return;
    e.preventDefault(); const area = $('#wins').getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    let r = w.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, moved = false, zone = null;
    const ghost = $('#snapg');
    const mv = ev => {
      if (!moved) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return; moved = true; w.classList.add('moving');
        if (w.classList.contains('max') || w.dataset.snap) {         // pulling a snapped window off the edge gives it back its size
          const pw = parseFloat(w.dataset.pw) || w.offsetWidth * .6, ph = parseFloat(w.dataset.ph) || w.offsetHeight * .7;
          w.classList.remove('max'); delete w.dataset.snap; w.style.width = pw + 'px'; w.style.height = ph + 'px'; dx = Math.min(dx, pw * .5); dy = Math.min(dy, 18);
        }
      }
      w.style.left = Math.min(area.width - 80, Math.max(-w.offsetWidth + 100, ev.clientX - area.left - dx)) + 'px'; w.style.top = Math.min(area.height - 36, Math.max(0, ev.clientY - area.top - dy)) + 'px';
      zone = ev.clientX < area.left + 18 ? 'l' : ev.clientX > area.right - 18 ? 'r' : ev.clientY < area.top + 8 ? 't' : null;
      if (zone) { const half = area.width / 2; Object.assign(ghost.style, { left: (zone === 'r' ? area.left + half : area.left) + 8 + 'px', top: area.top + 8 + 'px', width: (zone === 't' ? area.width : half) - 16 + 'px', height: area.height - 16 + 'px' }); ghost.classList.add('on'); }
      else ghost.classList.remove('on');
    };
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); w.classList.remove('moving'); ghost.classList.remove('on');
      if (!moved || !zone) return;
      w.dataset.pw = r.width; w.dataset.ph = r.height;
      if (zone === 't') { w.classList.add('max'); return; }
      const half = Math.round(area.width / 2); w.dataset.snap = zone;
      Object.assign(w.style, { left: (zone === 'r' ? half : 0) + 'px', top: '0px', width: half + 'px', height: area.height + 'px' }); SOUND.sfx('click');
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  },
  resize(e, w) {                                           // drag the corner grip
    if (w.classList.contains('max')) return;
    e.preventDefault(); e.stopPropagation();
    const r = w.getBoundingClientRect(), area = $('#wins').getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, cs = getComputedStyle(w);
    const minW = parseInt(cs.minWidth) || 260, minH = parseInt(cs.minHeight) || 160;
    const mv = ev => { w.style.width = Math.max(minW, Math.min(area.right - r.left - 2, r.width + ev.clientX - x0)) + 'px'; w.style.height = Math.max(minH, Math.min(area.bottom - r.top - 2, r.height + ev.clientY - y0)) + 'px'; };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  },
};
function dialog(title, html, buttons = [['ok', true]], icon = 'warn') {
  return new Promise(res => {
    const d = $('#dlg'); $('#dlgT').textContent = title; $('#dlgB').innerHTML = html; $('#dlgI use').setAttribute('href', '#i-' + icon);
    const a = $('#dlgA'); a.innerHTML = '';
    buttons.forEach(([label, def], i) => { const b = document.createElement('button'); b.className = 'bt' + (def ? ' def' : ''); b.type = 'button'; b.textContent = label; b.onclick = () => { d.classList.remove('open'); d.hidden = true; res(i); }; a.appendChild(b); });
    d.hidden = false; d.classList.add('open', 'active'); SOUND.sfx('ding'); d.querySelector('[data-x]').onclick = () => { d.classList.remove('open'); d.hidden = true; res(-1); };
    setTimeout(() => a.querySelector('.def') && a.querySelector('.def').focus(), 30);
  });
}
// home: every window steps aside; a second press goes back to the top
function showHome() {
  closeMenus(); closePal();
  const open = Object.keys(WM.wins).filter(a => WM.wins[a].classList.contains('open'));
  if (!open.length) { HOME && HOME.top(); WM.syncTasks(); return; }
  open.forEach(a => WM.min(a, true)); WM.syncTasks();
}

// ================================================================ the os chrome: top bar, dock, tabs, command bar, search
let HOOKS = {}, HOME = null, FX = null;
function closeMenus() { HOOKS.closeClock && HOOKS.closeClock(); }
// the home screen's pc: the ascii PC only runs when it is wanted, and pauses under the screensaver
const WALL = { want: 'pc', ctl: null, paused: false, covered: false, loading: false };
function setWall(v) {
  WALL.want = v; $('#wall').classList.toggle('off', v !== 'pc');
  if (WALL.ctl) WALL.ctl.show(v === 'pc');
  else if (v === 'pc' && !RM && !WALL.loading && !$('#os').hidden) { WALL.loading = true; import('./ascii3d.js?v=4').then(m => { WALL.ctl = m.mountAscii($('#wall')); WALL.ctl.show(WALL.want === 'pc'); WALL.ctl.pause(WALL.paused || WALL.covered); }).catch(() => {}); }
}
function pauseWall(p) { WALL.paused = p; if (WALL.ctl) WALL.ctl.pause(p || WALL.covered); FX && FX.pause(p || WALL.covered); }
let pickImage = null;
async function useImage(file) {
  WM.open('launch');
  if (pickImage) await pickImage(file);
  if (W.step === 0 && !checkCoin()) go(1); else if (W.step === 3) review();
  toast(W.step === 0 ? 'image set · fill in the coin, then next' : 'image set in launch.exe');
}
function openClaimWatch(addr) { WM.open('claim'); $('#kWatch').value = addr; setClaimKey(null, addr); }

// search: apps, the parts of home and a few commands, all from one box (ctrl k, or the apps tab on a phone)
const PAL = { items: [], list: [], i: 0 };
function palItems() {
  const app = (id, name, sub) => ({ k: 'app', id, name, sub, icon: WM.wins[id] ? WM.wins[id].dataset.icon : 'pc', run: () => WM.open(id) });
  const sec = (id, name) => ({ k: 'page', name, sub: 'home', icon: 'home', run: () => { showHome(); setTimeout(() => HOME && HOME.to(id), 60); } });
  const act = (name, sub, icon, run) => ({ k: 'do', name, sub, icon, run });
  return [
    app('launch', 'launch.exe', 'launch a coin, free'), app('coins', 'coins.db', 'every coin launched on dao'), app('claim', 'claim.exe', 'claim creator fees, no gas'),
    app('privacy', 'privacy.cpl', 'the six layers'), app('strip', 'strip.exe', 'see what a photo carries'), app('scan', 'scan.exe', 'what this page talks to'),
    app('paint', 'paint.exe', 'draw a coin'), app('sweeper', 'tracker sweeper', 'a game'), app('cd', 'cd player', 'the soundtrack'), app('cmd', 'cmd.exe', 'command prompt'),
    app('readme', 'readme.txt', 'the manual'), app('display', 'display.cpl', 'colours, crt, screen saver'), app('pc', 'system.cpl', 'status of this pc'), app('bin', 'recycle bin', 'emptied, on purpose'),
    sec('h-top', 'top of home'), sec('h-how', 'how a launch works'), sec('h-layers', 'the six layers'), sec('h-live', 'launched on dao'),
    sec('h-apps', 'every app in this os'), sec('h-faq', 'questions'),
    act('sound on / off', 'toggle', 'cd', () => SOUND.toggle()), act('screen saver', 'start it now', 'display', () => HOOKS.saver && HOOKS.saver.start()),
    ...['amber', 'teal', 'rose', 'ice', 'mono'].map(c => act('colour: ' + c, 'accent', 'display', () => HOOKS.setAccent && HOOKS.setAccent(c))),
    act('back to room 00', 'replay the way in', 'door', backToRoom),
  ];
}
function palRender() {
  const q = $('#palIn').value.trim().toLowerCase();
  PAL.list = PAL.items.filter(it => !q || (it.name + ' ' + it.sub).toLowerCase().includes(q));
  PAL.i = Math.min(PAL.i, Math.max(0, PAL.list.length - 1));
  const apps = PAL.list.filter(it => it.k === 'app');
  $('#palApps').innerHTML = !q ? apps.map(it => `<button type="button" data-p="${PAL.list.indexOf(it)}"><svg class="ico"><use href="#i-${it.icon}"/></svg><span>${esc(it.name)}</span></button>`).join('') : '';
  $('#palApps').hidden = !!q;
  const rows = q ? PAL.list : PAL.list.filter(it => it.k !== 'app');
  if (rows.length && !rows.includes(PAL.list[PAL.i])) PAL.i = PAL.list.indexOf(rows[0]);
  $('#palList').innerHTML = rows.length ? rows.map(it => { const i = PAL.list.indexOf(it); return `<button type="button" role="option" data-p="${i}" class="${i === PAL.i ? 'on' : ''}"><svg class="ico"><use href="#i-${it.icon}"/></svg><b>${esc(it.name)}</b><span>${esc(it.sub)}</span><em>${it.k === 'app' ? 'open' : it.k === 'page' ? 'go' : 'run'}</em></button>`; }).join('') : '<div class="palnone">nothing by that name. try launch, coins or claim.</div>';
  $$('#pal [data-p]').forEach(b => b.onclick = () => palRun(+b.dataset.p));
}
function palRun(i) { const it = PAL.list[i]; if (!it) return; closePal(); it.run(); }
function openPal() {
  const p = $('#pal'); if (!p.hidden) return closePal();
  closeMenus(); PAL.items = palItems(); PAL.i = 0; $('#palIn').value = ''; p.hidden = false; palRender(); SOUND.sfx('open');
  requestAnimationFrame(() => { p.classList.add('on'); if (!MOBILE) $('#palIn').focus(); });
}
function closePal() { const p = $('#pal'); if (!p || p.hidden) return; p.classList.remove('on'); p.hidden = true; }

// the sound bars in the top bar move with the real output, read from the analyser the cd player uses
function meter() {
  const b = $('#traySnd'), bars = [...b.querySelectorAll('.eq i')]; let buf = null, last = 0;
  const loop = now => {
    requestAnimationFrame(loop); if (now - last < 50) return; last = now;
    const a = SOUND.analyser && SOUND.analyser();
    if (!a || !SOUND.on || SOUND.muted || document.hidden) { if (b.classList.contains('live')) { b.classList.remove('live'); bars.forEach(i => { i.style.height = ''; }); } return; }
    if (!buf) buf = new Uint8Array(a.frequencyBinCount); a.getByteFrequencyData(buf); b.classList.add('live');
    [[1, 4], [4, 10], [10, 24], [24, 56]].forEach(([lo, hi], k) => { let v = 0; for (let j = lo; j < hi; j++) v = Math.max(v, buf[j]); bars[k].style.height = (3 + v / 255 * 10).toFixed(1) + 'px'; });
  };
  requestAnimationFrame(loop);
}

// the command bar: the same commands as cmd.exe, typed straight into the os. its answers show above it for a moment
function commandBar() {
  const inp = $('#oCmdIn'), out = $('#oOut'); let hideT = 0;
  const print = (h, cls) => { out.hidden = false; const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = h; out.appendChild(d); while (out.children.length > 9) out.firstChild.remove(); clearTimeout(hideT); hideT = setTimeout(() => { out.hidden = true; }, 9000); };
  const CMD = commands(print, () => { out.innerHTML = ''; out.hidden = true; }, () => { out.hidden = true; inp.blur(); });
  const hist = []; let hi = 0;
  inp.addEventListener('keydown', e => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') SOUND.sfx('key');
    if (e.key === 'Escape') { out.hidden = true; inp.blur(); return; }
    if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; return; }
    if (e.key === 'ArrowDown' && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; return; }
    if (e.key !== 'Enter') return; const raw = inp.value; inp.value = ''; if (!raw.trim()) return;
    hist.push(raw); hi = hist.length;
    print(`<span class="ok">C:\\DAO&gt;</span> ${esc(raw)}`); CMD.run(raw);
  });
  inp.addEventListener('blur', () => { clearTimeout(hideT); hideT = setTimeout(() => { out.hidden = true; }, 2500); });
}

function initOS() {
  WM.init();
  HOME = mountHome({ root: $('#ohome'), mobile: MOBILE });
  FX = mountFx({ main: $('#omain'), dock: $('#odock'), mobile: MOBILE, rm: RM });
  $$('#odock .ico').forEach((ic, k) => { ic.style.setProperty('--k', k); ic.classList.add('draw'); });
  meter();
  // anything marked data-open opens that app: the dock, the tabs, the home page, buttons inside windows
  document.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (!b) return; WM.open(b.dataset.open, undefined, b.closest('#odock, #otabs, .tiles, .ctas, #tasks') ? b : null); });
  $('#ohome').addEventListener('pointerdown', () => { closeMenus(); if (!NARROW()) WM.blur(); });
  $('#tabApps').onclick = e => { e.stopPropagation(); openPal(); };
  $('#oFind').onclick = e => { e.stopPropagation(); openPal(); };
  $('#oFind').dataset.tip = 'search · ' + (MAC ? '⌘K' : 'ctrl K');
  $('#pal').addEventListener('pointerdown', e => { if (e.target.id === 'pal') closePal(); });
  $('#palX').onclick = () => closePal(); $('#palX').textContent = MOBILE ? 'close' : 'esc';
  $('#palIn').addEventListener('input', () => { PAL.i = 0; palRender(); });
  $('#palIn').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const rows = $$('#palList [data-p]').map(b => +b.dataset.p); if (!rows.length) return; const k = rows.indexOf(PAL.i); PAL.i = rows[(k + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]; palRender(); const on = $('#palList .on'); on && on.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); const rows = $$('#palList [data-p]').map(b => +b.dataset.p); palRun(rows.includes(PAL.i) ? PAL.i : rows[0]); }
    else if (e.key === 'Escape') { e.preventDefault(); closePal(); }
  });
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(); return; }
    if (e.key === 'Escape') { closeMenus(); closePal(); return; }
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
    if (!typing && e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (NARROW()) openPal(); else $('#oCmdIn').focus(); }
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.menu, #clock')) closeMenus(); });
  soundButton($('#traySnd'));
  const tick = () => { const d = new Date(); $('#clock').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 15000);
  const leave = async () => { closeMenus(); const i = await dialog('leave the os', 'go back to room 00, or shut the pc down?', [['back to room 00', true], ['shut down', false], ['cancel', false]], 'power');
    if (i === 0) backToRoom();
    if (i === 1) { SOUND.sfx('brown'); pauseWall(true); $('#shutdown').hidden = false; $('#shutdown').onclick = backToRoom; } };
  $('#shutBtn').onclick = leave; $('#hRoom').onclick = backToRoom;
  $('#balloon').onclick = e => { if (!e.target.closest('.bx')) WM.open('coins'); $('#balloon').hidden = true; };
  wizard(); claimUi(); privacy(); readme(); cmd(); bin(); commandBar();
  $('#wizArt').textContent = WIZ_ART;
  $('#coinsRefresh').onclick = () => coins();
  HOOKS = install({ $, $$, esc, WM, dialog, toast, ls, MOBILE, copy, ago, usd, sfx: (n, a) => SOUND.sfx(n, a), getStatus: () => STATUS, getCoins: () => COINS, useImage, openClaimWatch, setWall, pauseWall, closeMenus });
  Object.assign(APPS, { display: HOOKS.display, paint: HOOKS.paint, sweeper: HOOKS.sweeper, coin: HOOKS.coin, run: HOOKS.run });
  const TOOLS = installTools({ $, esc, WM, toast, useImage, sound: SOUND, sfx: (n, a) => SOUND.sfx(n, a) });
  Object.assign(APPS, { strip: TOOLS.strip, scan: TOOLS.scan, cd: TOOLS.cd });
  // drop a photo anywhere in the os: strip.exe opens with it
  const dz = $('#os');
  dz.addEventListener('dragover', e => { if (!e.target.closest('.w') && [...(e.dataTransfer.items || [])].some(i => i.kind === 'file')) { e.preventDefault(); dz.classList.add('dropping'); } });
  dz.addEventListener('dragleave', e => { if (e.target === dz || !dz.contains(e.relatedTarget)) dz.classList.remove('dropping'); });
  dz.addEventListener('drop', e => { dz.classList.remove('dropping'); if (e.target.closest('.w')) return; const f = e.dataTransfer.files[0]; if (!f || !/^image\//.test(f.type)) return; e.preventDefault(); WM.open('strip', f); });
  WM.syncTasks();
  status(); coins(true);
  setInterval(status, 20000); setInterval(() => coins(false), 25000);
  setWall(WALL.want);
}

// ================================================================ live data
let STATUS = null, COINS = [], SEEN = null;
const WHY = { treasury: 'free launches are paused right now. you can still launch with your own wallet.', cap: "today's free launches are used up. back at 00:00 UTC, or launch with your own wallet.", paused: 'launches are paused for a moment.', rpc: "solana can't be reached right now." };
async function status() {
  try { STATUS = await api('status'); } catch { STATUS = null; }
  const s = STATUS;
  HOME && HOME.status(s);
  if (!s) return;
  $('#sysLive').innerHTML = `network: <b>${esc(s.network)}</b>`;
  $('#sysTre').textContent = s.network;
  if (s.x) $('#dockX').hidden = false;
  syncLaunch();
}
async function coins(first) {
  let j; try { j = await api('coins', { params: { limit: 50 } }); } catch (e) { $('#coinsBody').innerHTML = `<div class="empty">${esc(e.message)}</div>`; HOME && HOME.coins(null, true); return; }
  const list = j.coins || [];
  HOME && HOME.coins(list);
  const fresh = SEEN ? list.filter(c => !SEEN.has(c.id) && c.status === 'launched') : [];
  SEEN = new Set(list.map(c => c.id)); COINS = list;
  if (fresh.length && !first) balloon(`new coin · $${fresh[0].symbol}`, `${fresh[0].name} just launched on dao. click to see it.`);
  $('#coinsMeta').textContent = `${list.length} coin${list.length === 1 ? '' : 's'}${list.length ? (MOBILE ? ' · tap a coin for its properties' : ' · double-click a coin for its properties') : ''}`;
  $('#coinsSol').textContent = j.solUsd ? `SOL $${j.solUsd}` : '';
  if (!list.length) { $('#coinsBody').innerHTML = `<div class="empty"><pre>  .--------.\n  | empty_ |\n  '--------'</pre>no coins yet. the first one launched on dao shows up here.<br><br><button class="bt def" type="button" data-open="launch">launch the first</button></div>`; return; }
  const bar = p => { if (p == null) return '<span class="dim">—</span>'; const n = Math.round(p * 10); return `<span class="prog">${'█'.repeat(n)}<i>${'░'.repeat(10 - n)}</i></span> <span class="dim">${Math.round(p * 100)}%</span>`; };
  $('#coinsBody').innerHTML = `<table class="tbl"><thead><tr><th>coin</th><th>age</th><th>mcap</th><th>curve</th><th>creator</th><th></th></tr></thead><tbody>${list.map(c => `
    <tr><td><div class="coin"><img class="ci" src="${esc(c.img)}" alt="" loading="lazy"><b>${esc(c.name)}</b><span>$${esc(c.symbol)}</span></div></td>
    <td class="dim">${ago(c.at)}</td><td>${c.status === 'sending' ? '<span class="pill pend">confirming</span>' : usd(c.mcapUsd)}</td>
    <td>${c.graduated ? '<span class="pill grad">graduated</span>' : bar(c.progress)}</td>
    <td><a class="lk" href="https://solscan.io/account/${esc(c.creator)}" target="_blank" rel="noopener noreferrer">${short(c.creator)}</a></td>
    <td><a class="lk" href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener noreferrer">pump.fun ↗</a></td></tr>`).join('')}</tbody></table>`;
  $$('#coinsBody tbody tr').forEach((tr, i) => { tr.dataset.i = i; tr.title = 'double-click for its properties';
    tr.addEventListener('dblclick', e => { if (!e.target.closest('a')) WM.open('coin', list[i], tr); });
    if (MOBILE) tr.addEventListener('click', e => { if (!e.target.closest('a')) WM.open('coin', list[i]); }); });
}
function balloon(t, b) { const el = $('#balloon'); $('#balT').textContent = t; $('#balB').textContent = b; el.hidden = false; clearTimeout(balloon.t); balloon.t = setTimeout(() => el.hidden = true, 7000); }

// ================================================================ launch.exe
const W = { step: 0, image: null, key: null, mode: 'key' };
function go(s) {
  W.step = s;
  $$('#w-launch .step').forEach(el => el.classList.toggle('on', +el.dataset.s === s));
  $$('#rail div').forEach(b => { const i = +b.dataset.s; b.classList.toggle('on', i === s); b.classList.toggle('done', i < s); });
  $('#wizStatus').textContent = `step ${s + 1} of 5 · ${['coin', 'image', 'creator key', 'review', 'launch'][s]}`;
  if (s === 2 && !W.key && W.mode === 'key') newKey();
  if (s === 3) review();
}
const utf8len = s => new TextEncoder().encode(s).length;
const coinFields = () => ({ name: $('#fName').value.replace(/\s+/g, ' ').trim(), symbol: $('#fSym').value.trim().replace(/^\$/, ''), description: $('#fDesc').value.trim(), x: $('#fX').value.trim(), tg: $('#fTg').value.trim(), web: $('#fWeb').value.trim() });
function checkCoin() {
  const f = coinFields();
  if (!f.name) return 'Give the coin a name.'; if (utf8len(f.name) > 32) return 'The name is over 32 bytes (emoji count as several).';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,9}$/.test(f.symbol)) return 'The ticker needs 1 to 10 letters or numbers.';
  if (f.x && !/^(https:\/\/)?(www\.)?(x|twitter)\.com\//i.test(f.x)) return 'The X link should start with x.com/';
  if (f.tg && !/^(https:\/\/)?(t|telegram)\.me\//i.test(f.tg)) return 'The Telegram link should start with t.me/';
  return null;
}
async function cleanImage(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Use a PNG, JPG, WebP or GIF.');
  if (file.size > 12e6) throw new Error('That file is over 12 MB.');
  const bmp = await createImageBitmap(file), max = 1000, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let blob = await new Promise(r => c.toBlob(r, 'image/png'));
  if (blob.size > 1.4e6) blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .9));
  if (blob.size > 1.4e6) blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .75));
  const dataUrl = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  return { dataUrl, bytes: blob.size, w: c.width, h: c.height, origBytes: file.size };
}
function newKey() { const kp = nacl.sign.keyPair(); W.key = { pub: b58(kp.publicKey), sec: kp.secretKey }; $('#kAddr').textContent = W.key.pub; $('#kSec').textContent = b58(W.key.sec); $('#kSec').classList.remove('show'); $('#kSaved').checked = false; }
function keyFile() { const blob = new Blob([JSON.stringify(Array.from(W.key.sec))], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `dao-creator-${W.key.pub.slice(0, 6)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
const creator = () => W.mode === 'own' ? $('#fOwn').value.trim() : W.mode === 'wallet' ? (WAL.current() && WAL.current().address) : W.key && W.key.pub;
const buySol = () => Math.max(0, Math.min(10, parseFloat($('#wBuy').value) || 0));
function review() {
  const f = coinFields();
  $('#rImg').src = W.image ? W.image.dataUrl : '';
  const rows = [['name', esc(f.name)], ['ticker', '$' + esc(f.symbol)], ['description', esc((f.description ? f.description + '\n\n' : '') + 'launched on dao' + (/^(localhost|127\.|\[)|\.vercel\.app$/.test(location.host) ? '' : ' · ' + location.host))]];
  if (f.x) rows.push(['x', esc(f.x)]); if (f.tg) rows.push(['telegram', esc(f.tg)]); if (f.web) rows.push(['website', esc(f.web)]);
  if (W.mode === 'wallet') {
    const b = buySol();
    rows.push(['creator', `<span class="teal">${esc(creator() || '')}</span> <span class="dim">(your wallet)</span>`]);
    rows.push(['launcher', '<span class="dim">your wallet. it signs and pays.</span>']);
    rows.push(['cost to you', `<b class="gold">a little SOL${b ? ` + ${b} SOL dev buy` : ''}</b> <span class="dim">· paid by your wallet</span>`]);
    rows.push(['dev buy', b ? `<b>${b} SOL</b> <span class="dim">· bought in the same transaction</span>` : '<span class="dim">none</span>']);
  } else {
    rows.push(['creator', `<span class="teal">${esc(creator())}</span> <span class="dim">${W.mode === 'own' ? '(your own)' : '(made in this browser)'}</span>`]);
    rows.push(['launcher', '<span class="dim">a fresh wallet, made and funded at launch</span>']);
    rows.push(['cost to you', '<b class="gold">free</b>']);
    rows.push(['dev buy', '<span class="dim">none. nobody holds the coin at launch.</span>']);
  }
  $('#rKv').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd${k === 'description' ? ' class="desc"' : ''}>${v}</dd>`).join('');
  syncLaunch();
}
function syncLaunch() {
  const b = $('#goLaunch'); if (!b) return;
  if (W.mode === 'wallet') { b.disabled = !WAL.current(); b.textContent = 'sign & launch'; if (W.step === 3) $('#e3').textContent = WAL.current() ? '' : 'Connect a wallet first.'; return; }
  b.textContent = 'launch'; b.disabled = !(STATUS && STATUS.ready); if (W.step === 3) $('#e3').textContent = STATUS && !STATUS.ready ? (WHY[STATUS.why] || 'Launches are paused.') : (STATUS ? '' : 'Checking the treasury…');
}
const term = lines => $('#term').innerHTML = lines.join('\n');
function pow(challenge, bits, onP) { return new Promise((res, rej) => { const w = new Worker('/assets/js/pow.js'); w.onmessage = e => { if (e.data.done) { w.terminate(); res(e.data); } else onP(e.data); }; w.onerror = () => { w.terminate(); rej(new Error('Proof of work failed in this browser.')); }; w.postMessage({ challenge, bits }); }); }
async function launch() {
  const f = coinFields(), out = []; const say = s => { out.push(s); term(out); }, sayLast = s => { out[out.length - 1] = s; term(out); };
  go(4); $('#doneCard').classList.remove('show'); const oldBack = $('#termBack'); if (oldBack) oldBack.remove();
  try {
    say('<span class="m">C:\\DAO&gt;</span> launch --private');
    say('requesting a proof-of-work challenge …'); const ch = await api('pow'); sayLast(`requesting a proof-of-work challenge … <span class="ok">ok</span> <span class="m">(${ch.bits} bits)</span>`);
    say('hashing on your device …'); const t0 = performance.now();
    const res = await pow(ch.challenge, ch.bits, p => { const k = Math.min(1, p.tries / Math.pow(2, ch.bits)), n = Math.round(k * 16); sayLast(`hashing on your device <span class="bar8">[${'█'.repeat(n)}${'░'.repeat(16 - n)}]</span> <span class="m">${(p.rate / 1e6).toFixed(2)}M h/s</span>`); });
    sayLast(`hashing on your device <span class="bar8">[${'█'.repeat(16)}]</span> <span class="ok">found</span> <span class="m">${((performance.now() - t0) / 1000).toFixed(1)}s</span>`);
    say(`cleaned image ……………… <span class="ok">${Math.round(W.image.bytes / 1024)} KB</span>`);
    say(`creator ……………………… <span class="ok">${short(creator())}</span> <span class="m">(${W.mode === 'own' ? 'your own' : 'born in this browser'})</span>`);
    say('treasury funds a fresh launcher · pump.fun create …');
    const j = await api('launch', { method: 'POST', body: { ...f, image: W.image.dataUrl, creator: creator(), pow: { challenge: ch.challenge, nonce: res.nonce } } });
    sayLast('treasury funds a fresh launcher · pump.fun create … <span class="ok">sent</span>');
    say(`mint ……………………………… <span class="g">${j.mint}</span>`);
    let st = j.status, n = 0; say(st === 'launched' ? 'confirmed ……………………… <span class="ok">yes</span>' : 'waiting for confirmation …');
    while (st === 'sending' && n++ < 40) { await sleep(2500); try { st = (await api('launches', { params: { id: j.id } })).launch.status; } catch {} if (st === 'launched') sayLast('confirmed ……………………… <span class="ok">yes</span>'); }
    if (st === 'failed') throw new Error('The launch did not go through. Nothing was created and you spent nothing.');
    if (st !== 'launched') say('<span class="g">still confirming. check coins.db in a minute.</span>');
    say(''); say(`<span class="ok">■ ${esc(f.name)} ($${esc(f.symbol)}) is live.</span> its creator is a key nobody else has ever seen.`);
    $('#dPump').href = 'https://pump.fun/coin/' + j.mint; $('#dTx').href = 'https://solscan.io/tx/' + j.sig; $('#doneCard').classList.add('show');
    FX && FX.burst(); status(); coins(false);
  } catch (e) {
    say(`<span class="r">✗ ${esc(e.message)}</span>`); if (e.detail) say(`<span class="m">${esc(String(e.detail).slice(0, 200))}</span>`);
    const back = document.createElement('button'); back.id = 'termBack'; back.className = 'bt'; back.type = 'button'; back.textContent = '< back to review'; back.style.marginTop = '10px'; back.onclick = () => { back.remove(); go(3); }; $('#term').after(back);
  }
}
// A launch the connected wallet signs and pays for: the mint key is born here and signs after the wallet.
async function walletLaunch() {
  const f = coinFields(), out = []; const say = s => { out.push(s); term(out); }, sayLast = s => { out[out.length - 1] = s; term(out); };
  go(4); $('#doneCard').classList.remove('show'); const oldBack = $('#termBack'); if (oldBack) oldBack.remove();
  try {
    const cur = WAL.current(), mk = nacl.sign.keyPair(), mint = b58(mk.publicKey), buy = buySol();
    say('<span class="m">C:\\DAO&gt;</span> launch --wallet');
    say(`wallet ………………………… <span class="ok">${short(cur.address)}</span> <span class="m">(${esc(cur.name || 'connected')})</span>`);
    say(`coin key …………………… <span class="ok">${short(mint)}</span> <span class="m">(born in this browser)</span>`);
    say('building the launch' + (buy ? ` with a ${buy} SOL dev buy` : '') + ' …');
    const j = await api('walletbuild', { method: 'POST', body: { ...f, image: W.image.dataUrl, creator: cur.address, mint, buySol: buy } });
    sayLast('building the launch' + (buy ? ` with a ${buy} SOL dev buy` : '') + ' … <span class="ok">ok</span>');
    say('<span class="g">check your wallet and approve it …</span>');
    let signed; try { signed = await WAL.signTx(unb64(j.tx)); } catch (e) { throw new Error(/reject|denied|cancel/i.test(String(e && e.message)) ? 'You cancelled in your wallet. Nothing was sent.' : (e && e.message) || 'The wallet did not sign.'); }
    sayLast('check your wallet and approve it … <span class="ok">signed</span>');
    const full = WAL.addSignature(signed, mk.publicKey, mk.secretKey);
    say('sending to solana …');
    const r = await api('walletsend', { method: 'POST', body: { id: j.id, tx: WAL.b64(full) } });
    sayLast('sending to solana … <span class="ok">sent</span>');
    say(`mint ……………………………… <span class="g">${r.mint}</span>`);
    let st = r.status, n = 0; say(st === 'launched' ? 'confirmed ……………………… <span class="ok">yes</span>' : 'waiting for confirmation …');
    while (st === 'sending' && n++ < 40) { await sleep(2500); try { st = (await api('launches', { params: { id: r.id } })).launch.status; } catch {} if (st === 'launched') sayLast('confirmed ……………………… <span class="ok">yes</span>'); }
    if (st === 'failed') throw new Error('The launch did not land. Nothing was created.');
    if (st !== 'launched') say('<span class="g">still confirming. check coins.db in a minute.</span>');
    say(''); say(`<span class="ok">■ ${esc(f.name)} ($${esc(f.symbol)}) is live.</span> launched from your wallet${buy ? `, ${buy} SOL bought first` : ''}.`);
    $('#dPump').href = 'https://pump.fun/coin/' + r.mint; $('#dTx').href = 'https://solscan.io/tx/' + r.sig; $('#doneCard').classList.add('show');
    coins(false);
  } catch (e) {
    say(`<span class="r">✗ ${esc(e.message)}</span>`); if (e.detail) say(`<span class="m">${esc(String(e.detail).slice(0, 200))}</span>`);
    const back = document.createElement('button'); back.id = 'termBack'; back.className = 'bt'; back.type = 'button'; back.textContent = '< back to review'; back.style.marginTop = '10px'; back.onclick = () => { back.remove(); go(3); }; $('#term').after(back);
  }
}
function wizard() {
  $$('#w-launch [data-back]').forEach(b => b.onclick = () => go(W.step - 1));
  $$('#w-launch [data-cancel]').forEach(b => b.onclick = () => WM.close('launch'));
  $('#fDesc').addEventListener('input', e => $('#descCount').textContent = `${e.target.value.length} / 600 · "launched on dao" is added at the end`);
  $('#fSym').addEventListener('input', e => { e.target.value = e.target.value.replace(/^\$/, '').replace(/\s/g, ''); });
  $('#s0').addEventListener('submit', e => { e.preventDefault(); const er = checkCoin(); $('#e0').textContent = er || ''; if (!er) go(1); });
  const pick = async file => { $('#e1').textContent = ''; $('#imgInfo').textContent = 'cleaning…';
    try { const img = await cleanImage(file); W.image = img; $('#pv').innerHTML = `<img alt="" src="${img.dataUrl}">`; $('#imgInfo').innerHTML = `<span class="teal">clean</span> · ${img.w}×${img.h} · ${Math.round(img.bytes / 1024)} KB (was ${Math.round(img.origBytes / 1024)} KB with its metadata)`; }
    catch (e) { $('#e1').textContent = e.message; $('#imgInfo').textContent = ''; } };
  pickImage = pick;
  $('#fImg').addEventListener('change', e => e.target.files[0] && pick(e.target.files[0]));
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) pick(f); });
  $('#n1').onclick = () => { if (!W.image) { $('#e1').textContent = 'Add an image first.'; return; } go(2); };
  $('#kSec').onclick = () => $('#kSec').classList.toggle('show');
  $('#kDl').onclick = () => { keyFile(); $('#kSaved').checked = true; };
  $('#kCopy').onclick = () => copy(b58(W.key.sec));
  $('#kNew').onclick = () => newKey();
  const HINT = { key: "a brand-new key becomes the coin's creator. every creator fee lands in it. made right now, on your device.", own: 'an address you already control becomes the creator. the launch stays free.', wallet: 'your wallet launches the coin itself: it signs, pays and can buy first.' };
  const setMode = m => { W.mode = m; $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); $('#keyBox').hidden = m !== 'key'; $('#ownBox').hidden = m !== 'own'; $('#walletBox').hidden = m !== 'wallet'; $('#s2hint').textContent = HINT[m]; $('#e2').textContent = ''; if (m === 'key' && !W.key) newKey(); if (m === 'wallet') walletList(); $('#wizCost').textContent = m === 'wallet' ? 'cost to you: paid by your wallet' : 'cost to you: free'; syncLaunch(); };
  $$('#modeSeg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  const walletList = () => {
    const ws = WAL.wallets(), box = $('#wList'); if (WAL.current()) { box.innerHTML = ''; return; }
    box.innerHTML = ws.length ? ws.map((w, i) => `<button class="bt wbtn" type="button" data-w="${i}"><img src="${esc(w.icon || '')}" alt="">${esc(w.name)}</button>`).join('') : '<p class="hint">no solana wallet found in this browser. phantom, solflare and backpack all work. on a phone, open this page inside your wallet app.</p>';
    $$('#wList [data-w]').forEach(b => b.onclick = async () => { $('#e2').textContent = ''; try { await WAL.connect(ws[+b.dataset.w]); } catch (e) { $('#e2').textContent = e && e.message ? e.message : 'The wallet did not connect.'; } });
  };
  WAL.onWallets(() => { if (W.mode === 'wallet') walletList(); });
  WAL.onChange(cur => {
    $('#wConn').hidden = !cur; if (cur) { $('#wName').textContent = cur.name || 'wallet'; $('#wAddr').textContent = cur.address; $('#wIcon').src = cur.icon || '/assets/img/ico-claim-16.png'; }
    walletList(); if (W.step === 3) review(); else syncLaunch();
  });
  $('#wOff').onclick = () => WAL.disconnect();
  $('#wBuy').addEventListener('input', () => { if (W.step === 3) review(); });
  $('#n2').onclick = () => {
    if (W.mode === 'own') { if (!isAddr($('#fOwn').value.trim())) { $('#e2').textContent = 'That is not a Solana address.'; return; } }
    else if (W.mode === 'wallet') { if (!WAL.current()) { $('#e2').textContent = 'Connect a wallet first.'; return; } const v = $('#wBuy').value; if (v && !(parseFloat(v) >= 0 && parseFloat(v) <= 10)) { $('#e2').textContent = 'The dev buy can be 0 to 10 SOL.'; return; } }
    else if (!$('#kSaved').checked) { $('#e2').textContent = 'Save your creator key first, then tick the box.'; return; }
    $('#e2').textContent = ''; go(3); };
  $('#goLaunch').onclick = () => { if (!$('#rOk').checked) { $('#e3').textContent = 'Tick the box to confirm.'; return; }
    if (W.mode === 'key' && (!W.key || !$('#kSaved').checked)) { go(2); $('#e2').textContent = 'Save your creator key first, then tick the box.'; return; }
    if (!W.image) { go(1); $('#e1').textContent = 'Add an image first.'; return; } if (W.mode === 'wallet') { if (!WAL.current()) { syncLaunch(); return; } return walletLaunch(); } if (!STATUS || !STATUS.ready) { syncLaunch(); return; } launch(); };
  $('#dAgain').onclick = () => { W.image = null; W.key = null; $('#s0').reset(); $('#pv').innerHTML = '<pre class="asciiprev">  drop\n  an image\n  here</pre>'; $('#imgInfo').textContent = ''; $('#rOk').checked = false; go(0); };
}

// ================================================================ claim.exe
const CL = { kp: null, addr: null, watch: false, wallet: false };
function loadSecret(text) { text = String(text || '').trim(); const sec = text.startsWith('[') ? Uint8Array.from(JSON.parse(text)) : unb58(text); if (sec.length === 32) return nacl.sign.keyPair.fromSeed(sec); if (sec.length !== 64) throw new Error('That does not look like a Solana secret key.'); return nacl.sign.keyPair.fromSecretKey(sec); }
function setClaimKey(kp, watchAddr, wallet) { CL.kp = kp; CL.wallet = !!wallet; CL.watch = !kp && !wallet; CL.addr = kp ? b58(kp.publicKey) : watchAddr; $('#eK').textContent = ''; $('#cAddr').textContent = CL.addr + (CL.watch ? '  (read-only)' : CL.wallet ? '  (connected wallet)' : ''); $('#cRefresh').disabled = false; $('#cClaim').textContent = CL.wallet ? 'claim · your wallet signs' : 'claim · gas paid'; refreshClaim(); }
async function refreshClaim() {
  if (!CL.addr) return; $('#eC').textContent = '';
  try { const j = await api('claim', { params: { creator: CL.addr } });
    $('#cVault').textContent = `${j.vaultSol.toFixed(4)} SOL`; $('#cWallet').textContent = `${j.walletSol.toFixed(4)} SOL`;
    $('#cClaim').disabled = CL.watch || !j.canClaim; $('#cSend').disabled = CL.watch || CL.wallet || !(j.walletSol > 0.00001);
    if (!j.canClaim && j.vaultSol > 0) $('#eC').innerHTML = `<span class="dim">claims open from ${j.minClaimSol} SOL, so the network fee is worth paying.</span>`;
  } catch (e) { $('#eC').textContent = e.message; }
}
function cterm(s) { const t = $('#cTerm'); t.hidden = false; t.innerHTML = s; t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
async function signAndSend(build, sendOp, body) { const b = await api(build, { method: 'POST', body }); const sig = nacl.sign.detached(unb64(b.message), CL.kp.secretKey); return api(sendOp, { method: 'POST', body: { message: b.message, token: b.token, signer: CL.addr, signature: b58(sig) } }); }
async function walletClaim() {
  const b = await api('wclaimbuild', { method: 'POST', body: { creator: CL.addr } });
  cterm('<span class="g">check your wallet and approve the claim …</span>');
  let signed; try { signed = await WAL.signTx(unb64(b.tx)); } catch (e) { throw new Error(/reject|denied|cancel/i.test(String(e && e.message)) ? 'You cancelled in your wallet.' : (e && e.message) || 'The wallet did not sign.'); }
  return api('wclaimsend', { method: 'POST', body: { creator: CL.addr, tx: WAL.b64(signed) } });
}
function claimUi() {
  const load = async f => { try { setClaimKey(loadSecret(await f.text())); } catch { $('#eK').textContent = 'That file is not a creator key.'; } };
  $('#kFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) load(f); e.target.value = ''; });
  const kd = $('#kDrop');
  ['dragenter', 'dragover'].forEach(t => kd.addEventListener(t, e => { e.preventDefault(); kd.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => kd.addEventListener(t, e => { e.preventDefault(); kd.classList.remove('over'); }));
  kd.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) load(f); });
  $('#kPaste').addEventListener('change', e => { try { setClaimKey(loadSecret(e.target.value)); e.target.value = ''; } catch (er) { $('#eK').textContent = er.message || 'That is not a secret key.'; } });
  $('#kWatch').addEventListener('change', e => { const a = e.target.value.trim(); if (!isAddr(a)) { $('#eK').textContent = 'That is not a Solana address.'; return; } setClaimKey(null, a); });
  $('#cRefresh').onclick = refreshClaim;
  $('#cConn').onclick = async () => {
    let cur = WAL.current();
    if (!cur) { const ws = WAL.wallets(); if (!ws.length) return dialog('connect wallet', 'no solana wallet found in this browser.<br><span class="dim">phantom, solflare and backpack all work. on a phone, open this page inside your wallet app.</span>', [['ok', true]], 'claim');
      const i = ws.length === 1 ? 0 : await dialog('connect wallet', 'which wallet?', [...ws.map((w, k) => [w.name, k === 0]), ['cancel', false]], 'claim'); if (i < 0 || i >= ws.length) return;
      try { cur = await WAL.connect(ws[i]); } catch (e) { $('#eK').textContent = e && e.message ? e.message : 'The wallet did not connect.'; return; } }
    setClaimKey(null, cur.address, true);
  };
  WAL.onChange(cur => { $('#cConn').textContent = cur ? `use ${short(cur.address)}` : 'connect wallet'; if (CL.wallet && (!cur || cur.address !== CL.addr)) { CL.wallet = false; CL.addr = null; $('#cAddr').textContent = 'no key loaded'; $('#cClaim').disabled = true; } });
  $('#cClaim').onclick = async () => { $('#cClaim').disabled = true; cterm(CL.wallet ? 'building the claim for your wallet …' : 'building the claim · the treasury pays the fee …');
    try { const r = CL.wallet ? await walletClaim() : await signAndSend('claimbuild', 'claimsend', { creator: CL.addr }); cterm(`<span class="ok">claimed.</span> <a class="lk" href="https://solscan.io/tx/${r.sig}" target="_blank" rel="noopener noreferrer">transaction ↗</a>`); setTimeout(refreshClaim, 2500); }
    catch (e) { cterm(`<span class="r">✗ ${esc(e.message)}</span>`); $('#cClaim').disabled = false; } };
  $('#cSend').onclick = async () => { const to = $('#cTo').value.trim(); if (!isAddr(to)) { $('#eC').textContent = 'Enter a Solana address to send to.'; return; } $('#cSend').disabled = true; cterm('building the transfer …');
    try { const r = await signAndSend('withdrawbuild', 'withdrawsend', { from: CL.addr, to }); cterm(`<span class="ok">sent.</span> <a class="lk" href="https://solscan.io/tx/${r.sig}" target="_blank" rel="noopener noreferrer">transaction ↗</a>`); setTimeout(refreshClaim, 2500); }
    catch (e) { cterm(`<span class="r">✗ ${esc(e.message)}</span>`); $('#cSend').disabled = false; } };
}

// ================================================================ privacy.cpl
const LAYERS = [
  ['site', 'a site that tracks <b>nothing</b>', 'no analytics, no cookies, no third-party scripts or fonts. this page only talks to its own server, and its security headers forbid anything else. open devtools and check.', 'your IP reaches our host, like every website.'],
  ['connect', 'no wallet <b>connect</b>', 'you never connect a wallet, approve anything, or sign a launch. there is nothing for a drainer to hijack and no wallet of yours on the launch transaction.', 'the coin, its name, image and description.'],
  ['key', 'a creator key <b>born here</b>', "your browser makes a brand-new key, and that key becomes the coin's creator. it has no history and no funding trail. we never see it. you save it, you own the fees.", 'the creator address and the fees it earns.'],
  ['launcher', 'a fresh <b>launcher</b>', 'a new wallet signs each launch. the dao treasury funds it inside the same transaction to the lamport, so it ends empty. the dev wallet on the chart is never yours.', 'that the dao treasury paid for the launch.'],
  ['gas', 'claims without <b>gas</b>', 'funding a new wallet is how people get traced. so the creator key never needs funding: you sign the claim in your browser and the treasury pays the network fee.', 'the claim, and anything you do with the fees after.'],
  ['files', 'clean <b>files</b>', 'your image is redrawn in your browser before upload, which drops hidden data like camera, time and location. only the pixels leave your device.', 'whatever the picture itself shows.'],
];
function rings(on) {
  const labels = ['01 site', '02 connect', '03 key', '04 launcher', '05 gas', '06 files'], Wd = 40, Hd = 15, grid = Array.from({ length: Hd }, () => Array(Wd).fill([' ', -1]));
  labels.forEach((lab, i) => { const x0 = i * 3, y0 = i, x1 = Wd - 1 - i * 3, y1 = Hd - 1 - i; if (x1 - x0 < 4 || y1 <= y0) return;
    for (let x = x0; x <= x1; x++) { grid[y0][x] = ['─', i]; grid[y1][x] = ['─', i]; } for (let y = y0; y <= y1; y++) { grid[y][x0] = ['│', i]; grid[y][x1] = ['│', i]; }
    grid[y0][x0] = ['┌', i]; grid[y0][x1] = ['┐', i]; grid[y1][x0] = ['└', i]; grid[y1][x1] = ['┘', i]; });
  const cy = Hd >> 1; [...'you'].forEach((ch, k) => grid[cy][(Wd - 3 >> 1) + k] = [ch, 9]);
  return grid.map(r => r.map(([ch, i]) => i === 9 ? `<span class="core">${ch}</span>` : i === on ? `<span class="on">${esc(ch)}</span>` : esc(ch)).join('')).join('\n');
}
function privacy() {
  const tabs = $('#ptabs');
  tabs.innerHTML = LAYERS.map((l, i) => `<button type="button" role="tab" data-t="${i}">${l[0]}</button>`).join('');
  const show = i => { $$('#ptabs button').forEach(b => b.classList.toggle('on', +b.dataset.t === i)); const l = LAYERS[i];
    $('#ptab').innerHTML = `<h4>${String(i + 1).padStart(2, '0')} · ${l[1]}</h4><p>${l[2]}</p><div class="pub"><b>still public:</b> ${l[3]}</div><pre>${rings(i)}</pre>`; };
  $$('#ptabs button').forEach(b => b.onclick = () => show(+b.dataset.t)); show(0);
}
// ================================================================ readme.txt
function readme() {
  const S = [
    ['why dao', 'a coin with no name on it belongs to nobody in particular. no wallet of yours signs it, no dev wallet of yours sits on the chart, and nothing on the chain points back to a person. that is what we mean by every launch is a dao. the six layers below are how.'],
    ['how a launch works', [
      '1. fill in the coin: a name, a ticker, a line about it and links if you want. nothing about you. "launched on dao" is added to the end of the description.',
      '2. add an image or draw one in paint.exe. your browser redraws it first, so hidden data like the camera, time and location never leaves your device.',
      '3. your browser makes a brand-new creator key. it becomes the coin\'s creator and earns every creator fee. save the key file. it is the only way to claim.',
      '4. a few seconds of proof of work run on your device. that replaces an account and keeps bots out.',
      '5. the dao treasury funds a fresh launcher wallet inside the launch transaction. that wallet signs the pump.fun create and ends with nothing in it.',
      '6. the coin is live. there is no dev buy, so nobody holds it at launch. it shows up in coins.db, read live from the chain.',
    ]],
    ['the six layers', [
      '01 site      no analytics, no cookies, no third-party scripts or fonts. the page only talks to its own server.',
      '02 connect   no wallet connect, no approval and no signature for a free launch. there is nothing for a drainer to hijack.',
      '03 key       the creator key is born in your browser. dao never sees it.',
      '04 launcher  a new wallet signs every launch. the dev wallet on the chart is never yours.',
      '05 gas       the creator key never needs SOL. you sign a claim and the treasury pays the network fee.',
      '06 files     images are redrawn before upload. only the pixels leave your device.',
    ]],
    ['claiming creator fees', [
      '1. open claim.exe and drop in your key file. you can also paste the secret, or connect the wallet you launched with.',
      '2. the key stays in that window, in memory, and is gone when you close the tab. it is never uploaded.',
      '3. press claim. you sign in your browser and the treasury pays the gas.',
      '4. send the SOL anywhere. sending it to a wallet you use in public links the coin to you, so that part is up to you.',
    ]],
    ['or launch with your own wallet', 'pick "connect wallet" in the creator step. your wallet signs and pays the launch (a little SOL) and can add a dev buy in the same transaction. it becomes the creator and shows as the dev on the chart, so the coin is linked to that wallet. the coin\'s own key is still made in your browser. there is no daily limit for wallet launches. phantom, solflare, backpack and other wallets that support the wallet standard work. on a phone, open the site inside your wallet\'s browser.'],
    ['what stays public', 'everything on solana is public: the coin, its trades, the creator address, the launch wallet and the fact that the dao treasury funded it. what is not public is any link from those to you, unless you make one.'],
    ['keep your key safe', 'the creator key controls the fees. never share the secret. dao will never ask for it: claim.exe signs in your browser and only sends signatures. if you lose the key, the fees stay unclaimable. nobody can recover it, including us.'],
    ['tools in the os', [
      'strip.exe   drop any photo to see what it carries besides the picture: camera, lens, time, the place it was taken. then keep a clean copy, or use it as a coin image. you can also drop a photo anywhere in the os.',
      'scan.exe    a live check of this page: every request it made, every server it reached, cookies, trackers and the security policy.',
      'cd player   the soundtrack, made by code in your browser while you listen. two tracks, a volume and a visualizer.',
      'paint.exe   draw a 32 x 32 coin and send it straight to the launch wizard.',
      'sweeper     tracker sweeper. clear the board without hitting a tracker.',
    ]],
    ['commands', 'in room 00, type on the screen: launch, coins, claim, layers or docs to go straight there, or press enter to just go in. lights, lamp and racks do what you think. in the os, the command bar at the bottom and cmd.exe take launch, coins, claim, status, privacy, paint, sweeper, strip, scan, music, color, scr, readme, home, room, whoami, ver, cls and exit. type help in any of them. ctrl k (⌘k on a mac) searches every app and every part of home.'],
  ];
  const Q = [
    ['is it really free?', 'yes. creating a pump.fun coin costs a little SOL in account rent and network fees, and the dao treasury pays it. you pay nothing and sign nothing.'],
    ['why is there a daily limit?', 'every free launch costs the treasury real SOL, so there is a set number per day (reset at 00:00 UTC) and a few per visitor. the proof of work keeps bots out without asking who you are.'],
    ['who gets the creator fees?', 'the creator key, and only it. pump.fun pays creator fees to that address on every trade and dao takes no cut.'],
    ['can dao take my fees or my coin?', 'no. dao never sees the creator key, never buys the coin, and the launch wallet ends empty. dao only holds its own treasury key, which pays launch costs and claim fees.'],
    ['can i edit or delete a coin?', 'no. a coin on pump.fun cannot be edited or deleted after launch, so check the review step.'],
    ['does dao keep logs?', 'dao stores each launch (the coin details and addresses, which are public anyway). for the daily limit only, it also keeps a salted hash of your IP, which is useless the next day and then deleted. there are no accounts, no cookies and no analytics. the host still sees requests, as every host does.'],
  ];
  const body = v => esc(Array.isArray(v) ? v.join('\n') : v);
  $('#readmeBody').innerHTML = `<h5>README.TXT  ·  dao</h5><p>every launch is a dao. a privacy layer for pump.fun.\nno wallet. no signature. no name. no SOL either.</p>`
    + S.map(([h, v]) => `<h5>[ ${esc(h)} ]</h5><p>${body(v)}</p>`).join('')
    + `<h5>[ questions ]</h5>` + Q.map(([q, a]) => `<h5>> ${esc(q)}</h5><p>${esc(a)}</p>`).join('');
}
// ================================================================ cmd.exe
// the commands, shared by cmd.exe and the command bar at the bottom of the os
function commands(print, clear, close) {
  const C = {
    help: () => [['launch', 'open the launch wizard'], ['coins', 'list the newest coins'], ['claim', 'open claim.exe'], ['status', 'is it open?'], ['privacy', 'the six layers'], ['home', 'back to the home screen'], ['paint', 'draw a coin'], ['sweeper', 'tracker sweeper'], ['color', 'color amber|teal|rose|ice|mono'], ['scr', 'start the screen saver'], ['readme', 'open readme.txt'], ['strip', 'see and remove what a photo carries'], ['scan', 'check what this page talks to'], ['music', 'open the cd player'], ['room', 'back to room 00'], ['whoami', 'who are you?'], ['ver', 'version'], ['cls', 'clear the screen'], ['exit', 'close this']].forEach(([a, b]) => print(`<span class="g">${a.padEnd(9, ' ')}</span><span class="m">${b}</span>`)),
    status: () => { const s = STATUS; if (!s) return print('offline.', 'm'); print(`network    ${esc(s.network)}`); print(`launches   ${s.ready ? '<span class="ok">open</span>' : '<span class="g">paused for now</span>'}`); },
    coins: () => { if (!COINS.length) return print('no coins yet. type <span class="g">launch</span> to make the first.', 'm'); COINS.slice(0, 8).forEach(c => print(`<span class="g">$${esc(c.symbol).padEnd(10, ' ')}</span>${esc(c.name).slice(0, 22).padEnd(23, ' ')}<span class="m">${ago(c.at).padEnd(5, ' ')}</span>${c.mcapUsd ? usd(c.mcapUsd) : ''}`)); },
    launch: () => { print('starting launch.exe …', 'm'); WM.open('launch'); }, claim: () => { print('starting claim.exe …', 'm'); WM.open('claim'); },
    privacy: () => WM.open('privacy'), layers: () => WM.open('privacy'), readme: () => WM.open('readme'), docs: () => WM.open('readme'), help2: () => WM.open('readme'),
    strip: () => WM.open('strip'), scan: () => WM.open('scan'), cd: () => WM.open('cd'), music: () => WM.open('cd'), play: () => WM.open('cd'), cmd: () => WM.open('cmd'),
    home: () => showHome(), room: () => backToRoom(), search: () => openPal(), find: () => openPal(),
    // owner only and not in help: send everything in the treasury back to the owner wallet, after it signs a message
    sweep: async () => {
      let cur = WAL.current();
      if (!cur) { const ws = WAL.wallets(); if (!ws.length) return print('no solana wallet found in this browser. open the site in phantom, solflare or backpack.', 'm');
        const i = ws.length === 1 ? 0 : await dialog('connect wallet', 'which wallet holds the owner address?', [...ws.map((w, k) => [esc(w.name), k === 0]), ['cancel', false]], 'cmd');
        if (i < 0 || i >= ws.length) return print('cancelled.', 'm');
        try { cur = await WAL.connect(ws[i]); } catch (e) { return print(esc((e && e.message) || 'the wallet did not connect.'), 'r'); } }
      const msg = `dao · send the treasury to ${cur.address} · ${Date.now()}`;
      print(`check your wallet: it asks ${esc(short(cur.address))} to sign one line. nothing is paid.`, 'm');
      let sig; try { sig = await WAL.signMessage(new TextEncoder().encode(msg)); } catch (e) { return print(/reject|denied|cancel/i.test(String(e && e.message)) ? 'cancelled in your wallet.' : esc((e && e.message) || 'the wallet did not sign.'), 'r'); }
      try { const r = await api('sweep', { method: 'POST', body: { message: msg, signer: cur.address, signature: b58(sig) } });
        print(`sent ${Number(r.sol).toFixed(4)} SOL from the treasury to ${esc(short(cur.address))}.`, 'ok');
        print(`<a class="lk" href="https://solscan.io/tx/${esc(r.sig)}" target="_blank" rel="noopener noreferrer">transaction ↗</a>`); status();
      } catch (e) { print(esc(e.message), 'r'); }
    },
    whoami: () => print('nobody', 'ok'), ver: () => print('dao [version 4.10.1998]'), date: () => print(new Date().toString()), time: () => print(new Date().toLocaleTimeString()),
    cls: clear, clear, exit: close,
    dir: () => ['launch.exe', 'coins.db', 'claim.exe', 'paint.exe', 'sweeper.exe', 'privacy.cpl', 'display.cpl', 'readme.txt'].forEach(f => print(`10-20-98  12:00a    ${f}`)),
    sudo: () => print('nice try. there is no root here, only nobody.', 'm'),
    paint: () => WM.open('paint'), mspaint: () => WM.open('paint'), sweeper: () => WM.open('sweeper'), winmine: () => WM.open('sweeper'), display: () => WM.open('display'), run: () => WM.open('run'),
    scr: () => HOOKS.saver && HOOKS.saver.start(), saver: () => HOOKS.saver && HOOKS.saver.start(),
    color: rest => { const a = (rest[0] || '').toLowerCase(), ok = ['amber', 'teal', 'rose', 'ice', 'mono']; if (!ok.includes(a)) return print('usage: color amber | teal | rose | ice | mono', 'm'); HOOKS.setAccent(a); print(`accent set to ${a}.`, 'ok'); },
  };
  return {
    run(raw) {
      const [c, ...rest] = raw.trim().split(/\s+/); const k = (c || '').toLowerCase(); if (!k) return;
      if (k === 'echo') return print(esc(rest.join(' ')));
      if (k === 'start' && rest[0]) { const a = { 'launch.exe': 'launch', 'claim.exe': 'claim', 'coins.db': 'coins', 'readme.txt': 'readme', 'privacy.cpl': 'privacy', 'paint.exe': 'paint', 'sweeper.exe': 'sweeper', 'display.cpl': 'display', 'strip.exe': 'strip', 'scan.exe': 'scan', 'cdplayer.exe': 'cd', 'cmd.exe': 'cmd' }[rest[0].toLowerCase()] || rest[0].toLowerCase(); return WM.open(a); }
      (C[k] || (() => print(`'${esc(k)}' is not recognized as an internal or external command. type <span class="g">help</span>.`, 'm')))(rest);
    },
  };
}
function cmd() {
  const out = $('#cmdOut'), inp = $('#cmdIn');
  const print = (h, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = h; out.appendChild(d); $('#cmdBody').scrollTop = 1e9; };
  print('dao [version 4.10.1998]', 'm'); print('(c) nobody. all rights unclaimed.', 'm'); print('&nbsp;'); print('type <span class="g">help</span> for commands.');
  $('#cmdBody').addEventListener('click', () => inp.focus());
  const CMD = commands(print, () => { out.innerHTML = ''; }, () => WM.close('cmd'));
  inp.addEventListener('keydown', e => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') SOUND.sfx('key');
    if (e.key !== 'Enter') return; const raw = inp.value; inp.value = ''; print(`<span class="ok">C:\\DAO&gt;</span> ${esc(raw)}`);
    CMD.run(raw);
  });
}
// ================================================================ recycle bin
function bin() {
  const MSG = { name: "this file is empty. we never had your name in the first place.", logs: 'nothing to restore. dao does not keep visitor logs.', dev: 'empty. launches have no dev buy, so there was never a dev bag to delete.' };
  $$('#w-bin tr[data-msg]').forEach(tr => { tr.addEventListener('dblclick', () => dialog('recycle bin', esc(MSG[tr.dataset.msg]), [['ok', true]], 'bin')); tr.addEventListener('click', () => { $$('#w-bin tr').forEach(x => x.classList.toggle('picked', x === tr)); if (MOBILE) dialog('recycle bin', esc(MSG[tr.dataset.msg]), [['ok', true]], 'bin'); }); });
}
const APPS = { cmd: { open: () => setTimeout(() => $('#cmdIn').focus(), 50) }, coins: { open: () => coins(false) }, pc: { open: () => status() }, launch: { open: () => { if (W.step === 0) setTimeout(() => $('#fName').focus(), 60); } } };

boot();
