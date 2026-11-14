// Pantastic! — el obrador de Pan. Bucle principal, jornada, hornadas, clientes y economía.
import { mat as gmat, mesh as gmesh, G as GG } from './gfx.js';
import { THREE, initGfx, scene, render, setTimeOfDay, updateCamera, initParticles, updateParticles, windU, cam, camTarget, burst, fx, Spring, clamp, rnd, light } from './gfx.js';
import { buildWorld, updateWorld, W, setUpgrade, setWip, drawBoard, collide } from './world.js';
import { makeChar, updateChar, PAN_LOOK, MIGA_LOOK, randomLook } from './chars.js';
import { makeTray, makeBread, renderIcons } from './breads.js';
import { ING, BREADS, BREAD_ORDER, PRICE_LV, REP, NEIGH, NEIGH_ORDER, HEART_AT, UPG, UPG_ORDER, CAPS, PIPA, DIAS, TIEMPO, CARTA, CARTA_ROSCA, VISIT_LINES, NO_STOCK, CARO, CORREO, HALLAZGO, PIPA_LOOK, SUP, SUP_ORDER, MUEBLES, MUE_ORDER } from './data.js';
import { renderExtras } from './icons.js';
import { logoURL } from './logo.js';
import { ui, img, coin, stars, ingChip, $, ICON, XI } from './ui.js';
import { initAudio, resumeAudio, sfx, blip, note, music, toggleMute } from './audio.js';
import { DOUGH_TINT } from './breads.js';
import { toScreen } from './gfx.js';

const Q = new URLSearchParams(location.search), TEST = Q.has('test');
const SAVE = 'pantastic-v1';
const T_OPEN = 8 * 60, T_LAST = 19 * 60, T_CLOSE = 19.5 * 60, MIN_PER_SEC = 1.6;
const BAKE = { raw: 8, gold0: 14, gold1: 22, burnt: 28 };

let S, R, mode = 'boot', K = null, tSec = 0, cur = null, fiesta = null;
const keys = new Set(); let pressE = false;
const pan = makeChar(PAN_LOOK); let miga = null, pipa = null; const nbChar = {};
const doughSq = new Spring(1, 260, 12);

// ---------- partida ----------
function fresh() { return { v: 1, day: 1, money: 30, rep: 0, ing: { harina: 8, levadura: 4 }, recipes: ['barra', 'hogaza'], prices: {}, pts: {}, met: {}, gave: {}, up: {}, build: [], baked: {}, wood: 6, lata: 0, home: {}, sup: {}, tut: 0, intro: false, roscaLetter: false, fiesta: false, total: { sold: 0, earned: 0 }, seenLvl: 0 }; }
function save() { if (!TEST) localStorage.setItem(SAVE, JSON.stringify(S)); }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.v === 1 ? s : null; } catch { return null; } }
const lvl = () => { let l = 0; REP.forEach((r, i) => { if (S.rep >= r.at) l = i; }); return l; };
const hearts = (id) => { const p = S.pts[id] || 0; let h = 0; HEART_AT.forEach((a, i) => { if (p >= a) h = i; }); return h; };
const batchN = () => (S.up.bandeja ? 6 : 4);
const mastery = (id) => { const n = S.baked[id] || 0; return n >= 120 ? 3 : n >= 48 ? 2 : n >= 16 ? 1 : 0; };
const renown = () => Math.min(10, Math.max(0, Math.floor((S.rep - REP[REP.length - 1].at) / 400)));
const comfort = () => MUE_ORDER.filter(id => S.home[id]).length;
const supOf = (ing) => SUP_ORDER.find(k => SUP[k].ings.includes(ing));
const supLvl = (k) => Math.min(5, Math.floor((S.sup[k] || 0) / 96));
const supStamps = (k) => supLvl(k) >= 5 ? 8 : Math.floor(((S.sup[k] || 0) % 96) / 12);
const priceOf = (id) => Math.max(1, Math.round(BREADS[id].price * PRICE_LV[S.prices[id] ?? 1].k * (1 + renown() * 0.02))) + mastery(id);
const ingPrice = (id) => Math.max(1, Math.round(ING[id].p * (R.market[id] || 1) * (S.up.molino && ['harina', 'integral', 'centeno'].includes(id) ? 0.67 : 1) * (R.disc || 1) * (1 - supLvl(supOf(id)) * 0.04)));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const face = (id, ex = 'idle') => `<img src="${XI.face[id][ex]}" alt="">`;
const iimg = (id) => `<img src="${XI.ing[id]}" alt="">`;
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
  if (R) { for (const c of R.cust) scene.remove(c.ch.root); for (const c of R.stroll) scene.remove(c.ch.root); }
  for (const s of W.cartSlots) s.holder.clear();
  R = { time: 7 * 60, shelf: {}, carry: null, ferm: [null, null, null], oven: [null, null], cart: [null, null, null], reveal: [], fire: 0.7, brb: false, stroll: [], chatted: {}, finds: [], mail: null, chop: 0, disc: 1, cust: [], spawns: [], slots: [null, null, null, null], waits: [], weather: wk, antojo, market, wd, open: false, ended: false, today: { sold: 0, income: 0, tips: 0, spent: 0, lost: 0, rep: 0, by: {} }, migaT: 0, leafT: 0 };
  setCarry(null); refreshBaskets();
  // llegadas
  const L = lvl();
  // obras encargadas ayer: terminadas esta mañana
  for (const id of S.build || []) { S.up[id] = true; R.reveal.push(id); setWip(id, UPG[id].at, false); } S.build = []; applyUpgrades(false);
  let n = 9 + L * 3 + (S.up.jardin ? 2 : 0) + (S.up.reforma ? 3 : 0) + (S.up.terraza ? 3 : 0) + (S.up.puesto ? 2 : 0) + (S.up.farolillos ? 3 : 0) + (S.up.fuente ? 3 : 0);
  n = Math.round(n * TIEMPO[wk].k * (wd === 6 ? 1.35 : 1) * (S.day === 1 ? 0.9 : 1));
  const times = [];
  const peak = () => { const c = [9.2, 13.3, 17.4][Math.floor(r() * 3)]; return clamp((c + (r() + r() + r() - 1.5) * 1.5) * 60, T_OPEN + (S.day === 1 ? 70 : 25), T_LAST - 10); };
  const nb = knownNeigh();
  nb.forEach(id => { R.spawns.push({ t: peak(), nb: id }); if (hearts(id) >= 3) R.spawns.push({ t: peak(), nb: id }); });
  for (let i = nb.length; i < n; i++) R.spawns.push({ t: peak(), seed: S.day * 100 + i });
  R.spawns.sort((a, b) => a.t - b.t);
  if (S.day === 1 && R.spawns.length) { R.spawns[0].t = T_OPEN + 75; if (R.spawns[0].nb !== 'lana') { const i = R.spawns.findIndex(s => s.nb === 'lana'); if (i > 0) [R.spawns[0].nb, R.spawns[i].nb, R.spawns[0].seed, R.spawns[i].seed] = [R.spawns[i].nb, R.spawns[0].nb, R.spawns[i].seed, R.spawns[0].seed]; } }
  // que nunca se quede sin poder hornear: si ni con lo que hay ni con el monedero sale una hornada, Tejo fía
  const short = (id) => Object.entries(BREADS[id].ing).reduce((a, [k, q]) => a + Math.max(0, q - (S.ing[k] || 0)) * ingPrice(k), 0);
  if (Math.min(...S.recipes.map(short)) > S.money) { S.ing.harina = Math.max(S.ing.harina || 0, 4); S.ing.levadura = Math.max(S.ing.levadura || 0, 2); setTimeout(() => ui.toast(`${face('tejo')} Tejo te ha fiado harina. «Ya me lo pagarás en pan.»`, 'good'), 2600); }
  if (S.up.huerto && !first) { const g = pick(['aceitunas', 'nueces', 'semillas']), q = 1 + Math.floor(r() * 2); S.ing[g] = (S.ing[g] || 0) + q; setTimeout(() => ui.toast(`${iimg(g)} El huerto ha dado ${q} de ${ING[g].n.toLowerCase()}`, 'good'), 4200); }
  ui.setDay(S.day, DIAS[wd], wk, antojo); ui.setMoney(S.money); updRep();
  // encargos del día
  R.orders = []; if (S.day >= 3) { const who = NEIGH_ORDER.filter(id => S.met[id]); const cnt = 1 + (L >= 3 ? 1 : 0); for (let i = 0; i < cnt && who.length; i++) { const w = who.splice(Math.floor(r() * who.length), 1)[0], favs = NEIGH[w].favs.filter(f => S.recipes.includes(f)), bread = favs.length ? favs[Math.floor(r() * favs.length)] : sellable[Math.floor(r() * sellable.length)], n = Math.min(batchN() + 2, 3 + Math.floor(r() * 3) + (L > 3 ? 1 : 0)), by = i ? 17.5 : 13.5; if (bread === 'rosca') continue; R.orders.push({ who: w, bread, n, by, pay: Math.round(priceOf(bread) * n * 1.4), done: false, late: false }); } if (R.orders.length) setTimeout(() => ui.toast(`${face(R.orders[0].who)} Hay encargos en la pizarra`, 'good'), 6400); } drawOrders();
  const lines = [];
  if (antojo) lines.push('Hoy se lleva: ' + BREADS[antojo].n);
  lines.push(wk === 'lluvia' ? 'Día de lluvia: apetece dulce' : wd === 6 ? 'Domingo: ¡viene medio pueblo!' : wk === 'viento' ? 'Sopla el viento del molino' : 'Buen día para hornear');
  if (S.recipes.includes('rosca') && !S.fiesta) lines.push('8 roscas al atardecer', '= ¡la Hornada!');
  else lines.push(`Recetas: ${S.recipes.length} de ${BREAD_ORDER.length}`);
  if (R.orders.length) { lines.length = Math.min(lines.length, 2); for (const o of R.orders) lines.push(`${NEIGH[o.who].n}: ${o.n} ${BREADS[o.bread].pl}`); }
  drawBoard('Día ' + S.day + ' · ' + DIAS[wd], lines);
  ui.rain(false); R.inHome = false; for (const id of MUE_ORDER) W.home.fur[id].visible = !!S.home[id];

  // mundo vivo: hallazgos, buzón, vecinos de paseo, Pipa en la plaza
  W.brb.visible = false; $('#brb').classList.add('hide'); refreshWood();
  const spots = [...W.findSpots].sort(() => r() - 0.5).slice(0, 4); W.findMesh.forEach((m, i) => { m.visible = i < spots.length; if (spots[i]) m.position.set(spots[i][0], 0.35, spots[i][1]); }); R.finds = spots.map((p, i) => ({ x: p[0], z: p[1], i }));
  const friends = NEIGH_ORDER.filter(id => S.met[id] && hearts(id) >= 1);
  if (S.day > 1 && friends.length && r() < 0.65) { const from = friends[Math.floor(r() * friends.length)], coins = r() < 0.4; R.mail = { from, text: CORREO[Math.floor(r() * CORREO.length)], gift: coins ? { coins: 4 + Math.floor(r() * 4) + hearts(from) * 2 } : { ing: ['levadura', 'harina', 'mantequilla', 'azucar', 'nueces'][Math.floor(r() * 5)], n: 2 + (hearts(from) > 2 ? 1 : 0) } }; setTimeout(() => ui.toast(`${face(from)} Hay carta en el buzón`, 'good'), 5200); }
  const HANG = [[-12.6, 7.4], [-8, 9.4], [-7, 5], [2, 5.2], [5.6, 8.2], [10.5, 4.2], [13.8, 5.2], [-3, 4.2]];
  NEIGH_ORDER.filter(id => S.met[id] && NEIGH[id].lvl <= L).sort(() => r() - 0.5).slice(0, 3).forEach((id, i) => { const ch = nbChar[id] ||= makeChar(NEIGH[id].look); const p = HANG[Math.floor(r() * HANG.length)]; ch.x = p[0] + i * 0.4; ch.z = p[1]; ch.sit = false; ch.action = null; ch.speed = 0; ch.arms[1].remove(...ch.arms[1].children.filter(o => o.userData.bag)); scene.add(ch.root); R.stroll.push({ nb: id, ch, t: 3 + r() * 8, to: null, hang: HANG, pos: [0, 0, 0] }); });
  if (!pipa) { pipa = makeChar(PIPA_LOOK); } pipa.x = W.pipaSpot[0]; pipa.z = W.pipaSpot[1]; pipa.yaw = pipa.yawTo = 0.3; scene.add(pipa.root); R.pipa = true;
  ui.unanchor(R.fireG); R.fireG = ui.anchor('gauge flame', '<div class="fl"><i></i></div>', [6.2, 2.05, -4.6]); ui.unanchor(R.fermG); R.fermG = ui.anchor('gauge fdots', '<div class="fb"><i></i></div><div class="fb"><i></i></div><div class="fb"><i></i></div>', [3.0, 2.34, -4.95]); tweens.length = 0; for (const sl of [...W.fermSlots, ...W.ovenSlots]) sl.holder.position.set(...sl.p);
  pan.x = 1.6; pan.z = -2.6; pan.yawTo = pan.yaw = 0; pan.goto = null;
  mode = R.reveal.length ? 'reveal' : 'play'; R.revT = 0; music('day'); ui.show('#hud', true);
  if (!first) { ui.dayTitle('Día ' + S.day, `${DIAS[wd]} · ${TIEMPO[wk].n.toLowerCase()}`); sfx('day'); }
  if (S.recipes.length >= 9 && !S.roscaLetter && NEIGH_ORDER.every(id => S.gave[id])) setTimeout(roscaLetter, 3400);
  save();
}
function updRep() { const l = lvl(), a = REP[l].at, b = REP[l + 1]?.at, rn = renown(); ui.setRep(REP[l].n + (rn ? ' ' + '★'.repeat(Math.min(rn, 5)) + (rn > 5 ? '+' + (rn - 5) : '') : ''), b ? (S.rep - a) / (b - a) : rn >= 10 ? 1 : ((S.rep - a) % 400) / 400, l + 1 + rn); }
function addRep(n, x, y, z) {
  if (n <= 0) return; const before = lvl(), rn0 = renown(); S.rep += n; R.today.rep += n; updRep();
  if (renown() > rn0) setTimeout(() => { sfx('fanfare'); burst('confetti', pan.x, 1.8, pan.z, 40); ui.toast(`★ Renombre ${renown()}: todo el pan vale un 2 % más`, 'gold'); }, 700);
  if (lvl() > before) setTimeout(() => {
    const l = lvl(); sfx('fanfare'); pan.act('joy'); pan.say('happy', 2); burst('confetti', pan.x, 1.8, pan.z, 40);
    const news = NEIGH_ORDER.filter(id => NEIGH[id].lvl === l).map(id => NEIGH[id].n);
    ui.toast(`♥ Nivel ${l + 1}: ${REP[l].n}` + (news.length ? ` · Mañana vendrá ${news.join(' y ')}` : ''), 'gold');
    if (UPG_ORDER.some(id => UPG[id].lvl === l)) setTimeout(() => ui.toast('Hay obras nuevas en la libreta', 'good'), 3200);
  }, 700);
}

