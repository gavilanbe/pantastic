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
  setGoal(t, ic) { const g = $('#goal'); if ($('#goal-t').textContent === t) return; $('#goal-t').textContent = t; $('#goal-ic').src = ic || ICON.barra; g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); },
  prompt(text, p, ok = true, hold = 0) {
    const e = $('#prompt'); if (!text) { e.classList.add('hide'); return; } e.style.setProperty('--h', hold);
    e.classList.remove('hide'); const html = `<div class="in ${ok ? '' : 'no'}">${ok ? '<kbd>E</kbd>' : ''}<span>${text}</span></div>`;
    if (e.dataset.h !== html) { e.innerHTML = html; e.dataset.h = html; }
    const s = toScreen(p[0], p[1], p[2]); for (const a of anchors) if (a.sx != null && Math.abs(a.sx - s.x) < 130 && a.sy - s.y > -14 && a.sy - s.y < 46) s.y = a.sy - 50; e.style.transform = `translate(${s.x}px, ${Math.max(46, s.y)}px)`;
  },
  toast(html, cls = '') { const t = el('div', 'toast ' + cls, html); $('#toasts').append(t); setTimeout(() => t.remove(), 2550); while ($('#toasts').children.length > 2) $('#toasts').firstChild.remove(); },

  // ---- anclados al mundo ----
  anchor(cls, html, pos) { const e = el('div', cls, `<div class="in">${html}</div>`); e.pos = pos; $('#world').append(e); anchors.add(e); return e; },
  unanchor(e) { if (!e) return; anchors.delete(e); e.remove(); },
  float(text, x, y, z, cls = '') { const s = toScreen(x, y, z); const f = el('div', 'float ' + cls, text); f.style.left = s.x + 'px'; f.style.top = s.y + 'px'; $('#world').append(f); setTimeout(() => f.remove(), 1300); },
  update() { for (const e of anchors) { const p = e.pos, s = toScreen(p[0], p[1], p[2]); e.sx = s.x; e.sy = s.y; e.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`; } },
  clearWorld() { for (const e of anchors) e.remove(); anchors.clear(); },

  // ---- diálogo con máquina de escribir estable ----
  dialog(name, lines, { onDone, onChar, onLine, face } = {}) {
    const box = $('#dialog'), tx = $('#dlg-text'); let i = 0, n = 0, timer = null, full = '';
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
  modal(html, cls = '') { const m = $('#modal'); clearTimeout(ui.outT); m.classList.remove('out'); m.innerHTML = `<div class="sheet ${cls}">${html}</div>`; m.classList.remove('hide'); ui.modalOpen = true; m.scrollTop = 0; return m.firstChild; },
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
  card(html, ms = 6000) { document.querySelectorAll('.fiesta-card').forEach(e => e.remove()); const d = el('div', 'fiesta-card', html); $('#ui').append(d); if (ms) setTimeout(() => d.remove(), ms); return d; },
  title(hasSave, onStart, onNew) {
    const t = $('#title'); t.classList.remove('hide');
    t.innerHTML = `<img class="logo" src="${logoURL()}" alt="Pantastic!">
      <button class="btn main" id="t-go">${hasSave ? 'Seguir horneando' : 'Encender el horno'}</button>
      ${hasSave ? '<button class="btn sm" id="t-new" style="margin-top:14px">Empezar de cero</button>' : ''}
      <div class="hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> moverse</span><span><kbd>E</kbd> todo lo demás</span></div>`;
    $('#t-go').onclick = () => { t.classList.add('hide'); onStart(); };
    if (hasSave) $('#t-new').onclick = () => { if ($('#t-new').dataset.sure) { t.classList.add('hide'); onNew(); } else { $('#t-new').dataset.sure = 1; $('#t-new').textContent = '¿Seguro? Se borra la partida'; } };
  },
  rain(on) { const r = $('#rain'); if (!on) { r.innerHTML = ''; return; } if (r.children.length) return; let h = ''; for (let i = 0; i < 70; i++) h += `<i class="drop" style="left:${Math.random() * 110}vw;animation-duration:${0.5 + Math.random() * 0.4}s;animation-delay:${-Math.random()}s;opacity:${0.3 + Math.random() * 0.5}"></i>`; r.innerHTML = h; },
};
export const ingChip = (id, need, have) => `<span class="ing ${have < need ? 'miss' : ''}"><img src="${XI.ing[id]}" alt="">${need} ${ING[id].n.replace('Harina de ', '').replace('Harina ', '').toLowerCase()}${have < 90 ? ` <small>(${have})</small>` : ''}</span>`;
export { $, el };
