// The home screen of the dao os: a page about dao that you scroll inside the pc. Sections arrive as you reach them,
// headings decrypt, the six layers turn over by themselves, the launch log types itself and the newest coins come from
// the chain. Nothing here is made up: when there are no coins yet, it says so.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp01 = k => Math.max(0, Math.min(1, k));
const ago = t => { const s = Math.max(1, (Date.now() - new Date(t).getTime()) / 1000); return s < 60 ? `${s | 0}s` : s < 3600 ? `${s / 60 | 0}m` : s < 86400 ? `${s / 3600 | 0}h` : `${s / 86400 | 0}d`; };
const usd = n => n == null ? '—' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + Math.round(n);

const LAYERS = [
  ['site', 'a site that tracks <b>nothing</b>', 'no cookies, no analytics, no outside scripts.', 'your IP reaches the host.'],
  ['connect', 'no wallet <b>connect</b>', 'you never connect, approve or sign.', 'the coin itself.'],
  ['key', 'a key <b>born here</b>', 'your browser makes the creator key. we never see it.', 'the creator address.'],
  ['launcher', 'a fresh <b>launcher</b>', 'a new wallet signs each launch and ends empty.', 'that the treasury paid.'],
  ['gas', 'claims without <b>gas</b>', 'you sign, the treasury pays the fee.', 'where you send the fees.'],
  ['files', 'clean <b>files</b>', 'images are redrawn before upload.', 'the picture itself.'],
];
const FAQ = [
  ['is it free?', 'yes. the treasury pays the launch. you sign nothing.'],
  ['who gets the fees?', 'your creator key. dao takes no cut.'],
  ['can dao touch my coin?', 'no. it never sees your key.'],
  ['what stays public?', 'the coin and its trades, like any coin. nothing links them to you.'],
];
const LOG = [['simulate create_v2 on mainnet', 'ok'], ['fund a fresh launcher, to the lamport', 'ok'], ['sign: launcher + mint', 'ok'], ['send', 'confirmed'], ['launcher balance after', '0'], ['names on it', 'none']];

function rings(on) {                                     // six nested boxes around "you"; the layer you are reading lights up
  const W = 38, H = 15, grid = Array.from({ length: H }, () => Array(W).fill([' ', -1]));
  for (let i = 0; i < 6; i++) {
    const x0 = i * 3, y0 = i, x1 = W - 1 - i * 3, y1 = H - 1 - i; if (x1 - x0 < 4 || y1 <= y0) continue;
    for (let x = x0; x <= x1; x++) { grid[y0][x] = ['─', i]; grid[y1][x] = ['─', i]; }
    for (let y = y0; y <= y1; y++) { grid[y][x0] = ['│', i]; grid[y][x1] = ['│', i]; }
    grid[y0][x0] = ['┌', i]; grid[y0][x1] = ['┐', i]; grid[y1][x0] = ['└', i]; grid[y1][x1] = ['┘', i];
  }
  const cy = H >> 1; [...'you'].forEach((ch, k) => { grid[cy][(W - 3 >> 1) + k] = [ch, 9]; });
  return grid.map(r => r.map(([ch, i]) => i === 9 ? `<span class="core">${ch}</span>` : i === on ? `<span class="on">${esc(ch)}</span>` : i >= 0 && i < on ? `<span class="pass">${esc(ch)}</span>` : esc(ch)).join('')).join('\n');
}
const GL = '01<>/\\|#%&$@*+=?';
function decrypt(el) {                                    // the heading arrives scrambled and resolves left to right
  if (el.dataset.done) return; el.dataset.done = '1';
  const nodes = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) nodes.push([n, n.textContent]);
  const DUR = 620, t0 = performance.now() + 180;               // time based, so a slow device still lands on time
  const tick = () => {
    const k = Math.max(0, Math.min(1, (performance.now() - t0) / DUR));
    for (const [node, txt] of nodes) { const res = Math.floor(txt.length * k); let out = txt.slice(0, res); for (let i = res; i < txt.length; i++) out += txt[i] === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0]; node.textContent = out; }
    if (k < 1) setTimeout(tick, 28); else nodes.forEach(([node, txt]) => { node.textContent = txt; });
  };
  for (const [node, txt] of nodes) node.textContent = txt.replace(/\S/g, () => GL[(Math.random() * GL.length) | 0]);
  setTimeout(tick, 180);
}
function typeLog(el) {                                    // what a launch does, typed out
  if (el.dataset.done) return; el.dataset.done = '1';
  let i = 0, j = 0, out = '';
  const step = () => {
    if (!el.isConnected) return;
    if (i >= LOG.length) { el.innerHTML = out + '<span class="pr">&gt; </span><span class="cur">_</span>'; return; }
    const [a, b] = LOG[i];
    if (j <= a.length) { el.innerHTML = out + '<span class="pr">&gt; </span>' + esc(a.slice(0, j)) + '<span class="cur">_</span>'; j += 2; setTimeout(step, 18); }
    else { out += `<span class="pr">&gt; </span>${esc(a)}<span class="d"> ${'.'.repeat(Math.max(2, 40 - a.length))} </span><span class="ok">${esc(b)}</span>\n`; i++; j = 0; setTimeout(step, 240); }
  };
  step();
}
function words(el) {                                      // split a paragraph into word spans, keeping any markup inside it
  const walk = node => [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) { const f = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(document.createTextNode(w)); else { const sp = document.createElement('span'); sp.className = 'wd'; sp.textContent = w; f.appendChild(sp); } }); ch.replaceWith(f); }
    else if (ch.nodeType === 1) walk(ch);
  });
  walk(el); return [...el.querySelectorAll('.wd')];
}
function roll(el) {                                       // digits spin and land where they belong
  if (el.dataset.done) return; el.dataset.done = '1'; const to = el.textContent, t0 = performance.now();
  const t = setInterval(() => { const done = performance.now() - t0 > 600; el.textContent = done ? to : to.replace(/\d/g, () => (Math.random() * 10) | 0); if (done) clearInterval(t); }, 42);
}
function typeLine(el) {                                   // a line types itself out, a caret blinking after it
  if (!el || el.dataset.done) return; el.dataset.done = '1'; const txt = el.textContent, t0 = performance.now();
  el.textContent = ''; const out = document.createElement('span'), cur = document.createElement('i'); cur.className = 'caret'; el.append(out, cur);
  const t = setInterval(() => { const i = Math.min(txt.length, Math.floor((performance.now() - t0) / 32) + 1); out.textContent = txt.slice(0, i); if (i >= txt.length) clearInterval(t); }, 32);
}

