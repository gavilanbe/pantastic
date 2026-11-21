// Pantalla de título: las tres libretas de la abuela. Cada partida es una libreta con su foto y sus sellos;
// se abre para rebobinar a una mañana, copiarla, llevársela en un archivo o tirarla.
import { saves, SLOTS } from './saves.js';
import { REP, SEASONS, DIAS, BREAD_ORDER } from './data.js';
import { logoURL } from './logo.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lvlOf = (S) => { let l = 0; REP.forEach((r, i) => { if ((S.rep || 0) >= r.at) l = i; }); return l; };
const played = (s = 0) => { const m = Math.round(s / 60); return m < 1 ? 'recién empezada' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
const ago = (t) => { if (!t) return ''; const m = (Date.now() - t) / 60000; return m < 2 ? 'ahora mismo' : m < 60 ? `hace ${Math.round(m)} min` : m < 60 * 24 ? `hace ${Math.round(m / 60)} h` : m < 60 * 48 ? 'ayer' : `hace ${Math.round(m / 1440)} días`; };
const when = (day) => `${DIAS[(day - 1) % 7]} de ${SEASONS[Math.floor(((day - 1) % 28) / 7)].n}`;

export function openTitle({ onPlay, sfx, faces = {} }) {
  const t = document.getElementById('title'); t.classList.remove('hide'); t.classList.add('libros');
  let sel = saves.read(saves.cur()) ? saves.cur() : Math.max(0, [0, 1, 2].findIndex(i => saves.read(i))), open = -1, gone = false, binT = null;
  const fx = (n) => { try { sfx(n); } catch { /* sin sonido aún */ } };

  const cover = (i) => {
    const r = saves.read(i);
    if (!r) return `<div class="lib lib-c${i} empty" data-i="${i}"><div class="cover"><div class="rings"></div><div class="plus">+</div><b class="nw">Libreta nueva</b><small>Un obrador desde cero:<br>eliges quién lo lleva</small></div><div class="acts"><button class="btn main go">Encender el horno</button></div></div>`;
    const S = r.S, l = lvlOf(S), shot = saves.getShot(i), hist = saves.mornings(i).reverse();
    return `<div class="lib lib-c${i}" data-i="${i}">
      <div class="inside"><div class="in-h">${esc(saves.nameOf(S, i))}</div>
        <div class="in-l">Volver a una mañana</div>
        ${hist.length ? hist.map(h => `<button class="row rw" data-day="${h.day}"><span>Día ${h.day} · ${DIAS[(h.day - 1) % 7]}</span><em>${h.money} <i class="coin sm"></i></em></button>`).join('') : '<div class="none">Aún no hay mañanas guardadas</div>'}
        <div class="in-l">La libreta</div>
        <button class="row cp" ${saves.free() < 0 ? 'disabled' : ''}><span>Copiarla en otra</span><em>⧉</em></button>
        <button class="row ex"><span>Llevármela en un archivo</span><em>⇩</em></button>
        <button class="row del"><span>Tirarla (mantén)</span><em>✕</em></button>
      </div>
      <div class="cover"><div class="rings"></div>
        <div class="label" title="Cambiar el nombre"><small>Obrador</small><b>${esc(saves.nameOf(S, i))}</b><i class="pen">✎</i></div>
        <div class="photo ${shot ? '' : 'no'}">${shot ? `<img src="${shot}" alt="">` : '<span>sin foto todavía</span>'}<i class="tape"></i>${faces[S.hero || 'pan'] ? `<span class="who"><img src="${faces[S.hero || 'pan']}" alt=""></span>` : ''}</div>
        <div class="stats"><span class="mleaf"><em>día</em><b>${S.day}</b></span><span class="st"><i class="coin sm"></i>${S.money}</span><span class="st lv"><i class="ros">${l + 1}</i>nivel</span></div>
        <div class="foot"><b>${esc(S.hero === 'isart' ? REP[l].n.replace('Maestra panadera', 'Maestro panadero') : REP[l].n)}</b><br>${when(S.day)} · ${(S.recipes || []).length} de ${BREAD_ORDER.length} fichas<br>${played(S.played)} · ${ago(S.last)}</div>
      </div>
      <div class="acts"><button class="btn main go">Seguir horneando</button><button class="btn sm more">Abrir</button></div>
    </div>`;
  };
  const draw = (anim) => {
    t.innerHTML = `<img class="logo" src="${logoURL()}" alt="Pantastic!"><div class="libs-h">Las libretas de la abuela</div>
      <div class="libs ${anim ? 'in' : ''}">${[0, 1, 2].slice(0, SLOTS).map(cover).join('')}</div>
      <div class="tfoot"><span><kbd>A</kbd><kbd>D</kbd> elegir</span><span><kbd>E</kbd> jugar</span><span><kbd>Q</kbd> abrir la libreta</span><button class="tlink" id="t-imp">Traer una libreta de otro ordenador</button><input type="file" id="t-file" accept=".pan,.json,application/json" hidden></div>
      <div class="tbin hide"></div>`;
    t.querySelectorAll('.lib').forEach(e => {
      const i = Number(e.dataset.i);
      e.onpointerenter = () => { if (open < 0 && sel !== i) { sel = i; mark(); fx('tick'); } };
      e.querySelector('.cover').onclick = (ev) => { if (ev.target.closest('.label') && saves.read(i)) return rename(i); if (sel !== i) { sel = i; mark(); fx('tick'); } else if (open === i) toggle(i); else play(i); };
      e.querySelector('.go').onclick = () => play(i);
      const more = e.querySelector('.more'); if (more) more.onclick = () => toggle(i);
      e.querySelectorAll('.rw').forEach(b => b.onclick = () => { if (!b.dataset.sure) { e.querySelectorAll('.rw').forEach(x => { delete x.dataset.sure; x.classList.remove('sure'); }); b.dataset.sure = 1; b.classList.add('sure'); b.querySelector('span').textContent = `¿Volver al día ${b.dataset.day}? Pulsa otra vez`; fx('tick'); return; } if (saves.rewind(i, Number(b.dataset.day))) { fx('page'); play(i); } });
      const cp = e.querySelector('.cp'); if (cp) cp.onclick = () => { const j = saves.copy(i); if (j < 0) return fx('no'); fx('stamp'); open = -1; sel = j; draw(); note('Libreta copiada'); };
      const ex = e.querySelector('.ex'); if (ex) ex.onclick = () => { saves.export(i); fx('page'); note('Archivo descargado: ábrelo con «Traer una libreta» en el otro ordenador'); };
      const del = e.querySelector('.del'); if (del) hold(del, () => { saves.remove(i); fx('whoosh'); open = -1; e.classList.add('torn'); setTimeout(() => { draw(); bin(); }, 380); });
    });
    t.querySelector('#t-imp').onclick = () => t.querySelector('#t-file').click();
    t.querySelector('#t-file').onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const j = saves.import(await f.text()); if (j === -2) { fx('no'); return note('Ese archivo no es una libreta de Pantastic!'); } if (j === -1) { fx('no'); return note('No queda hueco: tira o exporta antes una libreta'); } fx('fanfare'); sel = j; open = -1; draw(); note('Libreta traída'); };
    mark();
  };
  const mark = () => t.querySelectorAll('.lib').forEach(e => { const i = Number(e.dataset.i); e.classList.toggle('sel', i === sel); e.classList.toggle('open', i === open); const m = e.querySelector('.more'); if (m) m.textContent = i === open ? 'Cerrar' : 'Abrir'; });
  const toggle = (i) => { if (!saves.read(i)) return; open = open === i ? -1 : i; sel = i; mark(); fx('page'); };
  const note = (txt) => { const b = t.querySelector('.tbin'); clearTimeout(binT); b.innerHTML = `<span>${txt}</span>`; b.classList.remove('hide'); binT = setTimeout(() => b.classList.add('hide'), 4200); };
  const bin = () => { const b = t.querySelector('.tbin'); clearTimeout(binT); b.innerHTML = '<span>Libreta tirada a la papelera</span><button class="btn sm">Deshacer</button>'; b.classList.remove('hide'); b.querySelector('button').onclick = () => { const j = saves.undo(); if (j >= 0) { fx('good'); sel = j; draw(); } }; binT = setTimeout(() => { b.classList.add('hide'); saves.clearBin(); }, 9000); };
  /** Botón que hay que mantener pulsado: se va llenando y, si se suelta antes, no pasa nada. */
  const hold = (b, done) => {
    let raf = 0, t0 = 0; const stop = () => { cancelAnimationFrame(raf); raf = 0; b.style.setProperty('--h', 0); };
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 1100); b.style.setProperty('--h', k); if (k >= 1) { stop(); done(); } else raf = requestAnimationFrame(step); };
    b.onpointerdown = (e) => { e.preventDefault(); t0 = performance.now(); fx('tick'); raf = requestAnimationFrame(step); }; b.onpointerup = b.onpointerleave = b.onpointercancel = stop;
  };
  const rename = (i) => {
    const lab = t.querySelector(`.lib[data-i="${i}"] .label`); if (!lab || lab.querySelector('input')) return; const r = saves.read(i), old = saves.nameOf(r.S, i);
    lab.classList.add('edit'); lab.querySelector('b').innerHTML = `<input maxlength="26" value="${esc(old)}" spellcheck="false">`; const inp = lab.querySelector('input'); inp.focus(); inp.select();
    const end = (ok) => { if (!lab.classList.contains('edit')) return; lab.classList.remove('edit'); if (ok && inp.value.trim()) { saves.rename(i, inp.value); fx('stamp'); } draw(); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') end(true); else if (e.key === 'Escape') end(false); }; inp.onblur = () => end(true); inp.onclick = (e) => e.stopPropagation();
  };
  const play = (i) => {
    if (gone) return; gone = true; const r = saves.read(i); fx(r ? 'page' : 'fanfare'); removeEventListener('keydown', onKey, true);
    t.querySelectorAll('.lib').forEach(e => e.classList.add(Number(e.dataset.i) === i ? 'pick' : 'drop')); t.classList.add('leaving');
    setTimeout(() => { t.classList.add('hide'); t.classList.remove('libros', 'leaving'); t.innerHTML = ''; onPlay(i, r ? r.S : null); }, 520);
  };
  const onKey = (e) => {
    if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (k === 'm') return; e.stopPropagation(); if (e.repeat) return;
    if (k === 'a' || k === 'arrowleft') { if (open >= 0) open = -1; sel = (sel + SLOTS - 1) % SLOTS; mark(); fx('tick'); }
    else if (k === 'd' || k === 'arrowright') { if (open >= 0) open = -1; sel = (sel + 1) % SLOTS; mark(); fx('tick'); }
    else if (k === 'e' || k === 'enter' || k === ' ') { e.preventDefault(); play(sel); }
    else if (k === 'q') toggle(sel);
    else if (k === 'escape' && open >= 0) { open = -1; mark(); }
  };
  addEventListener('keydown', onKey, true);
  draw(true);
}