// ---------- bandejas y cestas ----------
function setCarry(b) {
  R.carry = b; pan.carryAnchor.clear(); pan.carry = !!b;
  if (b && b.stage === 'wood') { for (let i = 0; i < 3; i++) { const l = new THREE.Group(); gmesh(GG.cyl(0.1, 0.1, 0.7, 9), gmat('#b07a4c', { rough: 0.95 }), { parent: l, r: [0, 0, Math.PI / 2] }); gmesh(GG.cyl(0.075, 0.075, 0.71, 9), gmat('#f0d2a0'), { parent: l, r: [0, 0, Math.PI / 2] }); l.position.set(0, i === 2 ? 0.19 : 0.04, i === 2 ? -0.08 : (i ? -0.18 : 0.03)); pan.carryAnchor.add(l); } }
  else if (b) { const t = makeTray(b.id, b.n, b.stage, b.burnt ? 1 : b.tone || 0); t.scale.setScalar(0.82); pan.carryAnchor.add(t); }
}
const tweens = [];
/** Desliza una bandeja entre las manos de Pan y su hueco. dir 1 = entra, -1 = sale. */
function slide(slot, dir, done) { const hp = new THREE.Vector3(); pan.carryAnchor.getWorldPosition(hp); tweens.push({ slot, dir, t: 0, hp: [hp.x, hp.y, hp.z], done }); if (dir > 0) slot.holder.position.set(hp.x, hp.y, hp.z); }
function updateTweens(dt) { for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t = Math.min(1, w.t + dt / 0.32); const k = w.dir > 0 ? 1 - Math.pow(1 - w.t, 3) : 1 - w.t * w.t, p = w.slot.p; w.slot.holder.position.set(w.hp[0] + (p[0] - w.hp[0]) * k, w.hp[1] + (p[1] - w.hp[1]) * k + Math.sin(k * Math.PI) * 0.12, w.hp[2] + (p[2] - w.hp[2]) * k); if (w.t >= 1) { tweens.splice(i, 1); w.slot.holder.position.set(...p); w.done?.(); } } }
function holderTray(slot, b, look) { slot.holder.clear(); if (b) slot.holder.add(look === 'baked' ? makeTray(b.id, b.n, 'baked', b.tone || 0) : makeTray(b.id, b.n, b.stage === 'baking' ? 'proofed' : b.stage)); }
function refreshBaskets() {
  const have = Object.keys(R.shelf).filter(k => R.shelf[k].length);
  for (const b of W.basketGroups) if (b.id && !have.includes(b.id)) { b.id = null; }
  for (const id of have) if (!W.basketGroups.some(b => b.id === id)) { const f = W.basketGroups.find(b => !b.id); if (f) f.id = id; }
  for (const b of W.basketGroups) {
    const n = b.id ? Math.min(6, R.shelf[b.id].length) : 0; if (b.n === n && b.shown === b.id) continue;
    b.items.clear(); b.n = n; b.shown = b.id;
    for (let i = 0; i < n; i++) {
      // siempre dentro del borde de la cesta: las piezas largas a lo ancho, las redondas en cuadrícula
      const m = makeBread(b.id), long = ['barra', 'semillas', 'nueces', 'chapata'].includes(b.id), lay = Math.floor(i / (long ? 3 : 4)), k = i % (long ? 3 : 4);
      if (long) { m.scale.setScalar(b.id === 'barra' ? 0.62 : 0.8); m.position.set(lay ? 0.02 : 0, 0.005 + lay * 0.09, (k - 1) * 0.2 + lay * 0.1); m.rotation.y = (k - 1) * 0.06; }
      else { m.scale.setScalar(0.56); m.position.set((k % 2 ? 0.17 : -0.17) * (lay ? 0 : 1), 0.005 + lay * 0.11, (k < 2 ? -0.16 : 0.16) * (lay ? (i % 2 ? 1 : -1) : 1)); m.rotation.y = i * 1.3; }
      b.items.add(m);
    }
  }
  ui.setShelf(R.shelf);
}

