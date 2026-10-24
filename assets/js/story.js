// The walk down the aisle: the page you scroll while the camera follows it. Sections open as they arrive, headings
// decrypt, the six steps and the six layers follow your scroll, and the latest coins are read from the chain.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp01 = k => Math.max(0, Math.min(1, k));
const ago = t => { const s = Math.max(1, (Date.now() - new Date(t).getTime()) / 1000); return s < 60 ? `${s | 0}s` : s < 3600 ? `${s / 60 | 0}m` : s < 86400 ? `${s / 3600 | 0}h` : `${s / 86400 | 0}d`; };

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
  ['does dao keep logs?', 'it stores each launch (the coin and its addresses, which are public anyway). no accounts, no cookies, no analytics. the host still sees requests, as every host does.'],
  ['can i edit or delete a coin?', 'no. a coin on pump.fun cannot be edited or deleted after launch, so check the review step.'],
  ['is this financial advice?', 'no. memecoins are extremely risky and most go to zero. dao is a tool and is not affiliated with pump.fun.'],
];
const LOG = [['simulate create_v2 on mainnet', 'ok'], ['fund a fresh launcher, to the lamport', 'ok'], ['sign: launcher + mint', 'ok'], ['send', 'confirmed'], ['launcher balance after', '0'], ['names on it', 'none']];

