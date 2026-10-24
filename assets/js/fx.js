// Motion for the dao os: data running along circuit traces behind everything, a light that follows the pointer, a dock
// that swells under it, buttons that lean toward the cursor and tiles that tilt. All of it rests when nobody can see it.
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

export function mountFx({ main, dock, mobile, rm }) {
  const api = { pause() {}, burst() {} };
  // ---- the light under the pointer
  if (!mobile) main.addEventListener('pointermove', e => { const r = main.getBoundingClientRect(); main.style.setProperty('--cx', (e.clientX - r.left) + 'px'); main.style.setProperty('--cy', (e.clientY - r.top) + 'px'); }, { passive: true });
  // ---- the dock swells under the pointer
  if (dock && !mobile && !rm) {
    const btns = [...dock.querySelectorAll('button')]; let my = null, raf = 0;
    const apply = () => { raf = 0; for (const b of btns) { if (b.hidden) continue; const r = b.getBoundingClientRect(), k = my == null ? 0 : Math.max(0, 1 - Math.abs(my - (r.top + r.height / 2)) / 105); b.style.transform = k > .01 ? `scale(${(1 + .24 * k * k).toFixed(3)})` : ''; } };
    dock.addEventListener('pointermove', e => { my = e.clientY; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    dock.addEventListener('pointerleave', () => { my = null; if (!raf) raf = requestAnimationFrame(apply); });
  }
  // ---- buttons lean toward the cursor, tiles tilt under it
  if (!mobile && !rm) {
    document.addEventListener('pointermove', e => {
      const m = e.target.closest && e.target.closest('.cta, .tile, .steps li');
      if (m !== api._last) { if (api._last) { api._last.style.setProperty('--tx', '0px'); api._last.style.setProperty('--ty', '0px'); api._last.style.setProperty('--rx', '0deg'); api._last.style.setProperty('--ry', '0deg'); } api._last = m; }
      if (!m) return;
      const r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      if (m.classList.contains('cta')) { m.style.setProperty('--tx', (x * r.width * .14).toFixed(1) + 'px'); m.style.setProperty('--ty', (y * r.height * .3).toFixed(1) + 'px'); }
      else { m.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg'); m.style.setProperty('--ry', (x * 11).toFixed(2) + 'deg'); }
    }, { passive: true });
  }
  if (rm) return api;

  // ---- traces and the data on them
  const cv = document.createElement('canvas'); cv.className = 'fxbg'; cv.setAttribute('aria-hidden', 'true'); main.prepend(cv);
  const g = cv.getContext('2d'), base = document.createElement('canvas'), bg = base.getContext('2d');
  const CELL = mobile ? 42 : 48;
  let W = 0, H = 0, dpr = 1, traces = [], packets = [], paused = false, last = 0, pending = 0, rnd = rng(11);
  function build() {
    const r = main.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
    dpr = Math.min(1.5, devicePixelRatio || 1); W = r.width; H = r.height; rnd = rng(11);
    cv.width = base.width = Math.round(W * dpr); cv.height = base.height = Math.round(H * dpr);
    traces = [];
    const cols = Math.ceil(W / CELL) + 1, rows = Math.ceil(H / CELL) + 1, n = Math.round(cols * rows / (mobile ? 10 : 7.5));
    for (let i = 0; i < n; i++) {
      let x = Math.floor(rnd() * cols), y = Math.floor(rnd() * rows); const pts = [[x, y]];
      let dir = rnd() < .5 ? [rnd() < .5 ? 1 : -1, 0] : [0, rnd() < .5 ? 1 : -1];
      const len = 4 + Math.floor(rnd() * 13);
      for (let k = 0; k < len; k++) {
        if (k && rnd() < .32) { const o = dir[0] ? [[0, 1], [0, -1], [dir[0], 1], [dir[0], -1]] : [[1, 0], [-1, 0], [1, dir[1]], [-1, dir[1]]]; dir = o[Math.floor(rnd() * o.length)]; }
        x += dir[0]; y += dir[1]; pts.push([x, y]);
      }
      const P = pts.map(([a, b]) => [a * CELL + .5, b * CELL + .5]), L = [0];
      for (let k = 1; k < P.length; k++) L.push(L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
      traces.push({ P, L, len: L[L.length - 1] });
    }
    bg.setTransform(dpr, 0, 0, dpr, 0, 0); bg.clearRect(0, 0, W, H); bg.lineWidth = 1; bg.lineJoin = 'round';
    for (const t of traces) {
      bg.strokeStyle = 'rgba(232,226,210,.05)'; bg.beginPath(); t.P.forEach(([x, y], k) => k ? bg.lineTo(x, y) : bg.moveTo(x, y)); bg.stroke();
      const [sx, sy] = t.P[0], [ex, ey] = t.P[t.P.length - 1];
      bg.strokeStyle = 'rgba(232,226,210,.1)'; bg.strokeRect(sx - 2.5, sy - 2.5, 5, 5);
      bg.fillStyle = 'rgba(98,240,200,.14)'; bg.beginPath(); bg.arc(ex, ey, 2.2, 0, 7); bg.fill();
    }
    packets = Array.from({ length: mobile ? 9 : 20 }, () => spawn(true));
    draw(0);
  }
  function spawn(init) { const t = traces[Math.floor(rnd() * traces.length)]; return { t, d: init ? rnd() * t.len : 0, v: 55 + rnd() * 120, gold: rnd() < .3, tail: 46 + rnd() * 70 }; }
  function at(t, d) { const L = t.L; let k = 1; while (k < L.length - 1 && L[k] < d) k++; const a = t.P[k - 1], b = t.P[k], u = Math.max(0, Math.min(1, (d - L[k - 1]) / ((L[k] - L[k - 1]) || 1))); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
  function draw(dt) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(base, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineWidth = 1.5;
    for (let i = 0; i < packets.length; i++) {
      const p = packets[i]; p.d += p.v * dt;
      if (p.d - p.tail > p.t.len) { packets[i] = spawn(false); continue; }
      const col = p.gold ? '242,184,75' : '98,240,200', seg = p.tail / 7;
      for (let k = 0; k < 7; k++) {
        const d0 = Math.min(p.t.len, p.d - k * seg), d1 = Math.max(0, p.d - (k + 1) * seg); if (d0 <= 0 || d0 <= d1) continue;
        const [x0, y0] = at(p.t, d0), [x1, y1] = at(p.t, d1); g.strokeStyle = `rgba(${col},${(.62 * (1 - k / 7)).toFixed(3)})`; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      if (p.d <= p.t.len) { const [x, y] = at(p.t, p.d); g.fillStyle = `rgba(${col},.16)`; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillStyle = `rgba(${col},1)`; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (paused || document.hidden || !traces.length) { last = now; return; }
    if (now - last < 33) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now; draw(dt);
  }
  new ResizeObserver(() => { clearTimeout(pending); pending = setTimeout(build, 120); }).observe(main);
  build(); requestAnimationFrame(frame);
  api.pause = v => { paused = !!v; };
  api.burst = () => { for (let i = 0; i < 8 && traces.length; i++) packets.push({ ...spawn(false), v: 160 + rnd() * 120, gold: i % 2 === 0 }); setTimeout(() => { packets.length = Math.min(packets.length, mobile ? 9 : 20); }, 6000); };
  return api;
}
