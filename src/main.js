// Pantastic! — el obrador de Pan. Bucle principal, jornada, hornadas, clientes y economía.
import { THREE, initGfx, scene, render, setTimeOfDay, updateCamera, initParticles, updateParticles, windU, cam, camTarget, burst, fx, Spring, clamp, rnd, light } from './gfx.js';
import { buildWorld, updateWorld, W, setUpgrade, drawBoard, collide } from './world.js';
import { makeChar, updateChar, PAN_LOOK, MIGA_LOOK, randomLook } from './chars.js';
import { makeTray, makeBread, renderIcons } from './breads.js';
import { ING, BREADS, BREAD_ORDER, PRICE_LV, REP, NEIGH, NEIGH_ORDER, HEART_AT, UPG, UPG_ORDER, DIAS, TIEMPO, CARTA, CARTA_ROSCA, VISIT_LINES, NO_STOCK, CARO } from './data.js';
import { ui, img, coin, stars, ingChip, $, ICON } from './ui.js';
import { initAudio, resumeAudio, sfx, blip, music, toggleMute } from './audio.js';

const Q = new URLSearchParams(location.search), TEST = Q.has('test');
const SAVE = 'pantastic-v1';
const T_OPEN = 8 * 60, T_LAST = 19 * 60, T_CLOSE = 19.5 * 60, MIN_PER_SEC = 1.6;
const BAKE = { raw: 8, gold0: 14, gold1: 22, burnt: 28 };

let S, R, mode = 'boot', K = null, tSec = 0, cur = null, fiesta = null;
const keys = new Set(); let pressE = false;
const pan = makeChar(PAN_LOOK); let miga = null; const nbChar = {};
const doughSq = new Spring(1, 260, 12);

// ---------- partida ----------
function fresh() { return { v: 1, day: 1, money: 30, rep: 0, ing: { harina: 8, levadura: 4 }, recipes: ['barra', 'hogaza'], prices: {}, pts: {}, met: {}, gave: {}, up: {}, tut: 0, intro: false, roscaLetter: false, fiesta: false, total: { sold: 0, earned: 0 }, seenLvl: 0 }; }
function save() { if (!TEST) localStorage.setItem(SAVE, JSON.stringify(S)); }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.v === 1 ? s : null; } catch { return null; } }
const lvl = () => { let l = 0; REP.forEach((r, i) => { if (S.rep >= r.at) l = i; }); return l; };
const hearts = (id) => { const p = S.pts[id] || 0; let h = 0; HEART_AT.forEach((a, i) => { if (p >= a) h = i; }); return h; };
const batchN = () => (S.up.bandeja ? 6 : 4);
const priceOf = (id) => Math.max(1, Math.round(BREADS[id].price * PRICE_LV[S.prices[id] ?? 1].k));
const ingPrice = (id) => Math.max(1, Math.round(ING[id].p * (R.market[id] || 1)));
const canMake = (id) => Object.entries(BREADS[id].ing).every(([k, n]) => (S.ing[k] || 0) >= n);
const batchCost = (id) => Object.entries(BREADS[id].ing).reduce((a, [k, n]) => a + ING[k].p * n, 0);
const shelfCount = () => Object.values(R.shelf).reduce((a, b) => a + b.length, 0);
const knownNeigh = () => NEIGH_ORDER.filter(id => NEIGH[id].lvl <= lvl());

function startDay(first = false) {
  const r = rnd(S.day * 9973 + 17), wd = (S.day - 1) % 7;
  const wk = S.day === 1 ? 'sol' : (() => { const x = r(); return x < 0.5 ? 'sol' : x < 0.7 ? 'nubes' : x < 0.86 ? 'lluvia' : 'viento'; })();
  const market = {}; const ids = Object.keys(ING);
  ids.forEach(id => market[id] = 0.85 + r() * 0.35);
  if (S.day > 1) { market[ids[Math.floor(r() * ids.length)]] = 0.6; market[ids[Math.floor(r() * ids.length)]] = 1.45; }
  const sellable = S.recipes.filter(x => x !== 'rosca' || S.fiesta);
  const antojo = S.day === 1 ? null : sellable[Math.floor(r() * sellable.length)];
  ui.clearWorld();
  for (const s of [...W.fermSlots, ...W.ovenSlots]) s.holder.clear();
  if (R) for (const c of R.cust) scene.remove(c.ch.root);
  R = { time: 7 * 60, shelf: {}, carry: null, ferm: [null, null, null], oven: [null, null], cust: [], spawns: [], slots: [null, null, null, null], waits: [], weather: wk, antojo, market, wd, open: false, ended: false, today: { sold: 0, income: 0, tips: 0, spent: 0, lost: 0, rep: 0, by: {} }, migaT: 0, leafT: 0 };
  setCarry(null); refreshBaskets();
  // llegadas
  const L = lvl();
  let n = 9 + L * 3 + (S.up.jardin ? 2 : 0) + (S.up.terraza ? 3 : 0) + (S.up.farolillos ? 3 : 0) + (S.up.fuente ? 3 : 0);
  n = Math.round(n * TIEMPO[wk].k * (wd === 6 ? 1.35 : 1) * (S.day === 1 ? 0.9 : 1));
  const times = [];
  const peak = () => { const c = [9.2, 13.3, 17.4][Math.floor(r() * 3)]; return clamp((c + (r() + r() + r() - 1.5) * 1.5) * 60, T_OPEN + (S.day === 1 ? 70 : 25), T_LAST - 10); };
  const nb = knownNeigh();
  nb.forEach(id => { R.spawns.push({ t: peak(), nb: id }); if (hearts(id) >= 3) R.spawns.push({ t: peak(), nb: id }); });
  for (let i = nb.length; i < n; i++) R.spawns.push({ t: peak(), seed: S.day * 100 + i });
  R.spawns.sort((a, b) => a.t - b.t);
  if (S.day === 1 && R.spawns.length) { R.spawns[0].t = T_OPEN + 75; if (R.spawns[0].nb !== 'lana') { const i = R.spawns.findIndex(s => s.nb === 'lana'); if (i > 0) [R.spawns[0].nb, R.spawns[i].nb, R.spawns[0].seed, R.spawns[i].seed] = [R.spawns[i].nb, R.spawns[0].nb, R.spawns[i].seed, R.spawns[0].seed]; } }
  // que nunca se quede sin poder hornear
  if (!S.recipes.some(canMake) && S.money < 8) { S.ing.harina = (S.ing.harina || 0) + 3; S.ing.levadura = (S.ing.levadura || 0) + 1; setTimeout(() => ui.toast('Tejo te ha fiado un saco de harina. «Ya me lo pagarás en pan.»', 'good'), 2500); }
  ui.setDay(S.day, DIAS[wd], TIEMPO[wk].ic, antojo); ui.setMoney(S.money); updRep();
  const lines = [];
  if (antojo) lines.push('Hoy se lleva: ' + BREADS[antojo].n);
  lines.push(wk === 'lluvia' ? 'Día de lluvia: apetece dulce' : wd === 6 ? 'Domingo: ¡viene medio pueblo!' : wk === 'viento' ? 'Sopla el viento del molino' : 'Buen día para hornear');
  if (S.recipes.includes('rosca') && !S.fiesta) lines.push('8 roscas al atardecer', '= ¡la Hornada!');
  else lines.push(`Recetas: ${S.recipes.length} de ${BREAD_ORDER.length}`);
  drawBoard('Día ' + S.day + ' · ' + DIAS[wd], lines);
  ui.rain(wk === 'lluvia');
  pan.x = 1.6; pan.z = -2.6; pan.yawTo = pan.yaw = 0; pan.goto = null;
  mode = 'play'; music('day'); ui.show('#hud', true);
  if (!first) { ui.dayTitle('Día ' + S.day, `${DIAS[wd]} · ${TIEMPO[wk].n.toLowerCase()}`); sfx('day'); }
  if (S.recipes.length >= 9 && !S.roscaLetter && NEIGH_ORDER.every(id => S.gave[id])) setTimeout(roscaLetter, 3400);
  save();
}
function updRep() { const l = lvl(), a = REP[l].at, b = REP[l + 1]?.at; ui.setRep(REP[l].n, b ? (S.rep - a) / (b - a) : 1); }
function addRep(n, x, y, z) {
  if (n <= 0) return; const before = lvl(); S.rep += n; R.today.rep += n; updRep();
  if (lvl() > before) setTimeout(() => {
    const l = lvl(); sfx('fanfare'); pan.act('joy'); pan.say('happy', 2); burst('confetti', pan.x, 1.8, pan.z, 40);
    const news = NEIGH_ORDER.filter(id => NEIGH[id].lvl === l).map(id => NEIGH[id].n);
    ui.toast(`♥ ${REP[l].n}` + (news.length ? ` · Mañana vendrá ${news.join(' y ')}` : ''), 'gold');
  }, 700);
}

