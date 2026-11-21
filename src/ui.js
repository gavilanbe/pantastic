// Interfaz en DOM: HUD, bocadillos sobre el mundo, diálogos, libreta y pantallas.
import { toScreen } from './gfx.js';
import { BREADS, ING } from './data.js';
import { logoURL } from './logo.js';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export let ICON = {}, XI = { ing: {}, up: {}, face: {} };
const sv = (b) => `<svg viewBox="0 0 40 40">${b}</svg>`;
const cloud = (y = 0, c = '#fff') => `<g transform="translate(0 ${y})"><ellipse cx="14" cy="24" rx="9" ry="7" fill="${c}"/><ellipse cx="23" cy="20" rx="10" ry="9" fill="${c}"/><ellipse cx="30" cy="25" rx="7" ry="6" fill="${c}"/><rect x="9" y="24" width="26" height="7" rx="3.5" fill="${c}"/></g>`;
const SUN = '<circle cx="20" cy="20" r="8.5" fill="#ffc83d"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="18.5" y="3" width="3" height="6" rx="1.5" fill="#ffb02e" transform="rotate(${a} 20 20)"/>`).join('');
const WX = {
  sol: sv(SUN), nubes: sv(`<g transform="translate(-6 -6) scale(.8)">${SUN}</g>` + cloud(4, '#fff') + cloud(4.5, 'rgba(160,180,200,.0)')),
  lluvia: sv(cloud(-4, '#c9d6e2') + [12, 20, 28].map(x => `<rect x="${x}" y="30" width="3" height="7" rx="1.5" fill="#6fb3e8" transform="rotate(15 ${x} 30)"/>`).join('')),
  viento: sv('<path d="M5 15h18a5 5 0 1 0-5-5M5 23h26a5 5 0 1 1-5 5M5 31h12" fill="none" stroke="#8fc4b8" stroke-width="3.4" stroke-linecap="round"/>'),
};
const anchors = new Set();
export const coin = '<span class="coin sm"></span>';
export const stars = (q) => '★'.repeat(q) + '<span style="opacity:.3">' + '★'.repeat(3 - q) + '</span>';
export const img = (id) => `<img src="${ICON[id]}" alt="">`;

