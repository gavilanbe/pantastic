// La radio del obrador: un dial que se gira a mano. Entre emisoras hay ruido; al acercarse a una, la música va entrando.
// Las emisoras llegan a Migas con los logros, y cada una hay que encontrarla en el dial la primera vez.
import { ui } from './ui.js';
import { RADIO, LOGROS } from './data.js';

export const F0 = 87.5, F1 = 108;
/** Qué se oye en un punto del dial: la emisora abierta más cercana y su señal, o la que aún no llega (fantasma). */
export function radioAt(f, isOpen) {
  let st = null, c = 0, ghost = null;
  for (const s of RADIO) { const k = 1 - Math.abs(f - s.f) / 0.5; if (k <= 0) continue; if (isOpen(s)) { if (k > c) { c = k; st = s; } } else ghost = s; }
  return { st, sig: st ? Math.min(1, c * 1.7) : 0, ghost: st ? null : ghost };
}

export function openRadio({ R, isOpen, apply, sfx, eve, onClose }) {
  const pct = (f) => ((f - F0) / (F1 - F0) * 100).toFixed(2) + '%', logro = (id) => LOGROS.find(l => l[0] === id);
  const ticks = []; for (let f = 88; f <= 108; f += 1) ticks.push(`<i class="${f % 4 === 0 ? 'big' : ''}" style="left:${pct(f)}">${f % 4 === 0 ? `<b>${f}</b>` : ''}</i>`);
  const sh = ui.modal(`<div class="rd-body"><div class="rd-handle"></div>
      <div class="rd-row">
        <div class="rd-grille">${'<i></i>'.repeat(9)}</div>
        <div class="rd-face"><div class="rd-eye"><i></i></div><div class="rd-scale"><div class="rd-ticks">${ticks.join('')}</div><div class="rd-marks"></div><div class="rd-needle"></div></div><div class="rd-fm">FM · <span id="rd-f"></span> MHz</div></div>
        <div class="rd-knobs"><button class="rd-knob" id="rd-knob" title="Girar el dial"><i></i></button><button class="rd-pow" id="rd-pow" title="Encender o apagar (X)"><i></i></button></div>
      </div>
      <div class="rd-label"><i class="tape"></i><div id="rd-txt"></div><span class="rd-seal">¡SINTONIZADA!</span></div>
      <div class="rd-presets" id="rd-pre"></div>
    </div>
    <div class="hint-keys"><span><kbd>A</kbd><kbd>D</kbd> girar el dial</span><span><kbd>1</kbd>–<kbd>7</kbd> emisoras encontradas</span><span><kbd>X</kbd> encender / apagar</span><span><kbd>E</kbd> cerrar</span></div>`, 'radio');
  const $ = (q) => sh.querySelector(q), needle = $('.rd-needle'), knob = $('#rd-knob i'), eye = $('.rd-eye i'), txt = $('#rd-txt'), bars = [...sh.querySelectorAll('.rd-grille i')], scale = $('.rd-scale');
  const held = new Set(); let vel = 0, target = null, raf = 0, last = performance.now(), lastTick = Math.round(R.f * 5), shown = '', alive = true, t = 0;
  const found = () => RADIO.filter(s => R.found[s.id] && isOpen(s));
  const marks = () => { $('.rd-marks').innerHTML = RADIO.map(s => `<i class="${R.found[s.id] && isOpen(s) ? 'on' : isOpen(s) ? 'new' : 'lock'}" style="left:${pct(s.f)}"></i>`).join(''); const fs = found(); $('#rd-pre').innerHTML = RADIO.map((s) => { const i = fs.indexOf(s); return i >= 0 ? `<button class="rd-p" data-f="${s.f}"><kbd>${i + 1}</kbd>${s.n}</button>` : `<span class="rd-p no">${isOpen(s) ? '¿…? búscala' : '🔒'.replace('🔒', '<i class="lk"></i>') + (logro(s.need)?.[1] || '')}</span>`; }).join(''); sh.querySelectorAll('.rd-p[data-f]').forEach(b => b.onclick = () => { target = Number(b.dataset.f); sfx('tick'); }); };
  const draw = () => {
    const a = radioAt(R.f, isOpen), on = !R.off; needle.style.left = pct(R.f); knob.style.transform = `rotate(${(R.f - F0) * 52}deg)`; $('#rd-f').textContent = R.f.toFixed(1); sh.classList.toggle('off', !on);
    eye.style.transform = `scale(${on ? 0.25 + a.sig * 0.75 : 0.1})`; eye.style.opacity = on ? 0.35 + a.sig * 0.65 : 0.15;
    let key, html;
    if (!on) { key = 'off'; html = '<small>apagada</small><b>Silencio de obrador</b><p>Solo el horno y la calle. Pulsa <kbd>X</kbd> para encenderla.</p>'; }
    else if (a.st && a.sig > 0.62) { const s = a.st, song = (eve && s.song.eve) || s.song.day; key = s.id + (eve ? 'e' : 'd'); html = `<small>${s.f.toFixed(1)} FM</small><b>${s.n}</b><p>${s.tag}</p><em>♪ Suena «${song}»</em>`; }
    else if (a.st) { key = 'weak'; html = '<small>casi…</small><b>Se oye algo entre el ruido</b><p>Afina un poco más el dial.</p>'; }
    else if (a.ghost) { const l = logro(a.ghost.need); key = 'g' + a.ghost.id; html = `<small>${a.ghost.f.toFixed(1)} FM · aún no llega a Migas</small><b>Una música muy lejana…</b><p>Esta emisora se sintoniza con el logro <u>«${l ? l[1] : '?'}»</u>${l ? ': ' + l[2].toLowerCase() : ''}.</p>`; }
    else { key = 'none'; html = '<small>fffshhh…</small><b>Por aquí no emite nadie</b><p>Sigue girando: hay ' + RADIO.length + ' emisoras repartidas por el dial.</p>'; }
    if (key !== shown) { shown = key; txt.innerHTML = html; txt.classList.remove('in'); void txt.offsetWidth; txt.classList.add('in'); }
    if (on && a.st && a.sig > 0.97 && !R.found[a.st.id]) { R.found[a.st.id] = 1; R.last = a.st.id; sfx('perfect'); sfx('stamp'); sh.querySelector('.rd-label').classList.remove('hit'); void sh.offsetWidth; sh.querySelector('.rd-label').classList.add('hit'); marks(); }
    if (on && a.st && a.sig > 0.9) R.last = a.st.id;
    return a;
  };
  const step = (now) => {
    if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const dir = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
    if (dir) { target = null; vel += (dir * 5.5 - vel) * Math.min(1, dt * 2.2); if (Math.sign(vel) !== dir) vel = dir * 0.4; } else vel *= Math.pow(0.0005, dt);
    if (target != null) { const d = target - R.f; if (Math.abs(d) < 0.02) { R.f = target; target = null; vel = 0; } else vel = Math.sign(d) * Math.min(9, Math.max(0.6, Math.abs(d) * 4)); }
    else if (!dir && Math.abs(vel) < 0.5) { const near = RADIO.filter(isOpen).find(s => Math.abs(s.f - R.f) < 0.16); if (near) { R.f += (near.f - R.f) * Math.min(1, dt * 7); vel = 0; } }   // al soltar cerca de una emisora, el dial termina de encajar
    if (vel) { R.f = Math.max(F0, Math.min(F1, R.f + vel * dt)); if (R.f === F0 || R.f === F1) vel = 0; }
    const tk = Math.round(R.f * 5); if (tk !== lastTick) { lastTick = tk; sfx('tick'); }
    apply(); const a = draw(), amp = R.off ? 0 : a.st ? a.sig : 0.25;
    bars.forEach((b, i) => { b.style.transform = `scaleY(${(0.12 + amp * (0.35 + 0.65 * Math.abs(Math.sin(t * (5 + i * 1.7) + i * 2)))).toFixed(2)})`; });
    raf = requestAnimationFrame(step);
  };
  const kd = (e) => { const k = e.key.toLowerCase(); if (['a', 'd', 'arrowleft', 'arrowright'].includes(k)) { held.add(k); e.stopPropagation(); } }, ku = (e) => held.delete(e.key.toLowerCase());
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);
  const setFromX = (x) => { const r = scale.getBoundingClientRect(); target = null; vel = 0; R.f = Math.max(F0, Math.min(F1, F0 + (x - r.left) / r.width * (F1 - F0))); };
  scale.onpointerdown = (e) => { scale.setPointerCapture(e.pointerId); setFromX(e.clientX); scale.onpointermove = (ev) => setFromX(ev.clientX); }; scale.onpointerup = scale.onpointercancel = () => { scale.onpointermove = null; };
  let kx = null; const kb = $('#rd-knob'); kb.onpointerdown = (e) => { kb.setPointerCapture(e.pointerId); kx = e.clientX; target = null; }; kb.onpointermove = (e) => { if (kx == null) return; R.f = Math.max(F0, Math.min(F1, R.f + (e.clientX - kx) * 0.02)); kx = e.clientX; }; kb.onpointerup = kb.onpointercancel = () => { kx = null; };
  sh.onwheel = (e) => { e.preventDefault(); target = null; R.f = Math.max(F0, Math.min(F1, R.f + Math.sign(e.deltaY || e.deltaX) * 0.1)); };
  const power = () => { R.off = !R.off; sfx('place'); sfx('tick'); };
  $('#rd-pow').onclick = power;
  ui.onKey = (k) => { if (k === 'x' || k === ' ') return power(); if (k === 'e' || k === 'enter' || k === 'r') return ui.closeModal(); const n = Number(k); if (n >= 1 && n <= 9) { const s = found()[n - 1]; if (s) { target = s.f; if (R.off) R.off = false; sfx('tick'); } } };
  ui.onClose = () => {
    alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true);
    // si se deja entre dos emisoras, el dial vuelve a la última que sonaba bien
    const a = radioAt(R.f, isOpen); if (!R.off && (!a.st || a.sig < 0.9)) { const s = RADIO.find(x => x.id === R.last && isOpen(x)) || RADIO[0]; R.f = s.f; } else if (a.st) R.f = a.st.f;
    apply(); onClose?.();
  };
  marks(); draw(); raf = requestAnimationFrame(step); sfx('page');
}