// ---------- bandejas y cestas ----------
function setCarry(b) {
  R.carry = b; pan.carryAnchor.clear(); pan.carry = !!b;
  if (b) { const t = makeTray(b.id, b.n, b.stage, b.burnt ? 1 : b.tone || 0); t.scale.setScalar(0.82); pan.carryAnchor.add(t); }
}
function holderTray(slot, b) { slot.holder.clear(); if (b) slot.holder.add(makeTray(b.id, b.n, b.stage === 'baking' ? 'proofed' : b.stage)); }
function refreshBaskets() {
  const have = Object.keys(R.shelf).filter(k => R.shelf[k].length);
  for (const b of W.basketGroups) if (b.id && !have.includes(b.id)) { b.id = null; }
  for (const id of have) if (!W.basketGroups.some(b => b.id === id)) { const f = W.basketGroups.find(b => !b.id); if (f) f.id = id; }
  for (const b of W.basketGroups) {
    const n = b.id ? Math.min(6, R.shelf[b.id].length) : 0; if (b.n === n && b.shown === b.id) continue;
    b.items.clear(); b.n = n; b.shown = b.id;
    for (let i = 0; i < n; i++) {
      const m = makeBread(b.id); const long = ['barra', 'semillas', 'nueces', 'chapata'].includes(b.id);
      m.scale.setScalar(long ? 0.72 : 0.62);
      if (long) { m.position.set((i % 3 - 1) * 0.13, 0.05 + Math.floor(i / 3) * 0.1, (i % 2) * 0.04); m.rotation.set(0, 0.3 + i * 0.2, 0.5); }
      else { const a = i * 2.1; m.position.set(Math.cos(a) * (i ? 0.15 : 0), 0.02 + Math.floor(i / 3) * 0.1, Math.sin(a) * (i ? 0.15 : 0)); m.rotation.y = i; }
      b.items.add(m);
    }
  }
  ui.setShelf(R.shelf);
}

// ---------- hornada ----------
function openRecipes() {
  if (R.carry) return ui.toast('Tienes las manos ocupadas'), sfx('no');
  const list = S.recipes.map(id => {
    const b = BREADS[id], ok = canMake(id);
    return `<div class="rc pick ${ok ? '' : 'no'}" data-id="${id}">${img(id)}<div><div class="nm">${b.n}</div><div class="ings">${Object.entries(b.ing).map(([k, n]) => ingChip(k, n, S.ing[k] || 0)).join('')}</div>
      <div class="have">${batchN()} piezas · ${priceOf(id)} ${coin} cada una${R.antojo === id ? '<span class="tag new">hoy se lleva</span>' : ''}</div></div></div>`;
  }).join('');
  const sh = ui.modal(`<button class="x">✕</button><h2>¿Qué amasamos?</h2><div class="sub">Elige una receta. Si te falta algo, pídelo en la despensa.</div><div class="scroll"><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(360px,1fr))">${list}</div></div>`);
  sh.querySelector('.x').onclick = () => ui.closeModal();
  const picks = [...sh.querySelectorAll('.pick')]; let sel = Math.max(0, picks.findIndex(p => !p.classList.contains('no')));
  const mark = () => picks.forEach((p, i) => p.classList.toggle('sel', i === sel)); mark();
  const go = (p) => { if (p.classList.contains('no')) return sfx('no'); ui.closeModal(); startKnead(p.dataset.id); };
  picks.forEach((p, i) => { p.onclick = () => go(p); p.onmouseenter = () => { sel = i; mark(); }; });
  ui.onKey = (k) => { if (k === 'arrowright' || k === 'd') sel = (sel + 1) % picks.length; else if (k === 'arrowleft' || k === 'a') sel = (sel + picks.length - 1) % picks.length; else if (k === 'arrowdown' || k === 's') sel = Math.min(picks.length - 1, sel + 2); else if (k === 'arrowup' || k === 'w') sel = Math.max(0, sel - 2); else if (k === 'e' || k === 'enter' || k === ' ') return go(picks[sel]); else return; sfx('tick'); mark(); picks[sel].scrollIntoView({ block: 'nearest' }); };
  sfx('page');
}
function startKnead(id) {
  for (const [k, n] of Object.entries(BREADS[id].ing)) S.ing[k] -= n;
  K = { id, beat: 0, t: -0.5, scores: [], n: 4, done: 0 }; mode = 'knead';
  pan.goto = { x: -0.74, z: -4.82, yaw: Math.PI / 2 }; pan.act('knead');
  W.dough.visible = true; W.dough.scale.setScalar(0.6); ui.knead(true, K.n); cam.zoomTo = 0.44; cam.pitchTo = 0.3; sfx('poof'); burst('flour', ...W.doughWorld, 10);
}
function kneadHit(miss) {
  const err = Math.abs(K.t - 0.72), sc = miss ? 0.1 : err < 0.075 ? 1 : err < 0.17 ? 0.7 : 0.35, gr = sc === 1 ? 'p' : sc === 0.7 ? 'g' : 'm';
  K.scores.push(sc); ui.kneadHit(K.beat, gr); sfx('squish'); sfx(gr === 'p' ? 'perfect' : gr === 'g' ? 'good' : 'meh');
  doughSq.kick(gr === 'p' ? -9 : -6); burst('flour', ...W.doughWorld, gr === 'p' ? 14 : 6); if (gr === 'p') { burst('spark', ...W.doughWorld, 6); cam.shake = 0.35; }
  K.beat++; K.t = -0.3; W.dough.scale.setScalar(0.6 + K.beat * 0.1);
  if (K.beat >= K.n) K.done = 0.0001;
}
function endKnead() {
  const q = K.scores.reduce((a, b) => a + b, 0) / K.n;
  ui.knead(false); W.dough.visible = false; pan.action = null; cam.zoomTo = 0.72; cam.yawTo = 0; cam.pitchTo = 0; mode = 'play';
  setCarry({ id: K.id, n: batchN(), stage: 'dough', knead: q }); pan.pop(4); sfx('pick');
  ui.toast(q > 0.85 ? '¡Masa de campeonato!' : q > 0.55 ? 'Buena masa' : 'Masa algo vaga… pero sirve', q > 0.85 ? 'gold' : '');
  if (S.tut === 0) S.tut = 1; K = null;
}
function useFerm() {
  const c = R.carry;
  if (c && c.stage === 'dough') {
    const i = R.ferm.findIndex(x => !x); if (i < 0) return ui.toast('La fermentadora está llena'), sfx('no');
    R.ferm[i] = { ...c, t: 0, need: S.up.fermenta ? 12 : 24 }; holderTray(W.fermSlots[i], c); setCarry(null); sfx('place'); pan.act('give');
    R.ferm[i].g = ui.anchor('gauge ferm', `<span>Subiendo…</span><div class="track"><i style="width:0"></i></div>`, [W.fermSlots[i].p[0] + (i - 1) * 0.0, W.fermSlots[i].p[1] + 0.55, W.fermSlots[i].p[2]]);
    if (S.tut === 1) S.tut = 2; return;
  }
  if (c) return ui.toast(c.stage === 'proofed' ? 'Esta ya ha subido: al horno' : 'Eso va al mostrador'), sfx('no');
  const i = R.ferm.findIndex(x => x && x.t >= x.need);
  if (i < 0) return ui.toast(R.ferm.some(x => x) ? 'Aún está subiendo. Paciencia de panadera.' : 'No hay masa dentro'), sfx('no');
  const b = R.ferm[i]; ui.unanchor(b.g); R.ferm[i] = null; holderTray(W.fermSlots[i], null);
  setCarry({ id: b.id, n: b.n, stage: 'proofed', knead: b.knead }); sfx('pick'); pan.pop(3); if (S.tut === 2) S.tut = 3;
}
function useOven() {
  const c = R.carry, max = S.up.horno2 ? 2 : 1;
  if (c && c.stage === 'proofed') {
    const i = R.oven.findIndex((x, k) => !x && k < max); if (i < 0) return ui.toast(max === 1 ? 'El horno está ocupado' : 'Las dos bocas están ocupadas'), sfx('no');
    R.oven[i] = { ...c, stage: 'baking', t: 0, dinged: false }; holderTray(W.ovenSlots[i], R.oven[i]); setCarry(null); sfx('place'); sfx('fire'); pan.act('give');
    R.oven[i].g = ui.anchor('gauge', `<span>Horneando</span><div class="track"><div class="mark"></div></div>`, [W.ovenSlots[i].p[0] + (i ? 0.9 : 0), W.ovenSlots[i].p[1] + (i ? 0.5 : 2.15), W.ovenSlots[i].p[2]]);
    return;
  }
  if (c) return ui.toast(c.stage === 'dough' ? 'Primero tiene que subir en la fermentadora' : 'Eso ya está hecho: al mostrador'), sfx('no');
  let i = -1, best = -1; R.oven.forEach((x, k) => { if (x && x.t > best) { best = x.t; i = k; } });
  if (i < 0) return ui.toast('El horno está vacío'), sfx('no');
  const b = R.oven[i]; if (b.t < BAKE.raw) return ui.toast('Aún está cruda'), sfx('no');
  let bake, word, cls = '';
  if (b.t < BAKE.gold0) { bake = 0.4; word = 'Un poco pálido'; } else if (b.t <= BAKE.gold1) { const mid = Math.abs(b.t - (BAKE.gold0 + BAKE.gold1) / 2) < 2.2; bake = 1; word = mid ? '¡En su punto!' : 'Dorado'; cls = mid ? 'gold' : 'good'; }
  else if (b.t < BAKE.burnt) { bake = 0.4; word = 'Algo tostado'; } else { bake = 0; word = 'Muy tostado… se venderá barato'; }
  const tot = b.knead * 0.5 + bake * 0.5, q = bake === 0 ? 1 : tot >= 0.8 ? 3 : tot >= 0.5 ? 2 : 1;
  ui.unanchor(b.g); R.oven[i] = null; holderTray(W.ovenSlots[i], null);
  setCarry({ id: b.id, n: b.n, stage: 'baked', q, burnt: bake === 0, tone: b.t > BAKE.gold1 ? 0.45 : 0 });
  sfx('pick'); sfx(q === 3 ? 'perfect' : 'good'); pan.pop(4); if (q === 3) { pan.say('happy', 1.5); burst('spark', pan.x, 1.4, pan.z + 0.4, 12); }
  burst('steam', pan.x, 1.2, pan.z + 0.4, 8); ui.toast(`${word} · ${stars(q)}`, cls); if (S.tut === 3) S.tut = 4;
}
function placeBread() {
  const c = R.carry; (R.shelf[c.id] ||= []).push(...Array.from({ length: c.n }, () => ({ q: c.q, burnt: c.burnt })));
  R.shelf[c.id].sort((a, b) => a.q - b.q); setCarry(null); refreshBaskets(); sfx('place'); sfx('pop'); pan.act('give');
  const b = W.basketGroups.find(x => x.id === c.id) || W.basketGroups[2]; const p = new THREE.Vector3(); b.g.getWorldPosition(p);
  burst('spark', p.x, p.y + 0.3, p.z, 10); burst('steam', p.x, p.y + 0.2, p.z, 5); ui.float(`+${c.n} ${BREADS[c.id].pl}`, p.x, p.y + 0.6, p.z, 'star');
  if (S.tut === 4) S.tut = 5;
}