export function mountHome({ root, mobile }) {
  const secs = $$('.hs', root), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  secs.forEach(sec => $$('.rv', sec).forEach((el, i) => el.style.setProperty('--d', Math.min(i, 12))));
  $('#hFaq', root).innerHTML = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="a">${esc(a)}</div></details>`).join('');
  $$('#hFaq details', root).forEach(d => d.querySelector('summary').addEventListener('click', e => {
    if (RM) return; e.preventDefault(); const a = d.querySelector('.a');
    if (!d.open) { d.open = true; const h = a.scrollHeight; a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.75,.2,1)' }); }
    else { const h = a.scrollHeight; const an = a.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: 'ease' }); an.onfinish = () => { d.open = false; }; }
  }));

  // the six layers: tabs, a card and the rings. they turn over by themselves while you look, and stop when you pick one
  const tabs = $('#hTabs', root), card = $('#hCard', root), ringsEl = $('#hRings', root), lbar = $('#hLbar', root);
  tabs.innerHTML = LAYERS.map((l, i) => `<button type="button" role="tab" data-l="${i}"><i>0${i + 1}</i>${esc(l[0])}</button>`).join('');
  let cur = -1, auto = true, layT = 0, layVis = false;
  const show = i => {
    cur = i; const l = LAYERS[i];
    card.innerHTML = `<div class="num">0${i + 1}</div><h4>${l[1]}</h4><p>${esc(l[2])}</p><div class="pub"><b>public:</b> ${esc(l[3])}</div>`;
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    clearInterval(show.t); let k = 0; ringsEl.innerHTML = rings(0);
    if (i > 0) show.t = setInterval(() => { k++; ringsEl.innerHTML = rings(Math.min(i, k)); if (k >= i) clearInterval(show.t); }, 60);
    $$('button', tabs).forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
    layT = performance.now();
  };
  show(0);
  $$('button', tabs).forEach(b => b.addEventListener('click', () => { auto = false; show(+b.dataset.l); lbar.style.transform = 'scaleX(0)'; }));

  // paragraphs that light up word by word as you read down through them
  const lit = $$('[data-words]', root).map(el => ({ el, w: words(el), n: -1 }));
  // a soft light follows the pointer across cards and tiles
  if (!mobile) $$('.steps li, .spec > div, .trio > div, .tile, .lcard, .lrow', root).forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true }));

  // arrive: each section reveals once, the first time it scrolls into view
  const io = new IntersectionObserver(es => es.forEach(e => {
    const s = e.target;
    if (s.id === 'h-layers') layVis = e.isIntersecting;
    if (!e.isIntersecting || s.classList.contains('vis')) return;
    s.classList.add('vis'); $$('[data-dec]', s).forEach(decrypt);
    if (s.id === 'h-tech') setTimeout(() => typeLog($('#hLog', root)), 650);
    if (s.id === 'h-top') setTimeout(() => typeLine($('.lead', s)), 620);
    if (s.id === 'h-how') { $$('.steps i', s).forEach((b, i) => setTimeout(() => roll(b), 250 + i * 90)); setTimeout(() => $('.steps', s).classList.add('done'), 1500); }
    if (s.id === 'h-apps') setTimeout(() => $('.tiles', s).classList.add('done'), 1600);
  }), { root, threshold: .12 });
  secs.forEach(s => io.observe(s));
  if (RM) secs.forEach(s => s.classList.add('vis'));

  // one loop while the home is on screen: the progress line, the words, the hero parallax, the layer timer
  const prog = $('#hProg', root), hero = $('.hud', root), how = $('#h-how .steps', root);
  let alive = true, raf = 0, lastY = -1, paused = false;
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (paused || document.hidden) return;
    const y = root.scrollTop, vh = root.clientHeight;
    if (y !== lastY) {
      lastY = y; const max = Math.max(1, root.scrollHeight - vh);
      prog.style.transform = `scaleX(${(y / max).toFixed(4)})`;
      if (!RM && !mobile && hero && y < vh * 1.2) hero.style.transform = `translate3d(0, ${(y * .12).toFixed(1)}px, 0)`;
      const rr = root.getBoundingClientRect();
      lit.forEach(o => { const r = o.el.getBoundingClientRect(), top = r.top - rr.top; if (top > vh || r.bottom < rr.top) return; const k = clamp01((vh * .94 - top) / (vh * .45)), n = Math.round(k * o.w.length); if (n !== o.n) { o.n = n; o.w.forEach((w, j) => w.classList.toggle('on', j < n)); } });
      if (how) { const r = how.getBoundingClientRect(), k = clamp01((vh * .8 - (r.top - rr.top)) / Math.max(1, r.height)); how.style.setProperty('--sp', k.toFixed(3)); }
    }
    if (auto && layVis && !RM) { const k = (now - layT) / 4200; lbar.style.transform = `scaleX(${Math.min(1, k).toFixed(3)})`; if (k >= 1) show((cur + 1) % LAYERS.length); }
  }
  raf = requestAnimationFrame(loop);

  const live = $('#hLive', root);
  return {
    coins(list, err) {                                     // the newest coins, from the same read coins.db makes
      if (err) { if (!live.querySelector('.lrow')) live.innerHTML = `<div class="empty">the chain is slow right now. trying again.</div>`; return; }
      const l = (list || []).filter(c => c.status === 'launched' && c.mint).slice(0, 6);
      if (!l.length) { live.innerHTML = '<div class="empty">no launches yet. the first one shows up here.</div>'; return; }
      live.innerHTML = l.map((c, i) => `<a class="lrow" style="--i:${i}" href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener noreferrer"><img src="${esc(c.img)}" alt="" loading="lazy"><div class="ln"><b>${esc(c.name)}</b><span>$${esc(c.symbol)}</span></div><div class="lm"><b>${c.mcapUsd != null ? usd(c.mcapUsd) : '—'}</b><span>${ago(c.at)}</span></div></a>`).join('');
    },
    status(s) {
      const x = $('#hX', root); if (x && s && s.x) x.innerHTML = `<a href="${esc(s.x)}" target="_blank" rel="noopener noreferrer">dao on x ↗</a>`;
    },
    top() { root.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); },
    to(id) { const t = $('#' + id, root); if (t) root.scrollTo({ top: t.offsetTop - 12, behavior: RM ? 'auto' : 'smooth' }); },
    pause(v) { paused = !!v; },
    stop() { alive = false; cancelAnimationFrame(raf); io.disconnect(); },
  };
}