// ---------- hornada ----------
function openRecipes() {
  if (R.carry) return ui.toast('Tienes las manos ocupadas: deja la bandeja en el carro'), sfx('no');
  const cards = S.recipes.map(id => {
    const b = BREADS[id], ok = canMake(id), miss = Object.entries(b.ing).filter(([k, n]) => (S.ing[k] || 0) < n).map(([k]) => ING[k].n.toLowerCase().replace('harina de ', '').replace('harina ', ''));
    return `<button class="rcard ${ok ? '' : 'no'}" data-id="${id}">${R.antojo === id ? '<span class="hot">hoy se lleva</span>' : ''}<div class="nm">${b.n}</div><img class="b" src="${ICON[id]}" alt="">
      <div class="need">${Object.entries(b.ing).map(([k, n]) => `<span class="nd ${(S.ing[k] || 0) < n ? 'miss' : ''}">${iimg(k)}<b>${n}</b></span>`).join('')}</div>
      <div class="out">${ok ? `${batchN()} piezas · ${priceOf(id)} ${coin}` : 'Falta ' + miss.join(' y ')}</div></button>`;
  }).join('');
  const sh = ui.modal(`<div class="head"><h2>¿Qué amasamos?</h2><div>Las fichas de la abuela. Lo que falte, al colmado.</div></div><div class="rcards scroll">${cards}</div><div class="hint-keys"><span><kbd>A</kbd><kbd>D</kbd> elegir</span><span><kbd>E</kbd> amasar</span><span><kbd>Esc</kbd> volver</span></div>`, 'board');
  const picks = [...sh.querySelectorAll('.rcard')]; let sel = Math.max(0, picks.findIndex(p => !p.classList.contains('no')));
  const mark = () => picks.forEach((p, i) => p.classList.toggle('sel', i === sel)); mark();
  const go = (p) => { if (p.classList.contains('no')) { sfx('no'); p.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 220 }); return; } ui.closeModal(); startKnead(p.dataset.id); };
  picks.forEach((p, i) => { p.onclick = () => go(p); p.onmouseenter = () => { if (sel !== i) { sel = i; mark(); sfx('tick'); } }; });
  const per = Math.max(1, Math.floor((sh.querySelector('.rcards').clientWidth - 20) / 192));
  ui.onKey = (k) => { if (k === 'arrowright' || k === 'd') sel = (sel + 1) % picks.length; else if (k === 'arrowleft' || k === 'a') sel = (sel + picks.length - 1) % picks.length; else if (k === 'arrowdown' || k === 's') sel = Math.min(picks.length - 1, sel + per); else if (k === 'arrowup' || k === 'w') sel = Math.max(0, sel - per); else if (k === 'e' || k === 'enter' || k === ' ') return go(picks[sel]); else return; sfx('tick'); mark(); picks[sel].scrollIntoView({ block: 'nearest' }); };
  sfx('page');
}
function startKnead(id) {
  const ing = Object.entries(BREADS[id].ing); for (const [k, n] of ing) S.ing[k] -= n;
  K = { id, phase: 'pour', beat: 0, t: 0, scores: [], n: 6, done: 0, combo: 0, hold: 0, holding: false, sx: new Spring(1, 200, 11), sz: new Spring(1, 200, 11) }; mode = 'knead';
  pan.goto = { x: -0.74, z: -4.72, yaw: 1.0 }; pan.act('knead');
  W.dough.visible = true; W.dough.scale.setScalar(0.05); W.dough.material.color.set(DOUGH_TINT[id] || '#f6e8cb');
  document.body.classList.add('kneading');
  ui.knead(true, K.n, 'Al montón: ' + ing.map(([k]) => ING[k].n.toLowerCase().replace('harina de ', '').replace('harina ', '')).join(', ')); cam.zoomTo = 0.42; cam.pitchTo = 0.32;
  // los ingredientes saltan de la despensa a la mesa
  const a0 = toScreen(6.0, 1.8, -2.2);
  ing.forEach(([k], i) => { const b = toScreen(W.doughWorld[0], W.doughWorld[1], W.doughWorld[2]); ui.fly(XI.ing[k], { x: innerWidth * 0.88, y: innerHeight * (0.3 + i * 0.08) }, { x: innerWidth * 0.5, y: innerHeight * 0.42 }, 620, i * 190); setTimeout(() => { if (!K) return; sfx('poof'); note(i); burst('flour', ...W.doughWorld, 9); W.dough.scale.setScalar(0.2 + (i + 1) / ing.length * 0.4); doughSq.kick(-5); cam.shake = 0.2; }, 620 + i * 190); });
  K.pourEnd = 0.9 + ing.length * 0.19;
}
function kneadKey(k) {
  if (!K || K.phase !== 'beat' || K.t < 0.15) return;
  const side = K.beat % 2 ? 'd' : 'a', hit = k === 'a' || k === 'arrowleft' ? 'a' : k === 'd' || k === 'arrowright' ? 'd' : k === 'e' || k === ' ' ? 'e' : null; if (!hit) return;
  document.querySelector('.k-hand.' + (side === 'a' ? 'l' : 'r')).animate([{ transform: 'scale(.8)' }, { transform: 'scale(1.18)' }], { duration: 160 });
  kneadHit(false, hit === side ? 0 : hit === 'e' ? 1 : 2);
}
function kneadHit(miss, wrong = 0) {
  const side = K.beat % 2 ? 'd' : 'a', err = Math.abs(K.t - 0.72);
  let sc = miss || wrong === 2 ? 0.1 : err < 0.08 ? 1 : err < 0.18 ? 0.7 : 0.35; if (wrong === 1) sc = Math.min(sc, 0.7);
  const gr = sc === 1 ? 'p' : sc === 0.7 ? 'g' : 'm';
  K.combo = gr === 'm' ? 0 : K.combo + 1; K.scores.push(sc); ui.kneadHit(K.beat, gr, side, K.combo); sfx('squish'); if (gr === 'm') sfx('meh'); else note(K.combo + (gr === 'p' ? 1 : 0));
  // la masa se estira hacia la mano que empuja y vuelve
  (side === 'a' ? K.sx : K.sz).kick(gr === 'p' ? 11 : 7); doughSq.kick(gr === 'p' ? -10 : -6); pan.pop(gr === 'p' ? 3 : 1.5);
  burst('flour', W.doughWorld[0] + (side === 'a' ? -0.25 : 0.25), W.doughWorld[1], W.doughWorld[2], gr === 'p' ? 14 : 6);
  if (gr === 'p') { burst('spark', ...W.doughWorld, 8); cam.shake = 0.4; } else cam.shake = 0.15;
  if (K.combo >= 3 && gr !== 'm') ui.float(`¡×${K.combo}!`, W.doughWorld[0], W.doughWorld[1] + 0.5, W.doughWorld[2], 'star');
  K.beat++; K.t = -0.22;
  if (K.beat >= K.n) { K.phase = 'hold'; K.t = 0; ui.kneadHoldMode(); ui.kneadTitle('Bolea la masa: mantén E y suelta en el dorado'); }
}
function kneadRelease() {
  const e = Math.abs(K.hold - 0.79), sc = e < 0.09 ? 1 : e < 0.2 ? 0.7 : 0.35; K.holdScore = sc; K.phase = 'out'; K.t = 0;
  ui.kneadWord(sc === 1 ? '¡Bola perfecta!' : sc === 0.7 ? 'Bien boleada' : K.hold > 0.9 ? 'Se pasó de vueltas' : 'Le faltaba un poco'); sfx(sc === 1 ? 'perfect' : sc === 0.7 ? 'good' : 'meh');
  doughSq.kick(sc === 1 ? 12 : 6); burst('flour', ...W.doughWorld, 16); if (sc === 1) { burst('spark', ...W.doughWorld, 18); burst('confetti', W.doughWorld[0], W.doughWorld[1] + 0.3, W.doughWorld[2], 14); cam.shake = 0.5; }
}
function updateKnead(dt) {
  doughSq.step(Math.min(dt, 0.03)); K.sx.step(Math.min(dt, 0.03)); K.sz.step(Math.min(dt, 0.03));
  const sq = clamp(doughSq.v, 0.45, 1.5), ex = clamp(K.sx.v, 0.6, 1.9), ez = clamp(K.sz.v, 0.6, 1.9);
  if (K.phase === 'pour') { K.t += dt; ui.kneadRing(0, null); if (K.t > K.pourEnd) { K.phase = 'beat'; K.t = -0.5; ui.kneadTitle('¡Amasa! Empuja con A y con D cuando el aro toque la masa'); } const b = W.dough.scale.x; W.dough.scale.set(b, b * sq, b); return; }
  const base = 0.62 + Math.min(K.beat, K.n) * 0.045;
  if (K.phase === 'beat') {
    K.t += dt / 0.85; ui.kneadRing(Math.max(0, K.t), K.beat % 2 ? 'd' : 'a'); if (K.t > 1.12) kneadHit(true);
    W.dough.scale.set(base * ex / Math.sqrt(sq), base * sq / Math.sqrt(ex * ez), base * ez / Math.sqrt(sq)); W.dough.rotation.y += dt * 0.6;
  } else if (K.phase === 'hold') {
    const down = keys.has('e') || keys.has(' ');
    if (down) { if (!K.holding) { K.holding = true; sfx('whoosh'); } K.hold += dt / 1.5; W.dough.rotation.y += dt * (4 + K.hold * 14); if (Math.random() < dt * 14) burst('flour', ...W.doughWorld, 1); if (Math.floor(K.hold * 12) !== Math.floor((K.hold - dt / 1.5) * 12)) sfx('tick'); }
    ui.kneadHold(K.hold); const r = base * (1 - K.hold * 0.12); W.dough.scale.set(r / Math.sqrt(sq), r * sq * (1 + K.hold * 0.5), r / Math.sqrt(sq));
    if ((K.holding && !down) || K.hold > 1.06) kneadRelease();
  } else { K.t += dt; W.dough.rotation.y += dt * 2; const r = base * 0.9; W.dough.scale.set(r / Math.sqrt(sq), r * sq * 1.4, r / Math.sqrt(sq)); if (K.t > 0.9) endKnead(); }
}
function endKnead() {
  const q = (K.scores.reduce((a, b) => a + b, 0) / K.n) * 0.7 + K.holdScore * 0.3;
  document.body.classList.remove('kneading');
  ui.knead(false); W.dough.visible = false; W.dough.rotation.y = 0; pan.action = null; cam.zoomTo = 0.72; cam.yawTo = 0; cam.pitchTo = 0; mode = 'play';
  setCarry({ id: K.id, n: batchN(), stage: 'dough', knead: q }); pan.pop(4); sfx('pick'); burst('flour', pan.x, 1.2, pan.z + 0.4, 10);
  ui.toast(`<img src="${ICON._masa}" alt="">` + (q > 0.85 ? '¡Masa de campeonato!' : q > 0.55 ? 'Buena masa' : 'Masa algo vaga… pero sirve'), q > 0.85 ? 'gold' : '');
  if (S.tut === 0) S.tut = 1; K = null;
}
function useFerm() {
  const c = R.carry;
  if (c && c.stage === 'dough') {
    const i = R.ferm.findIndex(x => !x); if (i < 0) return ui.toast('La fermentadora está llena'), sfx('no');
    R.ferm[i] = { ...c, t: 0, need: S.up.fermenta ? 12 : 24 }; holderTray(W.fermSlots[i], c); R.fermOpen = 0.75; slide(W.fermSlots[i], 1, () => { sfx('place'); burst('steam', 3.0, W.fermSlots[i].p[1] + 0.2, -4.95, 4); }); setCarry(null); sfx('whoosh'); pan.act('give');
    if (S.tut === 1) S.tut = 2; return;
  }
  if (c) return ui.toast(c.stage === 'wood' ? 'La leña va a la boca del horno' : c.stage === 'proofed' ? 'Esta ya ha subido: al horno, o déjala en el carro' : 'Eso va al mostrador'), sfx('no');
  const i = R.ferm.findIndex(x => x && x.t >= x.need);
  if (i < 0) return ui.toast(R.ferm.some(x => x) ? 'Aún está subiendo. Paciencia de panadera.' : 'No hay masa dentro'), sfx('no');
  const b = R.ferm[i]; ui.unanchor(b.g); R.ferm[i] = null; R.fermOpen = 0.8; sfx('whoosh'); pan.act('give'); burst('steam', 3.0, W.fermSlots[i].p[1] + 0.3, -4.95, 6);
  slide(W.fermSlots[i], -1, () => { holderTray(W.fermSlots[i], null); setCarry({ id: b.id, n: b.n, stage: 'proofed', knead: b.knead }); sfx('pick'); pan.pop(3); }); if (S.tut === 2) S.tut = 3;
}
function useOven() {
  const c = R.carry, max = S.up.horno2 ? 2 : 1;
  if (c && c.stage === 'wood') { if (R.fire > 0.92) return ui.toast('El fuego ya está bien alto'), sfx('no'); R.fire = Math.min(1, R.fire + 0.4); setCarry(null); sfx('fire'); sfx('place'); pan.act('give'); burst('spark', 5.1, 1.5, -4.3, 22, { color: 0xffa040 }); burst('steam', 5.1, 1.7, -4.2, 5); cam.shake = 0.25; R.fireWarn = false; return; }
  if (c && c.stage === 'proofed' && R.fire < 0.12) return ui.toast('El horno está casi apagado: trae leña de la leñera de fuera'), sfx('no');
  if (c && c.stage === 'proofed') {
    const i = R.oven.findIndex((x, k) => !x && k < max); if (i < 0) return ui.toast((max === 1 ? 'El horno está ocupado' : 'Las dos bocas están ocupadas') + ': deja la bandeja en el carro'), sfx('no');
    R.oven[i] = { ...c, stage: 'baking', t: 0, look: 0 }; holderTray(W.ovenSlots[i], R.oven[i]); slide(W.ovenSlots[i], 1, () => { sfx('place'); sfx('fire'); burst('spark', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.2, W.ovenSlots[i].p[2] - 0.2, 10, { color: 0xffa040 }); cam.shake = 0.2; }); setCarry(null); sfx('whoosh'); pan.act('give');
    R.oven[i].g = ui.anchor('gauge timer', `<div class="dial"><div class="ndl"></div>${img(c.id)}<b></b></div>`, [W.ovenSlots[i].p[0] + (i ? 1.0 : 1.2), W.ovenSlots[i].p[1] + (i ? 0.75 : 1.55), W.ovenSlots[i].p[2] + 0.3]);
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
  ui.unanchor(b.g); R.oven[i] = null; sfx('whoosh'); pan.act('give');
  slide(W.ovenSlots[i], -1, () => { holderTray(W.ovenSlots[i], null); setCarry({ id: b.id, n: b.n, stage: 'baked', q, burnt: bake === 0, tone: b.t > BAKE.gold1 ? 0.45 : 0 }); sfx('pick'); burst('steam', pan.x, 1.3, pan.z - 0.5, 10); });
   sfx(q === 3 ? 'perfect' : 'good'); pan.pop(4); if (q === 3) { pan.say('happy', 1.5); burst('spark', pan.x, 1.4, pan.z + 0.4, 12); }
  burst('steam', pan.x, 1.2, pan.z + 0.4, 8); ui.toast(`${img(b.id)}${word} <span class="st">${stars(q)}</span>`, cls); if (S.tut === 3) S.tut = 4;
}
function refreshWood() { W.woodLogs.forEach((l, i) => l.visible = i < Math.min(12, S.wood)); }
function takeWood() { if (R.carry) return ui.toast('Tienes las manos ocupadas'), sfx('no'); if (S.wood <= 0) return ui.toast('No queda leña. Parte troncos en el tocón de al lado.'), sfx('no'); S.wood--; refreshWood(); setCarry({ stage: 'wood' }); sfx('pick'); pan.pop(3); }
function chop() {
  if (R.carry) return ui.toast('Suelta primero lo que llevas'), sfx('no');
  W.stumpLog.visible = true; R.chop++; pan.act('give'); cam.shake = 0.3; sfx('place'); burst('crumb', 9.6, 0.9, -2.3, 6); W.axe.rotation.z = 0.5; W.axe.userData.t = 0.25;
  if (R.chop >= 3) { R.chop = 0; W.stumpLog.visible = false; S.wood += 2; refreshWood(); sfx('good'); ui.float('+2 leña', 9.6, 1.6, -2.3, 'star'); burst('dust', 9.6, 0.6, -2.3, 8); save(); }
}
function useCart() {
  const c = R.carry; if (c && c.stage === 'wood') return ui.toast('La leña va a la boca del horno'), sfx('no');
  if (c) { const i = R.cart.findIndex(x => !x); if (i < 0) return ui.toast('El carro está lleno'), sfx('no'); R.cart[i] = c; W.cartSlots[i].holder.clear(); W.cartSlots[i].holder.add(makeTray(c.id, c.n, c.stage, c.burnt ? 1 : c.tone || 0)); setCarry(null); sfx('place'); pan.act('give'); return; }
  let i = -1; R.cart.forEach((x, k) => { if (x) i = k; }); if (i < 0) return ui.toast('El carro está vacío. Aquí puedes dejar cualquier bandeja.'), sfx('no');
  const b = R.cart[i]; R.cart[i] = null; W.cartSlots[i].holder.clear(); setCarry(b); sfx('pick'); pan.pop(3);
}
function placeBread() {
  const c = R.carry; (R.shelf[c.id] ||= []).push(...Array.from({ length: c.n }, () => ({ q: c.q, burnt: c.burnt })));
  const m0 = mastery(c.id); S.baked[c.id] = (S.baked[c.id] || 0) + c.n; if (mastery(c.id) > m0) setTimeout(() => { sfx('fanfare'); ui.toast(`${img(c.id)}Maestría ${'★'.repeat(mastery(c.id))} en ${BREADS[c.id].n.toLowerCase()}: +1 ${coin} por pieza`, 'gold'); }, 900); R.shelf[c.id].sort((a, b) => a.q - b.q); setCarry(null); refreshBaskets(); sfx('place'); sfx('pop'); pan.act('give');
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
  let ch, walking = false; if (sp.nb) { ch = nbChar[sp.nb] ||= makeChar(NEIGH[sp.nb].look); if (R.cust.some(c => c.ch === ch)) return; const si = R.stroll.findIndex(x => x.nb === sp.nb); if (si >= 0) { R.stroll.splice(si, 1); walking = true; } } else ch = makeChar(randomLook(sp.seed));
  const side = Math.random() < 0.5 ? -1 : 1; if (!walking) { ch.x = side * 19.5; ch.z = 4.2 + Math.random() * 0.6; } ch.sit = false; ch.action = null; scene.add(ch.root);
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
function emote(pos, sym, ms = 1400) { const e = ui.anchor('bub emo', sym, pos); setTimeout(() => ui.unanchor(e), ms); }
function leave(c) {
  c.ch.lookAt = null;
  ui.unanchor(c.bub); c.bub = null; if (c.slot >= 0) { R.slots[c.slot] = null; c.slot = -1; } const wi = R.waits.indexOf(c); if (wi >= 0) R.waits[wi] = null;
  const seat = c.bought && S.up.terraza && Math.random() < 0.5 ? W.seats.find(s => !s.used) : null;
  if (seat) { seat.used = c; c.seat = seat; c.st = 'toSeat'; c.path = [[-4.6, 1.3], [1, 3.6], [seat.x - Math.sign(seat.x - 11) * 0.0, seat.z + 0.7]]; }
  else { c.st = 'leave'; c.path = [[-4.6, 1.3], [-4.6 - c.side, 4.2], [-c.side * 20, 4.4 + Math.random() * 0.5]]; }
}
const WAIT_SPOTS = [[-5.9, 1.7], [-3.3, 1.9], [-2.0, 2.5], [-6.8, 2.6], [-0.7, 1.8], [0.6, 2.6]];
function updateCustomers(dt) {
  // llegadas
  if (R.brb && !miga) { for (const sp of R.spawns) if (sp.t <= R.time + 2) sp.t = R.time + 3; }
  while (R.spawns.length && R.spawns[0].t <= R.time) spawn(R.spawns.shift());
  // vecinos de paseo y Pipa
  for (const st of R.stroll) { st.t -= dt; st.pos[0] = st.ch.x; st.pos[1] = 2.1; st.pos[2] = st.ch.z; if (st.to) { if (walk(st, st.to[0], st.to[1], dt, 1.3)) { st.to = null; st.t = 7 + Math.random() * 9; st.ch.yawTo = Math.random() * 1.2 - 0.6; } } else if (st.t < 0 && !ui.dialogOpen) { const p = pick(st.hang); st.to = [p[0] + Math.random() - 0.5, p[1] + Math.random() - 0.5]; } else if (Math.hypot(pan.x - st.ch.x, pan.z - st.ch.z) < 2.6) { st.ch.lookAt = pan; if (!st.hi && !R.chatted[st.nb]) { st.hi = true; emote(st.pos, '♪'); st.ch.act('wave'); } } else st.ch.lookAt = null; updateChar(st.ch, dt); }
  if (R.pipa) { if (R.time > 14 * 60 && !ui.modalOpen) { R.pipa = false; scene.remove(pipa.root); burst('dust', pipa.x, 0.5, pipa.z, 8); } else { pipa.lookAt = Math.hypot(pan.x - pipa.x, pan.z - pipa.z) < 4 ? pan : null; updateChar(pipa, dt); } }
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
      const p = W.slots[c.slot]; if (walk(c, p.x, p.z, dt)) { c.st = 'wait'; ch.yawTo = Math.PI / 2 - 0.55; ch.lookAt = pan; showWant(c); ch.pop(3); sfx('pop'); if (!R.firstCust) { R.firstCust = true; } }
    } else if (c.st === 'wait') {
      if (!R.brb) c.wait += dt; ch.speed = 0;
      if (c.bub) { const f = 1 - c.wait / c.max, b = c.bub.querySelector('.wait i'); b.style.width = (f * 100) + '%'; b.style.background = f > 0.5 ? '#7cc47a' : f > 0.22 ? '#f2b84b' : '#e9785e'; }
      if (c.wait > c.max * 0.66 && !c.sighed) { c.sighed = true; emote(c.pos, '…'); ch.say('sad', 1.5); }
      if (c.wait > c.max && !ui.dialogOpen) { say(c, 'Uy, se me hace tarde. ¡Vuelvo otro día!'); R.today.lost++; leave(c); ch.act('sad'); }
    } else if (c.st === 'served') { if (c.t > 1.1 && !ui.dialogOpen) leave(c); }
    else if (c.st === 'sit') { if (Math.sin(c.t * 2) > 0.95 && Math.random() < 0.1) burst('crumb', ch.x, 1.0, ch.z, 2); if (c.t > 16) { ch.sit = false; c.seat.used = null; c.st = 'leave'; c.path = [[ch.x, ch.z + 1.2], [c.side * -20, 4.4]]; } }
    updateChar(ch, dt);
  }
  // Miga despacha sola
  if (miga) {
    R.migaT -= dt; const tgt = mode === 'play' && R.slots.find(c => c && c.st === 'wait' && c.wait > 3 && !(c.nb && (!S.met[c.nb] || (hearts(c.nb) >= 2 && !S.gave[c.nb]))) && (R.shelf[c.want]?.length));
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
  const tip = (c.wait < 22 ? Math.round(price * 0.12) : 0) + (loaf.q === 3 ? Math.round(price * 0.12) : 0) + (S.up.jardin && Math.random() < 0.3 ? 1 : 0) + (Math.random() < comfort() * 0.12 ? 1 : 0);
  S.money += price + tip; S.total.sold++; S.total.earned += price + tip; R.today.sold++; R.today.income += price; R.today.tips += tip; R.today.by[id] = (R.today.by[id] || 0) + 1;
  const fav = N && N.favs.includes(id);
  addRep(loaf.burnt ? 0 : loaf.q + (fav ? 2 : 0) + (lv === 0 ? 1 : 0) + (hot ? 1 : 0));
  const ch = c.ch; c.bought = true; c.st = 'served'; c.t = 0; ui.unanchor(c.bub); c.bub = null;
  if (!byMiga) { pan.act('give'); pan.say('happy', 1.2); }
  ch.act(loaf.q === 3 || fav ? 'joy' : 'nod'); ch.say(loaf.q === 3 ? 'wow' : 'happy', 1.6); sfx('coin'); if (fav && !N) emote(c.pos, '♪'); else if (loaf.q === 3) emote(c.pos, '★');
  burst('spark', W.register[0], W.register[1], c.ch.z, 8); ui.setMoney(S.money, true);
  ui.float(`+${price}${tip ? ` <small>+${tip}</small>` : ''}`, -1.9, 1.9, ch.z, ''); if (loaf.q === 3) burst('crumb', ch.x, 1.3, ch.z, 6);
  // se lo lleva en su bolsa de papel; las piezas largas asoman por arriba
  const bag = new THREE.Group(), long = ['barra', 'semillas', 'nueces', 'chapata'].includes(id);
  const bm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.13), bagMat()); bm.castShadow = true; bm.frustumCulled = false; bag.add(bm);
  if (long) { const b = makeBread(id, loaf.burnt ? 1 : 0); b.scale.setScalar(0.42); b.rotation.z = Math.PI / 2 - 0.15; b.position.set(0.01, 0.14, 0); bag.add(b); }
  bag.userData.bag = true; bag.position.set(0, -0.44, 0.06); ch.arms[1].add(bag); c.loaf = bag;
  if (N) {
    const h0 = hearts(c.nb); S.pts[c.nb] = (S.pts[c.nb] || 0) + 1 + (fav ? 1 : 0) + (loaf.q === 3 ? 1 : 0);
    if (hearts(c.nb) > h0) { sfx('heart'); ui.float('♥', ch.x, 2.3, ch.z, 'heart'); }
    say(c, N.gracias[Math.floor(Math.random() * N.gracias.length)], 1900);
    if (hearts(c.nb) >= 2 && !S.gave[c.nb]) { S.gave[c.nb] = true; c.t = -1.2; setTimeout(() => talk(c, N.receta, () => unlock(N.gives, N.n)), 1500); }
  } else if (Math.random() < 0.6) say(c, VISIT_LINES[Math.floor(Math.random() * VISIT_LINES.length)], 1600);
  if (S.tut === 5) S.tut = 6;
  save();
}
let _bag; function bagMat() { if (!_bag) { _bag = pan.legs[0].children[0].material.clone(); _bag.onBeforeCompile = pan.legs[0].children[0].material.onBeforeCompile; _bag.customProgramCacheKey = pan.legs[0].children[0].material.customProgramCacheKey; _bag.color.set('#d9b98a'); _bag.map = null; } return _bag; }
function talk(c, lines, done) {
  const N = NEIGH[c.nb]; cam.zoomTo = 0.5; c.ch.say('happy', 1);
  ui.dialog(N.n, lines, { face: XI.face[c.nb], onChar: (k) => { if (k % 2) blip(N.pitch); }, onLine: (i) => { c.ch.talking = i >= 0; if (i >= 0) sfx('pop'); }, onDone: () => { cam.zoomTo = 0.72; c.ch.talking = false; done?.(); } });
}
function unlock(id, from) {
  if (S.recipes.includes(id)) return; S.recipes.push(id); sfx('fanfare'); pan.act('joy'); pan.say('wow', 2); burst('confetti', pan.x, 2, pan.z, 50); save();
  const sh = ui.modal(`<div class="rays"></div><div class="card"><div class="who">${from ? 'Una ficha de la abuela, de parte de ' + from : 'La última ficha de la abuela Hogaza'}</div><h2>${BREADS[id].n}</h2><img class="b" src="${ICON[id]}" alt=""><p>${BREADS[id].d}</p><div class="ings">${Object.entries(BREADS[id].ing).map(([k, n]) => ingChip(k, n, 99)).join('')}</div><button class="btn main">¡A hornearlo!</button></div>`, 'unlock');
  sh.querySelector('.btn').onclick = () => ui.closeModal(); ui.onKey = (k) => { if (k === 'e' || k === 'enter' || k === ' ') ui.closeModal(); };
}
function roscaLetter() {
  if (S.roscaLetter || ui.modalOpen || ui.dialogOpen) return; S.roscaLetter = true; sfx('page');
  letter(CARTA_ROSCA, 'Detrás del horno había una carta', () => unlock('rosca'));
}
function letter(lines, title, done) {
  const sh = ui.modal(`<h2>${title}</h2><div class="letter">${lines.map((l, i) => `<p style="animation-delay:${i * 0.9}s">${l}</p>`).join('')}</div><div class="row"><button class="btn main">Guardar la carta</button></div>`, 'lettersheet');
  ui.onClose = done; sh.querySelector('.btn').onclick = () => ui.closeModal(); ui.onKey = (k) => { if (k === 'e' || k === 'enter') ui.closeModal(); };
}