// ---------- clientes ----------
function pickWant(nb) {
  const opts = S.recipes.filter(x => x !== 'rosca' || S.fiesta); let tot = 0; const w = opts.map(id => {
    let k = 1; if (nb && NEIGH[nb].favs.includes(id)) k *= 4; if (R.antojo === id) k *= 3; if (R.weather === 'lluvia' && BREADS[id].sweet) k *= 2;
    k *= [1.3, 1, 0.7][S.prices[id] ?? 1]; if (R.shelf[id]?.length) k *= 1.6; tot += k; return k;
  });
  let x = Math.random() * tot; for (let i = 0; i < opts.length; i++) { x -= w[i]; if (x <= 0) return opts[i]; } return opts[0];
}
function spawn(sp) {
  let ch; if (sp.nb) { ch = nbChar[sp.nb] ||= makeChar(NEIGH[sp.nb].look); if (R.cust.some(c => c.ch === ch)) return; } else ch = makeChar(randomLook(sp.seed));
  const side = Math.random() < 0.5 ? -1 : 1; ch.x = side * 19.5; ch.z = 4.2 + Math.random() * 0.6; ch.sit = false; ch.action = null; scene.add(ch.root);
  const c = { ch, nb: sp.nb || null, want: pickWant(sp.nb), st: 'enter', path: [[-4.6 + Math.random() * 0.5, 4.0], [-4.6, 1.3]], side, wait: 0, max: 80 + (S.up.jardin ? 20 : 0) + Math.random() * 25, pos: [0, 0, 0], bpos: [0, 0, 0], slot: -1, t: 0, born: tSec };
  R.cust.push(c);
}
function walk(c, x, z, dt, sp = 2.0) {
  const ch = c.ch, dx = x - ch.x, dz = z - ch.z, d = Math.hypot(dx, dz);
  if (d < 0.08) { ch.speed = 0; return true; }
  const s = Math.min(d, sp * dt); ch.x += dx / d * s; ch.z += dz / d * s; ch.yawTo = Math.atan2(dx, dz); ch.speed = sp; return false;
}
function showWant(c) {
  ui.unanchor(c.bub); const nm = c.nb ? `<span class="nm">${NEIGH[c.nb].n}</span>` : '';
  c.bub = ui.anchor('bub side', `${nm}${img(c.want)}<div class="wait"><i></i></div>`, c.bpos);
}
function say(c, text, ms = 2200) { ui.unanchor(c.sayB); c.sayB = ui.anchor('bub say', text, c.pos); c.ch.talking = true; blip(c.nb ? NEIGH[c.nb].pitch : 1.2); setTimeout(() => { c.ch.talking = false; }, 500); setTimeout(() => { ui.unanchor(c.sayB); c.sayB = null; }, ms); }
function leave(c) {
  ui.unanchor(c.bub); c.bub = null; if (c.slot >= 0) { R.slots[c.slot] = null; c.slot = -1; } const wi = R.waits.indexOf(c); if (wi >= 0) R.waits[wi] = null;
  const seat = c.bought && S.up.terraza && Math.random() < 0.5 ? W.seats.find(s => !s.used) : null;
  if (seat) { seat.used = c; c.seat = seat; c.st = 'toSeat'; c.path = [[-4.6, 1.3], [1, 3.6], [seat.x - Math.sign(seat.x - 11) * 0.0, seat.z + 0.7]]; }
  else { c.st = 'leave'; c.path = [[-4.6, 1.3], [-4.6 - c.side, 4.2], [-c.side * 20, 4.4 + Math.random() * 0.5]]; }
}
const WAIT_SPOTS = [[-5.9, 1.7], [-3.3, 1.9], [-2.0, 2.5], [-6.8, 2.6], [-0.7, 1.8], [0.6, 2.6]];
function updateCustomers(dt) {
  // llegadas
  while (R.spawns.length && R.spawns[0].t <= R.time) spawn(R.spawns.shift());
  for (let i = R.cust.length - 1; i >= 0; i--) {
    const c = R.cust[i], ch = c.ch; c.t += dt; c.pos[0] = ch.x; c.pos[1] = 2.02 * ch.scale + (ch.L.sp === 'liebre' ? 0.35 : 0.1); c.pos[2] = ch.z; c.bpos[0] = ch.x - 0.62; c.bpos[1] = 1.35 * ch.scale; c.bpos[2] = ch.z;
    if (c.st === 'enter' || c.st === 'leave' || c.st === 'toSeat') {
      const p = c.path[0];
      if (walk(c, p[0], p[1], dt, c.st === 'leave' && !c.bought ? 1.7 : 2.1)) {
        c.path.shift();
        if (!c.path.length) {
          if (c.st === 'enter') { c.st = 'find'; sfx('bell'); }
          else if (c.st === 'toSeat') { c.st = 'sit'; c.t = 0; ch.x = c.seat.x; ch.z = c.seat.z; ch.yawTo = c.seat.yaw; ch.sit = true; ch.speed = 0; }
          else { scene.remove(ch.root); R.cust.splice(i, 1); }
        }
      }
    } else if (c.st === 'find') {
      const s = R.slots.findIndex(x => !x), firstWaiter = R.waits.find(x => x);
      if (s >= 0 && (!firstWaiter || firstWaiter === c)) { const wi = R.waits.indexOf(c); if (wi >= 0) R.waits[wi] = null; R.slots[s] = c; c.slot = s; c.st = 'toSlot'; }
      else if (!R.waits.includes(c)) { let w = R.waits.findIndex(x => !x); if (w < 0) w = R.waits.length; if (w < WAIT_SPOTS.length) { R.waits[w] = c; c.wspot = w; } else { c.wspot = Math.floor(Math.random() * WAIT_SPOTS.length); R.waits.push(c); } }
      if (c.st === 'find') { const p = WAIT_SPOTS[c.wspot % WAIT_SPOTS.length]; if (walk(c, p[0], p[1], dt, 1.8)) ch.yawTo = 0.6; }
    } else if (c.st === 'toSlot') {
      const p = W.slots[c.slot]; if (walk(c, p.x, p.z, dt)) { c.st = 'wait'; ch.yawTo = Math.PI / 2 - 0.55; showWant(c); ch.pop(3); sfx('pop'); if (!R.firstCust) { R.firstCust = true; } }
    } else if (c.st === 'wait') {
      c.wait += dt; ch.speed = 0;
      if (c.bub) { const f = 1 - c.wait / c.max, b = c.bub.querySelector('.wait i'); b.style.width = (f * 100) + '%'; b.style.background = f > 0.5 ? '#7cc47a' : f > 0.22 ? '#f2b84b' : '#e9785e'; }
      if (c.wait > c.max && !ui.dialogOpen) { say(c, 'Uy, se me hace tarde. ¡Vuelvo otro día!'); R.today.lost++; ch.act('sad'); leave(c); }
    } else if (c.st === 'served') { if (c.t > 1.1 && !ui.dialogOpen) leave(c); }
    else if (c.st === 'sit') { if (Math.sin(c.t * 2) > 0.95 && Math.random() < 0.1) burst('crumb', ch.x, 1.0, ch.z, 2); if (c.t > 16) { ch.sit = false; c.seat.used = null; c.st = 'leave'; c.path = [[ch.x, ch.z + 1.2], [c.side * -20, 4.4]]; } }
    updateChar(ch, dt);
  }
  // Miga despacha sola
  if (miga) {
    R.migaT -= dt; const tgt = R.slots.find(c => c && c.st === 'wait' && c.wait > 3 && !(c.nb && (!S.met[c.nb] || (hearts(c.nb) >= 2 && !S.gave[c.nb]))) && (R.shelf[c.want]?.length));
    if (tgt && R.migaT <= 0 && !ui.dialogOpen) { R.migaT = 3.2; miga.yawTo = Math.atan2(tgt.ch.x - miga.x, tgt.ch.z - miga.z); miga.act('give'); miga.pop(4); serve(tgt, true); }
    updateChar(miga, dt);
  }
}
function serve(c, byMiga = false) {
  const N = c.nb ? NEIGH[c.nb] : null;
  if (N && !S.met[c.nb] && !byMiga) { S.met[c.nb] = true; return talk(c, N.hola, () => serve(c)); }
  let id = c.want;
  if (!R.shelf[id]?.length) {
    const alts = Object.keys(R.shelf).filter(k => R.shelf[k].length && (k !== 'rosca' || S.fiesta));
    if (!alts.length) { if (c.askedEmpty) return; c.askedEmpty = true; sfx('no'); return ui.toast('No queda pan en el mostrador. ¡A hornear!'); }
    if (c.alt) return;
    c.alt = true; const fav = N && alts.find(a => N.favs.includes(a)); const pick = fav || alts[Math.floor(Math.random() * alts.length)];
    if (fav || Math.random() < 0.7) { c.want = id = pick; showWant(c); say(c, `No queda, ¿eh? Pues ${BREADS[id].art} ${BREADS[id].n.toLowerCase()} me vale.`, 1800); }
    else { say(c, NO_STOCK[Math.floor(Math.random() * NO_STOCK.length)]); R.today.lost++; c.st = 'served'; c.t = 0.4; ui.unanchor(c.bub); c.bub = null; return; }
  }
  const lv = S.prices[id] ?? 1, loaf = R.shelf[id][R.shelf[id].length - 1];
  if (lv === 2 && loaf.q < 3 && Math.random() < 0.45) { say(c, CARO[Math.floor(Math.random() * CARO.length)]); c.ch.act('sad'); R.today.lost++; c.st = 'served'; c.t = 0.3; ui.unanchor(c.bub); c.bub = null; sfx('no'); return; }
  R.shelf[id].pop(); refreshBaskets();
  const hot = R.antojo === id; let price = Math.round(priceOf(id) * (loaf.burnt ? 0.5 : 1) * (hot ? 1.25 : 1));
  const tip = (c.wait < 22 ? Math.round(price * 0.12) : 0) + (loaf.q === 3 ? Math.round(price * 0.12) : 0) + (S.up.jardin && Math.random() < 0.3 ? 1 : 0);
  S.money += price + tip; S.total.sold++; S.total.earned += price + tip; R.today.sold++; R.today.income += price; R.today.tips += tip; R.today.by[id] = (R.today.by[id] || 0) + 1;
  const fav = N && N.favs.includes(id);
  addRep(loaf.burnt ? 0 : loaf.q + (fav ? 2 : 0) + (lv === 0 ? 1 : 0) + (hot ? 1 : 0));
  const ch = c.ch; c.bought = true; c.st = 'served'; c.t = 0; ui.unanchor(c.bub); c.bub = null;
  if (!byMiga) { pan.act('give'); pan.say('happy', 1.2); }
  ch.act(loaf.q === 3 || fav ? 'joy' : 'nod'); ch.say('happy', 1.6); sfx('coin');
  burst('spark', W.register[0], W.register[1], c.ch.z, 8); ui.setMoney(S.money, true);
  ui.float(`+${price}${tip ? ` <small>+${tip}</small>` : ''}`, -1.9, 1.9, ch.z, ''); if (loaf.q === 3) burst('crumb', ch.x, 1.3, ch.z, 6);
  // el pan viaja con su dueño
  const b = makeBread(id, loaf.burnt ? 1 : 0); b.scale.setScalar(0.5); b.position.set(0, -0.26, 0.1); b.rotation.z = 1.2; ch.arms[1].add(b); c.loaf = b; setTimeout(() => { if (c.st !== 'sit') ch.arms[1].remove(b); }, 30000);
  if (N) {
    const h0 = hearts(c.nb); S.pts[c.nb] = (S.pts[c.nb] || 0) + 1 + (fav ? 1 : 0) + (loaf.q === 3 ? 1 : 0);
    if (hearts(c.nb) > h0) { sfx('heart'); ui.float('♥', ch.x, 2.3, ch.z, 'heart'); }
    say(c, N.gracias[Math.floor(Math.random() * N.gracias.length)], 1900);
    if (hearts(c.nb) >= 2 && !S.gave[c.nb]) { S.gave[c.nb] = true; c.t = -1.2; setTimeout(() => talk(c, N.receta, () => unlock(N.gives, N.n)), 1500); }
  } else if (Math.random() < 0.6) say(c, VISIT_LINES[Math.floor(Math.random() * VISIT_LINES.length)], 1600);
  if (S.tut === 5) S.tut = 6;
  save();
}
function talk(c, lines, done) {
  const N = NEIGH[c.nb]; cam.zoomTo = 0.5; c.ch.say('happy', 1);
  ui.dialog(N.n, lines, { onChar: (k) => { if (k % 2) blip(N.pitch); }, onLine: (i) => { c.ch.talking = i >= 0; if (i >= 0) sfx('pop'); }, onDone: () => { cam.zoomTo = 0.72; c.ch.talking = false; done?.(); } });
}
function unlock(id, from) {
  if (S.recipes.includes(id)) return; S.recipes.push(id); sfx('fanfare'); pan.act('joy'); pan.say('wow', 2); burst('confetti', pan.x, 2, pan.z, 50); save();
  const sh = ui.modal(`<div class="unlock"><div class="rays"></div><div class="sub" style="margin:0">${from ? 'Receta de ' + from : 'La última receta de la abuela'}</div><h2 style="font-size:38px">${BREADS[id].n}</h2>${img(id)}<p style="font-weight:700;font-size:18px;color:var(--soft);margin:4px 30px 14px">${BREADS[id].d}</p><div class="ings" style="justify-content:center">${Object.entries(BREADS[id].ing).map(([k, n]) => ingChip(k, n, 99)).join('')}</div><div class="row" style="justify-content:center"><button class="btn main">¡A hornearlo!</button></div></div>`, 'narrow');
  sh.querySelector('.btn').onclick = () => ui.closeModal(); ui.onKey = (k) => { if (k === 'e' || k === 'enter' || k === ' ') ui.closeModal(); };
}
function roscaLetter() {
  if (S.roscaLetter || ui.modalOpen || ui.dialogOpen) return; S.roscaLetter = true; sfx('page');
  letter(CARTA_ROSCA, 'Detrás del horno había una carta', () => unlock('rosca'));
}
function letter(lines, title, done) {
  const sh = ui.modal(`<h2>${title}</h2><div class="sub"></div><div class="letter">${lines.map((l, i) => `<p style="animation-delay:${i * 0.9}s">${l}</p>`).join('')}</div><div class="row"><button class="btn main">Guardar la carta</button></div>`, 'narrow');
  ui.onClose = done; sh.querySelector('.btn').onclick = () => ui.closeModal(); ui.onKey = (k) => { if (k === 'e' || k === 'enter') ui.closeModal(); };
}

