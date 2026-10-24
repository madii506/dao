// The home screen of the dao os: a page about dao that you scroll inside the pc. Sections arrive as you reach them,
// headings decrypt, the six layers turn over by themselves, the launch log types itself and the newest coins come from
// the chain. Nothing here is made up: when there are no coins yet, it says so.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp01 = k => Math.max(0, Math.min(1, k));
const ago = t => { const s = Math.max(1, (Date.now() - new Date(t).getTime()) / 1000); return s < 60 ? `${s | 0}s` : s < 3600 ? `${s / 60 | 0}m` : s < 86400 ? `${s / 3600 | 0}h` : `${s / 86400 | 0}d`; };
const usd = n => n == null ? '—' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + Math.round(n);

const LAYERS = [
  ['site', 'a site that tracks <b>nothing</b>', 'no analytics, no cookies, no third-party scripts or fonts. this page only talks to its own server, and its security headers forbid anything else. open devtools and check.', 'your IP reaches our host, like it does every website.'],
  ['connect', 'no wallet <b>connect</b>', 'you never connect a wallet, approve anything, or sign a launch. there is nothing for a drainer to hijack and no wallet of yours on the launch transaction.', 'the coin, its name, image and description.'],
  ['key', 'a creator key <b>born here</b>', "your browser makes a brand-new key and it becomes the coin's creator. it has no history and no funding trail. we never see it. you save it, you own the fees.", 'the creator address and the fees it earns.'],
  ['launcher', 'a fresh <b>launcher</b>', 'a new wallet signs each launch. the treasury funds it inside the same transaction, to the lamport, so it ends empty. the dev wallet on the chart is never yours.', 'that the dao treasury paid for the launch.'],
  ['gas', 'claims without <b>gas</b>', 'funding a new wallet is how people get traced. so the creator key never needs SOL: you sign the claim in your browser and the treasury pays the fee.', 'the claim, and what you do with the fees after.'],
  ['files', 'clean <b>files</b>', 'your image is redrawn in your browser before upload, which drops hidden data like the camera, the time and the place. only the pixels leave your device.', 'whatever the picture itself shows.'],
];
const FAQ = [
  ['is it really free?', 'yes. creating a pump.fun coin costs a little SOL in rent and network fees, and the dao treasury pays it. you pay nothing and sign nothing.'],
  ['who gets the creator fees?', 'the creator key, and only it. pump.fun pays creator fees to that address on every trade, and dao takes no cut.'],
  ['can dao take my fees or my coin?', 'no. dao never sees the creator key, never buys the coin, and the launch wallet ends empty. it only holds its own treasury key.'],
  ['can i launch with my own wallet?', 'yes. pick "connect wallet" in the creator step. your wallet signs and pays, can add a dev buy, and becomes the creator, so that coin is linked to it.'],
  ['why is there a daily limit?', 'every free launch costs the treasury real SOL, so there is a set number per day and a few per visitor. the proof of work keeps bots out without asking who you are.'],
  ['does dao keep logs?', 'it stores each launch (the coin and its addresses, which are public anyway). no accounts, no cookies, no analytics. the host still sees requests, as every host does.'],
  ['can i edit or delete a coin?', 'no. a coin on pump.fun cannot be edited or deleted after launch, so check the review step.'],
  ['is this financial advice?', 'no. memecoins are extremely risky and most go to zero. dao is a tool and is not affiliated with pump.fun.'],
];
const LOG = [['simulate create_v2 on mainnet', 'ok'], ['fund a fresh launcher, to the lamport', 'ok'], ['sign: launcher + mint', 'ok'], ['send', 'confirmed'], ['launcher balance after', '0'], ['names on it', 'none']];