// ---------- el colmado de Pipa ----------
function openShop(disc = 1) {
  R.disc = disc; ui.onClose = () => { R.disc = 1; };
  const ids = SUP_ORDER.flatMap(k => SUP[k].ings), cart = {}; let sel = 0, paid = false;
  const rows = SUP_ORDER.map(k => SUP[k].ings.map(id => ids.indexOf(id)));
  const stampsHTML = (k, fresh = 0) => { const n = supStamps(k), l = supLvl(k); return Array.from({ length: 8 }, (_, i) => `<i class="${i < n ? 'on' : ''} ${i >= n - fresh && i < n ? 'new' : ''}"></i>`).join('') + `<em>${l ? `nivel ${l} · −${l * 4} %` : 'tarjeta de sellos'}</em>`; };
  const used = (id) => S.recipes.filter(r => BREADS[r].ing[id]).map(r => BREADS[r].n.toLowerCase());
  const prod = (id) => { const k = R.market[id]; return `<button class="prod ${used(id).length ? '' : 'off'}" data-id="${id}"><i class="cur"></i>${k <= 0.7 ? '<span class="ribbon">OFERTA</span>' : k >= 1.35 ? '<span class="ribbon up">CARO</span>' : ''}<span class="minus">−</span><span class="qty"></span><img class="pi" src="${XI.ing[id]}" alt=""><span class="havej">tienes <b>${S.ing[id] || 0}</b></span><span class="ptag ${k <= 0.7 ? 'down' : k >= 1.35 ? 'up' : ''}">${ingPrice(id)} ${coin}</span><span class="pn">${ING[id].n}</span></button>`; };
  const sh = ui.modal(`<button class="x">✕</button><div class="awning"><span>${disc < 1 ? 'El carro de Pipa · precio de amiga' : 'El colmado de Pipa · pedido'}</span></div><div class="shop-in">
    <div class="keeper"><div class="kwin"><div class="pic">${face('pipa')}</div><div class="ksay"><b>Pipa</b><span></span></div></div>
      <div class="ticket"><div class="tk-h">· PEDIDO ·<small>día ${S.day} · se sube al obrador</small></div><div class="tk-lines"></div><div class="tk-tot"><span>TOTAL</span><span class="t"></span></div><div class="tk-purse"><span>en el monedero</span><span class="p"></span></div><button class="btn main" id="pay">Pagar</button></div></div>
    <div class="shelves">${SUP_ORDER.map(k => `<div class="suprow" data-sup="${k}"><span class="pic">${face(SUP[k].face)}</span><span><b>${SUP[k].n}</b> · ${SUP[k].d.toLowerCase()}</span><span class="stamps"></span></div><div class="plank">${SUP[k].ings.map(prod).join('')}</div>`).join('')}</div></div>
    <div class="hint-keys"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> mirar</span><span><kbd>E</kbd> añadir</span><span><kbd>Q</kbd> quitar</span><span><kbd>↵</kbd> pagar</span><span><kbd>Esc</kbd> salir</span></div>`, 'shop');
  sh.querySelectorAll('.suprow').forEach(e => e.querySelector('.stamps').innerHTML = stampsHTML(e.dataset.sup));
  const els = [...sh.querySelectorAll('.prod')], pic = sh.querySelector('.kwin .pic'), sayEl = sh.querySelector('.ksay'), sayT = sayEl.querySelector('span');
  const total = () => ids.reduce((a, id) => a + (cart[id] || 0) * ingPrice(id), 0);
  const says = (t, ex = 'talk') => { sayT.textContent = t; sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop'); pic.innerHTML = face('pipa', ex); pic.classList.remove('hop'); void pic.offsetWidth; pic.classList.add('hop'); blip(1.7); clearTimeout(says.t); says.t = setTimeout(() => { if (pic.isConnected) pic.innerHTML = face('pipa', ex === 'happy' ? 'happy' : 'idle'); }, 700); };
  const draw = () => {
    els.forEach((e, i) => { const id = e.dataset.id, n = cart[id] || 0; e.classList.toggle('sel', i === sel); e.classList.toggle('has', n > 0); e.querySelector('.qty').textContent = n ? '×' + n : ''; });
    const lines = ids.filter(id => cart[id]).map(id => `<div class="tk-l"><span>${cart[id]} × ${ING[id].n.toLowerCase()}</span><span>${cart[id] * ingPrice(id)}</span></div>`).join('');
    sh.querySelector('.tk-lines').innerHTML = lines || '<div class="tk-empty">Toca lo que necesites y lo voy apuntando.</div>';
    const t = total(); sh.querySelector('.tk-tot .t').innerHTML = t + ' ' + coin; sh.querySelector('.tk-purse .p').innerHTML = `${S.money} → ${S.money - t}`; sh.querySelector('#pay').disabled = !t;
  };
  const look = (i, quiet) => { sel = i; draw(); if (quiet) return; const id = ids[i], u = used(id), k = R.market[id]; sfx('tick'); says((k <= 0.7 ? '¡Hoy de oferta! ' : k >= 1.35 ? 'Hoy viene cara, te aviso. ' : '') + ING[id].d + (u.length ? ` Va en: ${u.slice(0, 3).join(', ')}${u.length > 3 ? '…' : ''}.` : ' Aún no tienes receta que la lleve.'), 'talk'); };
  const add = (i, n) => {
    if (paid) return; const id = ids[i]; sel = i;
    if (n > 0 && total() + ingPrice(id) > S.money) { sfx('no'); says(pick(PIPA.caro), 'idle'); return draw(); }
    if (n < 0 && !cart[id]) return; cart[id] = (cart[id] || 0) + n; draw();
    const e = els[i]; e.classList.remove('add'); void e.offsetWidth; e.classList.add('add');
    if (n > 0) { sfxPitch(cart[id]); if (cart[id] === 1 || Math.random() < 0.3) says(pick(PIPA.mas), 'happy'); } else { sfx('page'); says(pick(PIPA.menos), 'idle'); }
  };
  const pay = () => {
    const t = total(); if (paid) return; if (!t) { sfx('no'); return says(PIPA.vacio[0], 'idle'); }
    paid = true; S.money -= t; R.today.spent += t; for (const id of ids) if (cart[id]) S.ing[id] = (S.ing[id] || 0) + cart[id];
    for (const k of SUP_ORDER) { const sp = SUP[k].ings.reduce((a, id) => a + (cart[id] || 0) * ingPrice(id), 0); if (!sp) continue; const l0 = supLvl(k), n0 = supStamps(k); S.sup[k] = (S.sup[k] || 0) + sp; const row = sh.querySelector(`.suprow[data-sup="${k}"] .stamps`); row.innerHTML = stampsHTML(k, supLvl(k) > l0 ? 8 : supStamps(k) - n0); if (supLvl(k) > l0) { const g = pick(SUP[k].ings); S.ing[g] = (S.ing[g] || 0) + 3; setTimeout(() => { sfx('fanfare'); ui.toast(`${face(SUP[k].face)} ${SUP[k].n}: tarjeta completa. Nivel ${supLvl(k)}, −${supLvl(k) * 4} % y 3 de ${ING[g].n.toLowerCase()} de regalo`, 'gold'); }, 1500); } }
    ui.setMoney(S.money, true); sfx('stamp'); setTimeout(() => sfx('coin'), 180); says(pick(PIPA.paga), 'happy'); if (S.tut === 6) S.tut = 7; save();
    const st = document.createElement('div'); st.className = 'stamp'; st.textContent = 'PAGADO'; sh.querySelector('.ticket').append(st);
    els.forEach(e => { if (cart[e.dataset.id]) e.querySelector('.havej b').textContent = S.ing[e.dataset.id]; });
    setTimeout(() => { if (!ui.modalOpen) return; ui.closeModal(); const d = W.st.despensa; burst('spark', d.ox, 1.6, d.oz, 14); burst('flour', d.ox - 0.3, 1.2, d.oz, 8); pan.act('joy'); let k = 0; for (const id of ids) if (cart[id]) setTimeout(() => ui.float(`+${cart[id]} ${ING[id].n.toLowerCase()}`, d.ox - 0.4, 2.2, d.oz, 'star'), 260 * k++); }, 1150);
  };
  els.forEach((e, i) => { e.onclick = (ev) => { if (ev.target.classList.contains('minus')) add(i, -1); else add(i, ev.shiftKey ? 5 : 1); }; e.oncontextmenu = (ev) => { ev.preventDefault(); add(i, -1); }; e.onmouseenter = () => { if (sel !== i) look(i); }; });
  sh.querySelector('#pay').onclick = pay; sh.querySelector('.x').onclick = () => ui.closeModal();
  ui.onKey = (k) => { const r = rows.findIndex(a => a.includes(sel)), c = rows[r].indexOf(sel), vr = (d) => { const nr = rows[Math.max(0, Math.min(rows.length - 1, r + d))]; return nr[Math.min(nr.length - 1, c)]; }; if (k === 'arrowright' || k === 'd') look(Math.min(ids.length - 1, sel + 1)); else if (k === 'arrowleft' || k === 'a') look(Math.max(0, sel - 1)); else if (k === 'arrowdown' || k === 's') look(vr(1)); else if (k === 'arrowup' || k === 'w') look(vr(-1)); else if (k === 'e' || k === ' ') add(sel, 1); else if (k === 'q' || k === 'backspace') add(sel, -1); else if (k === 'enter') pay(); };
  look(0, true); sfx('bell');
  const off = ids.find(id => R.market[id] <= 0.7);
  says(disc < 1 ? 'En persona te quito un pellizco, que para eso vienes a verme.' : !S.metPipa ? PIPA.hola[0] + ' Por las mañanas estoy con el carro en la plaza y allí sale más barato.' : off ? `Hoy tengo ${ING[off].n.toLowerCase()} de oferta. ${pick(PIPA.abre)}` : pick(PIPA.abre), 'happy'); S.metPipa = true;
}
function sfxPitch(n) { sfx(n % 5 === 0 ? 'good' : 'buy'); }

// ---------- la libreta de anillas ----------
let bookTab = 'recetas'; const bookSel = {};
const EMO = { oveja: 'lana', tejon: 'tejo' };
function openBook(tab, keep) {
  if (tab) bookTab = tab; if (!keep) sfx('page');
  const L = lvl(), canUp = UPG_ORDER.some(id => !S.up[id] && !S.build.includes(id) && (UPG[id].lvl || 0) <= L && S.money >= UPG[id].p);
  const tabs = [['recetas', 'Recetas'], ['vecinos', 'Vecinos'], ['obras', 'Obras' + (canUp ? '<i class="dot"></i>' : '')]];
  let left = '', list = [];
  if (bookTab === 'recetas') {
    list = BREAD_ORDER; left = `<h2>Recetas</h2><div class="sub">${S.recipes.length} de ${BREAD_ORDER.length}. Las que faltan las guarda el pueblo.</div><div class="thumbs scroll">` + list.map(id => { const k = S.recipes.includes(id); return `<button class="th ${k ? '' : 'unk'}" data-id="${id}"><span class="stk"><img src="${ICON[id]}" alt=""></span>${k && R.shelf[id]?.length ? `<span class="mini">${R.shelf[id].length}</span>` : ''}</button>`; }).join('') + '</div>';
  } else if (bookTab === 'vecinos') {
    list = NEIGH_ORDER; left = `<h2>Vecinos</h2><div class="sub">Su pan favorito, bien hecho. Con dos corazones te devuelven una receta.</div><div class="thumbs c3 scroll" style="grid-template-columns:repeat(4,1fr)">` + list.map(id => { const k = S.met[id]; return `<button class="th photo ${k ? '' : 'unk'}" data-id="${id}"><span class="stk"><img src="${XI.face[id].idle}" alt=""></span><span class="cap">${k ? NEIGH[id].n : '???'}</span>${k ? `<span class="mini red">♥${hearts(id)}</span>` : ''}</button>`; }).join('') + '</div>';
  } else {
    list = UPG_ORDER; left = `<h2>Obras</h2><div class="sub">Lo que ganas vuelve al obrador y a la plaza. La cuadrilla trabaja de noche.</div><div class="thumbs scroll">` + CAPS.map((c, ci) => `<div class="chap">${c}</div>` + list.filter(id => UPG[id].cap === ci).map(id => { const u = UPG[id], lock = (u.lvl || 0) > L; return `<button class="th ${lock ? 'unk' : ''}" data-id="${id}"><span class="stk"><img src="${XI.up[id]}" alt=""></span>${S.up[id] ? '<span class="mini">✓</span>' : S.build.includes(id) ? '<span class="mini gold">⚒</span>' : lock ? '' : `<span class="mini ${S.money >= u.p ? 'red' : 'grey'}">${u.p}</span>`}</button>`; }).join('')).join('') + '</div>';
  }
  if (!list.includes(bookSel[bookTab])) bookSel[bookTab] = bookTab === 'recetas' ? S.recipes[S.recipes.length - 1] : bookTab === 'vecinos' ? (list.find(id => S.met[id]) || list[0]) : (list.find(id => !S.up[id] && !S.build.includes(id) && (UPG[id].lvl || 0) <= L) || list[0]);
  const sh = ui.modal(`<div class="btabs">${tabs.map(([k, n]) => `<button class="btab ${k === bookTab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div><button class="x">✕</button>
    <div class="bpage l">${left}<div class="bfoot"><button class="doorsign">Cerrar por hoy</button><span class="grow">${shelfCount() ? `Quedan ${shelfCount()} panes en el mostrador.` : 'El mostrador está vacío.'}</span></div></div><div class="rings"></div><div class="bpage r"></div>
    <div class="hint-keys" style="position:absolute;left:0;right:0;bottom:-46px"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> elegir</span><span><kbd>Tab</kbd> pestaña</span><span><kbd>E</kbd> ${bookTab === 'obras' ? 'encargar' : bookTab === 'recetas' ? 'cambiar precio' : 'mirar'}</span><span><kbd>L</kbd> cerrar</span></div>`, 'book');
  if (keep) sh.style.animation = 'none';
  const right = sh.querySelector('.bpage.r'), ths = [...sh.querySelectorAll('.th')];
  const detail = (turn) => {
    const id = bookSel[bookTab]; ths.forEach(t => t.classList.toggle('sel', t.dataset.id === id)); let h = '';
    if (bookTab === 'recetas') {
      const b = BREADS[id], giver = NEIGH_ORDER.find(n => NEIGH[n].gives === id);
      if (!S.recipes.includes(id)) h = `<div class="det"><div class="big"><div class="doily"><img src="${ICON[id]}" style="filter:brightness(0) opacity(.16)" alt=""></div><div><h3>¿¿¿???</h3><div class="ds">${id === 'rosca' ? 'La abuela la escondió bien. Aparecerá cuando el pueblo te haya devuelto todas las demás.' : giver && S.met[giver] && hearts(giver) >= 1 ? `A ${NEIGH[giver].n} se le ilumina la cara cuando habla de este pan…` : 'Alguien del pueblo se acuerda de este pan. Habrá que ganarse su cariño.'}</div></div></div></div>`;
      else { const lv = S.prices[id] ?? 1; h = `<div class="det"><div class="big"><div class="doily"><img src="${ICON[id]}" alt=""></div><div><h3>${b.n}</h3><div class="ds">${b.d}</div></div></div>
        <div class="lbl">Para una hornada de ${batchN()}</div><div class="ings">${Object.entries(b.ing).map(([k, n]) => ingChip(k, n, S.ing[k] || 0)).join('')}</div>
        <div class="lbl">La etiqueta del precio</div><div class="tags3">${PRICE_LV.map((p, i) => `<button class="ptg ${i === lv ? 'on' : ''}" data-lv="${i}"><b>${p.n}</b><span>${Math.max(1, Math.round(b.price * p.k))} ${coin}</span><small>${['el pueblo te quiere antes', 'lo de siempre', 'solo cuela con ★★★'][i]}</small></button>`).join('')}</div>
        <div class="from">${giver ? `<span class="pic">${face(giver, 'happy')}</span><span>Ficha que guardaba <b>${NEIGH[giver].n}</b></span>` : `<span class="pic">${face('pan', 'happy')}</span><span>De las que la abuela te enseñó de niña</span>`}<span style="margin-left:auto">Horneados: <b>${S.baked[id] || 0}</b> · maestría <b style="color:#d9861c">${'★'.repeat(mastery(id))}${'☆'.repeat(3 - mastery(id))}</b></span></div></div>`; }
    } else if (bookTab === 'vecinos') {
      const N = NEIGH[id], hh = hearts(id), p = S.pts[id] || 0, nx = HEART_AT[hh + 1];
      if (!S.met[id]) h = `<div class="det"><div class="big"><div class="polaroid"><img src="${XI.face[id].idle}" style="filter:brightness(0) opacity(.18)" alt=""><div class="cap">???</div></div><div><h3>Alguien por conocer</h3><div class="ds">${N.lvl > L ? `Vendrá cuando el obrador tenga más fama: «${REP[N.lvl].n}».` : 'Aún no ha pasado por el mostrador. Atiéndele tú en persona.'}</div></div></div></div>`;
      else h = `<div class="det"><div class="big"><div class="polaroid"><img src="${XI.face[id].happy}" alt=""><div class="cap">${N.n}</div></div><div><div class="hearts">${'♥'.repeat(hh)}<i>${'♥'.repeat(5 - hh)}</i></div>${nx ? `<div class="minibar"><i style="width:${Math.round((p - HEART_AT[hh]) / (nx - HEART_AT[hh]) * 100)}%"></i></div>` : ''}<div class="quote">«${N.hola[1]}»</div></div></div>
        <div class="lbl">Se le van los ojos con</div><div class="likes">${N.favs.map(f => `<span class="lk ${S.recipes.includes(f) ? '' : 'unk'}" title="${S.recipes.includes(f) ? BREADS[f].n : '???'}"><img src="${ICON[f]}" alt=""></span>`).join('')}</div>
        <div class="from"><span class="pic"><img src="${ICON[N.gives]}" style="width:100%;height:100%;margin:0;${S.gave[id] ? '' : 'filter:brightness(0) opacity(.2)'}" alt=""></span><span>${S.gave[id] ? `Te devolvió la ficha de <b>${BREADS[N.gives].n.toLowerCase()}</b>` : 'Guarda una ficha de la abuela. Dos corazones y es tuya.'}</span></div></div>`;
    } else {
      const u = UPG[id], lock = (u.lvl || 0) > L, own = S.up[id], wip = S.build.includes(id);
      h = `<div class="det"><div class="big"><div class="blue"><img src="${XI.up[id]}" alt=""></div><div><h3>${lock ? 'Obra por descubrir' : u.n}</h3><div class="ds">${lock ? `La cuadrilla no se fía todavía. Hace falta más fama: nivel ${u.lvl + 1}, «${REP[u.lvl].n}».` : u.d}</div></div></div>
        <div class="lbl">${CAPS[u.cap]}</div><div style="display:flex;align-items:center;gap:16px;min-height:64px">${own ? '<span class="sealed">HECHO</span>' : wip ? '<span class="sealed wip">EN OBRAS</span><span class="ds" style="font:700 16px var(--hand);color:var(--soft)">Estará mañana al abrir.</span>' : lock ? `<span class="sealed lock">NIVEL ${u.lvl + 1}</span>` : `<button class="btn ${S.money >= u.p ? 'main' : ''}" id="order" ${S.money < u.p ? 'disabled' : ''}>Encargar · ${u.p} ${coin}</button><span class="ds" style="font:700 16px var(--hand);color:var(--soft)">${S.money >= u.p ? 'La cuadrilla viene esta noche.' : `Te faltan ${u.p - S.money}.`}</span>`}</div>
        <div class="from"><span>Obras hechas: <b>${UPG_ORDER.filter(x => S.up[x]).length} de ${UPG_ORDER.length}</b></span><span style="margin-left:auto">En el monedero: <b>${S.money}</b> ${coin}</span></div></div>`;
    }
    right.innerHTML = h; if (turn) { right.classList.remove('turn'); void right.offsetWidth; right.classList.add('turn'); }
    right.querySelectorAll('.ptg').forEach(b => b.onclick = () => { S.prices[id] = Number(b.dataset.lv); sfx('stamp'); save(); detail(); });
    const ob = right.querySelector('#order'); if (ob) ob.onclick = () => orderWork(id);
  };
  const choose = (id) => { if (bookSel[bookTab] === id) return; bookSel[bookTab] = id; sfx('tick'); detail(true); };
  ths.forEach(t => { t.onclick = () => choose(t.dataset.id); });
  sh.querySelectorAll('.btab').forEach(b => b.onclick = () => openBook(b.dataset.tab, true));
  sh.querySelector('.x').onclick = () => ui.closeModal(); sh.querySelector('.doorsign').onclick = () => { ui.closeModal(); endDay(); };
  const cols = 4;
  ui.onKey = (k) => {
    const i = list.indexOf(bookSel[bookTab]), ord = tabs.map(t => t[0]);
    if (k === 'arrowright' || k === 'd') choose(list[Math.min(list.length - 1, i + 1)]); else if (k === 'arrowleft' || k === 'a') choose(list[Math.max(0, i - 1)]);
    else if (k === 'arrowdown' || k === 's') choose(list[Math.min(list.length - 1, i + cols)]); else if (k === 'arrowup' || k === 'w') choose(list[Math.max(0, i - cols)]);
    else if (k === 'tab') openBook(ord[(ord.indexOf(bookTab) + 1) % ord.length], true); else if (k === 'l') ui.closeModal();
    else if (k === 'e' || k === 'enter') { if (bookTab === 'obras') right.querySelector('#order')?.click(); else if (bookTab === 'recetas' && S.recipes.includes(bookSel.recetas)) { S.prices[bookSel.recetas] = ((S.prices[bookSel.recetas] ?? 1) + 1) % 3; sfx('stamp'); save(); detail(); } }
  };
  detail(!keep ? false : true);
}
function orderWork(id) {
  const u = UPG[id]; if (S.money < u.p || S.up[id] || S.build.includes(id)) return sfx('no');
  S.money -= u.p; R.today.spent += u.p; S.build.push(id); ui.setMoney(S.money, true); sfx('stamp'); setTimeout(() => sfx('coin'), 150); save();
  setWip(id, u.at, true); openBook('obras', true);
  ui.toast(`<img src="${XI.up[id]}" alt="">Encargado: ${u.n}. Mañana estará.`, 'gold'); pan.act('joy'); pan.say('happy', 2);
}
function applyUpgrades() {
  for (const id of UPG_ORDER) if (S.up[id]) setUpgrade(id, true);
  for (const id of S.build || []) setWip(id, UPG[id].at, true);
  if (S.up.miga && !miga) { miga = makeChar(MIGA_LOOK); miga.x = -1.0; miga.z = -3.85; miga.yaw = miga.yawTo = -Math.PI / 2 + 0.4; miga.root.position.y = 0.48; scene.add(miga.root); }
}
function updateReveal(dt) {
  const id = R.reveal[0], u = UPG[id]; R.revT += dt;
  if (R.revT - dt <= 0.9 && R.revT > 0.9) { sfx('fanfare'); burst('confetti', u.at[0], u.at[1] + 1, u.at[2], 70, { spread: 3 }); burst('spark', u.at[0], u.at[1], u.at[2], 24); ui.toast(`<img src="${XI.up[id]}" alt="">¡Obra terminada! ${u.n}`, 'gold'); if (id === 'miga' && miga) miga.act('wave'); }
  if (R.revT > 3.4 || (pressE && R.revT > 1.2)) { R.reveal.shift(); R.revT = 0; if (!R.reveal.length) mode = 'play'; }
  pressE = false;
}

// ---------- fin del día ----------
function endDay() {
  if (mode !== 'play' || R.ended) return; R.ended = true; mode = 'summary'; ui.prompt(null);
  // lo ya horneado que quedara en las manos o en el carro cuenta como pan del día
  for (const b of [R.carry, ...R.cart]) if (b && b.stage === 'baked') (R.shelf[b.id] ||= []).push(...Array.from({ length: b.n }, () => ({ q: b.q, burnt: b.burnt })));
  const lostDough = [R.carry, ...R.cart, ...R.ferm, ...R.oven].filter(b => b && b.stage !== 'baked' && b.stage !== 'wood').length; if (R.carry?.stage === 'wood') S.wood++;
  const left = shelfCount(), t = R.today, top = Object.entries(t.by).sort((a, b) => b[1] - a[1])[0];
  let stall = 0, gift = 0;
  if (S.up.puesto) { for (const [id, a] of Object.entries(R.shelf)) stall += a.length * Math.round(priceOf(id) * 0.5); S.money += stall; } else gift = Math.floor(left / 2);
  S.rep += gift; const net = t.income + t.tips + stall + (t.orders || 0) - t.spent; const inter = Math.min(30, Math.floor((S.lata || 0) * 0.04)); S.lata = (S.lata || 0) + inter;
  ui.fade(0.5); music('eve');
  setTimeout(() => {
    const rows = [['Panes vendidos', t.sold], ['Ventas', '+' + t.income], ['Propinas', '+' + t.tips]]; if (stall) rows.push(['Puesto de la plaza', '+' + stall]); rows.push(['Colmado, obras y casa', '−' + t.spent]); if (t.orders) rows.splice(3, 0, ['Encargos', '+' + t.orders]); if (inter) rows.push(['La lata de la abuela', '+' + inter + ' dentro']);
    let d = 0.5; const line = (a, b, cls = '') => `<div class="rl ${cls}" style="animation-delay:${(d += 0.32).toFixed(2)}s"><span>${a}</span><span>${b}</span></div>`;
    const note = `${t.lost ? `${t.lost} ${t.lost === 1 ? 'persona se fue' : 'personas se fueron'} sin pan. Mañana, más masa. ` : t.sold ? 'Nadie se fue con las manos vacías. ' : 'Hoy el mostrador ha estado tranquilo. '}${left ? (S.up.puesto ? `Los ${left} panes que sobraban se vendieron en el puesto.` : `Sobraron ${left}: los dejas en el banco de la plaza para quien los necesite${gift ? ` (+${gift} ♥)` : ''}.`) : ''}${lostDough ? ' La masa a medias no aguanta la noche; mañana será otra.' : ''}`;
    const sh = ui.modal(`<img class="logo-s" src="${logoURL()}" alt=""><div class="rh">CIERRE DE CAJA · DÍA ${S.day}${top ? `<br>lo más pedido: ${BREADS[top[0]].n.toLowerCase()}` : ''}</div>
      ${rows.map(r => line(r[0], r[1])).join('')}${line('BALANCE', (net >= 0 ? '+' : '−') + Math.abs(net) + ' ' + coin, 'tot')}${line('Cariño del pueblo', '+' + (t.rep + gift) + ' ♥')}
      <div class="rl note" style="animation-delay:${(d += 0.4).toFixed(2)}s">${note}</div><button class="btn main" style="animation-delay:${(d + 0.5).toFixed(2)}s">A dormir</button>`, 'receipt');
    for (let i = 0; i < rows.length + 2; i++) setTimeout(() => sfx('tick'), 820 + i * 320);
    setTimeout(() => { if (!sh.isConnected) return; sfx('stamp'); const st = document.createElement('div'); st.className = 'stamp'; st.textContent = net >= 0 ? 'BUEN DÍA' : 'CAJA CERRADA'; sh.append(st); }, 900 + (rows.length + 2) * 320);
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
  if (R.inHome) {
    const H = W.home.st, near = (k, d = 1.25) => Math.hypot(px - H[k][0], pz - H[k][1]) < d;
    if (near('cama')) return R.time < 12 * 60 ? { text: 'Tu cama. Aún es pronto para acostarse', ok: false, pos: [62.4, 1.9, -4.7], fn: () => sfx('no') } : { text: 'Acostarse y cerrar el día', pos: [62.4, 1.9, -4.7], fn: endDay };
    if (near('lata')) return { text: 'La lata de la abuela', pos: [56.9, 2.0, -5.4], fn: openLata };
    if (near('vitrina')) return { text: 'Vitrina y diario', pos: [59.4, 2.9, -5.8], fn: openVitrina };
    if (near('catalogo')) return { text: 'Hojear el catálogo de muebles', pos: [63.2, 1.6, -1.5], fn: openCatalog };
    if (near('salir', 1.1)) return { text: 'Salir a la calle', pos: [60, 1.2, -0.3], fn: () => goHome(false) };
    return null;
  }
  const ord = R.orders.find(o => !o.done && !o.late);
  if (ord && Math.hypot(px - W.boardPos[0], pz - W.boardPos[1]) < 1.9) { const have = R.shelf[ord.bread]?.length || 0; return have >= ord.n ? { text: `Entregar el encargo de ${NEIGH[ord.who].n}`, pos: [W.boardPos[0], 2.3, W.boardPos[1]], fn: () => deliver(ord) } : { text: `Encargo: ${have} de ${ord.n} ${BREADS[ord.bread].pl} en el mostrador`, ok: false, pos: [W.boardPos[0], 2.3, W.boardPos[1]], fn: () => sfx('no') }; }
  const behind = px > -1.5 && px < -0.35 && pz > -5.4 && pz < -0.4;
  if (behind && c && c.stage === 'baked') return { text: 'Dejar en el mostrador', pos: [-1.9, 1.75, pz], fn: placeBread };
  if (behind && !c) {
    let best = null, bd = 0.8; for (const cu of R.slots) if (cu && cu.st === 'wait') { const d = Math.abs(cu.ch.z - pz); if (d < bd) { bd = d; best = cu; } }
    if (best) { const has = R.shelf[best.want]?.length; return { text: has ? `Dar ${BREADS[best.want].n.toLowerCase()}` : (S.met[best.nb] || !best.nb ? `No queda ${BREADS[best.want].n.toLowerCase()}…` : 'Saludar'), pos: [-1.9, 1.75, best.ch.z], fn: () => serve(best), face: -Math.PI / 2 + 0.45, cust: best }; }
  }
  let bs = null, bd = 1.35; for (const [k, s] of Object.entries(W.st)) { if (k === 'mostrador') continue; const d = Math.hypot(px - s.x, pz - s.z); if (d < bd) { bd = d; bs = k; } }
  if (bs) {
    const s = W.st[bs], pos = [s.ox, bs === 'horno' ? 2.55 : bs === 'ferm' ? 3.05 : 1.9, s.oz + 0.4];
    if (bs === 'lena') return { text: c ? 'Leñera' : `Coger leña (${S.wood})`, ok: !c && S.wood > 0, pos: [8.0, 2.0, -2.9], fn: takeWood };
    if (bs === 'tocon') return { text: c ? 'Tocón' : `Partir leña ${'·'.repeat(R.chop)}`, ok: !c, pos: [9.6, 1.5, -2.3], fn: chop, st: s };
    if (bs === 'mesa') return { text: c ? 'Manos ocupadas: usa el carro' : 'Amasar', ok: !c, pos, fn: openRecipes, st: s };
    if (bs === 'despensa') return { text: 'Pedir al colmado', pos: [6.0, 2.2, -2.2], fn: openShop, st: s };
    if (bs === 'carro') { const any = R.cart.some(x => x); return { text: c ? 'Dejar la bandeja' : any ? 'Coger la bandeja' : 'Carro de bandejas', ok: !!c || any, pos: [5.9, 2.3, -0.45], fn: useCart, st: s }; }
    if (bs === 'ferm') { const rdy = R.ferm.some(x => x && x.t >= x.need); return { text: c?.stage === 'dough' ? 'Poner a fermentar' : rdy && !c ? 'Sacar la masa' : 'Fermentadora', ok: (c?.stage === 'dough') || (rdy && !c), pos, fn: useFerm, st: s }; }
    if (bs === 'horno') { const any = R.oven.some(x => x); if (c?.stage === 'wood') return { text: 'Echar leña', pos, fn: useOven, st: s }; return { text: c?.stage === 'proofed' ? 'Meter al horno' : any && !c ? 'Sacar del horno' : 'Horno', ok: (c?.stage === 'proofed') || (any && !c), pos, fn: useOven, st: s }; }
  }
  for (const st of R.stroll) if (!R.chatted[st.nb] && Math.hypot(px - st.ch.x, pz - st.ch.z) < 1.7) return { text: `Charlar con ${NEIGH[st.nb].n}`, pos: [st.ch.x, 2.3, st.ch.z], fn: () => chat(st), cust: st };
  if (R.pipa && Math.hypot(px - pipa.x, pz - pipa.z) < 1.9) return { text: 'Comprar a Pipa, precio de amiga', pos: [pipa.x, 2.2, pipa.z], fn: () => openShop(0.85) };
  for (const f of R.finds) if (Math.hypot(px - f.x, pz - f.z) < 1.2) return { text: 'Mirar qué brilla', pos: [f.x, 1.1, f.z], fn: () => find(f) };
  if (R.mail && Math.hypot(px - 7.9, pz - 1.5) < 1.6) return { text: 'Abrir el buzón', pos: [7.9, 1.9, 1.5], fn: openMail };
  if (Math.hypot(px - W.homeSpot[0], pz - W.homeSpot[1]) < 1.7) return { text: c ? 'Tu casa. Deja antes la bandeja' : 'Entrar en casa', ok: !c, pos: [12.6, 2.2, -5.3], fn: () => c ? sfx('no') : goHome(true) };
  if (Math.hypot(px + 8.2, pz - 1.5) < 1.5) return { text: R.brb ? 'Quitar el «Vuelvo enseguida»' : 'Colgar el «Vuelvo enseguida»', pos: [-7.6, 2.6, 1.5], fn: toggleBrb };
  if (Math.hypot(px - W.pondPos[0], pz - W.pondPos[1]) < 3.6 && !c) return { text: 'Saludar a los patos', pos: [W.pondPos[0], 1.2, W.pondPos[1]], fn: () => { pan.act('wave'); pan.yawTo = Math.atan2(W.pondPos[0] - px, W.pondPos[1] - pz); sfx('quack'); for (const d of W.ducks) d.a += 0.5; } };
  if (S.up.fuente && Math.hypot(px - W.fountainPos[0], pz - W.fountainPos[1]) < 2.6) return { text: 'Echar una miga a la fuente', pos: [W.fountainPos[0], 2.3, W.fountainPos[1]], fn: () => { pan.act('give'); sfx('pop'); burst('crumb', W.fountainPos[0], 1.2, W.fountainPos[1], 5); burst('spark', W.fountainPos[0], 1.5, W.fountainPos[1], 8); if (!R.wished) { R.wished = true; addRep(1); ui.toast('Dicen que da suerte.'); } } };
  return null;
}
function drawOrders() { $('#orders').innerHTML = R.orders.map(o => `<div class="ord ${o.done ? 'ok' : o.late ? 'late' : ''}"><span class="pic">${face(o.who)}</span>${o.n}×${img(o.bread)}<small>${o.done ? 'entregado' : 'antes de las ' + Math.floor(o.by) + ':' + (o.by % 1 ? '30' : '00')} · ${o.pay}</small><span class="coin sm"></span></div>`).join(''); }
function deliver(o) {
  R.shelf[o.bread].splice(-o.n, o.n); refreshBaskets(); o.done = true; S.money += o.pay; R.today.orders = (R.today.orders || 0) + o.pay; ui.setMoney(S.money, true); S.pts[o.who] = (S.pts[o.who] || 0) + 2; addRep(o.n + 2);
  sfx('stamp'); setTimeout(() => sfx('coin'), 160); pan.act('joy'); pan.say('happy', 2); burst('confetti', W.boardPos[0], 1.6, W.boardPos[1], 40); ui.float(`+${o.pay}`, W.boardPos[0], 2.2, W.boardPos[1]); ui.toast(`${face(o.who, 'happy')} Encargo entregado: ${NEIGH[o.who].n} pasará a recogerlo. +2 ♥`, 'gold'); drawOrders(); save();
}
function goHome(inside) {
  if (mode !== 'play') return; mode = 'move'; ui.prompt(null); ui.fade(1); sfx('whoosh');
  setTimeout(() => {
    R.inHome = inside;
    for (const id of MUE_ORDER) W.home.fur[id].visible = !!S.home[id];
    if (inside) { if (!R.brb && !miga) { toggleBrb(); R.autoBrb = true; } pan.x = 60; pan.z = -0.9; pan.yaw = pan.yawTo = Math.PI; cam.zoomTo = cam.zoom = 0.62; W.home.trophies.clear(); S.recipes.filter(id => mastery(id) > 0).slice(0, 9).forEach((id, i) => { const b = makeBread(id); b.scale.setScalar(0.6); b.position.set(-0.75 + (i % 3) * 0.75, 0.44 + Math.floor(i / 3) * 0.72, 0.05); b.rotation.y = i; W.home.trophies.add(b); }); }
    else { if (R.autoBrb && R.brb) toggleBrb(); R.autoBrb = false; pan.x = 12.2; pan.z = -4.6; pan.yaw = pan.yawTo = -1.2; cam.zoomTo = cam.zoom = 0.72; }
    frame.snap = true; mode = 'play'; ui.fade(0);
  }, 650);
}
function openLata() {
  sfx('page'); const draw = () => {
    const inter = Math.min(30, Math.floor((S.lata || 0) * 0.04));
    const sh = ui.modal(`<button class="x">✕</button><h2>La lata de la abuela</h2><div class="sub">Lo que guardes aquí crece un 4 % cada noche (hasta 30 por noche). No se toca para pagar: hay que sacarlo.</div>
      <div class="tinbox"><div class="tinbig"><b>${S.lata || 0} ${coin}</b></div><div style="flex:1"><div class="statg"><span>En el monedero</span><b>${S.money} ${coin}</b><span>Esta noche crecerá</span><b>+${inter} ${coin}</b></div>
      <div class="lbl">Guardar</div><div class="btnrow">${[10, 50, 'todo'].map(n => `<button class="btn sm" data-in="${n}" ${S.money < (n === 'todo' ? 1 : n) ? 'disabled' : ''}>${n === 'todo' ? 'Todo' : '+' + n}</button>`).join('')}</div>
      <div class="lbl">Sacar</div><div class="btnrow">${[10, 50, 'todo'].map(n => `<button class="btn sm" data-out="${n}" ${(S.lata || 0) < (n === 'todo' ? 1 : n) ? 'disabled' : ''}>${n === 'todo' ? 'Todo' : '−' + n}</button>`).join('')}</div></div></div>`, 'paper');
    sh.style.animation = draw.again ? 'none' : ''; draw.again = true; sh.querySelector('.x').onclick = () => ui.closeModal();
    const mv = (n, sign) => { const amt = n === 'todo' ? (sign > 0 ? S.money : S.lata) : Number(n); S.money -= sign * amt; S.lata = (S.lata || 0) + sign * amt; ui.setMoney(S.money, true); sfx('coin'); W.home.tin.scale.setScalar(1.2); setTimeout(() => W.home.tin.scale.setScalar(1), 150); save(); draw(); };
    sh.querySelectorAll('[data-in]').forEach(b => b.onclick = () => mv(b.dataset.in, 1)); sh.querySelectorAll('[data-out]').forEach(b => b.onclick = () => mv(b.dataset.out, -1));
  }; draw();
}
function openVitrina() {
  sfx('page'); const tot = Object.values(S.baked).reduce((a, b) => a + b, 0);
  const sh = ui.modal(`<button class="x">✕</button><h2>Vitrina y diario</h2><div class="sub">Cada pan que dominas se queda en la vitrina. Maestría: 16, 48 y 120 horneados.</div>
    <div class="troph">${BREAD_ORDER.map(id => { const k = S.recipes.includes(id), m = mastery(id); return `<div class="tr ${k ? '' : 'unk'}"><img src="${ICON[id]}" alt=""><div>${k ? BREADS[id].n : '???'}</div><div class="st">${'★'.repeat(m)}${'☆'.repeat(3 - m)}</div><div style="color:var(--soft)">${S.baked[id] || 0}</div></div>`; }).join('')}</div>
    <div class="lbl">El diario</div><div class="statg" style="grid-template-columns:1fr auto 1fr auto"><span>Días en Migas</span><b>${S.day}</b><span>Panes horneados</span><b>${tot}</b><span>Panes vendidos</span><b>${S.total.sold}</b><span>Monedas ganadas</span><b>${S.total.earned}</b><span>Fichas de la abuela</span><b>${S.recipes.length} de 10</b><span>Obras hechas</span><b>${UPG_ORDER.filter(x => S.up[x]).length} de 12</b><span>Renombre</span><b>${'★'.repeat(renown()) || '—'}</b><span>Comodidad de la casa</span><b>${comfort()} de 6</b></div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
}
function openCatalog(keep) {
  if (!keep) sfx('page');
  const sh = ui.modal(`<button class="x">✕</button><h2>Catálogo «Hogar, dulce horno»</h2><div class="sub">Cada mueble es un punto de comodidad: te levantas más ligera (andas un 3 % más rápido) y con mejor cara (un 4 % más de propinas). Llevas ${comfort()} de 6 · ${S.money} ${coin}</div>
    <div class="grid scroll">${MUE_ORDER.map(id => { const m = MUEBLES[id], own = S.home[id]; return `<div class="mue ${own ? 'own' : ''}"><img src="${XI.mue[id]}" alt=""><div class="nm">${m.n}</div><div class="ds">${m.d}</div>${own ? '<span class="sealed" style="font-size:15px">EN CASA</span>' : `<button class="btn sm ${S.money >= m.p ? 'main' : ''}" data-buy="${id}" ${S.money < m.p ? 'disabled' : ''}>${m.p} ${coin}</button>`}</div>`; }).join('')}</div>`, 'paper');
  if (keep) sh.style.animation = 'none'; sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const id = b.dataset.buy, m = MUEBLES[id]; if (S.money < m.p) return sfx('no'); S.money -= m.p; R.today.spent += m.p; S.home[id] = true; ui.setMoney(S.money, true); W.home.fur[id].visible = true; const wp = new THREE.Vector3(); W.home.fur[id].getWorldPosition(wp); sfx('stamp'); sfx('fanfare'); burst('confetti', wp.x, 1.6, wp.z, 50); burst('spark', wp.x, 1, wp.z, 16); save(); openCatalog(true); });
}
function toggleBrb() { R.brb = !R.brb; W.brb.visible = R.brb; $('#brb').classList.toggle('hide', !R.brb); sfx(R.brb ? 'place' : 'bell'); ui.toast(R.brb ? (miga ? 'Cartel puesto. Miga se queda al mando.' : 'Cartel puesto: nadie entra ni se impacienta. A pasear.') : 'Cartel fuera: ¡abierto otra vez!'); }
function chat(st) {
  const N = NEIGH[st.nb]; R.chatted[st.nb] = true; st.to = null; st.t = 6; pan.yawTo = Math.atan2(st.ch.x - pan.x, st.ch.z - pan.z);
  talk(st, [pick(N.charla)], () => { const h0 = hearts(st.nb); S.pts[st.nb] = (S.pts[st.nb] || 0) + 1; sfx('heart'); ui.float('♥', st.ch.x, 2.4, st.ch.z, 'heart'); st.ch.act('joy'); if (hearts(st.nb) >= 2 && !S.gave[st.nb]) { S.gave[st.nb] = true; setTimeout(() => talk(st, N.receta, () => unlock(N.gives, N.n)), 900); } save(); });
}
function find(f) {
  R.finds.splice(R.finds.indexOf(f), 1); W.findMesh[f.i].visible = false; sfx('perfect'); burst('spark', f.x, 0.6, f.z, 14); pan.act('joy');
  if (Math.random() < 0.5) { const n = 2 + Math.floor(Math.random() * 5); S.money += n; ui.setMoney(S.money, true); ui.float(`+${n}`, f.x, 1.4, f.z); ui.toast(`<span class="coin sm"></span> ${pick(HALLAZGO)}`); }
  else { const g = pick(['nueces', 'aceitunas', 'semillas', 'levadura']); S.ing[g] = (S.ing[g] || 0) + 1; ui.float(`+1 ${ING[g].n.toLowerCase()}`, f.x, 1.4, f.z, 'star'); ui.toast(`${iimg(g)}${pick(HALLAZGO)}`); }
  save();
}
function openMail() {
  const m = R.mail, N = NEIGH[m.from]; R.mail = null; sfx('page');
  letter([`Pan:`, m.text, m.gift.coins ? `(Dentro hay ${m.gift.coins} monedas envueltas en papel de periódico.)` : `(Dentro hay ${m.gift.n} de ${ING[m.gift.ing].n.toLowerCase()}.)`, `— ${N.n}`], 'Una carta en el buzón', () => { if (m.gift.coins) { S.money += m.gift.coins; ui.setMoney(S.money, true); sfx('coin'); } else { S.ing[m.gift.ing] = (S.ing[m.gift.ing] || 0) + m.gift.n; sfx('good'); ui.toast(`${iimg(m.gift.ing)}+${m.gift.n} ${ING[m.gift.ing].n.toLowerCase()}`, 'good'); } save(); });
}
function goalText() {
  if (R.fire < 0.3) return ['El fuego flojea: coge leña en la leñera (fuera, a la derecha del obrador) y échala al horno', XI.up.horno2];
  if (S.tut < 7) return [['Ve a la mesa y prepara tu primera masa', ICON._masa], ['Lleva la masa a la fermentadora (el armario verde)', XI.up.fermenta], ['Cuando suba, llévala al horno', XI.up.horno2], ['Sácala cuando el pan de la barra esté en el dorado', ICON.barra], ['Deja el pan en el mostrador, por detrás', XI.up.bandeja], ['Atiende desde detrás del mostrador a quien venga', XI.face.lana.happy], ['Pide harina y levadura en la despensa: el colmado de Pipa', XI.ing.levadura]][S.tut];
  if (S.fiesta) { const o = R.orders.find(x => !x.done && !x.late); return o ? [`Encargo de ${NEIGH[o.who].n}: ${o.n} ${BREADS[o.bread].pl}. Entrégalo en la pizarra`, ICON[o.bread]] : ['Migas ya tiene su Hornada. Sube tu renombre, llena la vitrina y la casa.', ICON.rosca]; }
  if (S.recipes.includes('rosca')) return [`Ten 8 roscas en el mostrador al atardecer (${R.shelf.rosca?.length || 0} de 8)`, ICON.rosca];
  const got = NEIGH_ORDER.filter(id => S.gave[id]).length;
  return [`Gánate a los vecinos: ${got} de 7 fichas de la abuela`, ICON.hogaza];
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
    const l = Math.hypot(mx, mz), sp = (R.carry ? 3.1 : 3.6) * (1 + comfort() * 0.03); const p = collide(pan.x + mx / l * sp * dt, pan.z + mz / l * sp * dt, 0.3, R.inHome);
    const moved = Math.hypot(p[0] - pan.x, p[1] - pan.z); pan.x = p[0]; pan.z = p[1]; pan.yawTo = Math.atan2(mx, mz); pan.speed = moved / dt > 0.4 ? sp : 0;
    if (pan.action === 'wave') pan.action = null;
    pan.stepT = (pan.stepT || 0) - dt; if (pan.stepT < 0 && pan.speed) { pan.stepT = 0.27; sfx('step'); if (Math.random() < 0.5) burst('dust', pan.x, 0.08, pan.z, 1, { color: pan.z > 0.7 ? 0xe9dcc0 : 0xf6ead6 }); }
  } else pan.speed = 0;
  updateChar(pan, dt);
  if (busy) { ui.prompt(null); pressE = false; return; }
  // amasado
  if (mode === 'knead') { updateKnead(dt); pressE = false; ui.prompt(null); return; }
  // reloj
  R.time += dt * MIN_PER_SEC; ui.setTime(R.time);
  if (!R.open && R.time >= T_OPEN) { R.open = true; sfx('bell'); ui.toast('¡Abierto! Suena la campanilla.'); }
  if (R.time > 17.5 * 60) music('eve');
  // fermentadora y horno
  R.fermOpen = Math.max(0, (R.fermOpen || 0) - dt); updateTweens(dt);
  R.ferm.forEach((b, i) => { const led = W.fermLed[i]; if (!b) { led.emissive.set('#000000'); led.color.set('#6a6a6a'); return; } led.color.set(b.t >= b.need ? '#7bd389' : '#ffd166'); led.emissive.set(b.t >= b.need ? '#3fdc6a' : '#ffb020'); led.emissiveIntensity = b.t >= b.need ? 1.6 + Math.sin(tSec * 8) * 0.8 : 0.9; const was = b.t >= b.need; b.t += dt; const f = Math.min(1, b.t / b.need); const it = W.fermSlots[i].holder.children[0]?.userData.items; if (it) for (const d of it) { const k = 1 + f * 0.3; d.scale.set(k * 0.9, (1 + f * 0.55) * 0.9, k * 0.9); } if (!was && b.t >= b.need) { sfx('ding'); burst('steam', 3.0, W.fermSlots[i].p[1] + 0.3, -4.95, 5); ui.toast(`${img(b.id)}La masa de ${BREADS[b.id].n.toLowerCase()} ha subido`, 'good'); } });
  if (R.fermG) { const any = R.ferm.some(x => x); R.fermG.style.visibility = any ? 'visible' : 'hidden'; R.ferm.forEach((b, i) => { const e = R.fermG.querySelectorAll('.fb')[i]; e.className = 'fb' + (b ? (b.t >= b.need ? ' ok' : ' on') : ''); e.firstChild.style.transform = `scale(${b ? 0.25 + Math.min(1, b.t / b.need) * 0.75 : 0})`; }); }
  const bakingNow = R.oven.some(x => x); R.fire = Math.max(0, R.fire - dt * (bakingNow ? 0.004 : 0.0006)); const heat = R.fire < 0.12 ? 0.25 : 0.6 + R.fire * 0.6;
  if (R.fireG) { R.fireG.querySelector('i').style.height = (R.fire * 100) + '%'; R.fireG.classList.toggle('low', R.fire < 0.25); R.fireG.style.opacity = R.fire < 0.3 || R.carry?.stage === 'wood' || Math.hypot(pan.x - 5.1, pan.z + 3.6) < 2.6 ? 1 : 0; }
  if (R.fire < 0.2 && !R.fireWarn) { R.fireWarn = true; ui.toast('El fuego del horno flojea. Hay leña en la leñera, fuera a la derecha.'); sfx('no'); }
  if (W.axe.userData.t > 0) { W.axe.userData.t -= dt; W.axe.rotation.z = 0.5 - Math.sin(Math.max(0, W.axe.userData.t) / 0.25 * Math.PI) * 1.3; }
  R.oven.forEach((b, i) => {
    if (!b) return; const t0 = b.t; b.t += dt * heat; b.g.querySelector('.ndl').style.transform = `rotate(${-135 + Math.min(1, b.t / BAKE.burnt) * 270}deg)`; const st = b.t < BAKE.gold0 ? '' : b.t <= BAKE.gold1 ? '¡ya!' : b.t < BAKE.burnt ? '¡ay!' : ''; const sp = b.g.querySelector('b'); if (sp.textContent !== st) sp.textContent = st;
    b.g.classList.toggle('ready', b.t >= BAKE.gold0 && b.t <= BAKE.gold1); b.g.classList.toggle('late', b.t > BAKE.gold1);
    if (t0 < BAKE.gold0 && b.t >= BAKE.gold0) { sfx('ding'); burst('steam', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.4, W.ovenSlots[i].p[2] + 0.5, 6); }
    if (b.t > BAKE.gold1 - 2.5 && b.t < BAKE.burnt && Math.floor(b.t * 2) !== Math.floor(t0 * 2)) sfx('tick');
    if (Math.random() < dt * 2) burst('steam', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.5, W.ovenSlots[i].p[2] + 0.45, 1);
  });
  updateCustomers(dt);
  // ambiente
  if (R.weather === 'lluvia' && !R.inHome) for (let i = 0; i < 14; i++) { const x = camTarget.x - 15 + Math.random() * 30, z = camTarget.z - 13 + Math.random() * 18; if (!(Math.abs(x) < 7.0 && z > -6.6 && z < 0.9)) burst('rain', x + 1.2, 9, z, 1); }
  for (const o of R.orders) if (!o.done && !o.late && R.time > o.by * 60) { o.late = true; drawOrders(); ui.toast(`Se pasó la hora del encargo de ${NEIGH[o.who].n}. Otra vez será.`); }
  if (R.weather === 'viento') { R.leafT -= dt; if (R.leafT < 0) { R.leafT = 0.25; burst('leaf', camTarget.x - 12 + Math.random() * 8, 3 + Math.random() * 3, camTarget.z - 4 + Math.random() * 10, 1, { color: [0xffb7c9, 0xffd98a, 0xb9e38a][Math.floor(Math.random() * 3)] }); } }
  // acción
  cur = findAction();
  pan.lookAt = cur?.cust ? cur.cust.ch : (pan.x > -1.6 && pan.x < -0.3 ? (R.slots.find(c => c && c.st === 'wait')?.ch || null) : null);
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
  else if (mode === 'reveal') { updateReveal(dt); updateChar(pan, dt); if (miga) updateChar(miga, dt); ui.prompt(null); }
  else if (mode === 'fiesta') { updateFiesta(dt); updateChar(pan, dt); if (miga) updateChar(miga, dt); }
  else if (mode === 'title') { cam.yawTo = Math.sin(tSec * 0.1) * 0.35; updateChar(pan, dt); }
  else { updateChar(pan, dt); if (R) for (const c of R.cust) updateChar(c.ch, dt); }
  const hour = R ? R.time / 60 : 9.5, wd = R ? { lluvia: 0.85, nubes: 0.45 }[R.weather] || 0 : 0;
  const inside = pan.z < 0.8 && Math.abs(pan.x) < 6.6, inHome = R?.inHome && mode !== 'reveal';
  const focus = inHome ? { x: clamp(pan.x, 58.6, 61.4), z: clamp(pan.z - 0.5, -4.2, -2.2) } : mode === 'reveal' && R.reveal[0] ? { x: clamp(UPG[R.reveal[0]].at[0], -11, 11), z: clamp(UPG[R.reveal[0]].at[2], -3.4, 8) } : mode === 'title' ? { x: 0, z: 0.5 } : mode === 'knead' ? { x: 0.0, z: -4.5 } : mode === 'fiesta' && fiesta ? { x: fiesta.cx, z: fiesta.cz + 0.3 } : ui.dialogOpen && cur?.cust ? { x: -2, z: cur.cust.ch.z + 0.3 } : { x: clamp(pan.x, -11, 11), z: clamp(pan.z + (inside ? -0.6 : 0.2), -3.4, 8) };
  updateCamera(dt, focus, frame.snap); frame.snap = false;
  setTimeOfDay(hour, wd);
  updateWorld(dt, hour, { wind: R?.weather === 'viento', baking: R ? [!!R.oven[0], !!R.oven[1]] : null, fire: R?.fire, home: !!R?.inHome, fermOpen: R?.fermOpen > 0, fermBusy: R?.ferm.some(x => x) });
  updateParticles(dt); ui.update();
}
let last = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); render(); requestAnimationFrame(loop); }