// ---------- libreta ----------
let libTab = 'pedidos';
function openLib(tab) {
  if (tab) libTab = tab; sfx('page');
  const newUp = UPG_ORDER.some(id => !S.up[id] && (UPG[id].lvl || 0) <= lvl() && S.money >= UPG[id].p);
  const tabs = [['pedidos', 'Despensa'], ['recetas', 'Recetas'], ['vecinos', 'Vecinos'], ['mejoras', 'Mejoras' + (newUp ? '<i class="dot"></i>' : '')]];
  let body = '';
  if (libTab === 'pedidos') body = `<div class="sub">Los precios cambian cada día. Hoy tienes ${S.money} ${coin}</div><div class="scroll"><div class="grid">` + Object.entries(ING).map(([id, g]) => {
    const p = ingPrice(id), k = R.market[id], used = S.recipes.some(r => BREADS[r].ing[id]);
    return `<div class="item ${used ? '' : 'off'}"><div class="sw" style="background:${g.c}"></div><div class="txt"><div class="nm">${g.n}${k <= 0.7 ? '<span class="tag down">oferta</span>' : k >= 1.35 ? '<span class="tag up">caro</span>' : ''}</div><div class="have">Tienes <b>${S.ing[id] || 0}</b> · <span class="price ${k <= 0.7 ? 'down' : k >= 1.35 ? 'up' : ''}">${p} ${coin}</span></div></div>
      <div class="buy"><button class="btn sm" data-buy="${id}" data-n="1" ${S.money < p ? 'disabled' : ''}>+1</button><button class="btn sm" data-buy="${id}" data-n="5" ${S.money < p * 5 ? 'disabled' : ''}>+5</button></div></div>`;
  }).join('') + '</div></div>';
  if (libTab === 'recetas') body = `<div class="sub">${S.recipes.length} de ${BREAD_ORDER.length} recetas. Las que faltan las guardan tus vecinos.</div><div class="scroll"><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(400px,1fr))">` + BREAD_ORDER.map(id => {
    const b = BREADS[id]; if (!S.recipes.includes(id)) return `<div class="rc" style="background:#f3e7cf;box-shadow:none;opacity:.8"><div style="width:90px;height:90px;display:grid;place-items:center;font-size:44px">❔</div><div><div class="nm">???</div><div class="ds">${id === 'rosca' ? 'La abuela la escondió bien.' : 'Alguien del pueblo se acuerda de este pan.'}</div></div></div>`;
    const lv = S.prices[id] ?? 1;
    return `<div class="rc">${img(id)}<div><div class="nm">${b.n}</div><div class="ds">${b.d}</div><div class="ings">${Object.entries(b.ing).map(([k, n]) => ingChip(k, n, S.ing[k] || 0)).join('')}</div>
      <div class="seg">${PRICE_LV.map((p, i) => `<button class="${i === lv ? 'on' : ''}" data-price="${id}" data-lv="${i}" title="${p.d}">${p.n} · ${Math.max(1, Math.round(b.price * p.k))}</button>`).join('')}</div></div></div>`;
  }).join('') + '</div></div>';
  if (libTab === 'vecinos') body = `<div class="sub">Dales su pan favorito y bien hecho. Con dos corazones te devuelven una receta de la abuela.</div><div class="scroll"><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(400px,1fr))">` + NEIGH_ORDER.map(id => {
    const N = NEIGH[id], known = S.met[id], h = hearts(id), em = { oveja: '🐑', tejon: '🦡', liebre: '🐇', rana: '🐸', erizo: '🦔', zorro: '🦊', buho: '🦉' }[N.look.sp];
    if (!known) return `<div class="vec" style="background:#f3e7cf;box-shadow:none"><div class="face" style="background:#e6d6b6">❔</div><div><div class="nm" style="font-weight:800">Alguien por conocer</div><div class="ds" style="font-size:13.5px;font-weight:600;color:var(--soft)">${N.lvl > lvl() ? 'Vendrá cuando el obrador tenga más fama.' : 'Aún no ha pasado por el mostrador.'}</div></div></div>`;
    return `<div class="vec"><div class="face" style="background:${N.look.shirt}">${em}</div><div style="flex:1"><div style="font-weight:800;font-size:18px">${N.n} <span class="hearts">${'♥'.repeat(h)}<i>${'♥'.repeat(5 - h)}</i></span></div>
      <div style="font-size:13.5px;font-weight:700;color:var(--soft);margin-top:3px">Le gusta: ${N.favs.map(f => S.recipes.includes(f) ? BREADS[f].n.toLowerCase() : '???').join(', ')}</div>
      <div style="font-size:13.5px;font-weight:700;margin-top:2px;color:${S.gave[id] ? '#3f9a5c' : 'var(--soft)'}">${S.gave[id] ? '✓ Te dio la receta: ' + BREADS[N.gives].n : 'Guarda una receta de la abuela'}</div></div></div>`;
  }).join('') + '</div></div>';
  if (libTab === 'mejoras') body = `<div class="sub">Lo que ganas vuelve al obrador y a la plaza. Tienes ${S.money} ${coin}</div><div class="scroll"><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(400px,1fr))">` + UPG_ORDER.map(id => {
    const u = UPG[id], own = S.up[id], locked = (u.lvl || 0) > lvl();
    return `<div class="item ${locked ? 'lock' : ''}"><div class="sw" style="background:#fff3d6">${locked ? '🔒' : u.ic}</div><div class="txt"><div class="nm">${u.n}</div><div class="ds">${locked ? `Hace falta más fama: «${REP[u.lvl].n}»` : u.d}</div></div>
      ${own ? '<b style="color:#3f9a5c">✓ Hecho</b>' : locked ? '' : `<button class="btn sm ${S.money >= u.p ? 'main' : ''}" data-up="${id}" ${S.money < u.p ? 'disabled' : ''}>${u.p} ${coin}</button>`}</div>`;
  }).join('') + '</div></div>';
  const sh = ui.modal(`<button class="x">✕</button><h2>La libreta de Pan</h2><div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${k === libTab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>${body}
    <div class="row"><span class="grow">${R.time < T_LAST ? 'Puedes cerrar antes si ya no te queda pan ni ganas.' : ''}</span><button class="btn" id="lib-close">Cerrar el obrador por hoy 🌙</button></div>`);
  sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => openLib(b.dataset.tab));
  sh.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const id = b.dataset.buy, n = Number(b.dataset.n), c = ingPrice(id) * n; if (S.money < c) return sfx('no'); S.money -= c; R.today.spent += c; S.ing[id] = (S.ing[id] || 0) + n; ui.setMoney(S.money, true); sfx('buy'); const sc = sh.querySelector('.scroll').scrollTop; openLibQuiet(sc); if (S.tut === 6) S.tut = 7; save(); });
  sh.querySelectorAll('[data-price]').forEach(b => b.onclick = () => { S.prices[b.dataset.price] = Number(b.dataset.lv); sfx('tick'); openLibQuiet(sh.querySelector('.scroll').scrollTop); save(); });
  sh.querySelectorAll('[data-up]').forEach(b => b.onclick = () => buyUp(b.dataset.up));
  sh.querySelector('#lib-close').onclick = () => { ui.closeModal(); endDay(); };
  ui.onKey = (k) => { const order = tabs.map(t => t[0]), i = order.indexOf(libTab); if (k === 'arrowright' || k === 'd') openLib(order[(i + 1) % 4]); if (k === 'arrowleft' || k === 'a') openLib(order[(i + 3) % 4]); if (k === 'l' || k === 'tab') ui.closeModal(); };
}
function openLibQuiet(scroll) { const s = sfx; openLib(); const sc = $('#modal .scroll'); if (sc) sc.scrollTop = scroll; $('#modal .sheet').style.animation = 'none'; }
function buyUp(id) {
  const u = UPG[id]; if (S.money < u.p || S.up[id]) return sfx('no');
  S.money -= u.p; R.today.spent += u.p; S.up[id] = true; ui.setMoney(S.money, true); ui.closeModal(); applyUpgrades(true, id); sfx('fanfare'); save();
  ui.toast(`${u.ic} ${u.n}`, 'gold'); pan.act('joy'); pan.say('happy', 2);
  const at = { jardin: [0, 0.6, 3.2], terraza: [11, 1, 1], farolillos: [0, 3, 4.5], fuente: [-10.2, 1.4, 7], horno2: [5.1, 1, -4.2], bandeja: [pan.x, 1.4, pan.z], fermenta: [3, 1.6, -4.9], miga: [-1, 1, -3.85] }[id];
  burst('confetti', at[0], at[1] + 0.5, at[2], 60, { spread: 3 }); burst('spark', at[0], at[1], at[2], 20);
}
function applyUpgrades(announce, only) {
  for (const id of UPG_ORDER) if (S.up[id]) setUpgrade(id, true);
  if (S.up.miga && !miga) { miga = makeChar(MIGA_LOOK); miga.x = -1.0; miga.z = -3.85; miga.yaw = miga.yawTo = -Math.PI / 2 + 0.4; miga.root.position.y = 0.48; scene.add(miga.root); if (announce && only === 'miga') { miga.act('wave'); } }
}

