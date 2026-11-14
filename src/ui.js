// Interfaz en DOM: HUD, bocadillos sobre el mundo, diálogos, libreta y pantallas.
import { toScreen } from './gfx.js';
import { BREADS, ING } from './data.js';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export let ICON = {};
const anchors = new Set();
export const coin = '<span class="coin sm"></span>';
export const stars = (q) => '★'.repeat(q) + '<span style="opacity:.3">' + '★'.repeat(3 - q) + '</span>';
export const img = (id) => `<img src="${ICON[id]}" alt="">`;

export const ui = {
  modalOpen: false, dialogOpen: false, onKey: null,
  init(icons) { ICON = icons; },
  show(sel, on) { $(sel).classList.toggle('hide', !on); },

  // ---- HUD ----
  setDay(day, wd, wx, antojo) {
    $('#dc-day').textContent = 'Día ' + day; $('#dc-wd').textContent = wd; $('#dc-wx').textContent = wx;
    $('#dc-antojo').innerHTML = antojo ? `Hoy se lleva ${img(antojo)}<b>${BREADS[antojo].n}</b>` : '';
  },
  setTime(min) {
    const h = Math.floor(min / 60), m = Math.floor(min % 60 / 10) * 10;
    $('#dc-time').textContent = h + ':' + String(m).padStart(2, '0');
    $('#dc-bar i').style.width = Math.max(0, Math.min(100, (min - 420) / (1170 - 420) * 100)) + '%';
  },
  setMoney(n, bump) { $('#money-n').textContent = n; if (bump) { const m = $('#money'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } },
  setRep(name, frac) { $('#rep-name').textContent = name; $('#rep-bar').style.width = Math.round(frac * 100) + '%'; },
  setShelf(shelf) {
    const box = $('#shelf'); const ids = Object.keys(shelf).filter(k => shelf[k].length);
    const key = ids.map(k => k + shelf[k].length).join(); if (box.dataset.k === key) return; box.dataset.k = key;
    box.innerHTML = ids.map(k => `<div class="sh">${img(k)}×${shelf[k].length}</div>`).join('');
  },
  setGoal(t, ic = '🥖') { const g = $('#goal'); if ($('#goal-t').textContent === t) return; $('#goal-t').textContent = t; g.querySelector('.goal-ic').textContent = ic; g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); },
  prompt(text, p, ok = true) {
    const e = $('#prompt'); if (!text) { e.classList.add('hide'); return; }
    e.classList.remove('hide'); const html = `<div class="in ${ok ? '' : 'no'}">${ok ? '<kbd>E</kbd>' : ''}<span>${text}</span></div>`;
    if (e.dataset.h !== html) { e.innerHTML = html; e.dataset.h = html; }
    const s = toScreen(p[0], p[1], p[2]); e.style.transform = `translate(${s.x}px, ${s.y}px)`;
  },
  toast(html, cls = '') { const t = el('div', 'toast ' + cls, html); $('#toasts').append(t); setTimeout(() => t.remove(), 2900); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); },

  // ---- anclados al mundo ----
  anchor(cls, html, pos) { const e = el('div', cls, `<div class="in">${html}</div>`); e.pos = pos; $('#world').append(e); anchors.add(e); return e; },
  unanchor(e) { if (!e) return; anchors.delete(e); e.remove(); },
  float(text, x, y, z, cls = '') { const s = toScreen(x, y, z); const f = el('div', 'float ' + cls, text); f.style.left = s.x + 'px'; f.style.top = s.y + 'px'; $('#world').append(f); setTimeout(() => f.remove(), 1300); },
  update() { for (const e of anchors) { const p = e.pos, s = toScreen(p[0], p[1], p[2]); e.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`; } },
  clearWorld() { for (const e of anchors) e.remove(); anchors.clear(); },

  // ---- diálogo con máquina de escribir estable ----
  dialog(name, lines, { onDone, onChar, onLine } = {}) {
    const box = $('#dialog'), tx = $('#dlg-text'); let i = 0, n = 0, timer = null, full = '';
    ui.dialogOpen = true; box.classList.remove('hide'); $('#dlg-name').textContent = name; $('#dlg-name').classList.toggle('hide', !name);
    const draw = () => { tx.innerHTML = `<span>${full.slice(0, n)}</span><span class="h">${full.slice(n)}</span>`; $('#dlg-next').style.visibility = n >= full.length ? 'visible' : 'hidden'; };
    const line = () => { full = lines[i]; n = 0; onLine?.(i); clearInterval(timer); timer = setInterval(() => { n++; if (full[n - 1] && full[n - 1] !== ' ') onChar?.(n); draw(); if (n >= full.length) { clearInterval(timer); onLine?.(-1); } }, 26); draw(); };
    const next = () => {
      if (n < full.length) { n = full.length; clearInterval(timer); onLine?.(-1); draw(); return; }
      i++; if (i >= lines.length) { clearInterval(timer); box.classList.add('hide'); ui.dialogOpen = false; box.onclick = null; ui.dlgNext = null; onDone?.(); } else line();
    };
    box.onclick = next; ui.dlgNext = next; line();
  },

  // ---- modal ----
  modal(html, cls = '') { const m = $('#modal'); m.innerHTML = `<div class="sheet ${cls}">${html}</div>`; m.classList.remove('hide'); ui.modalOpen = true; return m.firstChild; },
  closeModal() { $('#modal').classList.add('hide'); $('#modal').innerHTML = ''; ui.modalOpen = false; ui.onClose?.(); ui.onClose = null; },

  // ---- amasado ----
  knead(show, beats = 4) { ui.show('#knead', show); if (show) { $('.k-dots').innerHTML = '<i></i>'.repeat(beats); $('.k-word').textContent = ''; } },
  kneadRing(t) { const s = 190 - (190 - 96) * Math.min(1, t / 0.72) - Math.max(0, t - 0.72) * 150; const r = $('.k-ring'); r.style.width = r.style.height = Math.max(30, s) + 'px'; r.style.opacity = t < 0.05 ? 0 : 1; },
  kneadHit(i, grade) { const d = $('.k-dots').children[i]; if (d) d.className = grade; $('.k-word').textContent = { p: '¡Perfecto!', g: 'Bien', m: 'Casi…' }[grade]; const c = $('.k-core'); c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); },

  // ---- pantallas ----
  fade(v) { $('#fade').style.opacity = v; },
  dayTitle(a, b) { const d = el('div', 'daytitle', `<div class="a">${a}</div><div class="b">${b}</div>`); $('#ui').append(d); setTimeout(() => d.remove(), 3300); },
  card(html, ms = 6000) { document.querySelectorAll('.fiesta-card').forEach(e => e.remove()); const d = el('div', 'fiesta-card', html); $('#ui').append(d); if (ms) setTimeout(() => d.remove(), ms); return d; },
  title(hasSave, onStart, onNew) {
    const t = $('#title'); t.classList.remove('hide');
    t.innerHTML = `<div class="logo"><div class="big">Pan<span>tastic!</span></div><div class="small">el obrador de Pan · horno de leña</div></div>
      <button class="btn main" id="t-go">${hasSave ? 'Seguir horneando' : 'Encender el horno'}</button>
      ${hasSave ? '<button class="btn sm" id="t-new" style="margin-top:14px">Empezar de cero</button>' : ''}
      <div class="hint">WASD para moverse · E para todo lo demás</div>`;
    $('#t-go').onclick = () => { t.classList.add('hide'); onStart(); };
    if (hasSave) $('#t-new').onclick = () => { if ($('#t-new').dataset.sure) { t.classList.add('hide'); onNew(); } else { $('#t-new').dataset.sure = 1; $('#t-new').textContent = '¿Seguro? Se borra la partida'; } };
  },
  rain(on) { const r = $('#rain'); if (!on) { r.innerHTML = ''; return; } if (r.children.length) return; let h = ''; for (let i = 0; i < 70; i++) h += `<i class="drop" style="left:${Math.random() * 110}vw;animation-duration:${0.5 + Math.random() * 0.4}s;animation-delay:${-Math.random()}s;opacity:${0.3 + Math.random() * 0.5}"></i>`; r.innerHTML = h; },
};
export const ingChip = (id, need, have) => `<span class="ing ${have < need ? 'miss' : ''}"><i style="background:${ING[id].c}"></i>${need} ${ING[id].n.replace('Harina de ', '').replace('Harina ', '')}</span>`;
export { $, el };