export const ui = {
  modalOpen: false, dialogOpen: false, onKey: null,
  /** Filtro de textos según quién protagoniza la partida (nombre y género). */
  tx: null, t(s) { return ui.tx && typeof s === 'string' ? ui.tx(s) : s; },
  init(icons, extra) { ICON = icons; XI = extra; },
  show(sel, on) { $(sel).classList.toggle('hide', !on); },

  // ---- HUD ----
  setDay(day, wd, wx, antojo, se = '') {
    $('#dc-day').textContent = day; $('#dc-wd').textContent = wd; $('#dc-se').textContent = se; $('#dc-wx').innerHTML = WX[wx] || WX.sol;
    const l = $('#leaf'); l.classList.remove('flip'); void l.offsetWidth; l.classList.add('flip');
    $('#dc-antojo').innerHTML = antojo ? `Hoy se lleva ${img(antojo)}<b>${BREADS[antojo].n}</b>` : '';
  },
  setTime(min) {
    const h = Math.floor(min / 60), m = Math.floor(min % 60 / 10) * 10;
    $('#dc-time').textContent = h + ':' + String(m).padStart(2, '0');
    const f = Math.max(0, Math.min(1, (min - 420) / (1170 - 420))), s = $('#sun');
    s.style.left = (4 + f * 92) + '%'; s.style.top = (95 - Math.sin(f * Math.PI) * 85) + '%'; s.style.filter = f > 0.86 ? 'hue-rotate(-25deg) saturate(1.3)' : '';
  },
  setMoney(n, bump) { $('#money-n').textContent = n; if (bump) { const m = $('#money'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } },
  setRep(name, frac, lv) { $('#rep-name').textContent = name; $('#rep-bar').style.width = Math.round(frac * 100) + '%'; $('#rep-lv').textContent = lv; },
  setShelf(shelf) {
    const box = $('#shelf'); const ids = Object.keys(shelf).filter(k => shelf[k].length);
    const key = ids.map(k => k + shelf[k].length).join(); if (box.dataset.k === key) return; box.dataset.k = key;
    box.innerHTML = ids.map(k => `<div class="sh">${img(k)}×${shelf[k].length}</div>`).join('');
  },
  setGoal(t, ic) { t = ui.t(t); const g = $('#goal'); if ($('#goal-t').textContent === t) return; $('#goal-t').textContent = t; $('#goal-ic').src = ic || ICON.barra; g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); },
  prompt(text, p, ok = true, hold = 0) {
    const e = $('#prompt'); if (!text) { e.classList.add('hide'); return; } text = ui.t(text); e.style.setProperty('--h', hold);
    e.classList.remove('hide'); const html = `<div class="in ${ok ? '' : 'no'}">${ok ? '<kbd>E</kbd>' : ''}<span>${text}</span></div>`;
    if (e.dataset.h !== html) { e.innerHTML = html; e.dataset.h = html; }
    const s = toScreen(p[0], p[1], p[2]); for (const a of anchors) if (a.sx != null && Math.abs(a.sx - s.x) < 130 && a.sy - s.y > -14 && a.sy - s.y < 46) s.y = a.sy - 50; e.style.transform = `translate(${s.x}px, ${Math.max(46, s.y)}px)`;
  },
  toast(html, cls = '') { html = ui.t(html); const box = $('#toasts'); for (const o of [...box.children]) if (o.dataset.h === html) o.remove(); const t = el('div', 'toast ' + cls, html); t.dataset.h = html; box.append(t); setTimeout(() => t.remove(), 2550); while ($('#toasts').children.length > 2) $('#toasts').firstChild.remove(); },

  // ---- anclados al mundo ----
  anchor(cls, html, pos) { const e = el('div', cls, `<div class="in">${html}</div>`); e.pos = pos; $('#world').append(e); anchors.add(e); return e; },
  unanchor(e) { if (!e) return; anchors.delete(e); e.remove(); },
  float(text, x, y, z, cls = '') { text = ui.t(text); const s = toScreen(x, y, z); const f = el('div', 'float ' + cls, text); f.style.left = s.x + 'px'; f.style.top = s.y + 'px'; $('#world').append(f); setTimeout(() => f.remove(), 1300); },
  update() { for (const e of anchors) { const p = e.pos, s = toScreen(p[0], p[1], p[2]); e.sx = s.x; e.sy = s.y; e.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`; } },
  clearWorld() { for (const e of anchors) e.remove(); anchors.clear(); },

  // ---- diálogo con máquina de escribir estable ----
  dialog(name, lines, { onDone, onChar, onLine, face } = {}) {
    lines = lines.map(ui.t); const box = $('#dialog'), tx = $('#dlg-text'); let i = 0, n = 0, timer = null, full = '';
    box.classList.toggle('noface', !face); $('#dlg-face').classList.toggle('hide', !face); const fimg = $('#dlg-face img'); if (face) fimg.src = face.idle; ui.dlgFace = (talk) => { if (face) fimg.src = talk ? face.talk : face.happy; };
    ui.dialogOpen = true; box.classList.remove('hide'); $('#dlg-name').textContent = name; $('#dlg-name').classList.toggle('hide', !name);
    const draw = () => { tx.innerHTML = `<span>${full.slice(0, n)}</span><span class="h">${full.slice(n)}</span>`; $('#dlg-next').style.visibility = n >= full.length ? 'visible' : 'hidden'; };
    const line = () => { full = lines[i]; n = 0; onLine?.(i); ui.dlgFace(true); clearInterval(timer); timer = setInterval(() => { n++; if (full[n - 1] && full[n - 1] !== ' ') onChar?.(n); draw(); if (n % 4 === 0) ui.dlgFace(n % 8 === 0); if (n >= full.length) { clearInterval(timer); onLine?.(-1); ui.dlgFace(false); } }, 26); draw(); };
    const next = () => {
      if (n < full.length) { n = full.length; clearInterval(timer); onLine?.(-1); ui.dlgFace(false); draw(); return; }
      i++; if (i >= lines.length) { clearInterval(timer); box.classList.add('hide'); ui.dialogOpen = false; box.onclick = null; ui.dlgNext = null; onDone?.(); } else line();
    };
    box.onclick = next; ui.dlgNext = next; line();
  },

  // ---- modal ----
  modal(html, cls = '') { html = ui.t(html); const m = $('#modal'); clearTimeout(ui.outT); m.classList.remove('out'); m.innerHTML = `<div class="sheet ${cls}">${html}</div>`; m.classList.remove('hide'); ui.modalOpen = true; m.scrollTop = 0; return m.firstChild; },
  closeModal() { const m = $('#modal'); if (!ui.modalOpen) return; ui.modalOpen = false; m.classList.add('out'); const cb = ui.onClose; ui.onClose = null; ui.outT = setTimeout(() => { m.classList.add('hide'); m.classList.remove('out'); m.innerHTML = ''; }, 130); cb?.(); },

  // ---- amasado ----
  knead(show, beats = 6, title = '') { ui.show('#knead', show); if (show) { $('.k-dots').innerHTML = '<i></i>'.repeat(beats); $('.k-word').textContent = ''; $('.k-combo').textContent = ''; $('.k-title').textContent = title; $('.k-hold').classList.add('hide'); $('.k-stage').classList.remove('hide'); $('.k-dots').classList.remove('hide'); } },
  kneadTitle(t) { $('.k-title').textContent = t; },
  kneadRing(t, side) { const s = 210 - (210 - 122) * Math.min(1, t / 0.72) - Math.max(0, t - 0.72) * 170; const r = $('.k-ring'); r.style.width = r.style.height = Math.max(40, s) + 'px'; r.style.opacity = t < 0.05 ? 0 : 1; r.style.borderColor = Math.abs(t - 0.72) < 0.08 ? '#ffe27a' : '#fff'; $('.k-hand.l').classList.toggle('on', side === 'a'); $('.k-hand.r').classList.toggle('on', side === 'd'); $('.k-target b').textContent = side === 'a' ? '◀' : side === 'd' ? '▶' : ''; },
  kneadHit(i, grade, side, combo) { const d = $('.k-dots').children[i]; if (d) d.className = grade; $('.k-word').textContent = { p: '¡Perfecto!', g: 'Bien', m: 'Casi…' }[grade]; const c = $('.k-target'), cl = side === 'a' ? 'hitl' : side === 'd' ? 'hitr' : 'hit'; c.classList.remove('hitl', 'hitr', 'hit'); void c.offsetWidth; c.classList.add(cl); const k = $('.k-combo'); k.textContent = combo > 1 ? '×' + combo : ''; k.classList.remove('pop'); void k.offsetWidth; k.classList.add('pop'); },
  kneadHoldMode() { $('.k-stage').classList.add('hide'); $('.k-dots').classList.add('hide'); $('.k-hold').classList.remove('hide'); $('.k-word').textContent = ''; },
  kneadHold(v) { $('.k-hold i').style.width = Math.min(100, v * 100) + '%'; },
  kneadWord(t) { $('.k-word').textContent = t; },
  /** Un icono vuela en arco de un punto de pantalla a otro. */
  fly(src, a, b, ms = 650, delay = 0) { const e = document.createElement('img'); e.className = 'fly'; e.src = src; $('#ui').append(e); const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 150; e.animate([{ transform: `translate(${a.x}px,${a.y}px) scale(.4) rotate(-30deg)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.2) rotate(10deg)`, opacity: 1, offset: 0.5 }, { transform: `translate(${b.x}px,${b.y}px) scale(.5) rotate(40deg)`, opacity: 1 }], { duration: ms, delay, easing: 'cubic-bezier(.3,.1,.5,1)', fill: 'both' }).onfinish = () => e.remove(); },

  // ---- pantallas ----
  fade(v) { $('#fade').style.opacity = v; },
  dayTitle(a, b) { const d = el('div', 'daytitle', `<div class="a">${a}</div><div class="b">${b}</div>`); $('#ui').append(d); setTimeout(() => d.remove(), 3300); },
  card(html, ms = 6000) { html = ui.t(html); document.querySelectorAll('.fiesta-card').forEach(e => e.remove()); const d = el('div', 'fiesta-card', html); $('#ui').append(d); if (ms) setTimeout(() => d.remove(), ms); return d; },
  /** Sello pequeño junto a la libreta: la partida acaba de guardarse. */
  saved(text = 'Guardado') { let e = $('#saved'); if (!e) { e = el('div', '', ''); e.id = 'saved'; $('#ui').append(e); } e.innerHTML = `<i></i>${text}`; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); },
  /** Selector de protagonista: un rótulo grande bajo el foco con el nombre de quien está delante, y el otro asomando a un lado para cambiar. */
  pick(heroes, { onSel, onGo, onBack }) {
    const box = el('div', '', `<div class="pk-h">¿Quién enciende el horno?</div>
      <button class="pk-arrow l"><kbd>A</kbd><span class="pk-pic"><img alt=""></span><b></b></button><button class="pk-arrow r"><b></b><span class="pk-pic"><img alt=""></span><kbd>D</kbd></button>
      <div class="pk-plate"><i class="tape"></i><small class="pk-sub"></small><div class="pk-name"></div><div class="pk-quote"></div><div class="pk-tags"></div><button class="btn main"></button><span class="pk-seal"></span></div>
      <div class="pk-dots">${heroes.map(() => '<i></i>').join('')}</div>
      <div class="pk-keys"><span><kbd>A</kbd><kbd>D</kbd> mover el foco</span><span><kbd>E</kbd> elegir</span><span><kbd>Esc</kbd> volver a las libretas</span></div>`);
    box.id = 'pick'; $('#ui').append(box); let sel = -1, done = false;
    const plate = box.querySelector('.pk-plate'), L = box.querySelector('.pk-arrow.l'), Rr = box.querySelector('.pk-arrow.r');
    const set = (k) => {
      const dir = k > sel ? 1 : -1; sel = k; const h = heroes[k], o = heroes[1 - k];
      box.querySelector('.pk-sub').textContent = h.sub; box.querySelector('.pk-name').innerHTML = [...h.n].map((c, i) => `<span style="animation-delay:${i * 0.045}s">${c}</span>`).join(''); box.querySelector('.pk-quote').textContent = h.quote; box.querySelector('.pk-tags').innerHTML = h.tags.map((t, i) => `<span style="animation-delay:${0.15 + i * 0.07}s">${t}</span>`).join(''); plate.querySelector('.btn').innerHTML = `¡Al obrador con ${h.n}!`; box.querySelector('.pk-seal').textContent = h.seal;
      plate.style.setProperty('--d', dir); plate.classList.remove('in'); void plate.offsetWidth; plate.classList.add('in'); box.dataset.sel = k;
      for (const [b, show] of [[L, k === 1], [Rr, k === 0]]) { b.classList.toggle('off', !show); b.querySelector('img').src = o.face; b.querySelector('b').textContent = o.n; }
      box.querySelectorAll('.pk-dots i').forEach((d, i) => d.classList.toggle('on', i === k));
    };
    const go = () => { if (done) return; done = true; box.classList.add('done'); onGo(); };
    L.onclick = () => { if (!done) onSel(0); }; Rr.onclick = () => { if (!done) onSel(1); }; plate.querySelector('.btn').onclick = go;
    const key = (e) => { const k = e.key.toLowerCase(); if (k === 'm') return; e.stopPropagation(); if (e.repeat || done) return; if (k === 'a' || k === 'arrowleft') onSel(0); else if (k === 'd' || k === 'arrowright') onSel(1); else if (k === 'e' || k === 'enter' || k === ' ') { e.preventDefault(); go(); } else if (k === 'escape') onBack(); };
    addEventListener('keydown', key, true); set(0);
    return { set, close() { removeEventListener('keydown', key, true); box.remove(); } };
  },
  rain(on) { const r = $('#rain'); if (!on) { r.innerHTML = ''; return; } if (r.children.length) return; let h = ''; for (let i = 0; i < 70; i++) h += `<i class="drop" style="left:${Math.random() * 110}vw;animation-duration:${0.5 + Math.random() * 0.4}s;animation-delay:${-Math.random()}s;opacity:${0.3 + Math.random() * 0.5}"></i>`; r.innerHTML = h; },
};
export const ingChip = (id, need, have) => `<span class="ing ${have < need ? 'miss' : ''}"><img src="${XI.ing[id]}" alt="">${need} ${ING[id].n.replace('Harina de ', '').replace('Harina ', '').toLowerCase()}${have < 90 ? ` <small>(${have})</small>` : ''}</span>`;
export { $, el };