// ---------- fin del día ----------
function endDay() {
  if (mode !== 'play' || R.ended) return; R.ended = true; mode = 'summary'; ui.prompt(null);
  const left = shelfCount(), t = R.today, gift = Math.floor(left / 2);
  const top = Object.entries(t.by).sort((a, b) => b[1] - a[1])[0];
  if (gift) { S.rep += gift; }
  const net = t.income + t.tips - t.spent;
  ui.fade(0.55); music('eve');
  setTimeout(() => {
    const sh = ui.modal(`<h2>Fin del día ${S.day}</h2><div class="sub">${t.sold ? (top ? `Lo más pedido: ${BREADS[top[0]].n.toLowerCase()} (${top[1]})` : '') : 'Hoy el mostrador ha estado tranquilo.'}</div>
      <div class="sum"><span>Panes vendidos</span><span class="v">${t.sold}</span><span>Ventas</span><span class="v">+${t.income} ${coin}</span><span>Propinas</span><span class="v">+${t.tips} ${coin}</span><span>Gastos en despensa y mejoras</span><span class="v">−${t.spent} ${coin}</span>
      <span class="tot">Balance del día</span><span class="v tot" style="color:${net >= 0 ? '#3f9a5c' : '#d0503c'}">${net >= 0 ? '+' : '−'}${Math.abs(net)} ${coin}</span></div>
      <div style="font-weight:700;color:var(--soft);font-size:16px;line-height:1.4">${t.lost ? `${t.lost} ${t.lost === 1 ? 'persona se fue' : 'personas se fueron'} sin pan. Mañana más masa. ` : t.sold ? 'Nadie se fue con las manos vacías. ' : ''}${left ? `Sobraron ${left} panes: los dejas en el banco de la plaza para quien los necesite${gift ? ` (+${gift} ♥)` : ''}.` : ''}</div>
      <div class="row"><span class="grow">Cariño del pueblo: +${t.rep + gift} ♥</span><button class="btn main">A dormir 🌙</button></div>`, 'narrow');
    const go = () => { ui.closeModal(); ui.fade(1); setTimeout(() => { S.day++; startDay(); ui.fade(0); }, 800); };
    sh.querySelector('.btn').onclick = go; ui.onKey = (k) => { if (k === 'e' || k === 'enter') go(); };
  }, 700);
}