// ---------- arranque ----------
function boot() {
  initGfx(document.getElementById('c')); initParticles(); buildWorld(); ui.init(renderIcons(), renderExtras(200, Object.fromEntries(Object.entries(W.home.fur).map(([id, g]) => { const c = g.clone(true); c.visible = true; c.position.set(0, 0, 0); c.rotation.set(0, id === 'sillon' ? 0.5 : 0, 0); return [id, c]; }))));
  scene.add(pan.root);
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase(); if (k === 'tab') e.preventDefault(); if (e.repeat) return; initAudio(); resumeAudio();
    if (k === 'm') return ui.toast(toggleMute() ? 'Sin sonido' : 'Con sonido');
    if (ui.dialogOpen) { if (k === 'e' || k === ' ' || k === 'enter') ui.dlgNext?.(); return; }
    if (ui.modalOpen) { if (k === 'escape') return ui.closeModal(); ui.onKey?.(k); return; }
    keys.add(k); if (mode === 'knead') return kneadKey(k);
    if (k === 'e' || k === ' ' || k === 'enter') pressE = true;
    if ((k === 'l' || k === 'tab') && mode === 'play') openBook();
    if (k === 'b' && mode === 'play') toggleBrb();
    
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());
  addEventListener('pointerdown', () => { initAudio(); resumeAudio(); });
  $('#btn-lib').onclick = () => { if (mode === 'play' && !ui.modalOpen && !ui.dialogOpen) openBook(); };
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal' && mode === 'play') ui.closeModal(); });

  const saved = load();
  const begin = (s) => {
    S = s; S.build ||= []; S.baked ||= {}; S.wood ??= 6; S.lata ??= 0; S.home ||= {}; S.sup ||= {}; applyUpgrades(); cam.yawTo = 0; cam.pitchTo = 0; cam.zoomTo = 0.72;
    if (!S.intro) { S.intro = true; mode = 'letter'; R = null; music('title'); pan.x = 1.6; pan.z = -2.6; letter(CARTA, 'Una carta dentro del horno', () => { startDay(true); ui.dayTitle('Día 1', 'lunes · el horno vuelve a encenderse'); sfx('day'); }); }
    else startDay();
  };
  if (TEST) { S = fresh(); S.intro = true; if (Q.has('rich')) { S.money = 3000; S.rep = 700; S.recipes = BREAD_ORDER.filter(x => x !== 'rosca'); NEIGH_ORDER.forEach(id => { S.met[id] = true; S.pts[id] = 20; S.gave[id] = true; }); S.tut = 7; S.roscaLetter = true; S.recipes.push('rosca'); for (const k in ING) S.ing[k] = 40; if (Q.has('up')) UPG_ORDER.forEach(id => S.up[id] = true); S.day = Number(Q.get('day') || 5); } applyUpgrades(); cam.zoom = cam.zoomTo = 0.72; startDay(true); frame.snap = true; }
  else {
    mode = 'title'; pan.x = 1.2; pan.z = 1.6; pan.act('wave'); cam.zoom = cam.zoomTo = 1.0; cam.pitchTo = 0.25; frame.snap = true; music('title');
    setInterval(() => { if (mode === 'title') pan.act('wave'); }, 4000);
    ui.title(!!saved, () => { initAudio(); begin(saved || fresh()); }, () => { localStorage.removeItem(SAVE); begin(fresh()); });
  }
  // API de pruebas
  window.game = {
    ready: true, get S() { return S; }, get R() { return R; }, get mode() { return mode; }, get K() { return K; }, pan, W, ui, cam,
    step(sec, h = 1 / 30) { for (let t = 0; t < sec; t += h) frame(h); render(); },
    tp(x, z, yaw) { pan.x = x; pan.z = z; if (yaw != null) pan.yaw = pan.yawTo = yaw; frame.snap = true; },
    key(k) { if (ui.dialogOpen) return ui.dlgNext?.(); if (ui.modalOpen) return ui.onKey?.(k); if (k === 'e') pressE = true; else if (k === 'l') openBook(); },
    stock(id, n = 4, q = 3) { (R.shelf[id] ||= []).push(...Array.from({ length: n }, () => ({ q }))); refreshBaskets(); },
    time(h) { R.time = h * 60; }, carry(id, stage = 'baked', q = 3) { setCarry({ id, n: batchN(), stage, q, knead: 1 }); },
    spawn(nb) { spawn(nb ? { nb } : { seed: Math.floor(Math.random() * 999) }); }, openBook, openShop, openLib: openBook, goHome, openLata, openVitrina, openCatalog, endDay, startFiesta, unlock, startKnead, serve, letter,
  };
  if (!TEST) requestAnimationFrame(loop); else { frame(1 / 30); render(); }
}
boot();