function rings(on) {                                     // six nested boxes around "you"; the layer you are reading lights up
  const W = 38, H = 15, grid = Array.from({ length: H }, () => Array(W).fill([' ', -1]));
  for (let i = 0; i < 6; i++) {
    const x0 = i * 3, y0 = i, x1 = W - 1 - i * 3, y1 = H - 1 - i; if (x1 - x0 < 4 || y1 <= y0) continue;
    for (let x = x0; x <= x1; x++) { grid[y0][x] = ['─', i]; grid[y1][x] = ['─', i]; }
    for (let y = y0; y <= y1; y++) { grid[y][x0] = ['│', i]; grid[y][x1] = ['│', i]; }
    grid[y0][x0] = ['┌', i]; grid[y0][x1] = ['┐', i]; grid[y1][x0] = ['└', i]; grid[y1][x1] = ['┘', i];
    const lab = '0' + (i + 1); if (x0 + 2 + lab.length < x1) [...lab].forEach((ch, k) => { grid[y0][x0 + 2 + k] = [ch, i]; });
  }
  const cy = H >> 1; [...'you'].forEach((ch, k) => { grid[cy][(W - 3 >> 1) + k] = [ch, 9]; });
  return grid.map(r => r.map(([ch, i]) => i === 9 ? `<span class="core">${ch}</span>` : i === on ? `<span class="on">${esc(ch)}</span>` : i >= 0 && i < on ? `<span class="pass">${esc(ch)}</span>` : esc(ch)).join('')).join('\n');
}
const GL = '01<>/\\|#%&$@*+=?';
function decrypt(el) {                                    // the heading arrives scrambled and resolves left to right
  if (el.dataset.done) return; el.dataset.done = '1';
  const nodes = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) nodes.push([n, n.textContent]);
  const total = 20; let f = 0;
  const tick = () => {
    f++; const k = f / total;
    for (const [node, txt] of nodes) { const res = Math.floor(txt.length * k); let out = txt.slice(0, res); for (let i = res; i < txt.length; i++) out += txt[i] === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0]; node.textContent = out; }
    if (f < total) setTimeout(tick, 28); else nodes.forEach(([node, txt]) => { node.textContent = txt; });
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
function roll(el) {                                       // a digit spins and lands where it belongs
  if (el.dataset.done) return; el.dataset.done = '1'; const to = el.textContent; let n = 0;
  const t = setInterval(() => { n++; el.textContent = n < 14 ? String((Math.random() * 10) | 0) : to; if (n >= 14) clearInterval(t); }, 42);
}

export function mountHome({ root, mobile }) {
  const secs = $$('.hs', root), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  secs.forEach(sec => $$('.rv', sec).forEach((el, i) => el.style.setProperty('--d', Math.min(i, 12))));
  $('#hFaq', root).innerHTML = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="a">${esc(a)}</div></details>`).join('');

  // the six layers: tabs, a card and the rings. they turn over by themselves while you look, and stop when you pick one
  const tabs = $('#hTabs', root), card = $('#hCard', root), ringsEl = $('#hRings', root), lbar = $('#hLbar', root);
  tabs.innerHTML = LAYERS.map((l, i) => `<button type="button" role="tab" data-l="${i}"><i>0${i + 1}</i>${esc(l[0])}</button>`).join('');
  let cur = -1, auto = true, layT = 0, layVis = false;
  const show = i => {
    cur = i; const l = LAYERS[i];
    card.innerHTML = `<div class="num">0${i + 1}<span>/06</span></div><h4>${l[1]}</h4><p>${esc(l[2])}</p><div class="pub"><b>still public:</b> ${esc(l[3])}</div>`;
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    ringsEl.innerHTML = rings(i);
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
    if (s.id === 'h-top') $$('.zeros b', s).forEach((b, i) => setTimeout(() => roll(b), 650 + i * 140));
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
      if (err) { if (!live.querySelector('.lrow')) live.innerHTML = `<div class="empty">could not read the chain just now. it tries again on its own.</div>`; return; }
      const l = (list || []).filter(c => c.status === 'launched' && c.mint).slice(0, 6);
      if (!l.length) { live.innerHTML = '<div class="empty"><b>no launches yet.</b> the first coin launched on dao shows up here, read live from the chain. it could be yours.</div>'; return; }
      live.innerHTML = l.map((c, i) => `<a class="lrow" style="--i:${i}" href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener noreferrer"><img src="${esc(c.img)}" alt="" loading="lazy"><div class="ln"><b>${esc(c.name)}</b><span>$${esc(c.symbol)} · ${ago(c.at)} ago</span></div><div class="lm"><b>${c.mcapUsd != null ? usd(c.mcapUsd) : '—'}</b><span>${c.graduated ? 'graduated' : c.progress != null ? Math.round(c.progress * 100) + '% curve' : ''}</span></div><em>pump.fun ↗</em></a>`).join('');
    },
    status(s) {
      const st = $('#hState', root); if (!st) return;
      st.innerHTML = s ? `<i class="dot ${s.ready ? 'live' : 'off'}"></i>${s.ready ? 'launches open' : 'launches paused'}` : '<i class="dot"></i>offline';
      if (s && s.x) $('#hX', root).innerHTML = `<a href="${esc(s.x)}" target="_blank" rel="noopener noreferrer">dao on x ↗</a>`;
    },
    top() { root.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); },
    to(id) { const t = $('#' + id, root); if (t) root.scrollTo({ top: t.offsetTop - 12, behavior: RM ? 'auto' : 'smooth' }); },
    pause(v) { paused = !!v; },
    stop() { alive = false; cancelAnimationFrame(raf); io.disconnect(); },
  };
}