// ---------- la Hornada ----------
function startFiesta() {
  S.fiesta = true; save(); mode = 'fiesta'; ui.show('#hud', false); ui.prompt(null); ui.clearWorld(); ui.fade(1); music(null);
  setTimeout(() => {
    for (const c of R.cust) scene.remove(c.ch.root); R.cust = []; R.time = 19.1 * 60; setCarry({ id: 'rosca', n: batchN(), stage: 'baked', q: 3 }); R.shelf = {}; refreshBaskets();
    setUpgrade('farolillos', true); const cx = -1.8, cz = 4.7;
    pan.x = cx; pan.z = cz; pan.yaw = pan.yawTo = 0; fiesta = { t: 0, guests: [], cx, cz, card: -1 };
    NEIGH_ORDER.forEach((id, i) => { const ch = nbChar[id] ||= makeChar(NEIGH[id].look); const a = -0.3 + i / 6 * (Math.PI + 0.6); ch.x = cx + Math.cos(a) * 3.3; ch.z = cz + 0.5 - Math.sin(a) * 2.1; ch.yaw = ch.yawTo = Math.atan2(cx - ch.x, cz - ch.z); ch.sit = false; ch.act('dance'); ch.at = i * 0.4; scene.add(ch.root); fiesta.guests.push(ch); });
    for (let i = 0; i < 6; i++) { const ch = makeChar(randomLook(900 + i)); const sd = i % 2 ? 1 : -1; ch.x = cx + sd * (5 + Math.floor(i / 2) * 1.3); ch.z = cz - 0.8 + Math.floor(i / 2) * 1.1; ch.yaw = ch.yawTo = -sd * 0.9; ch.act('dance'); ch.at = i * 0.7; scene.add(ch.root); fiesta.guests.push(ch); }
    if (miga) { miga.root.position.y = 0; miga.x = cx + 1.3; miga.z = cz + 0.3; miga.act('dance'); }
    cam.zoomTo = 0.8; cam.pitchTo = 0.15; ui.fade(0); music('fiesta');
  }, 900);
}
const FIESTA_CARDS = ['La noche de la Hornada', 'Ocho roscas, un pueblo entero y el horno de la abuela otra vez caliente.', 'En Migas el pan nunca fue solo pan.<small>Era la excusa para juntarse.</small>', 'Gracias por hornear.<small>Pantastic! · un juego de Pan para Pan</small>'];
function updateFiesta(dt) {
  const f = fiesta; if (!f) return; f.t += dt;
  cam.yawTo = Math.sin(f.t * 0.12) * 0.5;
  if (Math.random() < dt * 2.5) burst('confetti', f.cx + (Math.random() - 0.5) * 9, 3 + Math.random() * 2, f.cz + (Math.random() - 0.5) * 5, 8, { spread: 1 });
  for (const g of f.guests) { if (g.action !== 'dance') g.act('dance'); updateChar(g, dt); }
  if (pan.action !== 'dance' && f.t > 4) { setCarry(null); pan.act('dance'); }
  const k = Math.floor((f.t - 1.5) / 6.5);
  if (k !== f.card && k >= 0 && k < FIESTA_CARDS.length) { f.card = k; ui.card(FIESTA_CARDS[k], k === FIESTA_CARDS.length - 1 ? 0 : 6000); if (k === 0) sfx('fanfare'); }
  if (f.t > 1.5 + 6.5 * FIESTA_CARDS.length && !f.btn) {
    f.btn = true; const d = ui.card(`${FIESTA_CARDS[3]}<br><button class="btn main" style="margin-top:18px;pointer-events:auto">Seguir horneando</button>`, 0); d.style.pointerEvents = 'auto';
    d.querySelector('button').onclick = () => { d.remove(); ui.fade(1); setTimeout(() => { for (const g of f.guests) scene.remove(g.root); fiesta = null; cam.yawTo = 0; cam.pitchTo = 0; cam.zoomTo = 0.72; if (!S.up.farolillos) setUpgrade('farolillos', false); if (miga) { miga.root.position.y = 0.48; miga.x = -1; miga.z = -3.85; miga.action = null; } pan.action = null; S.day++; startDay(); ui.fade(0); }, 800); };
  }
}