function rings(on) {                                     // six nested boxes around "you"; the layer you are reading lights up
  const W = 34, H = 15, grid = Array.from({ length: H }, () => Array(W).fill([' ', -1]));
  for (let i = 0; i < 6; i++) {
    const x0 = i * 3, y0 = i, x1 = W - 1 - i * 3, y1 = H - 1 - i; if (x1 - x0 < 4 || y1 <= y0) continue;
    for (let x = x0; x <= x1; x++) { grid[y0][x] = ['─', i]; grid[y1][x] = ['─', i]; }
    for (let y = y0; y <= y1; y++) { grid[y][x0] = ['│', i]; grid[y][x1] = ['│', i]; }
    grid[y0][x0] = ['┌', i]; grid[y0][x1] = ['┐', i]; grid[y1][x0] = ['└', i]; grid[y1][x1] = ['┘', i];
  }
  const cy = H >> 1; [...'you'].forEach((ch, k) => { grid[cy][(W - 3 >> 1) + k] = [ch, 9]; });
  return grid.map(r => r.map(([ch, i]) => i === 9 ? `<span class="core">${ch}</span>` : i === on ? `<span class="on">${esc(ch)}</span>` : i >= 0 && i < on ? `<span class="pass">${esc(ch)}</span>` : esc(ch)).join('')).join('\n');
}
function decrypt(el) {                                    // the heading arrives scrambled and resolves left to right
  if (el.dataset.done) return; el.dataset.done = '1';
  const nodes = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) nodes.push([n, n.textContent]);
  const G = '01<>/\\|#%&$@*+=?', total = 22; let f = 0;
  const tick = () => {
    f++; const k = f / total;
    for (const [node, txt] of nodes) { const res = Math.floor(txt.length * k); let out = txt.slice(0, res); for (let i = res; i < txt.length; i++) out += txt[i] === ' ' ? ' ' : G[(Math.random() * G.length) | 0]; node.textContent = out; }
    if (f < total) setTimeout(tick, 30); else nodes.forEach(([node, txt]) => { node.textContent = txt; });
  };
  for (const [node, txt] of nodes) node.textContent = txt.replace(/\S/g, () => G[(Math.random() * G.length) | 0]);
  setTimeout(tick, 260);
}
function typeLog(el) {                                    // what a launch does, typed out
  if (el.dataset.done) return; el.dataset.done = '1';
  let i = 0, j = 0, out = '';
  const step = () => {
    if (!el.isConnected) return;
    if (i >= LOG.length) { el.innerHTML = out + '<span class="cur">_</span>'; return; }
    const [a, b] = LOG[i];
    if (j <= a.length) { el.innerHTML = out + '<span class="pr">&gt; </span>' + esc(a.slice(0, j)) + '<span class="cur">_</span>'; j += 2; setTimeout(step, 18); }
    else { out += `<span class="pr">&gt; </span>${esc(a)}<span class="d"> ${'.'.repeat(Math.max(2, 38 - a.length))} </span><span class="ok">${esc(b)}</span>\n`; i++; j = 0; setTimeout(step, 260); }
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
function roll(el) {                                       // a digit spins and lands on zero
  if (el.dataset.done) return; el.dataset.done = '1'; let n = 0;
  const t = setInterval(() => { n++; el.textContent = n < 14 ? String((Math.random() * 10) | 0) : '0'; if (n >= 14) clearInterval(t); }, 45);
}

export function start({ api, sound, mobile }) {
  const root = document.documentElement, story = $('#story'), nav = $('#snav'), rail = $('#srail'), bar = $('#sbar');
  try { history.scrollRestoration = 'manual'; } catch {}
  story.hidden = false; nav.hidden = false; rail.hidden = !!mobile; bar.hidden = !mobile;
  root.classList.add('story'); scrollTo(0, 0);
  // the doorway stays clean: no words on it. the nav and the rail arrive once you start walking
  const secs = $$('.s', story), panels = $$('.panel', story), links = $$('#snav .nlinks a');
  secs.forEach(sec => $$('.rv', sec).forEach((el, i) => el.style.setProperty('--d', i)));

  // the six layers: a card and the rings, driven by how far through the section you are
  const card = $('#lcard'), ringsEl = $('#rings'), dots = $('#ldots');
  dots.innerHTML = LAYERS.map(() => '<i></i>').join('');
  let curLayer = -1;
  const showLayer = i => {
    curLayer = i; const l = LAYERS[i];
    card.innerHTML = `<div class="num">0${i + 1}</div><h4>${l[1]}</h4><p>${esc(l[2])}</p><div class="pub"><b>still public:</b> ${esc(l[3])}</div>`;
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    ringsEl.innerHTML = rings(i); $$('i', dots).forEach((d, k) => { d.className = k === i ? 'on' : k < i ? 'done' : ''; });
  };
  showLayer(0);
  $('#faq').innerHTML = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="a">${esc(a)}</div></details>`).join('');

  // paragraphs that light up word by word as you read down through them
  const lit = $$('[data-words]', story).map(el => ({ el, w: words(el), n: -1 }));
  // a soft light follows the pointer across the panels
  if (!mobile) panels.forEach(pn => pn.addEventListener('pointermove', e => { const r = pn.getBoundingClientRect(); pn.style.setProperty('--mx', (e.clientX - r.left) + 'px'); pn.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true }));
  // reveal on arrival; replays if you scroll back up past a section, stays if you scrolled down past it
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('vis'); $$('[data-dec]', e.target).forEach(decrypt); if (e.target.id === 's-tech') setTimeout(() => typeLog($('#tlog')), 700); if (e.target.id === 's-what') $$('.zeros b', e.target).forEach((b, i) => setTimeout(() => roll(b), 700 + i * 160)); }
    else if (e.boundingClientRect.top > 0) e.target.classList.remove('vis');
  }), { threshold: .16 });
  secs.forEach(s => io.observe(s));

  // the latest coins, read live from the chain; nothing made up when there are none
  (async () => {
    const el = $('#live'); let j;
    try { const r = await fetch('/api/coins?limit=8'); j = await r.json(); } catch { el.innerHTML = '<div class="empty">could not read the chain just now. coins.db will try again.</div>'; return; }
    const list = (j.coins || []).filter(c => c.status === 'launched' && c.mint).slice(0, 5);
    if (!list.length) { el.innerHTML = '<div class="empty">no launches yet. the first coin launched on dao shows up here, read live from the chain.</div>'; return; }
    el.innerHTML = list.map((c, i) => `<a class="lrow" style="--i:${i}" href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener noreferrer"><img src="${esc(c.img)}" alt="" loading="lazy"><div><b>${esc(c.name)}</b><span>$${esc(c.symbol)} · ${ago(c.at)} ago</span></div><em>pump.fun ↗</em></a>`).join('');
  })();
  fetch('/api/status').then(r => r.json()).then(s => { if (s && s.x) $('#sfX').innerHTML = `<a href="${esc(s.x)}" target="_blank" rel="noopener noreferrer">dao on x ↗</a>`; }).catch(() => {});

  // nav, buttons, sound
  const toSec = id => { const t = $('#' + id); if (t) scrollTo({ top: t.offsetTop, behavior: 'smooth' }); };
  const glide = () => scrollTo({ top: root.scrollHeight, behavior: 'smooth' });
  $$('[data-to]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toSec(a.dataset.to); }));
  $$('#story [data-go], #snav [data-go]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); api.go(b.dataset.go); }));
  const snd = $('#nSnd');
  const offSnd = sound && sound.onChange ? sound.onChange(s => { snd.classList.toggle('off', s.muted); snd.setAttribute('aria-pressed', String(!s.muted)); }) : null;
  snd.onclick = e => { e.stopPropagation(); sound && sound.toggle(); };

  // one loop: the scroll drives the camera; the rail, the steps, the layers and a little parallax follow it
  const how = $('#steps'), steps = $$('li', how), lay = $('#s-layers'), rFill = $('#rFill'), bFill = $('#sbarFill'), rDist = $('#rDist'), rSec = $('#rSec');
  let alive = true, raf = 0, lastSec = -1, lastDist = '';
  function loop() {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const vh = innerHeight, max = Math.max(1, root.scrollHeight - vh), p = clamp01(scrollY / max);
    try { api.scroll(p); } catch {}
    let cur = 0; for (let i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top < vh * .5) cur = i;
    const hr = how.getBoundingClientRect(), sp = clamp01((vh * .72 - hr.top) / Math.max(1, hr.height));
    const lr = lay.getBoundingClientRect(), lp = clamp01((-lr.top + vh * .2) / Math.max(1, lr.height - vh * .8)), li = Math.min(5, Math.floor(lp * 6));
    const pr = panels.map(pn => pn.getBoundingClientRect());
    const wr = lit.map(o => o.el.getBoundingClientRect());
    let z = 0; try { z = api.camZ(); } catch {}
    // writes after reads
    rFill.style.setProperty('--p', p.toFixed(4)); bFill.style.setProperty('--p', p.toFixed(4));
    const dist = `pc in ${Math.max(0, z - .15).toFixed(1)} m`; if (dist !== lastDist) { lastDist = dist; rDist.textContent = dist; }
    if (cur !== lastSec) { lastSec = cur; rSec.textContent = secs[cur].dataset.n; links.forEach(a => a.classList.toggle('on', a.dataset.to === secs[cur].id)); }
    lit.forEach((o, i) => { const r = wr[i]; if (r.bottom < 0 || r.top > vh) return; const k = clamp01((vh * .92 - r.top) / (vh * .5)), n = Math.round(k * o.w.length); if (n !== o.n) { o.n = n; o.w.forEach((w, j) => w.classList.toggle('on', j < n)); } });
    how.style.setProperty('--sp', sp.toFixed(3)); steps.forEach((s, i) => s.classList.toggle('lit', sp > (i + .3) / steps.length));
    if (li !== curLayer && lay.classList.contains('vis')) showLayer(li);
    panels.forEach((pn, i) => { const r = pr[i]; if (r.bottom < -40 || r.top > vh + 40 || pn.classList.contains('sticky')) return; const c = (r.top + r.height / 2 - vh / 2) / vh; pn.style.setProperty('--py', (c * -22).toFixed(1) + 'px'); });
    const moved = scrollY > vh * .2;
    if (moved !== root.classList.contains('moved')) { root.classList.toggle('moved', moved); nav.classList.toggle('on', moved); rail.classList.toggle('on', moved); }
    nav.classList.toggle('solid', scrollY > vh * .2);
    let ph = ''; try { ph = api.phase(); } catch {}
    if (ph === 'dive') root.classList.add('story-out');
    let al = false; try { al = api.alarm(); } catch {}
    if (al !== root.classList.contains('blackout')) root.classList.toggle('blackout', al);
  }
  loop();

  return {
    glide,
    stop() {
      alive = false; cancelAnimationFrame(raf); io.disconnect(); offSnd && offSnd();
      [story, nav, rail, bar].forEach(el => el && el.remove());
      root.classList.remove('story', 'story-out', 'blackout', 'moved'); scrollTo(0, 0);
    },
  };
}