// ---------- interacción ----------
function findAction() {
  const px = pan.x, pz = pan.z, c = R.carry;
  const behind = px > -1.5 && px < -0.35 && pz > -5.4 && pz < -0.4;
  if (behind && c && c.stage === 'baked') return { text: 'Dejar en el mostrador', pos: [-1.9, 1.75, pz], fn: placeBread };
  if (behind && !c) {
    let best = null, bd = 0.8; for (const cu of R.slots) if (cu && cu.st === 'wait') { const d = Math.abs(cu.ch.z - pz); if (d < bd) { bd = d; best = cu; } }
    if (best) { const has = R.shelf[best.want]?.length; return { text: has ? `Dar ${BREADS[best.want].n.toLowerCase()}` : (S.met[best.nb] || !best.nb ? `No queda ${BREADS[best.want].n.toLowerCase()}…` : 'Saludar'), pos: [-1.9, 1.75, best.ch.z], fn: () => serve(best), face: -Math.PI / 2 + 0.45, cust: best }; }
  }
  let bs = null, bd = 1.35; for (const [k, s] of Object.entries(W.st)) { if (k === 'mostrador') continue; const d = Math.hypot(px - s.x, pz - s.z); if (d < bd) { bd = d; bs = k; } }
  if (bs) {
    const s = W.st[bs], pos = [s.ox, bs === 'horno' ? 2.55 : bs === 'ferm' ? 2.75 : 1.9, s.oz + 0.4];
    if (bs === 'mesa') return { text: c ? 'Manos ocupadas' : 'Amasar', ok: !c, pos, fn: openRecipes, st: s };
    if (bs === 'despensa') return { text: 'Despensa', pos: [6.0, 2.2, -2.2], fn: () => openLib('pedidos'), st: s };
    if (bs === 'ferm') { const rdy = R.ferm.some(x => x && x.t >= x.need); return { text: c?.stage === 'dough' ? 'Poner a fermentar' : rdy && !c ? 'Sacar la masa' : 'Fermentadora', ok: (c?.stage === 'dough') || (rdy && !c), pos, fn: useFerm, st: s }; }
    if (bs === 'horno') { const any = R.oven.some(x => x); return { text: c?.stage === 'proofed' ? 'Meter al horno' : any && !c ? 'Sacar del horno' : 'Horno', ok: (c?.stage === 'proofed') || (any && !c), pos, fn: useOven, st: s }; }
  }
  if (Math.hypot(px - W.pondPos[0], pz - W.pondPos[1]) < 3.6 && !c) return { text: 'Saludar a los patos', pos: [W.pondPos[0], 1.2, W.pondPos[1]], fn: () => { pan.act('wave'); pan.yawTo = Math.atan2(W.pondPos[0] - px, W.pondPos[1] - pz); sfx('quack'); for (const d of W.ducks) d.a += 0.5; } };
  if (S.up.fuente && Math.hypot(px - W.fountainPos[0], pz - W.fountainPos[1]) < 2.6) return { text: 'Echar una miga a la fuente', pos: [W.fountainPos[0], 2.3, W.fountainPos[1]], fn: () => { pan.act('give'); sfx('pop'); burst('crumb', W.fountainPos[0], 1.2, W.fountainPos[1], 5); burst('spark', W.fountainPos[0], 1.5, W.fountainPos[1], 8); if (!R.wished) { R.wished = true; addRep(1); ui.toast('Dicen que da suerte.'); } } };
  return null;
}
function goalText() {
  if (S.tut < 7) return [['Ve a la mesa y prepara tu primera masa', '👐'], ['Lleva la masa a la fermentadora (el armario verde)', '🌡️'], ['Cuando suba, llévala al horno', '🔥'], ['Sácala cuando la aguja esté en el dorado', '🥖'], ['Deja el pan en el mostrador, por detrás', '🧺'], ['Atiende desde detrás del mostrador a quien venga', '🛎️'], ['Repón harina y levadura en la despensa', '📒']][S.tut];
  if (S.fiesta) return ['Migas ya tiene su Hornada. Hornea por gusto.', '🎉'];
  if (S.recipes.includes('rosca')) return [`Ten 8 roscas en el mostrador al atardecer (${R.shelf.rosca?.length || 0} de 8)`, '🎉'];
  const got = NEIGH_ORDER.filter(id => S.gave[id]).length;
  return [`Gánate a los vecinos: ${got} de 7 recetas de la abuela`, '💌'];
}

// ---------- bucle ----------
function updatePlay(dt) {
  const busy = ui.modalOpen || ui.dialogOpen;
  // movimiento
  let mx = 0, mz = 0;
  if (!busy && mode === 'play' && !pan.goto) {
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1; if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (keys.has('w') || keys.has('arrowup')) mz -= 1; if (keys.has('s') || keys.has('arrowdown')) mz += 1;
  }
  if (pan.goto) {
    const g = pan.goto, dx = g.x - pan.x, dz = g.z - pan.z, d = Math.hypot(dx, dz);
    if (d < 0.06) { pan.yawTo = g.yaw; pan.speed = 0; pan.goto = null; } else { const s = Math.min(d, 4 * dt); pan.x += dx / d * s; pan.z += dz / d * s; pan.yawTo = Math.atan2(dx, dz); pan.speed = 2.2; }
  } else if (mx || mz) {
    const l = Math.hypot(mx, mz), sp = R.carry ? 3.1 : 3.6; const p = collide(pan.x + mx / l * sp * dt, pan.z + mz / l * sp * dt, 0.3);
    const moved = Math.hypot(p[0] - pan.x, p[1] - pan.z); pan.x = p[0]; pan.z = p[1]; pan.yawTo = Math.atan2(mx, mz); pan.speed = moved / dt > 0.4 ? sp : 0;
    if (pan.action === 'wave') pan.action = null;
    pan.stepT = (pan.stepT || 0) - dt; if (pan.stepT < 0 && pan.speed) { pan.stepT = 0.27; sfx('step'); if (Math.random() < 0.5) burst('dust', pan.x, 0.08, pan.z, 1, { color: pan.z > 0.7 ? 0xe9dcc0 : 0xf6ead6 }); }
  } else pan.speed = 0;
  updateChar(pan, dt);
  if (busy) { ui.prompt(null); pressE = false; return; }
  // amasado
  if (mode === 'knead') {
    doughSq.step(Math.min(dt, 0.03)); const sq = clamp(doughSq.v, 0.5, 1.4), base = 0.6 + K.beat * 0.1; W.dough.scale.set(base / Math.sqrt(sq), base * sq, base / Math.sqrt(sq));
    if (K.done) { K.done += dt; if (K.done > 0.7) endKnead(); pressE = false; return; }
    K.t += dt / 0.95; ui.kneadRing(Math.max(0, K.t));
    if (pressE && K.t > 0.2) kneadHit(false); else if (K.t > 1.12) kneadHit(true);
    pressE = false; ui.prompt(null); return;
  }
  // reloj
  R.time += dt * MIN_PER_SEC; ui.setTime(R.time);
  if (!R.open && R.time >= T_OPEN) { R.open = true; sfx('bell'); ui.toast('🛎️ ¡Abierto! Hoy toca hornear.'); }
  if (R.time > 17.5 * 60) music('eve');
  // fermentadora y horno
  R.ferm.forEach((b, i) => { if (!b) return; const was = b.t >= b.need; b.t += dt; const f = Math.min(1, b.t / b.need); b.g.querySelector('.track i').style.width = f * 100 + '%'; const it = W.fermSlots[i].holder.children[0]?.userData.items; if (it) for (const d of it) { const k = 1 + f * 0.3; d.scale.set(k * 0.9, (1 + f * 0.55) * 0.9, k * 0.9); } if (!was && b.t >= b.need) { b.g.classList.add('ready'); b.g.querySelector('span').textContent = '¡Ha subido!'; sfx('pop'); } });
  R.oven.forEach((b, i) => {
    if (!b) return; const t0 = b.t; b.t += dt; const mark = b.g.querySelector('.mark'); mark.style.left = Math.min(100, b.t / BAKE.burnt * 100) + '%';
    const sp = b.g.querySelector('span'); const st = b.t < BAKE.gold0 ? 'Horneando…' : b.t <= BAKE.gold1 ? '¡Dorado! Sácalo' : b.t < BAKE.burnt ? '¡Que se tuesta!' : 'Muy tostado'; if (sp.textContent !== st) sp.textContent = st;
    b.g.classList.toggle('ready', b.t >= BAKE.gold0);
    if (t0 < BAKE.gold0 && b.t >= BAKE.gold0) { sfx('ding'); burst('steam', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.4, W.ovenSlots[i].p[2] + 0.5, 6); }
    if (b.t > BAKE.gold1 - 2.5 && b.t < BAKE.burnt && Math.floor(b.t * 2) !== Math.floor(t0 * 2)) sfx('tick');
    if (Math.random() < dt * 2) burst('steam', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.5, W.ovenSlots[i].p[2] + 0.45, 1);
  });
  updateCustomers(dt);
  // ambiente
  if (R.weather === 'viento') { R.leafT -= dt; if (R.leafT < 0) { R.leafT = 0.25; burst('leaf', camTarget.x - 12 + Math.random() * 8, 3 + Math.random() * 3, camTarget.z - 4 + Math.random() * 10, 1, { color: [0xffb7c9, 0xffd98a, 0xb9e38a][Math.floor(Math.random() * 3)] }); } }
  // acción
  cur = findAction();
  if (cur) { ui.prompt(cur.text, cur.pos, cur.ok !== false); if (pressE) { if (cur.st && cur.fn !== openRecipes) { pan.goto = { x: cur.st.x, z: cur.st.z, yaw: cur.st.yaw }; } if (cur.face != null) pan.yawTo = cur.face; cur.fn(); } } else ui.prompt(null);
  pressE = false;
  const g = goalText(); ui.setGoal(g[0], g[1]);
  // fiesta y cierre
  if (!S.fiesta && S.recipes.includes('rosca') && R.time > 17.5 * 60 && (R.shelf.rosca?.length || 0) >= 8) return startFiesta();
  if (R.time >= T_CLOSE && (!R.cust.some(c => c.st === 'wait' || c.st === 'toSlot' || c.st === 'find') || R.time > T_CLOSE + 30)) endDay();
}
function frame(dt) {
  tSec += dt; windU.value = tSec * (R?.weather === 'viento' ? 2.2 : 1);
  if (mode === 'play' || mode === 'knead') updatePlay(dt);
  else if (mode === 'fiesta') { updateFiesta(dt); updateChar(pan, dt); if (miga) updateChar(miga, dt); }
  else if (mode === 'title') { cam.yawTo = Math.sin(tSec * 0.1) * 0.35; updateChar(pan, dt); }
  else { updateChar(pan, dt); if (R) for (const c of R.cust) updateChar(c.ch, dt); }
  const hour = R ? R.time / 60 : 9.5, wd = R ? { lluvia: 0.85, nubes: 0.45 }[R.weather] || 0 : 0;
  const inside = pan.z < 0.8 && Math.abs(pan.x) < 6.6;
  const focus = mode === 'title' ? { x: 0, z: 0.5 } : mode === 'knead' ? { x: 0.0, z: -4.5 } : mode === 'fiesta' && fiesta ? { x: fiesta.cx, z: fiesta.cz + 0.3 } : ui.dialogOpen && cur?.cust ? { x: -2, z: cur.cust.ch.z + 0.3 } : { x: clamp(pan.x, -11, 11), z: clamp(pan.z + (inside ? -0.6 : 0.2), -3.4, 8) };
  updateCamera(dt, focus, frame.snap); frame.snap = false;
  setTimeOfDay(hour, wd);
  updateWorld(dt, hour, { wind: R?.weather === 'viento', baking: R ? [!!R.oven[0], !!R.oven[1]] : null });
  updateParticles(dt); ui.update();
}
let last = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); render(); requestAnimationFrame(loop); }

// ---------- arranque ----------
function boot() {
  initGfx(document.getElementById('c')); initParticles(); buildWorld(); ui.init(renderIcons());
  scene.add(pan.root);
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase(); if (k === 'tab') e.preventDefault(); if (e.repeat) return; initAudio(); resumeAudio();
    if (k === 'm') return ui.toast(toggleMute() ? '🔇 Sin sonido' : '🔊 Con sonido');
    if (ui.dialogOpen) { if (k === 'e' || k === ' ' || k === 'enter') ui.dlgNext?.(); return; }
    if (ui.modalOpen) { if (k === 'escape') return ui.closeModal(); ui.onKey?.(k); return; }
    keys.add(k);
    if (k === 'e' || k === ' ' || k === 'enter') pressE = true;
    if ((k === 'l' || k === 'tab') && mode === 'play') openLib();
    if (k === 'q' && mode === 'play' && R.carry) { ui.toast('Lo dejas para los patos'); setCarry(null); sfx('whoosh'); }
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());
  addEventListener('pointerdown', () => { initAudio(); resumeAudio(); });
  $('#btn-lib').onclick = () => { if (mode === 'play' && !ui.modalOpen && !ui.dialogOpen) openLib(); };
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal' && mode === 'play') ui.closeModal(); });

  const saved = load();
  const begin = (s) => {
    S = s; applyUpgrades(false); cam.yawTo = 0; cam.pitchTo = 0; cam.zoomTo = 0.72;
    if (!S.intro) { S.intro = true; mode = 'letter'; R = null; music('title'); pan.x = 1.6; pan.z = -2.6; letter(CARTA, 'Una carta dentro del horno', () => { startDay(true); ui.dayTitle('Día 1', 'lunes · el horno vuelve a encenderse'); sfx('day'); }); }
    else startDay();
  };
  if (TEST) { S = fresh(); S.intro = true; if (Q.has('rich')) { S.money = 3000; S.rep = 700; S.recipes = BREAD_ORDER.filter(x => x !== 'rosca'); NEIGH_ORDER.forEach(id => { S.met[id] = true; S.pts[id] = 20; S.gave[id] = true; }); S.tut = 7; S.roscaLetter = true; S.recipes.push('rosca'); for (const k in ING) S.ing[k] = 40; if (Q.has('up')) UPG_ORDER.forEach(id => S.up[id] = true); S.day = Number(Q.get('day') || 5); } applyUpgrades(false); cam.zoom = cam.zoomTo = 0.72; startDay(true); frame.snap = true; }
  else {
    mode = 'title'; pan.x = 1.2; pan.z = 1.6; pan.act('wave'); cam.zoom = cam.zoomTo = 1.0; cam.pitchTo = 0.25; frame.snap = true; music('title');
    setInterval(() => { if (mode === 'title') pan.act('wave'); }, 4000);
    ui.title(!!saved, () => { initAudio(); begin(saved || fresh()); }, () => { localStorage.removeItem(SAVE); begin(fresh()); });
  }
  // API de pruebas
  window.game = {
    ready: true, get S() { return S; }, get R() { return R; }, get mode() { return mode; }, pan, W, ui, cam,
    step(sec, h = 1 / 30) { for (let t = 0; t < sec; t += h) frame(h); render(); },
    tp(x, z, yaw) { pan.x = x; pan.z = z; if (yaw != null) pan.yaw = pan.yawTo = yaw; frame.snap = true; },
    key(k) { if (ui.dialogOpen) return ui.dlgNext?.(); if (ui.modalOpen) return ui.onKey?.(k); if (k === 'e') pressE = true; else if (k === 'l') openLib(); },
    stock(id, n = 4, q = 3) { (R.shelf[id] ||= []).push(...Array.from({ length: n }, () => ({ q }))); refreshBaskets(); },
    time(h) { R.time = h * 60; }, carry(id, stage = 'baked', q = 3) { setCarry({ id, n: batchN(), stage, q, knead: 1 }); },
    spawn(nb) { spawn(nb ? { nb } : { seed: Math.floor(Math.random() * 999) }); }, openLib, endDay, startFiesta, unlock, startKnead, serve,
  };
  if (!TEST) requestAnimationFrame(loop); else { frame(1 / 30); render(); }
}
boot();
