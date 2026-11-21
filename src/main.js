// Pantastic! — el obrador de Pan. Bucle principal, jornada, hornadas, clientes y economía.
import { mat as gmat, mesh as gmesh, G as GG } from './gfx.js';
import { THREE, initGfx, scene, render, setTimeOfDay, updateCamera, initParticles, updateParticles, windU, cam, camTarget, burst, fx, Spring, clamp, rnd, light } from './gfx.js';
import { buildWorld, updateWorld, W, setUpgrade, setWip, setSeason, setStyle, setDucklings, drawBoard, collide } from './world.js';
import { makeChar, updateChar, PAN_LOOK, ISART_LOOK, MIGA_LOOK, randomLook } from './chars.js';
import { sun, hemi, fill } from './gfx.js';
import { makeTray, makeBread, renderIcons } from './breads.js';
import { ITEMS } from './data.js';
import { ING, BREADS, BREAD_ORDER, PRICE_LV, REP, NEIGH, NEIGH_ORDER, HEART_AT, UPG, UPG_ORDER, CAPS, PIPA, DIAS, TIEMPO, CARTA, CARTA_ROSCA, VISIT_LINES, NO_STOCK, CARO, CORREO, HALLAZGO, PIPA_LOOK, SUP, SUP_ORDER, MUEBLES, MUE_ORDER, TRACKS, TRACK_ORDER, STAFF, STAFF_ORDER, SEASONS, BONDS, LOGROS, STORY, ESPINO } from './data.js';
import { renderExtras } from './icons.js';
import { initLife, updateLife, cat } from './life.js';
import { logoURL } from './logo.js';
import { ui, img, coin, stars, ingChip, $, ICON, XI } from './ui.js';
import { initAudio, resumeAudio, sfx, blip, note, music, toggleMute } from './audio.js';
import { DOUGH_TINT } from './breads.js';
import { toScreen, groundAt, setQuality, setSee, see } from './gfx.js';
import { setVolume, duck, ambient } from './audio.js';
import { itemModels, addToque } from './items.js';
import { saves } from './saves.js';
import { openTitle } from './title.js';
import { initVida, vidaDefaults, applyVida, vidaStartDay, vidaUpdate, vidaAction, vidaTomorrow, vidaAway, vidaLogros, vidaTab, VIDA_TABS, startFish, endFish, updateFish, openSell, openGift, canGift, tasteHTML, toqueK, toqueName, toqueFits, toqueList, useToque, almReady, give as giveItem, bagN, ii, fishK } from './vida.js';

const Q = new URLSearchParams(location.search), TEST = Q.has('test');
const T_OPEN = 8 * 60, T_LAST = 19 * 60, T_CLOSE = 19.5 * 60, MIN_PER_SEC = 1.6;
const BAKE = { raw: 8, gold0: 14, gold1: 22, burnt: 28 };
const SPARE_AT = [4.3, -3.9], FF = 5;

let S, R, mode = 'boot', K = null, tSec = 0, cur = null, fiesta = null;
const keys = new Set(); let pressE = false, eBuf = 0, holdT = 0, hitstop = 0, lastCust = null; const joy = { x: 0, y: 0, on: false }; let ffHold = false, ffOn = false;
const CFG = Object.assign({ mus: 0.5, sfx: 0.8, q: 'alta' }, (() => { try { return JSON.parse(localStorage.getItem('pantastic-cfg')) || {}; } catch { return {}; } })());
const hit = (s) => { hitstop = Math.max(hitstop, s); };
const pan = makeChar(PAN_LOOK); let miga = null, pipa = null, brasa = null, leva = null; const nbChar = {};
const doughSq = new Spring(1, 260, 12);
const guide = gmesh(GG.cone(0.2, 0.36, 4), gmat('#e2664f', { emissive: '#e2664f', ei: 0.7, rough: 0.4 }), { r: [Math.PI, 0, 0], cast: false }); guide.visible = false;
const marker = gmesh(GG.cone(0.11, 0.2, 4), gmat('#fff6da', { emissive: '#ffd98a', ei: 0.9, rough: 0.4 }), { r: [Math.PI, 0, 0], cast: false }); marker.visible = false;

// ---------- partida ----------
function fresh() { return { v: 1, day: 1, money: 30, rep: 0, ing: { harina: 8, levadura: 4 }, recipes: ['barra', 'hogaza'], prices: {}, pts: {}, met: {}, gave: {}, up: {}, build: [], baked: {}, wood: 6, lata: 0, home: {}, sup: {}, tr: {}, staff: {}, hornadas: 0, lastFiesta: 0, bond: {}, ach: {}, cnt: {}, look: {}, story: {}, ayer: [], years: 0, style: 'miel', tut: 0, intro: false, roscaLetter: false, fiesta: false, total: { sold: 0, earned: 0 }, seenLvl: 0 }; }
let slot = 0, frozen = false, lastShot = 0, lastSave = 0;
function save() { if (TEST || frozen || !S) return; S.last = lastSave = Date.now(); saves.write(slot, S); }
/** Foto del momento para la tapa de la libreta: se saca del lienzo recién pintado. */
function snap() { if (TEST || frozen || !S) return; try { render(); const cv = document.getElementById('c'), o = document.createElement('canvas'); o.width = 320; o.height = 200; const k = Math.max(320 / cv.width, 200 / cv.height), w = 320 / k, h = 200 / k; o.getContext('2d').drawImage(cv, (cv.width - w) / 2, (cv.height - h) / 2, w, h, 0, 0, 320, 200); saves.shot(slot, o.toDataURL('image/jpeg', 0.7)); lastShot = Date.now(); } catch { } }
/** Recarga la página y entra directa en una libreta (tras rebobinar o cambiar de partida). */
function jump(i) { frozen = true; if (i != null) sessionStorage.setItem('pantastic-go', String(i)); location.reload(); }
const lvl = () => { let l = 0; REP.forEach((r, i) => { if (S.rep >= r.at) l = i; }); return l; };
const hearts = (id) => { const p = S.pts[id] || 0; let h = 0; HEART_AT.forEach((a, i) => { if (p >= a) h = i; }); return h; };
const trk = (id) => S.tr[id] || 0, trCost = (id) => Math.round(TRACKS[id].base * Math.pow(TRACKS[id].g, trk(id)) / 5) * 5;
const batchN = () => (S.up.bandeja ? 6 : 4) + Math.floor(trk('bandejas') / 2);
const wages = () => STAFF_ORDER.reduce((a, id) => a + (S.staff[id] ? STAFF[id].wage : 0), 0) + (S.up.miga ? 20 : 0);
const bond = (id, h) => !!S.bond[id + h];
const season = () => SEASONS[Math.floor(((S.day - 1) % 28) / 7)];
const mastery = (id) => { const n = (S.baked[id] || 0) * (bond('ulular', 3) ? 1.34 : 1); return n >= 120 ? 3 : n >= 48 ? 2 : n >= 16 ? 1 : 0; };
const cnt = (k, n = 1) => { S.cnt[k] = (S.cnt[k] || 0) + n; };
/** Suma cariño y dispara los lazos de tres y cinco corazones. */
function gainPts(id, n) { S.pts[id] = (S.pts[id] || 0) + n; for (const h of [3, 5]) if (hearts(id) >= h && !S.bond[id + h]) { S.bond[id + h] = true; setTimeout(() => { sfx('fanfare'); ui.toast(`${face(id, 'happy')} Lazo con ${NEIGH[id].n} ${'♥'.repeat(h)}: ${BONDS[id][h]}`, 'gold'); checkLogros(); }, 1800 + h * 300); } }
const renown = () => Math.min(10, Math.max(0, Math.floor((S.rep - REP[REP.length - 1].at) / 400)));
const comfort = () => MUE_ORDER.filter(id => S.home[id]).length;
const supOf = (ing) => SUP_ORDER.find(k => SUP[k].ings.includes(ing));
const supLvl = (k) => Math.min(5, Math.floor((S.sup[k] || 0) / 96));
const supStamps = (k) => supLvl(k) >= 5 ? 8 : Math.floor(((S.sup[k] || 0) % 96) / 12);
const priceOf = (id) => Math.max(1, Math.round(BREADS[id].price * PRICE_LV[S.prices[id] ?? 1].k * (1 + (S.pm || 0) * 0.06) * (1 + renown() * 0.02) * (1 + Math.min(10, S.hornadas || 0) * 0.05) * (1 + (S.years || 0) * 0.03))) + mastery(id) + (S.rw?.sello ? 1 : 0);
const ingPrice = (id) => Math.max(1, Math.round(ING[id].p * (R.market[id] || 1) * (S.up.molino && ['harina', 'integral', 'centeno'].includes(id) ? 0.67 : 1) * (R.disc || 1) * (1 - supLvl(supOf(id)) * 0.04) * (bond('tejo', 3) && ['harina', 'integral', 'centeno'].includes(id) ? 0.9 : 1) * (R.cheap === id ? 0.7 : 1)));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const face = (id, ex = 'idle') => `<img src="${XI.face[id === 'pan' && S?.hero === 'isart' ? 'isart' : id][ex]}" alt="">`;
const iimg = (id) => `<img src="${XI.ing[id]}" alt="">`;
const canMake = (id) => Object.entries(BREADS[id].ing).every(([k, n]) => (S.ing[k] || 0) >= n);
const batchCost = (id) => Object.entries(BREADS[id].ing).reduce((a, [k, n]) => a + ING[k].p * n, 0);
const shelfCount = () => Object.values(R.shelf).reduce((a, b) => a + b.length, 0);
const knownNeigh = () => NEIGH_ORDER.filter(id => NEIGH[id].lvl <= lvl());

function startDay(first = false) {
  if (!TEST && !frozen) saves.morning(slot, S);
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
  R = { time: 7 * 60, shelf: {}, carry: null, ferm: [null, null, null], oven: [null, null], cart: [null, null, null], reveal: [], streak: 0, till: null, chopping: null, fire: 0.7, brb: false, stroll: [], chatted: {}, finds: [], mail: null, chop: 0, disc: 1, cust: [], spawns: [], slots: Array(4 + (trk('mostrador') >= 4 ? 1 : 0) + (trk('mostrador') >= 8 ? 1 : 0)).fill(null), zone: null, waits: [], weather: wk, antojo, market, wd, open: false, ended: false, today: { sold: 0, income: 0, tips: 0, spent: 0, lost: 0, rep: 0, by: {} }, migaT: 0, leafT: 0, spare: 0, idleT: 0, dirt: [], clean: false, oferta: null, recado: null, lingered: {}, autoBrb: false };
  W.slots = W.slotSets[R.slots.length].map(z => ({ x: -3.0, z }));
  for (const a of S.ayer || []) (R.shelf[a] ||= []).push({ q: 1, old: true }); S.ayer = [];
  setCarry(null); refreshBaskets();
  // llegadas
  const L = lvl();
  // obras encargadas ayer: terminadas esta mañana
  for (const id of S.build || []) { S.up[id] = true; R.reveal.push(id); setWip(id, UPG[id].at, false); } S.build = []; applyUpgrades(false);
  let n = 11 + L * 3 + trk('fama') + (bond('zarza', 5) ? 2 : 0) + (S.up.jardin ? 2 : 0) + (S.up.reforma ? 3 : 0) + (S.up.terraza ? 3 : 0) + (S.up.puesto ? 2 : 0) + (S.up.farolillos ? 3 : 0) + (S.up.fuente ? 3 : 0);
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
  if (S.staff.lenador && !first) { S.wood += 5; refreshWood(); }
  R.madre = S.madreBuff === S.day; R.repT = [12.5 * 60, 16.5 * 60];
  setDucklings(S.ducklings || 0); R.espino = false; if (espino) scene.remove(espino.root);
  if (S.day > 1 && (S.day - 1) % 28 === 0 && !first && S.yearDay !== S.day) { S.yearDay = S.day; S.years = (S.years || 0) + 1; setTimeout(() => { sfx('fanfare'); burst('confetti', pan.x, 2, pan.z, 60); ui.toast(`Año ${S.years + 1} en Migas. La solera se nota: todo tu pan vale un 3 % más`, 'gold'); }, 6000); }
  const se = season(); R.cheap = se.cheap; setSeason(se); R.fair = wd === 6; R.fondaWant = sellable.filter(x => x !== 'rosca')[Math.floor(r() * Math.max(1, sellable.filter(x => x !== 'rosca').length))] || 'hogaza';
  for (const [sn, bid] of [['verano', 'coca'], ['otoño', 'calabaza']]) if (se.n === sn && !S.recipes.includes(bid) && !first) setTimeout(() => { if (mode === 'play' && !ui.modalOpen) unlock(bid, `la feria de ${sn}`); else S.recipes.push(bid); }, 9000); R.fxT = 0; if (se.n === 'invierno' && R.weather === 'lluvia') R.weather = 'nubes';
  ui.setDay(S.day, DIAS[wd], R.weather, antojo, se.n); ui.setMoney(S.money); updRep();
  if ((S.day - 1) % 7 === 0 && S.day > 1 && !first) setTimeout(() => { sfx('fanfare'); ui.toast(`Empieza ${se.n === 'invierno' || se.n === 'verano' || se.n === 'otoño' ? 'el ' : 'la '}${se.n}: se llevan ${se.up.filter(x => S.recipes.includes(x)).map(x => BREADS[x].n.toLowerCase()).join(' y ') || 'los panes de siempre'}; ${ING[se.cheap].n.toLowerCase()} a buen precio`, 'gold'); }, 4800);
  // encargos del día
  R.orders = []; if (S.day >= 3) { const who = NEIGH_ORDER.filter(id => S.met[id]); const cnt = 1 + (L >= 3 ? 1 : 0) + (bond('charca', 3) ? 1 : 0); if (bond('charca', 3) && who.includes('charca')) { who.splice(who.indexOf('charca'), 1); who.unshift('charca'); } for (let i = 0; i < cnt && who.length; i++) { const w = who.splice(i === 0 && bond('charca', 3) && who[0] === 'charca' ? 0 : Math.floor(r() * who.length), 1)[0], favs = NEIGH[w].favs.filter(f => S.recipes.includes(f)), bread = favs.length ? favs[Math.floor(r() * favs.length)] : sellable[Math.floor(r() * sellable.length)], n = Math.min(batchN() + 2, 3 + Math.floor(r() * 3) + (L > 3 ? 1 : 0)), by = i ? 18.5 : 16; if (bread === 'rosca') continue; R.orders.push({ who: w, bread, n, by, pay: Math.round(priceOf(bread) * n * 1.4 * (bond('charca', 5) ? 1.2 : 1)), done: false, late: false }); } if (R.orders.length) setTimeout(() => orderIntro(R.orders[0]), 6400); } drawOrders();
  const lines = [];
  if (antojo) lines.push('Hoy se lleva: ' + BREADS[antojo].n);
  lines.push(wk === 'lluvia' ? 'Día de lluvia: apetece dulce' : wd === 6 ? `Feria de ${season().n}: ¡medio pueblo!` : wk === 'viento' ? 'Sopla el viento del molino' : 'Buen día para hornear');
  if (S.recipes.includes('rosca') && !S.fiesta) lines.push('8 roscas al atardecer', '= ¡la Hornada!');
  else if (S.fiesta) lines.push(S.day - (S.lastFiesta || 0) >= 7 ? 'Otra Hornada: 8 roscas hoy' : `Hornada en ${7 - (S.day - S.lastFiesta)} días`);
  else lines.push(`Recetas: ${S.recipes.length} de ${BREAD_ORDER.length}`);
  if (R.orders.length) { lines.length = Math.min(lines.length, 2); for (const o of R.orders) lines.push(`${NEIGH[o.who].n}: ${o.n} ${BREADS[o.bread].pl}`); }
  { const vl = vidaStartDay(first, r); if (vl.length) lines.splice(Math.min(1, lines.length), lines.length > 3 ? 1 : 0, ...vl); lines.length = Math.min(lines.length, 4); }
  drawBoard('Día ' + S.day + ' · ' + DIAS[wd], lines);
  ui.rain(false); R.inHome = false; for (const id of MUE_ORDER) W.home.fur[id].visible = !!S.home[id];

  // mundo vivo: hallazgos, buzón, vecinos de paseo, Pipa en la plaza
  W.brb.visible = false; $('#brb').classList.add('hide'); refreshWood(); refreshSpare(); refreshDirt(); drawOferta();
  const spots = [...W.findSpots].sort(() => r() - 0.5).slice(0, bond('pua', 5) ? 5 : 4); W.findMesh.forEach((m, i) => { m.visible = i < spots.length; if (spots[i]) m.position.set(spots[i][0], 0.35, spots[i][1]); }); R.finds = spots.map((p, i) => ({ x: p[0], z: p[1], i }));
  const friends = NEIGH_ORDER.filter(id => S.met[id] && hearts(id) >= 1);
  if (S.day > 1 && friends.length && (r() < 0.65 || bond('zarza', 3))) { const from = friends[Math.floor(r() * friends.length)], coins = r() < 0.4; R.mail = { from, text: CORREO[Math.floor(r() * CORREO.length)], gift: coins ? { coins: 4 + Math.floor(r() * 4) + hearts(from) * 2 } : { ing: ['levadura', 'harina', 'mantequilla', 'azucar', 'nueces'][Math.floor(r() * 5)], n: 2 + (hearts(from) > 2 ? 1 : 0) } }; setTimeout(() => ui.toast(`${face(from)} Hay carta en el buzón`, 'good'), 5200); }
  const HANG = [[-12.6, 7.4], [-8, 9.4], [-7, 5], [2, 5.2], [5.6, 8.2], [10.5, 4.2], [13.8, 5.2], [-3, 4.2]];
  R.hang = HANG; R.routine = NEIGH_ORDER.filter(id => S.met[id] && NEIGH[id].lvl <= L).map(id => ({ nb: id, out: (8.2 + r() * 3.2) * 60, state: 'home' })); for (const b of W.benchSeats) b.used = null; for (const id of NEIGH_ORDER) if (nbChar[id]) { nbChar[id].root.position.y = 0; nbChar[id].sit = false; }
  if (!pipa) { pipa = makeChar(PIPA_LOOK); } pipa.x = W.pipaSpot[0]; pipa.z = W.pipaSpot[1]; pipa.yaw = pipa.yawTo = 0.3; R.pipa = S.day >= 2; if (R.pipa) scene.add(pipa.root); else scene.remove(pipa.root);
  ui.unanchor(R.fireG); R.fireG = ui.anchor('gauge flame', '<div class="fl"><i></i></div>', [6.2, 2.05, -4.6]); ui.unanchor(R.fermG); R.fermG = ui.anchor('gauge fdots', '<div class="fb"><i></i></div><div class="fb"><i></i></div><div class="fb"><i></i></div>', [3.0, 2.34, -4.95]); tweens.length = 0; for (const sl of [...W.fermSlots, ...W.ovenSlots]) sl.holder.position.set(...sl.p);
  pan.x = 1.6; pan.z = -2.6; pan.yawTo = pan.yaw = 0; pan.goto = null;
  $('#keys').classList.toggle('gone', S.day > 2);
  if (!first && S.day === 2) setTimeout(() => ui.toast(`${face('pipa', 'happy')} Nuevo: por las mañanas Pipa está con su carro en la plaza, y vende más barato`, 'good'), 7600);
  if (!first && S.day === 2) setTimeout(() => ui.toast('<kbd>B</kbd> Nuevo: cuelga el «Vuelvo enseguida» y nadie se impacienta mientras das una vuelta', 'good'), 14500);
  if (!first && S.day === 2) setTimeout(() => ui.toast('Nuevo: antes de hornear se greña el pan. Unos buenos cortes suben la calidad', 'good'), 18000);
  if (!first && S.day === 3) setTimeout(() => ui.toast('Nuevo: desde hoy el horno pide leña. La leñera está fuera, a la derecha', 'good'), 8800);
  if (!first && S.day === 2) setTimeout(() => ui.toast('Nuevo: por las afueras, el río y el molino brota lo de cada estación. Lo que cojas va al zurrón de la libreta', 'good'), 11000);
  if (!first && S.day === 4) setTimeout(() => ui.toast('Nuevo: en la libreta, pestaña Taller, hay mejoras por niveles y equipo que contratar', 'good'), 7600);
  mode = R.reveal.length ? 'reveal' : 'play'; R.revT = 0; music('day'); ui.show('#hud', true);
  if (!first) { ui.dayTitle('Día ' + S.day, `${DIAS[wd]} de ${season().n} · ${TIEMPO[wk].n.toLowerCase()}`); sfx('day'); }
  if (S.recipes.length >= 9 && !S.roscaLetter && NEIGH_ORDER.every(id => S.gave[id])) setTimeout(roscaLetter, 3400);
  save(); if (!first && !TEST) setTimeout(() => ui.saved('Mañana guardada'), 3600);
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
  else if (b) { const t = makeTray(b.id, b.n, b.stage === 'order' ? 'baked' : b.stage, b.burnt ? 1 : b.tone || 0); t.scale.setScalar(0.82); pan.carryAnchor.add(t); }
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
    const n = b.id ? Math.min(6, R.shelf[b.id].length) : 0, sig = b.id ? R.shelf[b.id].slice(-6).map(l => l.q + (l.burnt ? 'b' : '') + (l.old ? 'o' : '') + (l.tq || '')).join('') : ''; if (b.n === n && b.shown === b.id && b.sig === sig) continue; b.sig = sig;
    b.items.clear(); b.n = n; b.shown = b.id;
    for (let i = 0; i < n; i++) {
      // siempre dentro del borde de la cesta: las piezas largas a lo ancho, las redondas en cuadrícula
      const lf = R.shelf[b.id][R.shelf[b.id].length - 1 - i] || {}, m = makeBread(b.id, lf.burnt ? 1 : lf.old ? 0.25 : lf.tone || 0), long = ['barra', 'semillas', 'nueces', 'chapata'].includes(b.id), lay = Math.floor(i / (long ? 3 : 4)), k = i % (long ? 3 : 4);
      if (long) { m.scale.setScalar((b.id === 'barra' ? 0.62 : 0.8) * Math.min(1.04, lf.s || 1)); m.position.set(lay ? 0.02 : 0, 0.005 + lay * 0.09, (k - 1) * 0.2 + lay * 0.1); m.rotation.y = (k - 1) * 0.06; }
      else { m.scale.setScalar(0.56 * Math.min(1.05, lf.s || 1)); m.position.set((k % 2 ? 0.17 : -0.17) * (lay ? 0 : 1), 0.005 + lay * 0.11, (k < 2 ? -0.16 : 0.16) * (lay ? (i % 2 ? 1 : -1) : 1)); m.rotation.y = i * 1.3; }
      if (lf.tq) addToque(m, lf.tq);
      b.items.add(m);
    }
  }
  for (const b of W.basketGroups) { const key = b.id ? b.id + priceOf(b.id) + (R.antojo === b.id) : ''; if (b.tagKey === key) continue; b.tagKey = key; b.tag.visible = !!b.id; if (!b.id) continue; const g = b.tagTex.userData.g; g.clearRect(0, 0, 128, 96); g.fillStyle = R.antojo === b.id ? '#ffe9a8' : '#fffdf5'; g.beginPath(); g.roundRect(3, 3, 122, 90, 12); g.fill(); g.strokeStyle = '#c98a5a'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#7a4a2a'; g.textAlign = 'center'; g.font = '800 17px "Baloo 2", ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.fillText(BREADS[b.id].n.replace('Pan de ', '').replace(' de aceitunas', '').replace(' de chocolate', '').replace(' de semillas', '').replace(' de la Hornada', ''), 64, 27, 112); g.font = '900 50px "Baloo 2", ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.fillStyle = '#e2664f'; g.fillText(String(priceOf(b.id)), 52, 78); g.fillStyle = '#f5c33b'; g.beginPath(); g.arc(96, 62, 13, 0, 7); g.fill(); g.strokeStyle = '#c98a2a'; g.lineWidth = 3; g.stroke(); b.tagTex.needsUpdate = true; }
  ui.setShelf(R.shelf);
}

// ---------- hornada ----------
function openRecipes() {
  if (R.carry) return ui.toast('Tienes las manos ocupadas: deja la bandeja en el carro'), sfx('no');
  const tqs = toqueList(); let tq = null;
  const cards = S.recipes.map(id => {
    const b = BREADS[id], ok = canMake(id), miss = Object.entries(b.ing).filter(([k, n]) => (S.ing[k] || 0) < n).map(([k]) => ING[k].n.toLowerCase().replace('harina de ', '').replace('harina ', ''));
    return `<button class="rcard ${ok ? '' : 'no'}" data-id="${id}">${R.antojo === id ? '<span class="hot">hoy se lleva</span>' : ''}<div class="nm">${b.n}</div><img class="b" src="${ICON[id]}" alt="">
      <div class="need">${Object.entries(b.ing).map(([k, n]) => `<span class="nd ${(S.ing[k] || 0) < n ? 'miss' : ''}">${iimg(k)}<b>${n}</b></span>`).join('')}</div>
      <div class="out">${ok ? `${batchN()} piezas · ${priceOf(id)} ${coin}` : 'Falta ' + miss.join(' y ')}</div>${ok && S.staff.amasadora && mastery(id) > 0 ? '<span class="mach">Q · a máquina</span>' : ''}</button>`;
  }).join('');
  const sh = ui.modal(`<div class="head"><h2>¿Qué amasamos?</h2><div>Las fichas de la abuela. Lo que falte, al colmado.</div></div>${tqs.length ? `<div class="toques"><b>Un toque del zurrón</b><button class="tq on" data-tq="">sin nada</button>${tqs.map(t => `<button class="tq" data-tq="${t}">${ii(t)}${ITEMS[t].toque.n} <small>×${bagN(t)} · +${Math.round((toqueK(t) - 1) * 100)} %</small></button>`).join('')}</div>` : ''}<div class="rcards scroll">${cards}</div><div class="hint-keys"><span><kbd>A</kbd><kbd>D</kbd> elegir</span><span><kbd>E</kbd> amasar</span>${tqs.length ? '<span><kbd>T</kbd> toque</span>' : ''}<span><kbd>Esc</kbd> volver</span></div>`, 'board');
  const picks = [...sh.querySelectorAll('.rcard')]; let sel = Math.max(0, picks.findIndex(p => !p.classList.contains('no')));
  const mark = () => picks.forEach((p, i) => p.classList.toggle('sel', i === sel)); mark();
  const go = (p) => { if (p.classList.contains('no')) { sfx('no'); p.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 220 }); return; } if (tq && !toqueFits(tq, p.dataset.id)) { sfx('no'); return ui.toast(`${ii(tq)} Ese toque ${ITEMS[tq].toque.sweet ? 'solo pega con lo dulce' : 'no pega con lo dulce'}`); } ui.closeModal(); startKnead(p.dataset.id, tq); };
  const setTq = (t) => { tq = t || null; sh.querySelectorAll('.tq').forEach(b => b.classList.toggle('on', (b.dataset.tq || null) === tq)); sfx('tick'); }; sh.querySelectorAll('.tq').forEach(b => b.onclick = () => setTq(b.dataset.tq));
  picks.forEach((p, i) => { p.onclick = () => go(p); p.onmouseenter = () => { if (sel !== i) { sel = i; mark(); sfx('tick'); } }; });
  const per = Math.max(1, Math.floor((sh.querySelector('.rcards').clientWidth - 20) / 192));
  ui.onKey = (k) => { if (k === 'arrowright' || k === 'd') sel = (sel + 1) % picks.length; else if (k === 'arrowleft' || k === 'a') sel = (sel + picks.length - 1) % picks.length; else if (k === 'arrowdown' || k === 's') sel = Math.min(picks.length - 1, sel + per); else if (k === 'arrowup' || k === 'w') sel = Math.max(0, sel - per); else if (k === 'e' || k === 'enter' || k === ' ') return go(picks[sel]); else if (k === 'q') return machine(picks[sel]); else if (k === 't' && tqs.length) return setTq([null, ...tqs][([null, ...tqs].indexOf(tq) + 1) % (tqs.length + 1)]); else return; sfx('tick'); mark(); picks[sel].scrollIntoView({ block: 'nearest' }); };
  const machine = (p) => { const id = p.dataset.id, mt = tq && toqueFits(tq, id) ? tq : null; if (!p.querySelector('.mach')) return sfx('no'); ui.closeModal(); if (mt) useToque(mt); for (const [k, n] of Object.entries(BREADS[id].ing)) S.ing[k] -= n; sfx('whoosh'); pan.goto = { x: W.st.mesa.x, z: W.st.mesa.z, yaw: Math.PI }; W.mixerSpin = 1.4; setTimeout(() => { if (mode !== 'play' || R.carry) return; setCarry({ id, n: batchN(), stage: 'dough', knead: 0.68, tq: mt }); sfx('pick'); burst('flour', 1.65, 1.3, -5.2, 12); ui.toast(`<img src="${ICON._masa}" alt="">La amasadora ha hecho su parte`); }, 1400); };
  sh.querySelectorAll('.mach').forEach(m => m.onclick = (e) => { e.stopPropagation(); machine(m.closest('.rcard')); });
  sfx('page');
}
function startKnead(id, tq = null) {
  const ing = Object.entries(BREADS[id].ing); for (const [k, n] of ing) S.ing[k] -= n; if (tq) useToque(tq);
  K = { id, tq, phase: 'pour', beat: 0, t: 0, scores: [], n: 6, done: 0, combo: 0, hold: 0, holding: false, sx: new Spring(1, 200, 11), sz: new Spring(1, 200, 11) }; mode = 'knead';
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
  if (gr === 'p') { burst('spark', ...W.doughWorld, 8); cam.shake = 0.4; hit(0.05); } else cam.shake = 0.15;
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
  const q = Math.min(1, (K.scores.reduce((a, b) => a + b, 0) / K.n) * 0.7 + K.holdScore * 0.3 + (bond('ulular', 5) ? 0.12 : 0));
  document.body.classList.remove('kneading');
  ui.knead(false); W.dough.visible = false; W.dough.rotation.y = 0; pan.action = null; cam.zoomTo = 0.72; cam.yawTo = 0; cam.pitchTo = 0; mode = 'play';
  setCarry({ id: K.id, n: batchN(), stage: 'dough', knead: q, tq: K.tq }); pan.pop(4); sfx('pick'); burst('flour', pan.x, 1.2, pan.z + 0.4, 10);
  ui.toast(`<img src="${ICON._masa}" alt="">` + (q > 0.85 ? '¡Masa de campeonato!' : q > 0.55 ? 'Buena masa' : 'Masa algo vaga… pero sirve') + (K.tq ? `, ${ITEMS[K.tq].toque.n}` : ''), q > 0.85 ? 'gold' : '');
  if (S.tut === 0) S.tut = 1; K = null; addDirt();
}
function useFerm() {
  const c = R.carry;
  if (c && c.stage === 'dough') {
    const i = R.ferm.findIndex(x => !x); if (i < 0) return ui.toast('La fermentadora está llena'), sfx('no');
    R.ferm[i] = { ...c, t: 0, need: (S.up.fermenta ? 12 : 24) / (1 + trk('ferment') * 0.07) / (R.madre ? 1.2 : 1) / (1 + (S.pm || 0) * 0.04) }; holderTray(W.fermSlots[i], c); R.fermOpen = 0.75; slide(W.fermSlots[i], 1, () => { sfx('place'); burst('steam', 3.0, W.fermSlots[i].p[1] + 0.2, -4.95, 4); }); setCarry(null); sfx('whoosh'); pan.act('give');
    if (S.tut === 1) S.tut = 2; return;
  }
  if (c) return ui.toast(c.stage === 'wood' ? 'La leña va al horno. Si no hace falta, devuélvela a la leñera' : c.stage === 'proofed' ? 'Esta ya ha subido: al horno, o déjala en el carro' : 'Eso va al mostrador'), sfx('no');
  const i = R.ferm.findIndex(x => x && x.t >= x.need);
  if (i < 0) return ui.toast(R.ferm.some(x => x) ? 'Aún está subiendo. Paciencia de panadera.' : 'No hay masa dentro'), sfx('no');
  const b = R.ferm[i]; ui.unanchor(b.g); R.ferm[i] = null; R.fermOpen = 0.8; sfx('whoosh'); pan.act('give'); burst('steam', 3.0, W.fermSlots[i].p[1] + 0.3, -4.95, 6);
  slide(W.fermSlots[i], -1, () => { holderTray(W.fermSlots[i], null); setCarry({ id: b.id, n: b.n, stage: 'proofed', knead: b.knead, tq: b.tq }); sfx('pick'); pan.pop(3); }); if (S.tut === 2) S.tut = 3;
}
function useOven() {
  const c = R.carry, max = S.up.horno2 ? 2 : 1;
  if (c && c.stage === 'wood') { if (R.fire > 0.92) { if (R.spare >= 2) return ui.toast('Ya hay dos troncos esperando al pie del horno. Devuelve este a la leñera'), sfx('no'); R.spare++; refreshSpare(); setCarry(null); sfx('place'); pan.act('give'); burst('dust', 4.3, 0.3, -3.9, 5); return ui.toast('El fuego ya va alto: dejas el tronco al pie del horno. Entrará solo cuando baje', 'good'); } R.fire = Math.min(1, R.fire + 0.4); setCarry(null); sfx('fire'); sfx('place'); pan.act('give'); burst('spark', 5.1, 1.5, -4.3, 22, { color: 0xffa040 }); burst('steam', 5.1, 1.7, -4.2, 5); cam.shake = 0.25; R.fireWarn = false; return; }
  if (c && c.stage === 'proofed' && R.fire < 0.12) return ui.toast('El horno está casi apagado: trae leña de la leñera de fuera'), sfx('no');
  if (c && c.stage === 'proofed') {
    const i = R.oven.findIndex((x, k) => !x && k < max); if (i < 0) return ui.toast((max === 1 ? 'El horno está ocupado' : 'Las dos bocas están ocupadas') + ': deja la bandeja en el carro'), sfx('no');
    if (!c.scored && S.day >= 2 && mode === 'play' && !TEST_NOSCORE) return startScore();
    R.oven[i] = { ...c, stage: 'baking', t: 0, look: 0 }; holderTray(W.ovenSlots[i], R.oven[i]); slide(W.ovenSlots[i], 1, () => { sfx('place'); sfx('fire'); burst('spark', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.2, W.ovenSlots[i].p[2] - 0.2, 10, { color: 0xffa040 }); cam.shake = 0.2; }); setCarry(null); sfx('whoosh'); pan.act('give');
    R.oven[i].g = ui.anchor('gauge timer', `<div class="dial"><div class="ndl"></div>${img(c.id)}<b></b></div>`, [W.ovenSlots[i].p[0] + (i ? 1.0 : 1.2), W.ovenSlots[i].p[1] + (i ? 0.75 : 1.55), W.ovenSlots[i].p[2] + 0.3]);
    return;
  }
  if (c) return ui.toast(c.stage === 'dough' ? 'Primero tiene que subir en la fermentadora' : c.stage === 'order' ? 'Eso es un encargo: llévalo a su casa' : 'Eso ya está hecho: al mostrador'), sfx('no');
  let i = -1, best = -1; R.oven.forEach((x, k) => { if (x && x.t > best) { best = x.t; i = k; } });
  if (i < 0) return ui.toast('El horno está vacío'), sfx('no');
  const b = R.oven[i]; if (b.t < BAKE.raw) return ui.toast('Aún está cruda'), sfx('no');
  let bake, word, cls = '';
  if (b.t < BAKE.gold0) { bake = 0.4; word = 'Un poco pálido'; } else if (b.t <= BAKE.gold1) { const mid = Math.abs(b.t - (BAKE.gold0 + BAKE.gold1) / 2) < 2.2; bake = 1; word = mid ? '¡En su punto!' : 'Dorado'; cls = mid ? 'gold' : 'good'; }
  else if (b.t < BAKE.burnt) { bake = 0.4; word = 'Algo tostado'; } else { bake = 0; word = 'Muy tostado… se venderá barato'; }
  const tot = b.knead * 0.5 + bake * 0.5 + ((b.score ?? 0.6) - 0.6) * 0.3, q = bake === 0 ? 1 : tot >= 0.8 ? 3 : tot >= 0.5 ? 2 : 1;
  ui.unanchor(b.g); R.oven[i] = null; sfx('whoosh'); pan.act('give');
  slide(W.ovenSlots[i], -1, () => { holderTray(W.ovenSlots[i], null); setCarry({ id: b.id, n: b.n, stage: 'baked', q, burnt: bake === 0, tone: b.t > BAKE.gold1 ? 0.45 : 0, tq: b.tq }); sfx('pick'); burst('steam', pan.x, 1.3, pan.z - 0.5, 10); });
   sfx(q === 3 ? 'perfect' : 'good'); pan.pop(4); if (q === 3) { pan.say('happy', 1.5); burst('spark', pan.x, 1.4, pan.z + 0.4, 12); }
  burst('steam', pan.x, 1.2, pan.z + 0.4, 8); ui.toast(`${img(b.id)}${word} <span class="st">${stars(q)}</span>`, cls); if (S.tut === 3) S.tut = 4;
}
function refreshWood() { W.woodLogs.forEach((l, i) => l.visible = i < Math.min(12, S.wood)); }
function returnWood() { S.wood++; refreshWood(); setCarry(null); sfx('place'); pan.act('give'); ui.float('+1 leña', 8.0, 1.9, -2.9); }
let spareLogs = null;
function refreshSpare() { if (!spareLogs) { spareLogs = [0, 1].map(i => { const l = new THREE.Group(); gmesh(GG.cyl(0.11, 0.11, 0.72, 9), gmat('#b07a4c', { rough: 0.95 }), { parent: l, r: [0, 0, Math.PI / 2] }); gmesh(GG.cyl(0.085, 0.085, 0.73, 9), gmat('#f0d2a0'), { parent: l, r: [0, 0, Math.PI / 2] }); l.position.set(SPARE_AT[0], 0.13 + i * 0.2, SPARE_AT[1] + i * 0.04); l.rotation.y = 0.5 + i * 0.25; scene.add(l); return l; }); } spareLogs.forEach((l, i) => l.visible = !!R && i < (R.spare || 0)); }
function takeWood() { if (R.carry) return ui.toast('Tienes las manos ocupadas'), sfx('no'); if (S.wood <= 0) return ui.toast('No queda leña. Parte troncos en el tocón de al lado.'), sfx('no'); S.wood--; refreshWood(); setCarry({ stage: 'wood' }); sfx('pick'); pan.pop(3); }
function useCart() {
  const c = R.carry; if (c && c.stage === 'wood') return ui.toast('La leña va al horno. Si no hace falta, devuélvela a la leñera'), sfx('no'); if (c && c.stage === 'order') return ui.toast(`El encargo va a casa de ${NEIGH[R.orders[c.o].who].n}: sigue la flecha`), sfx('no');
  if (c) { const i = R.cart.findIndex(x => !x); if (i < 0) return ui.toast('El carro está lleno'), sfx('no'); R.cart[i] = c; W.cartSlots[i].holder.clear(); W.cartSlots[i].holder.add(makeTray(c.id, c.n, c.stage, c.burnt ? 1 : c.tone || 0)); setCarry(null); sfx('place'); pan.act('give'); return; }
  let i = -1; R.cart.forEach((x, k) => { if (x) i = k; }); if (i < 0) return ui.toast('El carro está vacío. Aquí puedes dejar cualquier bandeja.'), sfx('no');
  const b = R.cart[i]; R.cart[i] = null; W.cartSlots[i].holder.clear(); setCarry(b); sfx('pick'); pan.pop(3);
}
function placeBread() {
  const c = R.carry; (R.shelf[c.id] ||= []).push(...Array.from({ length: c.n }, () => { const x = Math.random(), q = c.burnt ? 1 : Math.max(1, Math.min(3, c.q + (x < 0.22 ? -1 : x > 0.86 ? 1 : 0))); return { q, burnt: c.burnt, tone: c.burnt ? 1 : Math.max(0, (c.tone || 0) + (q < c.q ? 0.3 : 0) + (Math.random() - 0.5) * 0.2), s: 0.92 + Math.random() * 0.16, ...(c.tq && !c.burnt ? { tq: c.tq } : {}) }; }));
  const m0 = mastery(c.id); S.baked[c.id] = (S.baked[c.id] || 0) + c.n; if (mastery(c.id) > m0) setTimeout(() => { sfx('fanfare'); ui.toast(`${img(c.id)}Maestría ${'★'.repeat(mastery(c.id))} en ${BREADS[c.id].n.toLowerCase()}: +1 ${coin} por pieza`, 'gold'); }, 900); R.shelf[c.id].sort((a, b) => a.q - b.q); setCarry(null); refreshBaskets(); sfx('place'); sfx('pop'); pan.act('give');
  const b = W.basketGroups.find(x => x.id === c.id) || W.basketGroups[2]; const p = new THREE.Vector3(); b.g.getWorldPosition(p);
  burst('spark', p.x, p.y + 0.3, p.z, 10); burst('steam', p.x, p.y + 0.2, p.z, 5); ui.float(`+${c.n} ${BREADS[c.id].pl}${toqueName(c.tq)}`, p.x, p.y + 0.6, p.z, 'star');
  if (S.tut === 4) S.tut = 5;
}

// ---------- clientes ----------
function pickWant(nb) {
  const opts = S.recipes.filter(x => x !== 'rosca' || S.fiesta); let tot = 0; const w = opts.map(id => {
    let k = 1; if (season().up.includes(id)) k *= 1.7; if (nb && NEIGH[nb].favs.includes(id)) k *= 4; if (R.antojo === id) k *= 3; if (R.weather === 'lluvia' && BREADS[id].sweet) k *= 2;
    k *= [1.3, 1, 0.7][S.prices[id] ?? 1]; if (R.shelf[id]?.length) k *= 1.6; if (R.oferta === id) k *= 2.6; tot += k; return k;
  });
  let x = Math.random() * tot; for (let i = 0; i < opts.length; i++) { x -= w[i]; if (x <= 0) return opts[i]; } return opts[0];
}
function spawn(sp) {
  let ch, walking = false; if (sp.nb) { ch = nbChar[sp.nb] ||= makeChar(NEIGH[sp.nb].look); if (R.cust.some(c => c.ch === ch)) return; const si = R.stroll.findIndex(x => x.nb === sp.nb); if (si >= 0) { R.stroll.splice(si, 1); walking = true; } } else ch = makeChar(randomLook(sp.seed));
  const side = Math.random() < 0.5 ? -1 : 1; if (walking) { ch.sit = false; ch.root.position.y = 0; for (const b of W.benchSeats) if (b.used && b.used.nb === sp.nb) b.used = null; } if (!walking) { const hm = sp.nb && W.homes[sp.nb], rt = sp.nb && R.routine.find(x => x.nb === sp.nb); if (hm && !hm.edge && rt && rt.state === 'home') { ch.x = hm.out[0]; ch.z = hm.out[1]; rt.state = 'out'; } else { ch.x = side * 26.5; ch.z = 4.2 + Math.random() * 0.6; } } ch.sit = false; ch.action = null; scene.add(ch.root);
  const c = { ch, nb: sp.nb || null, want: pickWant(sp.nb), st: 'enter', path: [[-4.6 + Math.random() * 0.5, 4.0], [-4.6, 1.3]], side, wait: 0, max: (80 + (S.up.jardin ? 20 : 0)) * (1 + trk('mostrador') * 0.08) * (bond('lana', 5) ? 1.15 : 1) + Math.random() * 25, pos: [0, 0, 0], bpos: [0, 0, 0], slot: -1, t: 0, born: tSec };
  R.cust.push(c);
}
function walk(c, x, z, dt, sp = 2.8) {
  const ch = c.ch, dx = x - ch.x, dz = z - ch.z, d = Math.hypot(dx, dz);
  if (d < 0.08) { ch.speed = 0; return true; }
  const s = Math.min(d, sp * dt); ch.x += dx / d * s; ch.z += dz / d * s; ch.yawTo = Math.atan2(dx, dz); ch.speed = sp; return false;
}
function outStroll(rt, quiet) {
  const id = rt.nb, ch = nbChar[id] ||= makeChar(NEIGH[id].look), h = W.homes[id]; rt.state = 'out'; ch.x = h.out[0]; ch.z = h.out[1]; ch.sit = false; ch.action = null; ch.speed = 0; ch.root.position.y = 0; ch.arms[1].remove(...ch.arms[1].children.filter(o => o.userData.bag)); scene.add(ch.root);
  const st = { nb: id, ch, t: 0.5, to: null, hang: R.hang, pos: [0, 0, 0] }; R.stroll.push(st); if (!h.edge && !quiet) { ch.pop(4); burst('dust', ch.x, 0.3, ch.z, 4); } return st;
}
function standUp(st) { if (!st.seat) return; st.seat.used = null; const b = st.seat; st.seat = null; st.ch.sit = false; st.ch.root.position.y = 0; st.ch.z += Math.cos(b.yaw) * 0.55; st.ch.x += Math.sin(b.yaw) * 0.55; }
function knock(id) {
  if (R.recado?.to === id) setTimeout(() => recadoDone(id), 1200);
  const rt = R.routine.find(x => x.nb === id), h = W.homes[id], N = NEIGH[id]; sfx('tick'); setTimeout(() => sfx('tick'), 140);
  if (!rt || rt.state === 'out' || R.stroll.some(s2 => s2.nb === id) || R.cust.some(c => c.nb === id)) return ui.toast(`Nadie contesta en casa de ${N.n}. Andará por la plaza.`);
  const wasBack = rt.state === 'back', st = outStroll(rt, false); st.ch.yawTo = st.ch.yaw = Math.atan2(pan.x - st.ch.x, pan.z - st.ch.z); st.t = 5; if (wasBack) { st.home = true; st.to = null; st.t = 99; setTimeout(() => { st.to = [h.out[0], h.out[1]]; }, 400); }
  if (!R.chatted[id]) chat(st); else talk(st, [wasBack ? 'A estas horas ya estoy en zapatillas. ¡Hasta mañana, Pan!' : '¡Ya salgo, ya salgo! Qué prisas.']);
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
  else { c.st = 'leave'; c.path = [[-4.6, 1.3], [-4.6 - c.side, 4.2], [-c.side * 27, 4.4 + Math.random() * 0.5]]; }
}
const WAIT_SPOTS = [[-5.9, 1.7], [-3.3, 1.9], [-2.0, 2.5], [-6.8, 2.6], [-0.7, 1.8], [0.6, 2.6]];
function updateCustomers(dt) {
  // llegadas
  if (R.brb && !miga) { for (const sp of R.spawns) if (sp.t <= R.time + 2) sp.t = R.time + 3; }
  while (R.spawns.length && R.spawns[0].t <= R.time) spawn(R.spawns.shift());
  // vecinos de paseo y Pipa
  // rutinas: salen de casa por la mañana y vuelven al caer la tarde
  for (const rt of R.routine) if (rt.state === 'home' && R.time >= rt.out && R.time < 17.5 * 60 && R.stroll.length < 4 && !R.cust.some(c => c.nb === rt.nb) && !ui.dialogOpen) outStroll(rt);
  for (let si = R.stroll.length - 1; si >= 0; si--) { const st = R.stroll[si]; if (R.time > 18 * 60 && !st.home && !ui.dialogOpen) { st.home = true; standUp(st); const h = W.homes[st.nb]; st.to = [h.out[0], h.out[1]]; st.lost = -30; } if (st.home && !st.to) { scene.remove(st.ch.root); burst('dust', st.ch.x, 0.4, st.ch.z, 5); R.stroll.splice(si, 1); const rt = R.routine.find(x => x.nb === st.nb); if (rt) rt.state = 'back'; } }
  for (const st of R.stroll) { st.t -= dt; if (st.seat && st.t < 0) standUp(st); st.pos[0] = st.ch.x; st.pos[1] = 2.1; st.pos[2] = st.ch.z; if (st.to) { const arrived = walk(st, st.to[0], st.to[1], dt, 1.3); const cp = collide(st.ch.x, st.ch.z, 0.35); st.ch.x = cp[0]; st.ch.z = cp[1]; st.lost = (st.lost || 0) + dt; if (arrived || st.lost > 9) { st.lost = 0; st.to = null; st.t = 7 + Math.random() * 9; st.ch.yawTo = Math.random() * 1.2 - 0.6; if (st.goSeat) { const b = st.goSeat; st.goSeat = null; st.seat = b; st.ch.x = b.x; st.ch.z = b.z; st.ch.yaw = st.ch.yawTo = b.yaw; st.ch.sit = true; st.ch.root.position.y = 0.2; st.ch.speed = 0; st.t = 12 + Math.random() * 10; } } } else if (st.t < 0 && !ui.dialogOpen && !st.seat) { const free = W.benchSeats.filter(b => !b.used && Math.hypot(b.x + 13.9, b.z - 7) > 0.6); if (free.length && Math.random() < 0.4) { const b = pick(free); b.used = st; st.goSeat = b; st.to = [b.x, b.z + (b.yaw ? -0.5 : 0.5) * Math.cos(b.yaw)]; } else { const p = pick(st.hang); st.to = [p[0] + Math.random() - 0.5, p[1] + Math.random() - 0.5]; } } else if (Math.hypot(pan.x - st.ch.x, pan.z - st.ch.z) < 2.6) { st.ch.lookAt = pan; if (!st.hi && !R.chatted[st.nb]) { st.hi = true; emote(st.pos, '♪'); st.ch.act('wave'); } } else st.ch.lookAt = null; updateChar(st.ch, dt); }
  R.gossipT = (R.gossipT || 4) - dt; if (R.gossipT < 0) { R.gossipT = 5 + Math.random() * 5; for (const a of R.stroll) for (const b of R.stroll) if (a !== b && !a.to && !b.to && Math.hypot(a.ch.x - b.ch.x, a.ch.z - b.ch.z) < 3.2 && !ui.dialogOpen) { a.ch.yawTo = Math.atan2(b.ch.x - a.ch.x, b.ch.z - a.ch.z); b.ch.yawTo = Math.atan2(a.ch.x - b.ch.x, a.ch.z - b.ch.z); a.ch.lookAt = b.ch; b.ch.lookAt = a.ch; a.ch.talking = true; setTimeout(() => { a.ch.talking = false; b.ch.talking = true; emote(b.pos, pick(['♪', '!', '…', '♥'])); setTimeout(() => { b.ch.talking = false; }, 900); }, 900); emote(a.pos, pick(['♪', '…', '!'])); blip(NEIGH[a.nb].pitch); a.t = b.t = Math.max(a.t, 3); R.gossipT += 3; break; } }
  if (R.pipa) { if (R.time > 14 * 60 && !ui.modalOpen) { R.pipa = false; scene.remove(pipa.root); burst('dust', pipa.x, 0.5, pipa.z, 8); } else { pipa.lookAt = Math.hypot(pan.x - pipa.x, pan.z - pipa.z) < 4 ? pan : null; updateChar(pipa, dt); } }
  for (let i = R.cust.length - 1; i >= 0; i--) {
    const c = R.cust[i], ch = c.ch; c.t += dt; c.pos[0] = ch.x; c.pos[1] = 2.02 * ch.scale + (ch.L.sp === 'liebre' ? 0.35 : 0.1); c.pos[2] = ch.z; c.bpos[0] = ch.x - 0.62; c.bpos[1] = 1.35 * ch.scale; c.bpos[2] = ch.z;
    ch.root.scale.setScalar(ch.scale * Math.min(1, c.t / 0.4));
    if (c.st === 'enter' || c.st === 'leave' || c.st === 'toSeat') {
      const p = c.path[0]; if (ch.z > 1.1 && Math.abs(ch.x) < 23) { const cp = collide(ch.x, ch.z, 0.3); ch.x = cp[0]; ch.z = cp[1]; c.jam = (c.jam || 0) + dt; if (c.jam > 14) { c.jam = 0; ch.x = p[0]; ch.z = p[1]; } }
      if (walk(c, p[0], p[1], dt, c.st === 'leave' && !c.bought ? 2.4 : 3.0)) {
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
      if (c.st === 'find') { const p = WAIT_SPOTS[c.wspot % WAIT_SPOTS.length]; if (walk(c, p[0], p[1], dt, 2.6)) ch.yawTo = 0.6; }
    } else if (c.st === 'toSlot') {
      const p = W.slots[c.slot]; if (walk(c, p.x, p.z, dt)) { c.st = 'wait'; ch.yawTo = Math.PI / 2 - 0.55; ch.lookAt = pan; showWant(c); ch.pop(3); sfx('pop'); if (!R.firstCust) { R.firstCust = true; } }
    } else if (c.st === 'wait') {
      if (!R.brb) c.wait += dt; ch.speed = 0;
      if (c.bub) { const f = 1 - c.wait / c.max, b = c.bub.querySelector('.wait i'); b.style.width = (f * 100) + '%'; b.style.background = f > 0.5 ? '#7cc47a' : f > 0.22 ? '#f2b84b' : '#e9785e'; }
      if (c.wait > c.max * 0.66 && !c.sighed) { c.sighed = true; emote(c.pos, '…'); ch.say('sad', 1.5); }
      if (c.wait > c.max && !ui.dialogOpen) { say(c, 'Uy, se me hace tarde. ¡Vuelvo otro día!'); R.today.lost++; leave(c); ch.act('sad'); }
    } else if (c.st === 'served') { if (c.t > 1.1 && !ui.dialogOpen) { if (c.linger && R.slots.filter(x => !x).length >= 1 && !R.brb) { c.linger = false; c.st = 'linger'; c.t = 0; ch.lookAt = pan; ch.act('wave'); c.bub = ui.anchor('bub side chatty', `<span class="nm">${NEIGH[c.nb].n}</span><b>¿Tienes un momento?</b>`, c.bpos); sfx('pop'); } else leave(c); } }
    else if (c.st === 'linger') { ch.speed = 0; if (c.t > 15 && !ui.dialogOpen) { ui.unanchor(c.bub); c.bub = null; say(c, 'Bueno, te dejo, que tienes lío. ¡Hasta luego!', 1700); leave(c); } }
    else if (c.st === 'sit') { if (Math.sin(c.t * 2) > 0.95 && Math.random() < 0.1) burst('crumb', ch.x, 1.0, ch.z, 2); if (c.t > 16) { ch.sit = false; c.seat.used = null; c.st = 'leave'; c.path = [[ch.x, ch.z + 1.2], [c.side * -20, 4.4]]; } }
    updateChar(ch, dt);
  }
  // Brasa saca el pan en dorado y cuida el fuego
  if (brasa) {
    R.brasaT = (R.brasaT || 0) - dt; const i = R.oven.findIndex(b => b && b.t >= BAKE.gold0 + 1.6 && b.t < BAKE.gold1);
    if (i >= 0 && R.brasaT <= 0 && mode === 'play' && !tweens.length) { const j = R.cart.findIndex(x => !x), b = R.oven[i]; if (j < 0) { if (!R.brasaFull) { R.brasaFull = true; ui.toast(`${face('brasa')} Brasa: «El carro está lleno, ¡que se me tuesta!»`); } } else { R.brasaFull = false; R.brasaT = 1.5; const q = b.knead * 0.5 + 0.5 >= 0.8 ? 3 : 2; ui.unanchor(b.g); R.oven[i] = null; holderTray(W.ovenSlots[i], null); R.cart[j] = { id: b.id, n: b.n, stage: 'baked', q, burnt: false, tone: 0, tq: b.tq }; W.cartSlots[j].holder.clear(); W.cartSlots[j].holder.add(makeTray(b.id, b.n, 'baked', 0)); brasa.act('give'); brasa.pop(4); brasa.say('happy', 1.5); sfx('pick'); burst('steam', 5.1, 1.6, -4.1, 8); ui.float(`${BREADS[b.id].n} al carro`, 5.9, 2.4, -0.45, 'star'); } }
    if (R.fire < 0.35 && S.wood > 0 && R.brasaT <= 0) { R.brasaT = 2; S.wood--; refreshWood(); R.fire = Math.min(1, R.fire + 0.4); R.fireWarn = false; brasa.act('give'); sfx('fire'); burst('spark', 5.1, 1.5, -4.3, 14, { color: 0xffa040 }); }
    brasa.lookAt = R.oven.some(x => x) ? { x: 5.1, z: -4.5 } : (Math.hypot(pan.x - brasa.x, pan.z - brasa.z) < 3 ? pan : null); updateChar(brasa, dt);
  }
  // Leva repone sola lo que más se pide, con lo que haya en la despensa
  if (leva) {
    if (R.leva) { R.leva.t -= dt; leva.action ||= 'knead'; if (R.leva.t <= 0) { const b = R.leva; R.leva = null; leva.action = null; (R.shelf[b.id] ||= []).push(...Array.from({ length: b.n }, () => ({ q: Math.random() < 0.2 ? 1 : 2, tone: Math.random() * 0.15, s: 0.92 + Math.random() * 0.14 }))); S.baked[b.id] = (S.baked[b.id] || 0) + b.n; refreshBaskets(); leva.act('joy'); leva.say('happy', 1.5); sfx('place'); sfx('pop'); burst('steam', -1.9, 1.4, -3, 8); ui.float(`Leva repone ${b.n} ${BREADS[b.id].pl}`, -1.9, 2.3, -3, 'star'); R.levaT = 6; } }
    else { R.levaT = (R.levaT ?? 10) - dt; if (R.levaT <= 0 && mode === 'play' && R.time < 18.2 * 60 && R.time > 7.3 * 60) { R.levaT = 5; const pend = R.ferm.filter(x => x).length + R.oven.filter(x => x).length + R.cart.filter(x => x && x.stage !== 'wood').length; if (shelfCount() + pend * batchN() < 6 + lvl() * 2) { const opts = S.recipes.filter(id => id !== 'rosca' && canMake(id)).sort((a, b) => ((R.today.by[b] || 0) + (R.antojo === b ? 4 : 0) + priceOf(b) * 0.05 - (R.shelf[b]?.length || 0) * 1.5) - ((R.today.by[a] || 0) + (R.antojo === a ? 4 : 0) + priceOf(a) * 0.05 - (R.shelf[a]?.length || 0) * 1.5)); if (opts.length) { const id = opts[0]; for (const [k, n] of Object.entries(BREADS[id].ing)) S.ing[k] -= n; R.leva = { id, n: batchN(), t: 38 / (1 + trk('horno') * 0.04) }; R.levaDry = false; leva.act('knead'); burst('flour', 2.0, 1.3, -4.4, 8); } else if (!R.levaDry) { R.levaDry = true; ui.toast(`${face('leva')} Leva: «Jefa, la despensa está pelada. Sin harina no hay milagros.»`); } } } }
    leva.lookAt = R.leva ? null : (Math.hypot(pan.x - leva.x, pan.z - leva.z) < 3 ? pan : null); updateChar(leva, dt);
  }
  // Chispa se lleva pan a la fonda
  if (S.staff.chispa && R.repT.length && R.time > R.repT[0]) { R.repT.shift(); let left = 6, got = 0, cnt = 0; const ids = Object.keys(R.shelf).filter(k => k !== 'rosca').sort((a, b) => R.shelf[b].length - R.shelf[a].length); for (const id of ids) while (left > 0 && R.shelf[id].length > 2) { R.shelf[id].shift(); got += Math.round(priceOf(id) * 0.8 * (bond('charca', 5) ? 1.2 : 1)); left--; cnt++; } if (cnt) { S.money += got; R.today.reparto = (R.today.reparto || 0) + got; S.total.earned += got; ui.setMoney(S.money, true); refreshBaskets(); sfx('coin'); ui.toast(`${face('chispa', 'happy')} Chispa lleva ${cnt} panes a la fonda: +${got}`, 'good'); } }
  // Miga despacha sola
  if (miga) {
    R.migaT -= dt; const tgt = mode === 'play' && R.slots.find(c => c && c.st === 'wait' && c.wait > 3 && !(c.nb && (!S.met[c.nb] || (hearts(c.nb) >= 2 && !S.gave[c.nb]))) && (R.shelf[c.want]?.length));
    if (tgt && R.migaT <= 0 && !ui.dialogOpen) { R.migaT = 3.2; miga.yawTo = Math.atan2(tgt.ch.x - miga.x, tgt.ch.z - miga.z); miga.act('give'); miga.pop(4); serve(tgt, true); }
    updateChar(miga, dt);
  }
}
function serve(c, byMiga = false, pickIdx = null, gift = false) {
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
  const lv = S.prices[id] ?? 1, li = pickIdx != null && R.shelf[id][pickIdx] ? pickIdx : R.shelf[id].length - 1, loaf = R.shelf[id][li];
  if (gift) { R.shelf[id].splice(li, 1); refreshBaskets(); c.bought = true; c.st = 'served'; c.t = 0; ui.unanchor(c.bub); c.bub = null; pan.act('give'); pan.say('happy', 1.5); c.ch.act('joy'); c.ch.say('wow', 1.8); sfx('heart'); ui.float('♥ regalo', c.ch.x, 2.3, c.ch.z, 'heart'); addRep(3 + loaf.q); if (c.nb) { gainPts(c.nb, 3); say(c, '¿Para mí? ¡Ay, qué detalle!', 1900); } else say(c, '¡Invita la casa! Volveré con toda la familia.', 1900); cnt('gifts'); save(); return; }
  if (lv === 2 && Math.random() < (loaf.q < 3 ? 0.45 : 0.12)) { say(c, CARO[Math.floor(Math.random() * CARO.length)]); c.ch.act('sad'); R.today.lost++; c.st = 'served'; c.t = 0.3; ui.unanchor(c.bub); c.bub = null; sfx('no'); return; }
  R.shelf[id].splice(li, 1); refreshBaskets();
  const hot = R.antojo === id, ofe = R.oferta === id; let price = Math.round(priceOf(id) * (loaf.burnt ? 0.5 : loaf.old ? 0.6 : 1) * (hot ? 1.25 : 1) * (R.fair ? 1.1 : 1) * (ofe ? 0.9 : 1) * toqueK(loaf.tq)); if (loaf.tq) cnt('toque');
  const tip = (c.wait < 22 ? Math.round(price * 0.12) : 0) + (loaf.q === 3 ? Math.round(price * 0.12) : 0) + (S.up.jardin && Math.random() < 0.3 ? 1 : 0) + (Math.random() < comfort() * 0.12 ? 1 : 0) + (Math.random() < trk('mostrador') * 0.1 ? 1 : 0) + (S.luck?.day === S.day && Math.random() < 0.18 * S.luck.n ? 1 : 0) + (R.clean && Math.random() < 0.3 ? 1 : 0);
  if (loaf.q === 3) cnt('star3'); S.money += price + tip; S.total.sold++; S.total.earned += price + tip; R.today.sold++; R.today.income += price; R.today.tips += tip; R.today.by[id] = (R.today.by[id] || 0) + 1;
  const fav = N && N.favs.includes(id);
  addRep(loaf.burnt || loaf.old ? (loaf.old ? 1 : 0) : loaf.q + (fav ? 2 : 0) + (lv === 0 ? 1 : 0) + (hot ? 1 : 0));
  const ch = c.ch; c.bought = true; c.st = 'served'; c.t = 0; ui.unanchor(c.bub); c.bub = null; if (ofe) addRep(1);
  if (N && !byMiga && R.recado?.to === c.nb) setTimeout(() => recadoDone(c.nb, c), 700);
  else if (N && !byMiga && S.tut >= 7 && !R.lingered[c.nb] && R.time < 18.3 * 60 && Math.random() < 0.42 && !R.cust.some(x => x.st === 'linger')) { R.lingered[c.nb] = true; c.linger = true; }
  if (!byMiga) { pan.act('give'); pan.say('happy', 1.2); }
  const meh = loaf.q === 1 && N && hearts(c.nb) >= 3; ch.act(meh ? 'sad' : loaf.q === 3 || fav ? 'joy' : 'nod'); if (!meh) ch.say(loaf.q === 3 ? 'wow' : 'happy', 1.6); sfx('coin'); if (fav && !N) emote(c.pos, '♪'); else if (loaf.q === 3) emote(c.pos, '★');
  burst('spark', W.register[0], W.register[1], c.ch.z, 8); ui.setMoney(S.money, true);
  ui.float(`+${price}${tip ? ` <small>+${tip}</small>` : ''}${loaf.tq ? ` <small>${ITEMS[loaf.tq].toque.n}</small>` : ''}`, -1.9, 1.9, ch.z, ''); if (loaf.q === 3) burst('crumb', ch.x, 1.3, ch.z, 6);
  // el pan salta de la cesta a su bolsa de papel; las piezas largas asoman por arriba
  const bk = W.basketGroups.find(b => b.shown === id) || W.basketGroups[2], from = new THREE.Vector3(); bk.g.getWorldPosition(from);
  const fl = makeBread(id, loaf.burnt ? 1 : 0); fl.scale.setScalar(0.55); scene.add(fl); flying.push({ o: fl, from: [from.x, from.y + 0.2, from.z], to: ch, t: 0, done: () => {
    const bag = new THREE.Group(), long = ['barra', 'semillas', 'nueces', 'chapata'].includes(id);
    const bm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.13), bagMat()); bm.castShadow = true; bm.frustumCulled = false; bag.add(bm);
    if (long) { const b = makeBread(id, loaf.burnt ? 1 : 0); b.scale.setScalar(0.42); b.rotation.z = Math.PI / 2 - 0.15; b.position.set(0.01, 0.14, 0); bag.add(b); }
    bag.userData.bag = true; bag.position.set(0, -0.44, 0.06); ch.arms[1].add(bag); c.loaf = bag; ch.pop(3); sfx('pop'); } });
  // la caja: cajón, visor y, si despacha Pan, el cobro a tiempo
  W.regOpen = 1; const rg = W.regTex.userData.g; rg.fillStyle = '#fffbe6'; rg.fillRect(0, 0, 128, 64); rg.fillStyle = '#5a3a28'; rg.font = '900 46px ui-monospace, Menlo, monospace'; rg.textAlign = 'center'; rg.fillText(String(price + tip), 64, 48); W.regTex.needsUpdate = true;
  W.tipFill.scale.y = Math.min(1, 0.05 + R.today.tips / 45); W.tipFill.position.y = 0.01 + 0.13 * W.tipFill.scale.y;
  if (!byMiga) { const quick = c.wait < 26 && !c.alt; R.streak = quick ? (R.streak || 0) + 1 : 0; S.cnt.tillBest = Math.max(S.cnt.tillBest || 0, R.streak); const bonus = Math.floor(R.streak / 3); if (bonus) { S.money += bonus; R.today.tips += bonus; S.total.earned += bonus; ui.setMoney(S.money, true); } if (R.streak >= 3) { note(Math.min(10, R.streak)); ui.float(`buen servicio ×${R.streak}${bonus ? ` <small>+${bonus}</small>` : ''}`, W.register[0], W.register[1] + 0.45, W.register[2], 'star'); } sfx('ding'); }
  if (N) {
    const h0 = hearts(c.nb); gainPts(c.nb, 1 + (fav ? 1 : 0) + (loaf.q === 3 ? 1 : 0) + (loaf.tq && S.rw.toques ? 1 : 0));
    if (hearts(c.nb) > h0) { sfx('heart'); ui.float('♥', ch.x, 2.3, ch.z, 'heart'); }
    say(c, N.gracias[Math.floor(Math.random() * N.gracias.length)], 1900);
    if (hearts(c.nb) >= 2 && !S.gave[c.nb]) { S.gave[c.nb] = true; c.t = -1.2; setTimeout(() => talk(c, N.receta, () => unlock(N.gives, N.n)), 1500); }
  } else if (Math.random() < 0.6) say(c, VISIT_LINES[Math.floor(Math.random() * VISIT_LINES.length)], 1600);
  if (S.tut === 5) S.tut = 6;
  checkLogros(); save();
}
let _bag; function bagMat() { if (!_bag) { _bag = pan.legs[0].children[0].material.clone(); _bag.onBeforeCompile = pan.legs[0].children[0].material.onBeforeCompile; _bag.customProgramCacheKey = pan.legs[0].children[0].material.customProgramCacheKey; _bag.color.set('#d9b98a'); _bag.map = null; } return _bag; }
const groupsOf = (id) => { const m = new Map(); (R.shelf[id] || []).forEach((l, i) => { const k = (l.burnt ? 'b' : l.old ? 'o' + l.q : 'q' + l.q) + (l.tq || ''); if (!m.has(k)) m.set(k, { l, n: 0, idx: i }); const g = m.get(k); g.n++; g.idx = i; }); return [...m.values()].sort((a, b) => (b.l.burnt ? 0 : b.l.q + (b.l.old ? -0.5 : 0)) - (a.l.burnt ? 0 : a.l.q + (a.l.old ? -0.5 : 0))); };
const loafName = (l) => l.burnt ? 'Muy tostado' : (l.old ? 'De ayer · ' : '') + ['', 'Normalito', 'Bueno', 'De escaparate'][l.q] + (l.tq ? ' · ' + ITEMS[l.tq].toque.n : '');
function openBasket(id, cust = null) {
  const gs = groupsOf(id); if (!gs.length) return; sfx('page'); const b = BREADS[id], N = cust?.nb ? NEIGH[cust.nb] : null, comp = !!S.up.huerto;
  const sh = ui.modal(`<button class="x">✕</button><h2>${cust ? `¿Cuál le das${N ? ' a ' + N.n : ''}?` : `La cesta de ${b.pl}`}</h2><div class="sub">${cust ? 'Cada pieza sale distinta. La mejor da más cariño y propina; la floja se vende igual, pero no enamora.' : `No hay dos iguales. Lo que no quieras vender puede ir ${comp ? 'al compost del huerto' : 'al cubo'} o a la bolsa de los patos (llevas ${S.duckBag || 0} de 6).`}</div>
    <div class="grid" style="grid-template-columns:repeat(${Math.min(4, gs.length)},1fr)">${gs.map((g, i) => { const pr = Math.round(priceOf(id) * (g.l.burnt ? 0.5 : g.l.old ? 0.6 : 1) * toqueK(g.l.tq)); return `<div class="mue"><img src="${ICON[id]}" style="filter:${g.l.burnt ? 'brightness(.45) saturate(.6)' : g.l.old ? 'saturate(.6) brightness(.95)' : g.l.q === 3 ? 'drop-shadow(0 0 8px #ffd866)' : 'none'}" alt=""><div class="nm">${loafName(g.l)} <span style="color:#d9861c">${g.l.burnt ? '' : '★'.repeat(g.l.q)}</span></div><div class="ds">Quedan ${g.n} · ${pr} ${coin}</div>
      ${cust ? `<div class="btnrow" style="justify-content:center"><button class="btn sm main" data-give="${i}">Dar esta</button><button class="btn sm" data-gift="${i}" title="Sin cobrar">Regalar ♥</button></div>` : `<div class="btnrow" style="justify-content:center"><button class="btn sm" data-duck="${i}" ${(S.duckBag || 0) >= 6 ? 'disabled' : ''}>Para los patos</button><button class="btn sm" data-bin="${i}">${comp ? 'Al compost' : 'Al cubo'}</button></div>`}</div>`; }).join('')}</div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('[data-give]').forEach(x => x.onclick = () => { ui.closeModal(); serve(cust, false, gs[x.dataset.give].idx); });
  sh.querySelectorAll('[data-gift]').forEach(x => x.onclick = () => { ui.closeModal(); serve(cust, false, gs[x.dataset.gift].idx, true); });
  const take = (i) => { const g = gs[i]; R.shelf[id].splice(g.idx, 1); refreshBaskets(); const bk = W.basketGroups.find(q => q.shown === id) || W.basketGroups[2], from = new THREE.Vector3(); bk.g.getWorldPosition(from); const fl = makeBread(id, g.l.burnt ? 1 : g.l.tone || 0); fl.scale.setScalar(0.5); scene.add(fl); return { g, from: [from.x, from.y + 0.2, from.z], fl }; };
  sh.querySelectorAll('[data-bin]').forEach(x => x.onclick = () => { const t = take(x.dataset.bin); ui.closeModal(); W.binOpen = 1.1; pan.yawTo = Math.atan2(W.binPos[0] - pan.x, W.binPos[2] - pan.z); pan.act('give');
    flying.push({ o: t.fl, from: t.from, to: { x: W.binPos[0], z: W.binPos[2] }, off: 0, ty: 0.75, t: 0, done: () => { sfx('place'); burst('crumb', W.binPos[0], 0.9, W.binPos[2], 8); if (comp) { S.compost = (S.compost || 0) + 1; sfx('good'); ui.float('al compost', W.binPos[0], 1.5, W.binPos[2], 'star'); burst('leaf', W.binPos[0], 1.2, W.binPos[2], 3, { color: 0x7ccf7f }); } else { S.rep = Math.max(0, S.rep - 1); updRep(); cnt('trash'); pan.act('sad'); sfx('meh'); ui.float('−1 ♥  tirar pan da pena', W.binPos[0], 1.6, W.binPos[2]); burst('dust', W.binPos[0], 0.8, W.binPos[2], 6, { color: 0x9a8a80 }); } save(); } }); });
  sh.querySelectorAll('[data-duck]').forEach(x => x.onclick = () => { const t = take(x.dataset.duck); ui.closeModal(); S.duckBag = (S.duckBag || 0) + 1; pan.act('give'); flying.push({ o: t.fl, from: t.from, to: pan, off: 0, ty: 0.7, t: 0, done: () => { sfx('pick'); ui.float(`bolsa de los patos: ${S.duckBag}`, pan.x, 2, pan.z, 'star'); save(); } }); });
  ui.onKey = (k) => { if (k === 'q') ui.closeModal(); };
}
// ---------- Don Espino y los patos ----------
let espino = null;
function updateEspino(dt) {
  const on = R.time > 12 * 60 && R.time < 18.6 * 60 && R.weather !== 'lluvia';
  if (on && !R.espino) { espino ||= makeChar(ESPINO.look); const st = W.espinoSeat; espino.x = st.x; espino.z = st.z; espino.yaw = espino.yawTo = st.yaw; espino.sit = true; espino.root.position.y = 0.2; scene.add(espino.root); R.espino = true; }
  if (!on && R.espino && !ui.dialogOpen) { R.espino = false; scene.remove(espino.root); }
  if (R.espino) { espino.lookAt = Math.hypot(pan.x - espino.x, pan.z - espino.z) < 3.5 ? pan : null; updateChar(espino, dt); }
}
function espinoTalk() {
  const say2 = (lines, done) => { cam.zoomTo = 0.5; ui.dialog('Don Espino', lines, { onChar: (k) => { if (k % 2) blip(0.75); }, onLine: (i) => { espino.talking = i >= 0; }, onDone: () => { cam.zoomTo = 0.72; espino.talking = false; done?.(); } }); };
  if (!S.metEspino) { S.metEspino = true; save(); return say2(ESPINO.hola); }
  if (!(S.duckBag > 0)) return say2([pick(ESPINO.charla)]);
  if ((R.fedDucks || 0) >= 3) return say2(['Por hoy ya han comido bastante, que luego no nadan. Mañana más.']);
  S.duckBag--; R.fedDucks = (R.fedDucks || 0) + 1; cnt('ducks'); espino.act('give'); pan.act('give'); W.duckFeedT = 9; sfx('quack'); setTimeout(() => sfx('quack'), 500);
  for (let i = 0; i < 4; i++) setTimeout(() => { const x = W.pondPos[0] + 1.0 + Math.random() * 1.1, z = W.pondPos[1] - 1.2 + Math.random() * 1.6; burst('crumb', x, 1.4, z, 5); setTimeout(() => { burst('steam', x, 0.2, z, 3); sfx('pop'); }, 420); }, i * 260);
  addRep(1); if (S.met.pua) gainPts('pua', 1); S.luck = { day: S.day + 1, n: R.fedDucks }; ui.float('♥', espino.x, 2.3, espino.z, 'heart');
  const dk = Math.min(6, Math.floor((S.cnt.ducks || 0) / 4)); if (dk > (S.ducklings || 0)) { S.ducklings = dk; setTimeout(() => { setDucklings(dk); sfx('fanfare'); ui.toast(`Ha nacido un patito. Ya van ${dk}${dk === 6 ? ', la familia al completo' : ''}.`, 'gold'); }, 2200); }
  setTimeout(() => ui.toast(`${pick(ESPINO.gracias)} Mañana los patos te traerán suerte con las propinas.`, 'good'), 900); checkLogros(); save();
}
const flying = [];
function updateFlying(dt) { for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.t = Math.min(1, f.t + dt / 0.36); const k = f.t, tx = f.to.x + (f.off ?? 0.25), ty = f.ty ?? 0.75, tz = f.to.z; f.o.position.set(f.from[0] + (tx - f.from[0]) * k, f.from[1] + (ty - f.from[1]) * k + Math.sin(k * Math.PI) * 0.55, f.from[2] + (tz - f.from[2]) * k); f.o.rotation.z += dt * 9; f.o.rotation.y += dt * 5; if (f.t >= 1) { scene.remove(f.o); flying.splice(i, 1); f.done(); } } }
function startTill(price) { ui.unanchor(R.till?.g); R.till = { t: 0, price, g: ui.anchor('gauge till', '<div class="tillbar"><div class="zone"></div><i></i></div><div class="tk"><kbd>E</kbd> ¡cobra!</div>', [W.register[0], W.register[1] + 0.25, W.register[2]]) }; }
function updateTill(dt) {
  const T = R.till; T.t += dt / 0.95; T.g.querySelector('i').style.left = Math.min(100, T.t * 100) + '%';
  const end = (won) => {
    ui.unanchor(T.g); R.till = null;
    if (won) { R.streak = (R.streak || 0) + 1; S.cnt.tillBest = Math.max(S.cnt.tillBest || 0, R.streak); const bonus = Math.max(1, Math.round(T.price * 0.15)) + Math.floor(R.streak / 3); S.money += bonus; R.today.tips += bonus; S.total.earned += bonus; ui.setMoney(S.money, true); sfx('ding'); sfx('coin'); note(Math.min(10, R.streak)); W.regOpen = 1; cam.shake = 0.25; hit(0.05); burst('spark', W.register[0], W.register[1] - 0.3, W.register[2], 14); ui.float(`¡Cling! +${bonus}${R.streak > 1 ? ` <small>racha ×${R.streak}</small>` : ''}`, W.register[0], W.register[1] + 0.5, W.register[2], 'star'); pan.pop(3); W.tipFill.scale.y = Math.min(1, 0.05 + R.today.tips / 45); W.tipFill.position.y = 0.01 + 0.13 * W.tipFill.scale.y; if (R.streak === 5 || R.streak === 10) ui.toast(`Racha de caja ×${R.streak}: cada tres seguidas, una moneda más de propina`, 'gold'); }
    else { if (R.streak > 2) ui.float('racha perdida', W.register[0], W.register[1] + 0.4, W.register[2]); R.streak = 0; }
  };
  if (pressE) { pressE = false; end(T.t > 0.6 && T.t < 0.84); } else if (T.t > 1.08) end(false);
}
// ---------- partir leña ----------
function startChop() {
  if (R.carry) return ui.toast('Suelta primero lo que llevas'), sfx('no');
  R.chopping = { t: Math.random() * 3, state: 'aim', k: 0, combo: 0, g: ui.anchor('gauge chop', '<div class="chopbar"><div class="zone"></div><div class="zone2"></div><i></i></div><div class="tk"><kbd>E</kbd> golpea en el centro · muévete para dejarlo</div>', [9.6, 2.5, -2.3]) };
  pan.goto = { x: 8.72, z: -2.15, yaw: Math.PI / 2 + 0.12 }; pan.act('chop'); pan.chopK = 0; W.axe.visible = false; W.stumpLog.visible = true; W.stumpLog.scale.setScalar(1);
  const ax = W.axe.clone(true); ax.visible = true; ax.position.set(0, -0.3, 0.02); ax.rotation.set(1.45, 0, 0); ax.scale.setScalar(1.05); ax.userData.axe = true; pan.arms[1].add(ax); sfx('pick');
}
function endChop() { const C = R.chopping; if (!C) return; ui.unanchor(C.g); R.chopping = null; pan.action = null; pan.arms[1].remove(...pan.arms[1].children.filter(o => o.userData.axe)); W.axe.visible = true; W.stumpLog.visible = false; save(); }
const debris = [];
function updateChop(dt) {
  const C = R.chopping, sp = W.stumpPos; C.t += dt;
  const m = Math.sin(C.t * (3.4 + Math.min(C.combo, 5) * 0.25));
  if (C.state === 'aim') { C.g.querySelector('i').style.left = (50 + m * 46) + '%'; pan.chopK += (0 - pan.chopK) * (1 - Math.exp(-dt * 10)); if (pressE) { C.acc = 1 - Math.abs(m); C.state = 'swing'; C.st = 0; sfx('whoosh'); } }
  else if (C.state === 'swing') {
    C.st += dt / 0.13; pan.chopK = Math.min(1, C.st);
    if (C.st >= 1) {
      const perfect = C.acc > 0.84, ok = C.acc > 0.5, n = (perfect ? 3 : ok ? 2 : 1) + (bond('tejo', 5) ? 1 : 0); if (perfect) { S.cnt.chopRun = (S.cnt.chopRun || 0) + 1; if (S.cnt.chopRun >= 5) S.cnt.chop5 = 1; } else S.cnt.chopRun = 0; S.wood += n; refreshWood(); C.combo = perfect ? C.combo + 1 : 0; cam.shake = perfect ? 0.55 : 0.3; hit(perfect ? 0.09 : 0.04); sfx('place'); sfx(perfect ? 'perfect' : ok ? 'good' : 'meh'); if (perfect) note(Math.min(10, C.combo + 2));
      burst('crumb', sp[0], sp[1] + 0.5, sp[2], perfect ? 16 : 8); burst('dust', sp[0], sp[1] + 0.2, sp[2], 6);
      ui.float(perfect ? `¡Limpio! +3 leña${C.combo > 1 ? ` <small>×${C.combo}</small>` : ''}` : ok ? '+2 leña' : 'Astillado… +1', sp[0], sp[1] + 1.3, sp[2], perfect ? 'star' : '');
      if (ok) { W.stumpLog.visible = false; for (const sd of [-1, 1]) { const h = W.halfProto.clone(true); h.position.set(sp[0], sp[1] + 0.25, sp[2]); h.rotation.y = sd > 0 ? 0 : Math.PI; scene.add(h); debris.push({ o: h, vx: sd * (1.6 + Math.random()), vy: 2.6 + Math.random(), vz: 0.4 - Math.random() * 0.8, t: 0, rz: sd * -5 }); } } else { W.stumpLog.rotation.z = (Math.random() - 0.5) * 0.3; W.stumpLog.scale.set(1, 0.92, 1); }
      C.state = 'rest'; C.st = 0;
    }
  } else { C.st += dt; if (C.st > 0.2) pan.chopK += (0 - pan.chopK) * (1 - Math.exp(-dt * 7)); if (C.st > 0.62) { C.state = 'aim'; W.stumpLog.visible = true; W.stumpLog.rotation.z = 0; W.stumpLog.scale.setScalar(1); burst('dust', sp[0], sp[1] + 0.3, sp[2], 3); sfx('pop'); } }
  pressE = false;
}
function updateDebris(dt) { for (let i = debris.length - 1; i >= 0; i--) { const d = debris[i]; d.t += dt; d.vy -= 9 * dt; d.o.position.x += d.vx * dt; d.o.position.y += d.vy * dt; d.o.position.z += d.vz * dt; d.o.rotation.z += d.rz * dt; if (d.o.position.y < 0.12) { d.o.position.y = 0.12; d.vy *= -0.3; d.vx *= 0.5; d.rz *= 0.4; } if (d.t > 1.3) d.o.scale.multiplyScalar(Math.max(0, 1 - dt * 6)); if (d.t > 1.6) { scene.remove(d.o); debris.splice(i, 1); } } }
function talk(c, lines, done) {
  const N = NEIGH[c.nb]; cam.zoomTo = 0.5; c.ch.say('happy', 1);
  ui.dialog(N.n, lines, { face: XI.face[c.nb], onChar: (k) => { if (k % 2) blip(N.pitch); }, onLine: (i) => { c.ch.talking = i >= 0; if (i >= 0) sfx('pop'); }, onDone: () => { cam.zoomTo = 0.72; c.ch.talking = false; done?.(); } });
}
function unlock(id, from) {
  if (S.recipes.includes(id)) return; if (mode !== 'play') { S.recipes.push(id); save(); ui.toast(`${img(id)}Ficha nueva en la libreta: ${BREADS[id].n}`, 'gold'); return; } S.recipes.push(id); sfx('fanfare'); pan.act('joy'); pan.say('wow', 2); burst('confetti', pan.x, 2, pan.z, 50); save();
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
  const canTr = TRACK_ORDER.some(id => trk(id) < TRACKS[id].max && S.money >= trCost(id));
  const tabs = [['recetas', 'Recetas'], ['vecinos', 'Vecinos'], ['obras', 'Obras' + (canUp ? '<i class="dot"></i>' : '')], ['taller', 'Taller' + (canTr ? '<i class="dot"></i>' : '')], ...VIDA_TABS.map(([k, n]) => [k, n + (k === 'almanaque' && almReady() ? '<i class="dot"></i>' : '')])];
  let left = '', list = [], VT = null;
  if (VIDA_TABS.some(t => t[0] === bookTab)) { VT = vidaTab(bookTab, () => openBook(bookTab, true)); left = VT.left; list = VT.list; if (!list.includes(bookSel[bookTab])) bookSel[bookTab] = VT.sel; } else
  if (bookTab === 'recetas') {
    list = BREAD_ORDER; left = `<h2>Recetas</h2><div class="sub">${S.recipes.length} de ${BREAD_ORDER.length}. Las que faltan las guarda el pueblo.</div><div class="thumbs scroll">` + list.map(id => { const k = S.recipes.includes(id); return `<button class="th ${k ? '' : 'unk'}" data-id="${id}"><span class="stk"><img src="${ICON[id]}" alt=""></span>${k && R.shelf[id]?.length ? `<span class="mini">${R.shelf[id].length}</span>` : ''}</button>`; }).join('') + '</div>';
  } else if (bookTab === 'vecinos') {
    list = NEIGH_ORDER; left = `<h2>Vecinos</h2><div class="sub">Su pan favorito, bien hecho. Con dos corazones te devuelven una receta.</div><div class="thumbs c3 scroll" style="grid-template-columns:repeat(4,1fr)">` + list.map(id => { const k = S.met[id]; return `<button class="th photo ${k ? '' : 'unk'}" data-id="${id}"><span class="stk"><img src="${XI.face[id].idle}" alt=""></span><span class="cap">${k ? NEIGH[id].n : '???'}</span>${k ? `<span class="mini red">♥${hearts(id)}</span>` : ''}</button>`; }).join('') + '</div>';
  } else if (bookTab === 'taller') {
    list = [...TRACK_ORDER, ...STAFF_ORDER]; const tIcon = { horno: XI.up.horno2, bandejas: XI.up.bandeja, ferment: XI.up.fermenta, mostrador: XI.up.t_mostrador, fama: XI.up.t_fama, lena: XI.up.t_lena }, sIcon = (id) => STAFF[id].look ? XI.face[id].happy : XI.up.t_amasadora; openBook.icon = (id) => TRACKS[id] ? tIcon[id] : sIcon(id);
    left = `<h2>Taller</h2><div class="sub">Lo que mejora nivel a nivel y quien te quita trabajo de las manos. Jornales de hoy: ${wages()}.</div><div class="thumbs scroll"><div class="chap">Mejoras por niveles</div>` + TRACK_ORDER.map(id => `<button class="th" data-id="${id}"><span class="stk"><img src="${tIcon[id]}" alt=""></span><span class="mini ${trk(id) >= TRACKS[id].max ? '' : S.money >= trCost(id) ? 'red' : 'grey'}">${trk(id) >= TRACKS[id].max ? '★' : 'nv ' + trk(id)}</span></button>`).join('') + '<div class="chap">El equipo</div>' + STAFF_ORDER.map(id => { const lock = STAFF[id].lvl > L; return `<button class="th ${STAFF[id].look ? 'photo' : ''} ${lock ? 'unk' : ''}" data-id="${id}"><span class="stk"><img src="${sIcon(id)}" alt=""></span>${STAFF[id].look ? `<span class="cap">${lock ? '???' : STAFF[id].n.split(',')[0]}</span>` : ''}${S.staff[id] ? '<span class="mini">✓</span>' : lock ? '' : `<span class="mini ${S.money >= STAFF[id].p ? 'red' : 'grey'}">${STAFF[id].p}</span>`}</button>`; }).join('') + '</div>';
  } else {
    list = UPG_ORDER; left = `<h2>Obras</h2><div class="sub">Lo que ganas vuelve al obrador y a la plaza. La cuadrilla trabaja de noche.</div><div class="thumbs scroll">` + CAPS.map((c, ci) => `<div class="chap">${c}</div>` + list.filter(id => UPG[id].cap === ci).map(id => { const u = UPG[id], lock = (u.lvl || 0) > L; return `<button class="th ${lock ? 'unk' : ''}" data-id="${id}"><span class="stk"><img src="${XI.up[id]}" alt=""></span>${S.up[id] ? '<span class="mini">✓</span>' : S.build.includes(id) ? '<span class="mini gold">⚒</span>' : lock ? '' : `<span class="mini ${S.money >= u.p ? 'red' : 'grey'}">${u.p}</span>`}</button>`; }).join('')).join('') + '</div>';
  }
  if (!list.includes(bookSel[bookTab])) bookSel[bookTab] = bookTab === 'recetas' ? S.recipes[S.recipes.length - 1] : bookTab === 'vecinos' ? (list.find(id => S.met[id]) || list[0]) : bookTab === 'taller' ? list[0] : (list.find(id => !S.up[id] && !S.build.includes(id) && (UPG[id].lvl || 0) <= L) || list[0]);
  const sh = ui.modal(`<div class="btabs">${tabs.map(([k, n]) => `<button class="btab ${k === bookTab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div><button class="x">✕</button>
    <div class="bpage l">${left}<div class="bfoot"><button class="doorsign">Cerrar por hoy</button><span class="grow">${shelfCount() ? `Quedan ${shelfCount()} panes en el mostrador.` : 'El mostrador está vacío.'}</span></div></div><div class="rings"></div><div class="bpage r"></div>
    <div class="hint-keys" style="position:absolute;left:0;right:0;bottom:-46px"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> elegir</span><span><kbd>Tab</kbd> pestaña</span><span><kbd>E</kbd> ${VT ? VT.hint : bookTab === 'obras' ? 'encargar' : bookTab === 'taller' ? 'comprar' : bookTab === 'recetas' ? 'cambiar precio' : 'mirar'}</span><span><kbd>L</kbd> cerrar</span></div>`, 'book');
  if (keep) sh.style.animation = 'none';
  const right = sh.querySelector('.bpage.r'), ths = [...sh.querySelectorAll('.th')];
  const detail = (turn) => {
    const id = bookSel[bookTab]; ths.forEach(t => t.classList.toggle('sel', t.dataset.id === id)); let h = '';
    if (VT) h = VT.detail(id);
    else if (bookTab === 'recetas') {
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
        <div class="lbl">Se le van los ojos con</div><div class="likes">${N.favs.map(f => `<span class="lk ${S.recipes.includes(f) ? '' : 'unk'}" title="${S.recipes.includes(f) ? BREADS[f].n : '???'}"><img src="${ICON[f]}" alt=""></span>`).join('')}</div>${tasteHTML(id)}
        <div class="from"><span class="pic"><img src="${ICON[N.gives]}" style="width:100%;height:100%;margin:0;${S.gave[id] ? '' : 'filter:brightness(0) opacity(.2)'}" alt=""></span><span>${S.gave[id] ? `Te devolvió la ficha de <b>${BREADS[N.gives].n.toLowerCase()}</b>` : 'Guarda una ficha de la abuela. Dos corazones y es tuya.'}</span></div></div>`;
    } else if (bookTab === 'taller') {
      if (TRACKS[id]) { const T = TRACKS[id], lv = trk(id), mx = lv >= T.max, c = trCost(id);
        h = `<div class="det"><div class="big"><div class="blue"><img src="${openBook.icon(id)}" alt=""></div><div><h3>${T.n}</h3><div class="ds">${T.d}</div></div></div>
          <div class="lbl">Nivel ${lv} de ${T.max}</div><div class="pips">${Array.from({ length: T.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
          <div style="display:flex;align-items:center;gap:16px;min-height:64px;margin-top:14px">${mx ? '<span class="sealed">AL MÁXIMO</span>' : `<button class="btn ${S.money >= c ? 'main' : ''}" id="tbuy" ${S.money < c ? 'disabled' : ''}>Subir a nivel ${lv + 1} · ${c} ${coin}</button><span class="ds" style="font:700 16px var(--hand);color:var(--soft)">${S.money >= c ? 'Se nota al momento.' : `Te faltan ${c - S.money}.`}</span>`}</div>
          <div class="from"><span>${id === 'bandejas' ? `Ahora: <b>${batchN()} piezas</b> por hornada` : id === 'fama' ? `Ahora: <b>+${lv}</b> clientes al día` : `Ahora: <b>+${lv * { horno: 8, ferment: 7, mostrador: 8, lena: 12 }[id]} %</b>`}</span><span style="margin-left:auto">En el monedero: <b>${S.money}</b> ${coin}</span></div></div>`; }
      else { const P = STAFF[id], lock = P.lvl > L, own = S.staff[id];
        h = `<div class="det"><div class="big">${P.look ? `<div class="polaroid"><img src="${XI.face[id][own ? 'happy' : 'idle']}" ${lock ? 'style="filter:brightness(0) opacity(.18)"' : ''} alt=""><div class="cap">${lock ? '???' : P.n.split(',')[0]}</div></div>` : `<div class="blue"><img src="${openBook.icon(id)}" alt=""></div>`}<div><h3>${lock ? 'Alguien por contratar' : P.n}</h3><div class="ds">${lock ? `Hace falta más fama: nivel ${P.lvl + 1}, «${REP[P.lvl].n}».` : P.d}</div></div></div>
          <div class="lbl">${P.wage ? `Jornal: ${P.wage} al día` : 'Sin jornal'}</div><div style="display:flex;align-items:center;gap:16px;min-height:64px">${own ? '<span class="sealed">EN EL EQUIPO</span>' : lock ? `<span class="sealed lock">NIVEL ${P.lvl + 1}</span>` : `<button class="btn ${S.money >= P.p ? 'main' : ''}" id="tbuy" ${S.money < P.p ? 'disabled' : ''}>${P.look ? 'Contratar' : 'Comprar'} · ${P.p} ${coin}</button>`}</div>
          <div class="from"><span>Jornales al cierre: <b>${wages()}</b> ${coin}</span><span style="margin-left:auto">En el monedero: <b>${S.money}</b> ${coin}</span></div></div>`; }
    } else {
      const u = UPG[id], lock = (u.lvl || 0) > L, own = S.up[id], wip = S.build.includes(id);
      h = `<div class="det"><div class="big"><div class="blue"><img src="${XI.up[id]}" alt=""></div><div><h3>${lock ? 'Obra por descubrir' : u.n}</h3><div class="ds">${lock ? `La cuadrilla no se fía todavía. Hace falta más fama: nivel ${u.lvl + 1}, «${REP[u.lvl].n}».` : u.d}</div></div></div>
        <div class="lbl">${CAPS[u.cap]}</div><div style="display:flex;align-items:center;gap:16px;min-height:64px">${own && id === 'reforma' ? `<span class="sealed">HECHO</span><span class="seg">${[['miel', 'Miel'], ['mar', 'Mar'], ['fresa', 'Fresa'], ['menta', 'Menta']].map(([k, n]) => `<button class="btn sm ${S.style === k ? 'main' : ''}" data-style="${k}">${n}</button>`).join(' ')}</span>` : own ? '<span class="sealed">HECHO</span>' : wip ? '<span class="sealed wip">EN OBRAS</span><span class="ds" style="font:700 16px var(--hand);color:var(--soft)">Estará mañana al abrir.</span>' : lock ? `<span class="sealed lock">NIVEL ${u.lvl + 1}</span>` : `<button class="btn ${S.money >= u.p ? 'main' : ''}" id="order" ${S.money < u.p ? 'disabled' : ''}>Encargar · ${u.p} ${coin}</button><span class="ds" style="font:700 16px var(--hand);color:var(--soft)">${S.money >= u.p ? 'La cuadrilla viene esta noche.' : `Te faltan ${u.p - S.money}.`}</span>`}</div>
        <div class="from"><span>Obras hechas: <b>${UPG_ORDER.filter(x => S.up[x]).length} de ${UPG_ORDER.length}</b></span><span style="margin-left:auto">En el monedero: <b>${S.money}</b> ${coin}</span></div></div>`;
    }
    right.innerHTML = h; if (turn) { right.classList.remove('turn'); void right.offsetWidth; right.classList.add('turn'); }
    right.querySelectorAll('.ptg').forEach(b => b.onclick = () => { S.prices[id] = Number(b.dataset.lv); sfx('stamp'); save(); detail(); });
    const ob = right.querySelector('#order'); if (ob) ob.onclick = () => orderWork(id);
    right.querySelectorAll('[data-style]').forEach(b => b.onclick = () => { S.style = b.dataset.style; setStyle(S.style); sfx('stamp'); save(); detail(); });
    const tb = right.querySelector('#tbuy'); if (tb) tb.onclick = () => buyTaller(id);
    VT?.bind?.(right, id);
  };
  const choose = (id) => { if (bookSel[bookTab] === id) return; bookSel[bookTab] = id; sfx('tick'); detail(true); };
  ths.forEach(t => { t.onclick = () => choose(t.dataset.id); });
  sh.querySelectorAll('.btab').forEach(b => b.onclick = () => openBook(b.dataset.tab, true));
  sh.querySelector('.x').onclick = () => ui.closeModal(); sh.querySelector('.doorsign').onclick = () => { ui.closeModal(); endDay(); };
  const cols = VT?.cols || 4;
  ui.onKey = (k) => {
    const i = list.indexOf(bookSel[bookTab]), ord = tabs.map(t => t[0]);
    if (k === 'arrowright' || k === 'd') choose(list[Math.min(list.length - 1, i + 1)]); else if (k === 'arrowleft' || k === 'a') choose(list[Math.max(0, i - 1)]);
    else if (k === 'arrowdown' || k === 's') choose(list[Math.min(list.length - 1, i + cols)]); else if (k === 'arrowup' || k === 'w') choose(list[Math.max(0, i - cols)]);
    else if (k === 'tab') openBook(ord[(ord.indexOf(bookTab) + 1) % ord.length], true); else if (k === 'l') ui.closeModal();
    else if (k === 'e' || k === 'enter') { if (VT) VT.act?.(right); else if (bookTab === 'obras') right.querySelector('#order')?.click(); else if (bookTab === 'taller') right.querySelector('#tbuy')?.click(); else if (bookTab === 'recetas' && S.recipes.includes(bookSel.recetas)) { S.prices[bookSel.recetas] = ((S.prices[bookSel.recetas] ?? 1) + 1) % 3; sfx('stamp'); save(); detail(); } }
  };
  detail(!keep ? false : true);
}
function buyTaller(id) {
  const T = TRACKS[id], c = T ? trCost(id) : STAFF[id].p; if (S.money < c || (T ? trk(id) >= T.max : S.staff[id])) return sfx('no');
  S.money -= c; R.today.spent += c; if (T) S.tr[id] = trk(id) + 1; else S.staff[id] = true; ui.setMoney(S.money, true); sfx('stamp'); setTimeout(() => sfx(T ? 'good' : 'fanfare'), 140); save(); applyUpgrades(); openBook('taller', true);
  ui.toast(T ? `${T.n}: nivel ${trk(id)}` : `${STAFF[id].n} ya es del equipo`, 'gold'); if (!T) { pan.act('joy'); burst('confetti', pan.x, 1.8, pan.z, 40); }
}
function orderWork(id) {
  const u = UPG[id]; if (S.money < u.p || S.up[id] || S.build.includes(id)) return sfx('no');
  S.money -= u.p; R.today.spent += u.p; S.build.push(id); ui.setMoney(S.money, true); sfx('stamp'); setTimeout(() => sfx('coin'), 150); save();
  setWip(id, u.at, true); openBook('obras', true);
  ui.toast(`<img src="${XI.up[id]}" alt="">Encargado: ${u.n}. Mañana estará.`, 'gold'); pan.act('joy'); pan.say('happy', 2);
}
function applyUpgrades() {
  for (const id of UPG_ORDER) if (S.up[id]) setUpgrade(id, true);
  if (S.up.reforma) setStyle(S.style);
  for (const id of S.build || []) setWip(id, UPG[id].at, true);
  if (S.staff.brasa && !brasa) { brasa = makeChar(STAFF.brasa.look); brasa.x = 5.95; brasa.z = -3.2; brasa.yaw = brasa.yawTo = -2.55; scene.add(brasa.root); }
  W.mixer.visible = !!S.staff.amasadora;
  if (S.staff.leva && !leva) { leva = makeChar(STAFF.leva.look); leva.x = 2.05; leva.z = -3.55; leva.yaw = leva.yawTo = Math.PI; scene.add(leva.root); }
  if (S.up.miga && !miga) { miga = makeChar(MIGA_LOOK); miga.x = -1.0; miga.z = -3.85; miga.yaw = miga.yawTo = -Math.PI / 2 + 0.4; miga.root.position.y = 0.48; scene.add(miga.root); }
}
function updateReveal(dt) {
  const id = R.reveal[0], u = UPG[id]; R.revT += dt;
  if (R.revT - dt <= 0.9 && R.revT > 0.9) { sfx('fanfare'); burst('confetti', u.at[0], u.at[1] + 1, u.at[2], 70, { spread: 3 }); burst('spark', u.at[0], u.at[1], u.at[2], 24); ui.toast(`<img src="${XI.up[id]}" alt="">¡Obra terminada! ${u.n}`, 'gold'); if (id === 'miga' && miga) miga.act('wave'); if (id === 'huerto') setTimeout(() => ui.toast('Nuevo: entra al huerto por la cancela. Siembra lo de la estación, riega cada día y cosecha. Todo va al zurrón de la libreta', 'good'), 2800); }
  if (R.revT > 3.4 || (pressE && R.revT > 1.2)) { R.reveal.shift(); R.revT = 0; if (!R.reveal.length) mode = 'play'; }
  pressE = false;
}

// ---------- fin del día ----------
function endDay() {
  if (mode !== 'play' || R.ended) return; if (R.fishing) endFish(); checkLogros(); endChop(); ui.unanchor(R.till?.g); R.till = null; R.ended = true; mode = 'summary'; ui.prompt(null);
  // lo ya horneado que quedara en las manos o en el carro cuenta como pan del día
  for (const b of [R.carry, ...R.cart]) if (b && (b.stage === 'baked' || b.stage === 'order')) (R.shelf[b.id] ||= []).push(...Array.from({ length: b.n }, () => ({ q: b.q, burnt: b.burnt })));
  const lostDough = [R.carry, ...R.cart, ...R.ferm, ...R.oven].filter(b => b && b.stage !== 'baked' && b.stage !== 'wood' && b.stage !== 'order').length; if (R.carry?.stage === 'wood') S.wood++; S.wood += R.spare || 0; R.spare = 0;
  const left = shelfCount(), t = R.today, top = Object.entries(t.by).sort((a, b) => b[1] - a[1])[0];
  let stall = 0, gift = 0;
  let kept = 0; if (S.up.puesto) { for (const [id, a] of Object.entries(R.shelf)) stall += a.length * Math.round(priceOf(id) * 0.5); S.money += stall; } else { const fresh = Object.entries(R.shelf).flatMap(([id, a]) => a.filter(x => !x.old && !x.burnt && id !== 'rosca').map(() => id)); S.ayer = fresh.slice(0, 6); kept = S.ayer.length; gift = Math.floor((left - kept) / 2); }
  S.rep += gift; const net0 = t.income + t.tips + stall + (t.orders || 0) + (t.reparto || 0) + (t.zurron || 0) - t.spent; const tom = vidaTomorrow(); const inter = Math.min(30, Math.floor((S.lata || 0) * 0.04)); S.lata = (S.lata || 0) + inter; const wg = Math.min(S.money, wages()); S.money -= wg; delete S.mid; const net = net0 - wg;
  ui.fade(0.5); music('eve');
  R.showSum = () => {
    if (ui.dialogOpen) return;
    const rows = [['Panes vendidos', t.sold], ['Ventas', '+' + t.income], ['Propinas', '+' + t.tips]]; if (stall) rows.push(['Puesto de la plaza', '+' + stall]); rows.push(['Colmado, obras y casa', '−' + t.spent]); if (t.orders) rows.splice(3, 0, ['Encargos', '+' + t.orders]); if (t.reparto) rows.splice(3, 0, ['Reparto a la fonda', '+' + t.reparto]); if (t.zurron) rows.splice(3, 0, ['Zurrón y feria', '+' + t.zurron]); if (wg) rows.push(['Jornales del equipo', '−' + wg]); if (inter) rows.push(['La lata de la abuela', '+' + inter + ' dentro']);
    let d = 0.5; const line = (a, b, cls = '') => `<div class="rl ${cls}" style="animation-delay:${(d += 0.32).toFixed(2)}s"><span>${a}</span><span>${b}</span></div>`;
    const note = `${t.lost ? `${t.lost} ${t.lost === 1 ? 'persona se fue' : 'personas se fueron'} sin pan. Mañana, más masa. ` : t.sold ? 'Nadie se fue con las manos vacías. ' : 'Hoy el mostrador ha estado tranquilo. '}${left ? (S.up.puesto ? `Los ${left} panes que sobraban se vendieron en el puesto.` : `Sobraron ${left}: ${kept ? `guardas ${kept} para venderlos mañana como pan de ayer, más baratos` : ''}${kept && left > kept ? ' y ' : ''}${left > kept ? `dejas ${left - kept} en el banco de la plaza${gift ? ` (+${gift} ♥)` : ''}` : ''}.`) : ''}${lostDough ? ' La masa a medias no aguanta la noche; mañana será otra.' : ''}`;
    const sh = ui.modal(`<img class="logo-s" src="${logoURL()}" alt=""><div class="rh">CIERRE DE CAJA · DÍA ${S.day}${top ? `<br>lo más pedido: ${BREADS[top[0]].n.toLowerCase()}` : ''}</div>
      ${rows.map(r => line(r[0], r[1])).join('')}${line('BALANCE', (net >= 0 ? '+' : '−') + Math.abs(net) + ' ' + coin, 'tot')}${line('Cariño del pueblo', '+' + (t.rep + gift) + ' ♥')}
      <div class="rl note" style="animation-delay:${(d += 0.4).toFixed(2)}s">${note}</div>${tom.length ? `<div class="rl tom" style="animation-delay:${(d += 0.4).toFixed(2)}s"><b>MAÑANA</b>${tom.map(x => `<span>${x}</span>`).join('')}</div>` : ''}<button class="btn main" style="animation-delay:${(d + 0.5).toFixed(2)}s">A dormir</button>`, 'receipt');
    for (let i = 0; i < rows.length + 2; i++) setTimeout(() => sfx('tick'), 820 + i * 320);
    setTimeout(() => { if (!sh.isConnected) return; sfx('stamp'); const st = document.createElement('div'); st.className = 'stamp'; st.textContent = net >= 0 ? 'BUEN DÍA' : 'CAJA CERRADA'; sh.append(st); }, 900 + (rows.length + 2) * 320);
    let gone = false; const go = () => { if (gone) return; gone = true; R.showSum = null; ui.closeModal(); ui.fade(1); setTimeout(() => { S.day++; startDay(); ui.fade(0); }, 800); };
    sh.querySelector('.btn').onclick = go; ui.onKey = (k) => { if (k === 'e' || k === 'enter') go(); };
  }; setTimeout(R.showSum, 700);
}

// ---------- la Hornada ----------
function startFiesta() {
  S.fiesta = true; S.hornadas = (S.hornadas || 0) + 1; S.lastFiesta = S.day; save(); mode = 'fiesta'; ui.show('#hud', false); ui.prompt(null); ui.clearWorld(); ui.fade(1); music(null);
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
  if (R.fishing) return null; { const va = vidaAction(px, pz, c); if (va) return va; if (R.zone === 'huerta') return null; }
  if (R.zone === 'rio') { const Z = W.zones.rio; if (Math.hypot(px - Z.st.muelle[0], pz - Z.st.muelle[1]) < 1.3) return { text: 'Echar la caña', pos: [Z.bob[0], 1.5, Z.bob[1] + 1.2], fn: startFish }; if (Math.hypot(px - Z.st.salir[0], pz - Z.st.salir[1]) < 1.2) return { text: 'Volver al pueblo', pos: [Z.st.salir[0], 1.2, Z.st.salir[1]], fn: () => travel(null) }; return null; }
  if (R.zone === 'fonda' || R.zone === 'molino') {
    const Z = W.zones[R.zone], near = (k, d = 1.5) => Math.hypot(px - Z.st[k][0], pz - Z.st[k][1]) < d, n = zoneCh[R.zone]?.[0];
    if (R.zone === 'fonda' && near('charca')) return { text: c?.stage === 'baked' ? 'Ofrecerle la bandeja a Charca' : 'Hablar con Charca', pos: [Z.npc[0], 2.3, Z.npc[1] + 0.8], fn: openFonda, cust: n && { ch: n } };
    if (R.zone === 'molino' && near('tejo')) return { text: 'Hablar con Tejo', pos: [Z.npc[0], 2.3, Z.npc[1]], fn: openMolino, cust: n && { ch: n } };
    if (near('salir', 1.2)) return { text: 'Volver al pueblo', pos: [Z.st.salir[0], 1.2, Z.st.salir[1]], fn: () => travel(null) };
    return null;
  }
  if (R.zone === 'home') {
    const H = W.home.st, near = (k, d = 1.25) => Math.hypot(px - H[k][0], pz - H[k][1]) < d;
    if (near('cama')) return R.time < 12 * 60 ? { text: 'Tu cama. Aún es pronto para acostarse', ok: false, pos: [62.4, 1.9, -4.7], fn: () => sfx('no') } : { text: 'Acostarse y cerrar el día', pos: [62.4, 1.9, -4.7], fn: endDay, hold: true };
    if (near('lata')) return { text: 'La lata de la abuela', pos: [56.9, 2.0, -5.4], fn: openLata };
    if (near('vitrina')) return { text: 'Vitrina y diario', pos: [59.4, 2.9, -5.8], fn: openVitrina };
    if (near('catalogo')) return { text: 'Hojear el catálogo de muebles', pos: [63.2, 1.6, -1.5], fn: openCatalog };
    if (near('armario')) return { text: 'Abrir el armario', pos: [56.6, 2.7, -3.55], fn: openWardrobe };
    if (near('salir', 1.1)) return { text: 'Salir a la calle', pos: [60, 1.2, -0.3], fn: () => goHome(false) };
    return null;
  }
  if (c?.stage === 'order') { const o = R.orders[c.o], h = W.homes[o.who]; if (Math.hypot(px - h.out[0], pz - h.out[1]) < 1.9) return { text: `Entregar el encargo en casa de ${NEIGH[o.who].n}`, pos: [h.door[0], 2.3, h.door[1]], fn: () => deliverHome(o) }; if (Math.hypot(px - W.boardPos[0], pz - W.boardPos[1]) < 1.9) return { text: 'Dejarlo aquí: que pase a recogerlo (sin propina)', pos: [W.boardPos[0], 2.3, W.boardPos[1]], fn: () => finishOrder(o, false), hold: true }; }
  if (Math.hypot(px - W.boardPos[0], pz - W.boardPos[1]) < 1.9 && !R.zone) {
    const open = R.orders.filter(o => !o.done && !o.out), rdy = open.find(o => ordHave(o) >= o.n), pos = [W.boardPos[0], 2.3, W.boardPos[1]];
    if (rdy && (!c || (c.stage === 'baked' && c.id === rdy.bread && !c.burnt))) return { text: `Preparar el encargo de ${NEIGH[rdy.who].n}${rdy.late ? ' (tarde: media paga)' : ''}`, pos, fn: () => takeOrder(rdy) };
    if (!R.oferta && S.tut >= 7 && !c) return { text: 'Escribir la oferta del día', pos, fn: openOferta };
    if (open.length) { const o = open[0], have = ordHave(o); return { text: `Encargo de ${NEIGH[o.who].n}: llevas ${have} de ${o.n} ${BREADS[o.bread].pl}. Hornea lo que falta y vuelve`, ok: false, pos, fn: () => sfx('no') }; }
  }
  const behind = px > -1.5 && px < -0.35 && pz > -5.4 && pz < -0.4;
  if (behind && c && c.stage === 'baked') return { text: 'Dejar en el mostrador', pos: [-1.9, 1.75, pz], fn: placeBread };
  if (behind && !c) {
    let best = null, bd = 0.8; for (const cu of R.slots) if (cu && cu.st === 'wait') { const d = Math.abs(cu.ch.z - pz); if (d < bd) { bd = d; best = cu; } }
    if (!best) { let lg = null, ld = 1.1; for (const cu of R.slots) if (cu && cu.st === 'linger') { const d = Math.abs(cu.ch.z - pz); if (d < ld) { ld = d; lg = cu; } } if (lg) return { text: `Charlar un momento con ${NEIGH[lg.nb].n}`, pos: [-1.9, 1.75, lg.ch.z], fn: () => lingerChat(lg), face: -Math.PI / 2 + 0.45, cust: lg }; }
    if (best) { const has = R.shelf[best.want]?.length, mix = has && groupsOf(best.want).length > 1; return { pick: has ? best.want : null, text: has ? `Dar ${BREADS[best.want].n.toLowerCase()}${mix ? ' · Q elegir pieza' : ' · Q regalar'}` : (S.met[best.nb] || !best.nb ? `No queda ${BREADS[best.want].n.toLowerCase()}…` : 'Saludar'), pos: [-1.9, 1.75, best.ch.z], fn: () => serve(best), face: -Math.PI / 2 + 0.45, cust: best }; }
  }
  if (behind && !c) { const bk = W.basketGroups.find((b, i) => b.shown && R.shelf[b.shown]?.length && Math.abs(W.baskets[i].z - pz) < 0.42); if (bk) return { text: `Revisar la cesta de ${BREADS[bk.shown].pl}`, pos: [-1.9, 1.75, pz], fn: () => openBasket(bk.shown) }; }
  if (R.espino && Math.hypot(px - espino.x, pz - espino.z) < 1.8) return { text: S.metEspino && S.duckBag > 0 ? `Dar pan a los patos (${S.duckBag} en la bolsa)` : 'Hablar con Don Espino', pos: [espino.x, 2.3, espino.z], fn: espinoTalk, cust: { ch: espino } };
  if (!c && !R.zone) for (const d of R.dirt) if (Math.hypot(px - DIRT_AT[d][0], pz - DIRT_AT[d][1]) < 0.95) return { text: 'Barrer la harina', pos: [DIRT_AT[d][0], 1.2, DIRT_AT[d][1]], fn: () => sweep(d) };
  let bs = null, bd = 1.35; for (const [k, s] of Object.entries(W.st)) { if (k === 'mostrador') continue; const d = Math.hypot(px - s.x, pz - s.z); if (d < bd) { bd = d; bs = k; } }
  if (bs) {
    const s = W.st[bs], pos = [s.ox, bs === 'horno' ? 2.55 : bs === 'ferm' ? 3.05 : 1.9, s.oz + 0.4];
    if (bs === 'lena') return c?.stage === 'wood' ? { text: 'Devolver la leña a la leñera', pos: [8.0, 2.0, -2.9], fn: returnWood } : { text: c ? 'Leñera' : `Coger leña (${S.wood})`, ok: !c && S.wood > 0, pos: [8.0, 2.0, -2.9], fn: takeWood };
    if (bs === 'tocon') return { text: c ? 'Tocón' : 'Coger el hacha y partir leña', ok: !c, pos: [9.6, 1.6, -2.3], fn: startChop };
    if (bs === 'mesa') return { text: c ? 'Manos ocupadas: usa el carro' : 'Amasar', ok: !c, pos, fn: openRecipes, st: s };
    if (bs === 'despensa') return { text: 'Pedir al colmado', pos: [6.0, 2.2, -2.2], fn: openShop, st: s };
    if (bs === 'carro') { const any = R.cart.some(x => x); return { text: c ? 'Dejar la bandeja' : any ? 'Coger la bandeja' : 'Carro de bandejas', ok: !!c || any, pos: [5.9, 2.3, -0.45], fn: useCart, st: s }; }
    if (bs === 'ferm') { const rdy = R.ferm.some(x => x && x.t >= x.need); return { text: c?.stage === 'dough' ? 'Poner a fermentar' : rdy && !c ? 'Sacar la masa' : 'Fermentadora', ok: (c?.stage === 'dough') || (rdy && !c), pos, fn: useFerm, st: s }; }
    if (bs === 'horno') { const any = R.oven.some(x => x); if (c?.stage === 'wood') return { text: R.fire > 0.92 ? 'Dejar el tronco al pie del horno' : 'Echar leña', pos, fn: useOven, st: s }; return { text: c?.stage === 'proofed' ? 'Meter al horno' : any && !c ? 'Sacar del horno' : 'Horno', ok: (c?.stage === 'proofed') || (any && !c), pos, fn: useOven, st: s }; }
  }
  for (const st of R.stroll) if (!st.home && Math.hypot(px - st.ch.x, pz - st.ch.z) < 1.7) { const cg = canGift(st.nb), bd = R.bday === st.nb ? ' 🎂' : ''; if (!R.chatted[st.nb]) return { text: `Charlar con ${NEIGH[st.nb].n}${bd}${cg ? ' · Q regalar' : ''}`, pos: [st.ch.x, 2.3, st.ch.z], fn: () => chat(st), cust: st, gift: cg ? st : null }; if (cg) return { text: `Hacerle un regalo a ${NEIGH[st.nb].n}${bd}`, pos: [st.ch.x, 2.3, st.ch.z], fn: () => openGift(st), cust: st, gift: st }; }
  if (R.pipa && Math.hypot(px - pipa.x, pz - pipa.z) < 1.9) return { text: 'Comprar a Pipa, precio de amiga', pos: [pipa.x, 2.2, pipa.z], fn: () => openShop(0.85) };
  for (const f of R.finds) if (Math.hypot(px - f.x, pz - f.z) < 1.2) return { text: 'Mirar qué brilla', pos: [f.x, 1.1, f.z], fn: () => find(f) };
  if (R.mail && Math.hypot(px - 7.9, pz - 1.5) < 1.6) return { text: 'Abrir el buzón', pos: [7.9, 1.9, 1.5], fn: openMail };
  if (Math.hypot(px - W.homeSpot[0], pz - W.homeSpot[1]) < 1.7) return { text: c ? 'Tu casa. Deja antes la bandeja' : 'Entrar en casa', ok: !c, pos: [12.6, 2.2, -5.3], fn: () => c ? sfx('no') : goHome(true) };
  for (const id of NEIGH_ORDER) { const h = W.homes[id]; if (h && !h.edge && S.met[id] && Math.hypot(px - h.out[0], pz - h.out[1]) < 1.5 && !R.stroll.some(s2 => s2.nb === id && Math.hypot(s2.ch.x - h.out[0], s2.ch.z - h.out[1]) < 2)) return { text: `Llamar a casa de ${NEIGH[id].n}`, pos: [h.door[0], 2.2, h.door[1]], fn: () => knock(id) }; }
  if (Math.hypot(px - W.travel.rio[0], pz - W.travel.rio[1]) < 1.6) return { text: c ? 'Al río, con las manos libres' : 'Bajar al río', ok: !c, pos: [W.travel.rio[0], 1.9, W.travel.rio[1]], fn: () => c ? sfx('no') : travel('rio') };
  for (const [zn, who, name] of [['fonda', 'charca', 'la fonda de Charca'], ['molino', 'tejo', 'el molino de Tejo']]) if (Math.hypot(px - W.travel[zn][0], pz - W.travel[zn][1]) < 1.7) { const okc = zn === 'fonda' || !c; return S.met[who] ? { text: okc ? `Ir a ${name}` : 'Al molino, con las manos libres', ok: okc, pos: [W.travel[zn][0], 1.9, W.travel[zn][1]], fn: () => okc ? travel(zn) : sfx('no') } : { text: `Por ahí se va a ${name.split(' de ')[0]}. Aún no conoces a ${NEIGH[who].n}`, ok: false, pos: [W.travel[zn][0], 1.9, W.travel[zn][1]], fn: () => sfx('no') }; }
  if (Math.hypot(px + 8.2, pz - 1.5) < 1.5) return { text: R.brb ? 'Quitar el «Vuelvo enseguida»' : 'Colgar el «Vuelvo enseguida»', pos: [-7.6, 2.6, 1.5], fn: toggleBrb };
  if (cat.g.visible && Math.hypot(px - cat.x, pz - cat.z) < 1.5 && !c) return { text: 'Acariciar al gato', pos: [cat.x, 1.4, cat.z], fn: () => { cat.purr = 4; pan.act('give'); sfx('heart'); ui.float('♥', cat.x, 1.3, cat.z, 'heart'); if (!R.petted) { R.petted = true; addRep(1); cnt('pets'); checkLogros(); } } };
  if (Math.hypot(px - W.pondPos[0], pz - W.pondPos[1]) < 3.6 && !c) return { text: 'Saludar a los patos', pos: [W.pondPos[0], 1.2, W.pondPos[1]], fn: () => { pan.act('wave'); pan.yawTo = Math.atan2(W.pondPos[0] - px, W.pondPos[1] - pz); sfx('quack'); for (const d of W.ducks) d.a += 0.5; } };
  if (S.up.fuente && Math.hypot(px - W.fountainPos[0], pz - W.fountainPos[1]) < 2.6) return { text: 'Echar una miga a la fuente', pos: [W.fountainPos[0], 2.3, W.fountainPos[1]], fn: () => { pan.act('give'); sfx('pop'); burst('crumb', W.fountainPos[0], 1.2, W.fountainPos[1], 5); burst('spark', W.fountainPos[0], 1.5, W.fountainPos[1], 8); if (!R.wished) { R.wished = true; addRep(1); ui.toast('Dicen que da suerte.'); } } };
  return null;
}
/** Piezas que valen para un encargo: las del mostrador y la bandeja recién horneada que lleve Pan en las manos. */
const ordHave = (o) => (R.shelf[o.bread]?.length || 0) + (R.carry?.stage === 'baked' && R.carry.id === o.bread && !R.carry.burnt ? R.carry.n : 0);
const ordPay = (o) => o.late ? Math.round(o.pay * 0.5) : o.pay;
const hhmm = (h) => Math.floor(h) + ':' + (h % 1 ? '30' : '00');
function drawOrders() {
  const key = R.orders.map(o => o.done ? 'd' : o.out ? 'o' : (o.late ? 'l' : '') + Math.min(o.n, ordHave(o))).join(); R.ordKey = key;
  $('#orders').innerHTML = R.orders.map(o => { const have = o.out ? o.n : Math.min(o.n, ordHave(o)), rdy = !o.done && have >= o.n; return `<div class="ord ${o.done ? 'ok' : rdy ? 'rdy' : o.late ? 'late' : ''}"><span class="pic">${face(o.who, o.done ? 'happy' : 'idle')}</span><div class="oc"><div class="l1">${o.n}×${img(o.bread)}<span class="pg">${o.done ? '✓' : have + '/' + o.n}</span><b>${ordPay(o)}</b><span class="coin sm"></span></div><small>${o.done ? 'entregado' : o.out ? 'Llévaselo a casa: sigue la flecha' : rdy ? '¡Listo! Prepáralo en la pizarra de la entrada' : o.late ? 'se pasó la hora: media paga' : `para ${NEIGH[o.who].n}, antes de las ${hhmm(o.by)}`}</small></div></div>`; }).join('');
}
/** Vigila los encargos: redibuja al cambiar lo horneado y avisa cuando uno ya se puede entregar. */
function watchOrders() {
  if (!R.orders.length) return; const key = R.orders.map(o => o.done ? 'd' : o.out ? 'o' : (o.late ? 'l' : '') + Math.min(o.n, ordHave(o))).join(); if (key === R.ordKey) return; drawOrders();
  for (const o of R.orders) { if (o.out) continue; const rdy = !o.done && ordHave(o) >= o.n; if (rdy && !o.told) { o.told = true; sfx('ding'); ui.toast(`${face(o.who, 'happy')} Ya tienes el encargo de ${NEIGH[o.who].n}: prepáralo en la pizarra de la entrada`, 'gold'); } else if (!rdy) o.told = false; }
}
/** La primera vez que hay un encargo, quien lo pide explica cómo va; después basta un aviso. */
function orderIntro(o, tries = 0) {
  if (!R || R.ended || !R.orders.includes(o)) return; const N = NEIGH[o.who];
  if (S.ordTip) return ui.toast(`${face(o.who)} Hay encargos en la pizarra de la entrada`, 'good');
  if (mode !== 'play' || ui.modalOpen || ui.dialogOpen || R.zone || R.chopping || R.fishing) { if (tries < 40) setTimeout(() => orderIntro(o, tries + 1), 1500); return; }
  S.ordTip = 1; sfx('page');
  ui.dialog(N.n, [`¡Pan! Te he dejado un encargo apuntado: ${o.n} ${BREADS[o.bread].pl} para hoy, antes de las ${hhmm(o.by)}.`, `Hornéalos como siempre. Cuando los tengas, en el mostrador o recién sacados en la bandeja, pásate por la pizarra de la entrada y prepara el pedido.`, `Luego me lo acercas a casa: una flecha te marca la puerta, y el cartel de «Vuelvo enseguida» se cuelga solo mientras estás fuera.`, `Lo llevas apuntado arriba a la izquierda, con lo que te falta. ¡Se paga mejor que en el mostrador, y a domicilio hay propina!`], { face: XI.face[o.who], onChar: (k) => { if (k % 2) blip(N.pitch); }, onDone: () => save() });
}
function setBrb(on, quiet) { if (R.brb === on) return; R.brb = on; W.brb.visible = on; $('#brb').classList.toggle('hide', !on); if (!quiet) sfx(on ? 'place' : 'bell'); }
/** En la pizarra se prepara el pedido: sale del mostrador (o de la bandeja) y Pan se lo lleva a casa de quien lo encargó. */
function takeOrder(o) {
  let need = o.n; const c = R.carry;
  if (c?.stage === 'baked' && c.id === o.bread && !c.burnt) { const take = Math.min(need, c.n); need -= take; S.baked[o.bread] = (S.baked[o.bread] || 0) + take; if (c.n > take) (R.shelf[o.bread] ||= []).push(...Array.from({ length: c.n - take }, () => ({ q: c.q, tone: c.tone || 0, s: 1 }))); }
  if (need > 0) R.shelf[o.bread].splice(-need, need); refreshBaskets(); sfx('stamp'); sfx('pick'); pan.pop(3);
  const h = W.homes[o.who]; if (!h || h.edge) { setCarry(null); return finishOrder(o, false); }
  o.out = true; setCarry({ id: o.bread, n: o.n, stage: 'order', q: 3, o: R.orders.indexOf(o) }); drawOrders();
  if (!R.brb) { setBrb(true, true); R.autoBrb = true; }
  ui.toast(`${face(o.who)} Pedido listo. Llévaselo a casa a ${NEIGH[o.who].n}: sigue la flecha${R.autoBrb ? '. El cartel queda colgado' : ''}`, 'good'); save();
}
const GRACIAS = ['¡A domicilio y todo! Así da gusto. Toma, y quédate con la vuelta.', 'Huele que alimenta. Justo a tiempo: ya tenía la mesa puesta.', '¡Mi pedido! Pasa, pasa… ah, que tienes el horno encendido. Otro día.', 'Calentito todavía. Tu abuela también me lo traía a casa, ¿sabes?'];
function deliverHome(o) {
  const id = o.who, rt = R.routine.find(x => x.nb === id), away = !rt || rt.state === 'out' || R.stroll.some(s2 => s2.nb === id) || R.cust.some(c => c.nb === id);
  setCarry(null); sfx('tick'); setTimeout(() => sfx('tick'), 140); pan.act('give');
  if (away) { ui.toast(`Nadie abre en casa de ${NEIGH[id].n}: le dejas el pedido colgado de la puerta`); return finishOrder(o, false, true); }
  const wasBack = rt.state === 'back', st = outStroll(rt, false), h = W.homes[id]; st.ch.yawTo = st.ch.yaw = Math.atan2(pan.x - st.ch.x, pan.z - st.ch.z); st.t = 6; pan.yawTo = Math.atan2(st.ch.x - pan.x, st.ch.z - pan.z);
  talk(st, [o.late ? 'Más vale tarde que nunca. Gracias por acercarte hasta aquí.' : pick(GRACIAS)], () => { st.ch.act('joy'); finishOrder(o, true, true); if (wasBack) { st.home = true; st.to = [h.out[0], h.out[1]]; } });
}
/** Cobra el encargo. En mano hay propina y más cariño; dejado en la pizarra o en la puerta, lo justo. */
function finishOrder(o, inHand, atHome) {
  if (R.carry?.stage === 'order') setCarry(null); const h = W.homes[o.who], at = atHome && h ? [h.out[0], h.out[1]] : [W.boardPos[0], W.boardPos[1]];
  const tip = inHand && !o.late ? Math.max(2, Math.round(o.pay * 0.15)) : 0, pay = ordPay(o) + tip; o.done = true; o.out = false; S.money += pay; R.today.orders = (R.today.orders || 0) + pay; ui.setMoney(S.money, true); if (!o.late) gainPts(o.who, inHand ? 3 : 2); addRep(o.late ? 2 : o.n + 2 + (inHand ? 2 : 0)); cnt('orders'); if (inHand) cnt('repartos');
  sfx('stamp'); setTimeout(() => sfx('coin'), 160); pan.act('joy'); pan.say('happy', 2); burst('confetti', at[0], 1.6, at[1], 40); ui.float(`+${pay}${tip ? ` <small>propina ${tip}</small>` : ''}`, at[0], 2.2, at[1]);
  ui.toast(`${face(o.who, 'happy')} Encargo de ${NEIGH[o.who].n} entregado${inHand ? ' en mano' : ''}.${o.late ? '' : inHand ? ' +3 ♥' : ' +2 ♥'}`, 'gold'); drawOrders(); save();
}

// ---------- ratos libres: barrer, la oferta del día, charlas y recados ----------
const DIRT_AT = [[0.3, -3.8], [1.5, -3.4], [-0.2, -2.9], [2.4, -3.9], [0.9, -2.5]];
let dirtMesh = null;
function refreshDirt() {
  if (!dirtMesh) dirtMesh = DIRT_AT.map((p, i) => { const g = new THREE.Group(), m = gmat('#fffaf0', { rough: 1, transparent: true, opacity: 0.82 }), r = rnd(31 + i * 7); for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = k ? 0.12 + r() * 0.3 : 0, b = gmesh(GG.cyl(1, 1, 0.012, 14), m, { parent: g, p: [Math.cos(a) * d, 0, Math.sin(a) * d], cast: false }); const sz = k ? 0.1 + r() * 0.16 : 0.3; b.scale.set(sz, 1, sz * (0.7 + r() * 0.5)); } g.position.set(p[0], 0.108, p[1]); g.rotation.y = r() * 6; scene.add(g); return g; });
  dirtMesh.forEach((g, i) => g.visible = !!R && R.dirt.includes(i));
}
function addDirt() { const free = DIRT_AT.map((_, i) => i).filter(i => !R.dirt.includes(i)); if (!free.length || S.day < 2) return; const i = pick(free); R.dirt.push(i); R.clean = false; refreshDirt(); burst('flour', DIRT_AT[i][0], 0.4, DIRT_AT[i][1], 8); }
function sweep(i) {
  R.dirt.splice(R.dirt.indexOf(i), 1); refreshDirt(); const [x, z] = DIRT_AT[i]; pan.yawTo = Math.atan2(x - pan.x, z - pan.z); pan.act('give'); setTimeout(() => pan.act('give'), 260); sfx('whoosh'); setTimeout(() => sfx('whoosh'), 240); burst('flour', x, 0.3, z, 16); burst('dust', x, 0.2, z, 6); addRep(1); cnt('sweeps'); ui.float('♥ limpio', x, 1.2, z, 'heart');
  if (!R.dirt.length && !R.clean) { R.clean = true; setTimeout(() => { sfx('good'); ui.toast('El obrador, como una patena: a la gente se le va la mano con las propinas', 'good'); }, 600); } save();
}
function drawOferta() { let e = $('#oferta'); if (!e) { e = document.createElement('div'); e.id = 'oferta'; $('#chalks').insertBefore(e, $('#orders')); } e.innerHTML = R?.oferta ? `Oferta ${img(R.oferta)}<b>${BREADS[R.oferta].n}</b>` : ''; }
function openOferta() {
  const ids = S.recipes.filter(x => x !== 'rosca' || S.fiesta);
  const sh = ui.modal(`<div class="head"><h2>La oferta del día</h2><div>Lo que escribas en la pizarra se pide más del doble, un pelín más barato, y da cariño. Vienen dos clientes de más. Una vez al día.</div></div><div class="rcards scroll">${ids.map(id => `<button class="rcard" data-id="${id}">${R.antojo === id ? '<span class="hot">hoy se lleva</span>' : ''}<div class="nm">${BREADS[id].n}</div><img class="b" src="${ICON[id]}" alt=""><div class="out">${R.shelf[id]?.length || 0} en el mostrador · ${Math.round(priceOf(id) * 0.9)} ${coin}</div></button>`).join('')}</div><div class="hint-keys"><span><kbd>A</kbd><kbd>D</kbd> elegir</span><span><kbd>E</kbd> escribirla</span><span><kbd>Esc</kbd> ahora no</span></div>`, 'board');
  const picks = [...sh.querySelectorAll('.rcard')]; let sel = Math.max(0, ids.indexOf(R.antojo)); const mark = () => picks.forEach((p, i) => p.classList.toggle('sel', i === sel)); mark();
  const go = (p) => { R.oferta = p.dataset.id; ui.closeModal(); drawOferta(); sfx('stamp'); pan.act('give'); burst('flour', W.boardPos[0], 1.4, W.boardPos[1], 10); for (let i = 0; i < 2; i++) R.spawns.push({ t: Math.min(T_LAST - 12, R.time + 25 + Math.random() * 150), seed: S.day * 100 + 80 + i }); R.spawns.sort((a, b) => a.t - b.t); ui.toast(`${img(R.oferta)}Oferta del día: ${BREADS[R.oferta].n.toLowerCase()}. Que no falte en el mostrador`, 'good'); cnt('ofertas'); save(); };
  picks.forEach((p, i) => { p.onclick = () => go(p); p.onmouseenter = () => { if (sel !== i) { sel = i; mark(); sfx('tick'); } }; });
  ui.onKey = (k) => { if (k === 'arrowright' || k === 'd') sel = (sel + 1) % picks.length; else if (k === 'arrowleft' || k === 'a') sel = (sel + picks.length - 1) % picks.length; else if (k === 'e' || k === 'enter' || k === ' ') return go(picks[sel]); else return; sfx('tick'); mark(); picks[sel].scrollIntoView({ block: 'nearest' }); }; sfx('page');
}
const RECADOS = ['que le guardo sitio en la partida de dominó', 'que ya tengo sus tomates', 'que el jueves hay ensayo de la charanga', 'que le debo una y no se me olvida', 'que se dejó el paraguas en mi casa'];
/** Un vecino que se queda en el mostrador tras comprar: cuenta algo, da una pista de algo que brilla o pide un recado. */
function lingerChat(c) {
  const N = NEIGH[c.nb]; ui.unanchor(c.bub); c.bub = null; c.t = 0; R.chatted[c.nb] = true; let after = null, lines;
  const others = NEIGH_ORDER.filter(id => id !== c.nb && S.met[id]), free = W.findMesh.findIndex(m => !m.visible), x = Math.random();
  if (x < 0.34 && !R.recado && others.length) { const to = pick(others), what = pick(RECADOS); lines = [`¿Me haces un favor, Pan? Si ves a ${NEIGH[to].n}, dile ${what}.`, 'Cuando te pille de paso, sin prisa. ¡Te debo una!']; after = () => { R.recado = { from: c.nb, to, what }; ui.toast(`${face(to)} Recado para ${NEIGH[to].n}: díselo cuando le veas, en el mostrador, de paseo o en su casa`, 'good'); }; }
  else if (x < 0.68 && free >= 0) { const used = R.finds.map(f => f.x + ',' + f.z), sp = pick(W.findSpots.filter(p => !used.includes(p[0] + ',' + p[1]))); lines = [pick(['Viniendo para acá he visto brillar algo en el suelo. Yo no me agacho, que luego no me levanto.', 'Por cierto: algo relucía ahí fuera, entre la hierba. Igual es tuyo.', 'Se le ha debido de caer algo a alguien por la plaza. Brillaba. Ve a mirar cuando puedas.'])]; after = () => { if (!sp) return; W.findMesh[free].visible = true; W.findMesh[free].position.set(sp[0], 0.35, sp[1]); R.finds.push({ x: sp[0], z: sp[1], i: free }); ui.toast('Algo brilla por el pueblo: ve a mirar cuando tengas un rato', 'good'); }; }
  else lines = [pick(N.charla)];
  talk(c, lines, () => { gainPts(c.nb, 1); sfx('heart'); ui.float('♥', c.ch.x, 2.4, c.ch.z, 'heart'); c.ch.act('joy'); cnt('charlas'); after?.(); c.st = 'served'; c.t = 0.6; save(); });
}
function recadoDone(nb, who) {
  const r = R.recado; if (!r || r.to !== nb || ui.dialogOpen && false) return; R.recado = null; gainPts(r.to, 2); gainPts(r.from, 2); S.money += 6; ui.setMoney(S.money, true); cnt('recados'); sfx('heart'); sfx('coin');
  if (who?.ch) { emote(who.pos || [who.ch.x, 2.1, who.ch.z], '!'); who.ch.act('joy'); }
  ui.toast(`${face(nb, 'happy')} Recado dado: «${NEIGH[r.from].n} dice ${r.what}». +2 ♥ con cada uno y 6 de propina`, 'gold'); save();
}
/** Lo que hay por hacer ahora mismo cuando el mostrador está tranquilo. */
function freeTime() {
  if (S.tut < 7 || !R.open || R.carry || R.zone || R.time > 18.6 * 60 || R.slots.some(c => c && (c.st === 'wait' || c.st === 'toSlot')) || R.oven.some(b => b && b.t > BAKE.gold0 - 3) || R.ferm.some(b => b && b.t >= b.need)) { R.freeOn = false; return null; }
  if (R.idleT > 3.5) R.freeOn = true; if (!R.freeOn) return null;
  const out = [], inn = []; const lg = R.slots.find(c => c && c.st === 'linger'); if (lg) inn.push(`${NEIGH[lg.nb].n} quiere charlar en el mostrador`);
  if (R.dirt.length) inn.push('barre la harina del suelo'); if (!R.oferta) inn.push('escribe la oferta del día en la pizarra');
  if (R.recado) out.push(`dale el recado a ${NEIGH[R.recado.to].n}`); if (R.mail) out.push('hay carta en el buzón'); const st = R.stroll.find(x => !R.chatted[x.nb] && !x.home); if (st) out.push(`${NEIGH[st.nb].n} pasea por la plaza`);
  if (R.finds.length) out.push('algo brilla por el pueblo'); if (R.pipa) out.push('Pipa vende barato en la plaza'); if (S.day >= 2 && R.time > 10 * 60) out.push('en el río pican');
  const all = [...inn, ...out].slice(0, 2); if (!all.length) return null; const needOut = all.some(x => out.includes(x)) && !R.brb && !miga;
  return 'Rato libre: ' + all.join(' · ') + (needOut ? ' (B cuelga el cartel)' : '');
}

// ---------- greñado ----------
let TEST_NOSCORE = TEST && !Q.has('score'), GS = null;
/** Antes de meter la bandeja al horno, la cuchilla recorre la masa y hay que cortar justo en cada marca. */
function startScore() {
  const c = R.carry, sweet = !!BREADS[c.id].sweet, long = ['barra', 'semillas', 'nueces', 'chapata'].includes(c.id), marks = sweet ? [0.25, 0.5, 0.75] : long ? [0.17, 0.39, 0.61, 0.83] : [0.26, 0.5, 0.74];
  GS = { id: c.id, long, marks, hits: [], u: -0.22, i: 0, end: 0, col: DOUGH_TINT[c.id] || '#f6e8cb', sp: 0.42 + Math.min(0.14, mastery(c.id) * 0.04) }; mode = 'score'; ui.prompt(null); pan.act('knead'); setTimeout(() => { if (pan.action === 'knead') pan.action = null; }, 400);
  let e = $('#score'); if (!e) { e = document.createElement('div'); e.id = 'score'; e.innerHTML = '<div class="k-title"></div><canvas width="560" height="210"></canvas><div class="sc-word"></div><div class="sc-keys"><span><kbd>E</kbd> cortar en cada marca</span><span><kbd>Esc</kbd> sin greñar</span></div>'; $('#ui').append(e); e.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); scoreKey('e'); }); }
  e.classList.remove('hide'); e.querySelector('.k-title').textContent = 'Greña el pan: corta cuando la cuchilla pase por cada marca'; e.querySelector('.sc-word').textContent = ''; document.body.classList.add('kneading'); sfx('page'); drawScore();
}
function scoreKey(k) {
  const g = GS; if (!g || g.end) return;
  if (k === 'escape') { g.skip = true; return endScore(); }
  if (k !== 'e' && k !== ' ' && k !== 'enter') return; if (g.i >= g.marks.length || g.u < 0) return;
  const err = Math.abs(g.u - g.marks[g.i]), gr = err < 0.022 ? 'p' : err < 0.055 ? 'g' : 'm'; g.hits.push({ u: g.u, gr }); g.i++;
  sfx('squish'); if (gr === 'p') { sfx('perfect'); note(g.i + 2); cam.shake = 0.25; hit(0.04); } else if (gr === 'g') note(g.i); else sfx('meh');
  $('#score .sc-word').textContent = gr === 'p' ? '¡Limpio!' : gr === 'g' ? 'Bien' : 'Torcido…'; if (g.i >= g.marks.length) g.end = 0.001;
}
function updateScore(dt) {
  const g = GS; if (!g) return;
  if (g.end) { g.end += dt; if (g.end > 0.75) endScore(); } else { g.u += dt * g.sp; while (g.i < g.marks.length && g.u > g.marks[g.i] + 0.075) { g.hits.push({ u: g.marks[g.i], gr: 'x' }); g.i++; sfx('meh'); $('#score .sc-word').textContent = 'Se pasó…'; } if (g.i >= g.marks.length || g.u > 1.1) g.end = 0.001; }
  drawScore();
}
function drawScore() {
  const g = GS, cv = $('#score canvas'), x = cv.getContext('2d'), W2 = 560, H2 = 210, cx = W2 / 2, cy = 112, hw = g.long ? 230 : 150, hh = g.long ? 58 : 82;
  x.clearRect(0, 0, W2, H2);
  // tabla enharinada y masa
  x.fillStyle = '#c58a58'; x.beginPath(); x.roundRect(14, 34, W2 - 28, H2 - 44, 26); x.fill(); x.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 7; i++) x.fillRect(14, 48 + i * 22, W2 - 28, 3);
  x.fillStyle = 'rgba(90,50,20,.25)'; x.beginPath(); x.ellipse(cx, cy + 9, hw + 6, hh + 5, 0, 0, 7); x.fill();
  const gr = x.createRadialGradient(cx - hw * 0.3, cy - hh * 0.4, 8, cx, cy, hw); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(0.35, g.col); gr.addColorStop(1, '#d9c39a'); x.fillStyle = gr; x.beginPath(); x.ellipse(cx, cy, hw, hh, 0, 0, 7); x.fill();
  const r = rnd(7); x.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 60; i++) { const a = r() * 6.28, d = Math.sqrt(r()); x.fillRect(cx + Math.cos(a) * d * hw * 0.9, cy + Math.sin(a) * d * hh * 0.85, 2.2, 2.2); }
  const px = (u) => cx - hw * 0.86 + u * hw * 1.72, half = (u) => Math.sqrt(Math.max(0, 1 - Math.pow((px(u) - cx) / hw, 2))) * hh * 0.78;
  // marcas por cortar y cortes dados
  g.marks.forEach((m, i) => { if (i < g.i) return; const X = px(m), h = half(m); x.setLineDash([7, 6]); x.lineWidth = i === g.i ? 5 : 3.5; x.strokeStyle = i === g.i ? '#fff' : 'rgba(255,255,255,.65)'; x.beginPath(); x.moveTo(X - 14, cy + h); x.lineTo(X + 14, cy - h); x.stroke(); x.setLineDash([]); });
  for (const h of g.hits) { if (h.gr === 'x') continue; const X = px(h.u), hf = half(h.u), tw = h.gr === 'm' ? 0.55 : 1; x.lineCap = 'round'; x.strokeStyle = '#8a5a34'; x.lineWidth = 11; x.beginPath(); x.moveTo(X - 14 * tw, cy + hf * tw); x.lineTo(X + 14 * tw, cy - hf * tw); x.stroke(); x.strokeStyle = h.gr === 'p' ? '#ffe9a8' : '#f3dcb4'; x.lineWidth = 5; x.stroke(); }
  // la cuchilla
  if (!g.end) { const X = px(clamp(g.u, -0.12, 1.12)); x.strokeStyle = 'rgba(60,30,10,.35)'; x.lineWidth = 2; x.setLineDash([3, 5]); x.beginPath(); x.moveTo(X, 36); x.lineTo(X, H2 - 12); x.stroke(); x.setLineDash([]); x.save(); x.translate(X, 30); x.rotate(0.5); x.fillStyle = '#dfe6ea'; x.beginPath(); x.moveTo(-5, -4); x.lineTo(7, -4); x.lineTo(2, 24); x.closePath(); x.fill(); x.strokeStyle = '#8c9aa3'; x.lineWidth = 1.5; x.stroke(); x.fillStyle = '#a36b42'; x.beginPath(); x.roundRect(-7, -26, 16, 24, 5); x.fill(); x.restore(); }
}
function endScore() {
  const g = GS, c = R.carry; GS = null; $('#score').classList.add('hide'); document.body.classList.remove('kneading'); mode = 'play';
  const sc = g.skip ? 0.55 : g.hits.reduce((a, h) => a + (h.gr === 'p' ? 1 : h.gr === 'g' ? 0.75 : h.gr === 'm' ? 0.35 : 0.2), 0) / g.marks.length;
  if (c) { c.scored = true; c.score = sc; }
  if (!g.skip) { const all = g.hits.every(h => h.gr === 'p'); ui.toast(`${img(g.id)}${all ? '¡Greñado de libro!' : sc > 0.7 ? 'Buenos cortes' : sc > 0.45 ? 'Cortes pasables' : 'Cortes de principiante… pero es pan'}`, all ? 'gold' : sc > 0.7 ? 'good' : ''); if (all) { cnt('grena'); addRep(1); burst('spark', pan.x, 1.4, pan.z + 0.4, 12); } }
  useOven();
}

function goHome(inside) { travel(inside ? 'home' : null); }
const zoneCh = {};
function travel(to) {
  if (mode !== 'play') return; endChop(); mode = 'move'; ui.prompt(null); ui.fade(1); sfx('whoosh'); const from = R.zone;
  setTimeout(() => {
    R.zone = to; R.inHome = !!to;
    if (to) {
      const Z = W.zones[to]; if (!R.brb && !miga) { toggleBrb(); R.autoBrb = true; } pan.x = Z.enter[0]; pan.z = Z.enter[1]; pan.yaw = pan.yawTo = Z.enter[2]; cam.zoomTo = cam.zoom = Z.zoom;
      if (to === 'home') { applyHomePos(); for (const id of MUE_ORDER) W.home.fur[id].visible = !!S.home[id]; W.home.trophies.clear(); S.recipes.filter(id => mastery(id) > 0).slice(0, 9).forEach((id, i) => { const b = makeBread(id); b.scale.setScalar(0.6); b.position.set(-0.75 + (i % 3) * 0.75, 0.44 + Math.floor(i / 3) * 0.72, 0.05); b.rotation.y = i; W.home.trophies.add(b); }); }
      else if (Z.npc && !zoneCh[to]) { const nb = to === 'fonda' ? 'charca' : 'tejo', ch = makeChar(NEIGH[nb].look); ch.x = Z.npc[0]; ch.z = Z.npc[1]; ch.yaw = ch.yawTo = Z.npc[2]; scene.add(ch.root); zoneCh[to] = [ch]; if (to === 'fonda') [0, 3].forEach((si, k) => { const g = makeChar(randomLook(40 + k * 7)); const st = W.fondaSeats[si]; g.x = st[0]; g.z = st[1]; g.yaw = g.yawTo = st[2]; g.sit = true; scene.add(g.root); zoneCh[to].push(g); }); }
    } else { const Z = W.zones[from]; if (R.autoBrb && R.brb) toggleBrb(); R.autoBrb = false; pan.x = Z.back[0]; pan.z = Z.back[1]; pan.yaw = pan.yawTo = Z.back[2]; cam.zoomTo = cam.zoom = 0.72; }
    frame.snap = true; mode = 'play'; ui.fade(0);
  }, 650);
}
function openFonda() {
  const c = R.carry, tray = c && c.stage === 'baked' && !c.burnt, mult = 0.9 * (bond('charca', 5) ? 1.2 : 1), pay = tray ? Math.round(priceOf(c.id) * c.n * mult * (c.id === R.fondaWant ? 1.5 : 1)) : 0; sfx('page');
  const sh = ui.modal(`<button class="x">✕</button><h2>La fonda de Charca</h2><div class="sub">«Croac. Perdón. ¿Qué me traes?» Hoy el guiso pide <b>${BREADS[R.fondaWant].n.toLowerCase()}</b>: esa bandeja la pago vez y media.</div>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr"><div class="mue"><img src="${ICON[tray ? c.id : R.fondaWant]}" alt=""><div class="nm">Vender la bandeja</div><div class="ds">${tray ? `${c.n} ${BREADS[c.id].pl} al por mayor${c.id === R.fondaWant ? ', y es el pan del guiso' : ''}.` : 'Tráele una bandeja de pan recién hecho en las manos y te la compra entera.'}</div><button class="btn sm ${tray ? 'main' : ''}" id="f-sell" ${tray ? '' : 'disabled'}>${tray ? `Vender · ${pay} ${coin}` : 'Nada que vender'}</button></div>
    <div class="mue"><img src="${XI.item.trucha}" alt=""><div class="nm">Lo del zurrón</div><div class="ds">Huerta, monte y río: Charca lo compra todo para la cocina.${R.wd === 4 ? ' Hoy hay lonja: el pescado, vez y media.' : ''}</div><button class="btn sm main" id="f-fish">Vender del zurrón</button></div>
    <div class="mue ${R.fed ? 'own' : ''}"><img src="${XI.face.charca.happy}" alt=""><div class="nm">Menú del día</div><div class="ds">Potaje, pan y flan. Sales con otro cuerpo: andas un 8 % más ligera hasta la noche.</div>${R.fed ? '<span class="sealed" style="font-size:15px">COMIDA</span>' : `<button class="btn sm ${S.money >= 8 ? 'main' : ''}" id="f-eat" ${S.money < 8 ? 'disabled' : ''}>Comer · 8 ${coin}</button>`}</div></div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
  const sb = sh.querySelector('#f-sell'); if (tray) sb.onclick = () => { S.money += pay; R.today.reparto = (R.today.reparto || 0) + pay; S.total.earned += pay; S.total.sold += c.n; S.baked[c.id] = (S.baked[c.id] || 0) + c.n; gainPts('charca', 1); addRep(c.n); setCarry(null); ui.setMoney(S.money, true); sfx('stamp'); setTimeout(() => sfx('coin'), 150); ui.closeModal(); zoneCh.fonda[0].act('joy'); zoneCh.fonda[0].say('happy', 2); burst('spark', W.fondaPot[0], W.fondaPot[1], W.fondaPot[2], 14); ui.float(`+${pay}`, pan.x, 2, pan.z); checkLogros(); save(); };
  sh.querySelector('#f-fish').onclick = () => openSell('La cocina de Charca', `«Croac. A ver qué traes.» ${R.wd === 4 ? 'Viernes de lonja: el pescado se paga vez y media.' : 'Los viernes hay lonja y el pescado se paga más.'}`, fishK(), 'charca');
  const eb = sh.querySelector('#f-eat'); if (eb) eb.onclick = () => { S.money -= 8; R.today.spent += 8; R.fed = true; ui.setMoney(S.money, true); sfx('good'); pan.act('joy'); pan.say('happy', 2); burst('steam', W.fondaPot[0], W.fondaPot[1], W.fondaPot[2], 10); ui.closeModal(); ui.toast(`${face('charca', 'happy')} «Rebaña, que para eso está el pan.» Andas más ligera`, 'good'); save(); };
}
function openMolino() {
  sfx('page'); const fl = ['harina', 'integral', 'centeno'];
  const sh = ui.modal(`<button class="x">✕</button><h2>El molino de Tejo</h2><div class="sub">«Hmf. Aquí se compra por sacos, no por pellizcos.» Diez de golpe, un cuarto más barato que en el colmado.</div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${fl.map(id => { const p = Math.round(ingPrice(id) * 10 * 0.75); return `<div class="mue"><img src="${XI.ing[id]}" alt=""><div class="nm">${ING[id].n}</div><div class="ds">Saco de 10 · tienes ${S.ing[id] || 0}</div><button class="btn sm ${S.money >= p ? 'main' : ''}" data-b="${id}" data-p="${p}" ${S.money < p ? 'disabled' : ''}>${p} ${coin}</button></div>`; }).join('')}</div>
    <div class="bfoot"><button class="btn" id="m-free" ${R.milled ? 'disabled' : ''}>${R.milled ? 'Ya barriste hoy' : 'Barrer lo que cae de la muela (+2 harina)'}</button><span class="grow">Lo que barras es tuyo, una vez al día.</span></div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const p = Number(b.dataset.p), id = b.dataset.b; if (S.money < p) return sfx('no'); S.money -= p; R.today.spent += p; S.ing[id] = (S.ing[id] || 0) + 10; S.sup.tejo = (S.sup.tejo || 0) + p; ui.setMoney(S.money, true); sfx('stamp'); sfx('poof'); burst('flour', pan.x + 1, 1.2, pan.z - 0.6, 14); gainPts('tejo', 1); save(); ui.closeModal(); ui.toast(`${iimg(id)}+10 ${ING[id].n.toLowerCase()}`, 'good'); });
  sh.querySelector('#m-free').onclick = () => { R.milled = true; S.ing.harina = (S.ing.harina || 0) + 2; sfx('good'); burst('flour', pan.x, 0.6, pan.z, 16); pan.act('give'); ui.closeModal(); ui.toast(`${iimg('harina')}Barres dos puñados de harina buena`, 'good'); save(); };
}
const ROPA = {
  get peto() { return S?.hero === 'isart' ? [['marino', 'Azul marino', '#34466b', () => true, ''], ...PETOS] : PETOS; }, get head() { return S?.hero === 'isart' ? HEAD_I : HEAD_P; },
  tee: [['crema', 'Crema', '#fbf3e3', () => true, ''], ['menta', 'Menta', '#bfe6d8', () => supLvl('pipa') >= 1, 'tarjeta de Pipa a nivel 1'], ['rosa', 'Rosa', '#ffc2c8', () => bond('pua', 3), 'tres corazones con Púa'], ['rayas', 'De rayas', '#e2664f', () => bond('brinco', 3), 'tres corazones con Brinco']],
};
const HEAD_I = [['gorro', 'Gorro de panadero', '#fffdf7', () => true, ''], ['gorra', 'Gorra beige', '#d8c4a0', () => S.day >= 3, 'llegar al día 3'], ['panuelo', 'Pañuelo rojo', '#e2664f', () => S.day >= 5, 'llegar al día 5']];
const ROPA_BASE = {
  peto: [['denim', 'Vaquero', '#5f8fc4', () => true, ''], ['mostaza', 'Mostaza', '#d9a441', () => lvl() >= 2, 'fama nivel 3'], ['verde', 'Verde huerto', '#6fa878', () => S.up.huerto, 'tener el huerto'], ['frambuesa', 'Frambuesa', '#c9556b', () => bond('lana', 3), 'tres corazones con Doña Lana'], ['carbon', 'Carbón', '#4a4654', () => renown() >= 1, 'una estrella de renombre']],
  tee: [['crema', 'Crema', '#fbf3e3', () => true, ''], ['menta', 'Menta', '#bfe6d8', () => supLvl('pipa') >= 1, 'tarjeta de Pipa a nivel 1'], ['rosa', 'Rosa', '#ffc2c8', () => bond('pua', 3), 'tres corazones con Púa'], ['rayas', 'De rayas', '#e2664f', () => bond('brinco', 3), 'tres corazones con Brinco']],
  head: [['nada', 'Sin nada', '#33211c', () => true, ''], ['panuelo', 'Pañuelo rojo', '#e2664f', () => S.day >= 5, 'llegar al día 5'], ['flor', 'Flor en el pelo', '#ff9ac1', () => S.up.jardin, 'tener las jardineras'], ['gorro', 'Gorro de panadera', '#fffdf7', () => lvl() >= 5, 'ser Maestra panadera']],
};
const PETOS = ROPA_BASE.peto, HEAD_P = ROPA_BASE.head;
function panLook() { const k = S.look || {}, f = (slot, id) => ROPA[slot].find(x => x[0] === (id || ROPA[slot][0][0])) || ROPA[slot][0], acc = f('head', k.head)[0]; return { ...(S.hero === 'isart' ? ISART_LOOK : PAN_LOOK), peto: f('peto', k.peto)[2], tee: k.tee === 'rayas' ? '#fbf3e3' : f('tee', k.tee)[2], stripes: k.tee === 'rayas', acc: acc !== 'nada' ? acc : null }; }
function rebuildPan() { const n = makeChar(panLook()), old = pan.root; scene.remove(old); for (const k of ['root', 'body', 'head', 'arms', 'legs', 'tail', 'torso', 'carryAnchor', 'faceMat', 'L']) pan[k] = n[k]; pan._ex = null; scene.add(pan.root); see.m.value = ['gorro', 'gorra'].includes(pan.L.acc) ? 1.05 : 0.15; if (R) setCarry(R.carry); }
function openWardrobe(keep) {
  if (!keep) sfx('page'); pan.goto = null; pan.yawTo = 0.35; cam.zoomTo = 0.4;
  const row = (slot, title) => `<div class="lbl">${title}</div><div class="ropa">${ROPA[slot].map(([id, n, c, ok, how]) => { const has = ok(), on = (S.look[slot] || ROPA[slot][0][0]) === id; return `<button class="rp ${on ? 'on' : ''} ${has ? '' : 'lock'}" data-slot="${slot}" data-id="${id}" ${has ? '' : 'disabled'}><i style="background:${c}"></i><b>${n}</b>${has ? '' : `<small>${how}</small>`}</button>`; }).join('')}</div>`;
  const sh = ui.modal(`<button class="x">✕</button><h2>El armario</h2><div class="sub">Lo que te van regalando y lo que te has ganado.</div>${row('peto', 'El peto')}${row('tee', 'La camiseta')}${row('head', 'En la cabeza')}`, 'paper side');
  const m = sh.parentElement; m.style.background = 'none'; m.style.backdropFilter = 'none'; m.style.placeItems = 'center end'; if (keep) sh.style.animation = 'none';
  ui.onClose = () => { m.style.background = m.style.backdropFilter = m.style.placeItems = ''; cam.zoomTo = 0.62; };
  sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('.rp:not(.lock)').forEach(b => b.onclick = () => { S.look[b.dataset.slot] = b.dataset.id; rebuildPan(); pan.pop(4); pan.act('joy'); pan.say('happy', 1.5); sfx('pop'); burst('spark', pan.x, 1.4, pan.z, 10); save(); ui.onClose = null; openWardrobe(true); });
}
const pmGain = () => Math.max(1, Math.floor(Math.sqrt(Math.max(0, S.total.earned - (S.runBase || 0)) / 250)));
function prestige() {
  const gain = pmGain(); S.pm = (S.pm || 0) + gain; S.runs = (S.runs || 0) + 1; S.runBase = S.total.earned; S.runHornadas = S.hornadas || 0;
  for (const id of UPG_ORDER) { setUpgrade(id, false); setWip(id, UPG[id].at, false); } if (miga) { scene.remove(miga.root); miga = null; } if (brasa) { scene.remove(brasa.root); brasa = null; } if (leva) { scene.remove(leva.root); leva = null; } W.mixer.visible = false;
  Object.assign(S, { money: 30 + S.pm * 25, rep: 0, ing: { harina: 8, levadura: 4 }, up: {}, build: [], tr: {}, staff: {}, lata: 0, wood: 6, ayer: [], prices: {}, style: 'miel' }); delete S.mid; S.day++; save();
  ui.closeModal(); ui.fade(1); sfx('fanfare');
  setTimeout(() => { R.zone = null; R.inHome = false; startDay(true); ui.fade(0); setTimeout(() => letter(['Has traspasado el obrador a Miga y a la cuadrilla, que lo llevarán como tú les enseñaste.', 'Te quedas lo que no se traspasa: las fichas de la abuela, la mano, los amigos, tu casa.', `Y un tarro de masa madre vieja, ${S.pm} ${S.pm === 1 ? 'cucharada' : 'cucharadas'}: todo tu pan vale un ${S.pm * 6} % más y las masas y el horno van un ${S.pm * 4} % más rápido.`, 'En la otra punta de la plaza hay un horno frío. Ya sabes qué hacer.'], `Obrador número ${S.runs + 1}`, () => { ui.dayTitle('Día ' + S.day, 'un horno nuevo que encender'); sfx('day'); }), 500); }, 900);
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
    <div class="lbl">Logros · ${LOGROS.filter(l => S.ach[l[0]]).length} de ${LOGROS.length}</div><div class="logs scroll">${LOGROS.map(([id, n, d, p]) => `<span class="lg ${S.ach[id] ? 'on' : ''}" title="${d}"><b>${S.ach[id] ? '★' : '☆'}</b>${n}<small>${S.ach[id] ? 'conseguido' : d} · ${p}</small></span>`).join('')}</div>
    <div class="lbl">Masa madre vieja${S.pm ? ` · ${S.pm} ${S.pm === 1 ? 'cucharada' : 'cucharadas'}: +${S.pm * 6} % al precio, +${S.pm * 4} % de velocidad` : ''}</div><div style="display:flex;gap:14px;align-items:center;font:700 16px var(--hand);color:var(--soft);line-height:1.25"><span style="flex:1">${(S.hornadas || 0) > (S.runHornadas || 0) ? `Traspasar el obrador y encender otro horno desde cero. Pierdes monedas, despensa, obras, taller, equipo y fama. Conservas recetas, maestría, amistades, casa, ropa y logros. Te llevarías <b>${pmGain()} ${pmGain() === 1 ? 'cucharada' : 'cucharadas'}</b> de masa madre (cuanto más hayas ganado en este obrador, más).` : 'Cuando celebres la Hornada en este obrador podrás traspasarlo y empezar otro con la masa madre de este: es lo que hace que cada obrador rinda más que el anterior.'}</span>${(S.hornadas || 0) > (S.runHornadas || 0) ? '<button class="btn" id="v-pm">Traspasar el obrador</button>' : ''}</div>
    <div class="lbl">El diario</div><div class="statg" style="grid-template-columns:1fr auto 1fr auto"><span>Días en Migas</span><b>${S.day}</b><span>Panes horneados</span><b>${tot}</b><span>Panes vendidos</span><b>${S.total.sold}</b><span>Monedas ganadas</span><b>${S.total.earned}</b><span>Fichas de la abuela</span><b>${S.recipes.length} de 10</b><span>Obras hechas</span><b>${UPG_ORDER.filter(x => S.up[x]).length} de 12</b><span>Renombre</span><b>${'★'.repeat(renown()) || '—'}</b><span>Comodidad de la casa</span><b>${comfort()} de ${MUE_ORDER.length}</b></div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
  const pb = sh.querySelector('#v-pm'); if (pb) pb.onclick = () => { if (pb.dataset.sure) prestige(); else { pb.dataset.sure = 1; pb.textContent = '¿Seguro? Pulsa otra vez'; pb.classList.add('main'); sfx('tick'); } };
}
function applyHomePos() { for (const id of MUE_ORDER) { const g = W.home.fur[id], p = (S.homePos || {})[id] || g.userData.home; g.position.x = p[0]; g.position.z = p[1]; g.rotation.y = p[2]; g.scale.setScalar(1); } }
function startDecor() {
  const own = MUE_ORDER.filter(id => S.home[id]); if (!own.length) return ui.toast('Aún no tienes muebles que mover. Mira el catálogo.'), sfx('no');
  S.homePos ||= {}; R.decor = { own, i: 0 }; pan.goto = null; pan.vx = pan.vz = 0; document.body.classList.add('kneading'); sfx('page');
  R.decor.card = ui.card('<span style="font-size:22px">Colocando: <b id="dc-name"></b></span><small><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> mover · <kbd>R</kbd> girar · <kbd>Q</kbd> siguiente mueble · <kbd>X</kbd> a su sitio · <kbd>E</kbd> listo</small>', 0);
}
function decorKey(k) {
  const D = R.decor, id = D.own[D.i], g = W.home.fur[id];
  if (k === 'q' || k === 'tab') { D.i = (D.i + 1) % D.own.length; sfx('tick'); } else if (k === 'r') { g.rotation.y += Math.PI / 4; sfx('pop'); } else if (k === 'x') { const h = g.userData.home; g.position.x = h[0]; g.position.z = h[1]; g.rotation.y = h[2]; sfx('page'); }
  else if (k === 'e' || k === 'enter' || k === 'escape' || k === ' ') { for (const o of D.own) { const f = W.home.fur[o]; S.homePos[o] = [f.position.x, f.position.z, f.rotation.y]; f.scale.setScalar(1); } D.card.remove(); R.decor = null; document.body.classList.remove('kneading'); sfx('stamp'); save(); ui.toast('Cada cosa en su sitio.', 'good'); }
}
function updateDecor(dt) {
  const D = R.decor, id = D.own[D.i], g = W.home.fur[id]; const nm = document.getElementById('dc-name'); if (nm && nm.textContent !== MUEBLES[id].n) nm.textContent = MUEBLES[id].n;
  let mx = 0, mz = 0; if (keys.has('a') || keys.has('arrowleft')) mx -= 1; if (keys.has('d') || keys.has('arrowright')) mx += 1; if (keys.has('w') || keys.has('arrowup')) mz -= 1; if (keys.has('s') || keys.has('arrowdown')) mz += 1;
  if (id === 'cuadro') { g.position.x = clamp(g.position.x + mx * 2.4 * dt, -3.4, 3.4); } else { g.position.x = clamp(g.position.x + mx * 2.4 * dt, -3.6, 3.6); g.position.z = clamp(g.position.z + mz * 2.4 * dt, -2.5, 2.6); }
  for (const o of D.own) W.home.fur[o].scale.setScalar(o === id ? 1.04 + Math.sin(tSec * 7) * 0.025 : 1);
  marker.visible = true; marker.position.set(60 + g.position.x, (id === 'cuadro' ? 3.1 : 2.3) + Math.sin(tSec * 6) * 0.06, -3 + g.position.z); marker.rotation.y = tSec * 2;
}
function openCatalog(keep) {
  if (!keep) sfx('page');
  const sh = ui.modal(`<button class="x">✕</button><h2>Catálogo «Hogar, dulce horno»</h2><div class="sub">Cada mueble es un punto de comodidad: te levantas más ligera (andas un 3 % más rápido) y con mejor cara (un 4 % más de propinas). Llevas ${comfort()} de ${MUE_ORDER.length} · ${S.money} ${coin}</div>
    <div class="row" style="display:flex;justify-content:flex-end;margin:-8px 0 10px"><button class="btn sm" id="c-move">Recolocar los muebles</button></div>
    <div class="grid scroll">${MUE_ORDER.map(id => { const m = MUEBLES[id], own = S.home[id]; return `<div class="mue ${own ? 'own' : ''}"><img src="${XI.mue[id]}" alt=""><div class="nm">${m.n}</div><div class="ds">${m.d}</div>${own ? '<span class="sealed" style="font-size:15px">EN CASA</span>' : `<button class="btn sm ${S.money >= m.p ? 'main' : ''}" data-buy="${id}" ${S.money < m.p ? 'disabled' : ''}>${m.p} ${coin}</button>`}</div>`; }).join('')}</div>`, 'paper');
  if (keep) sh.style.animation = 'none'; sh.querySelector('.x').onclick = () => ui.closeModal(); sh.querySelector('#c-move').onclick = () => { ui.closeModal(); startDecor(); };
  sh.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const id = b.dataset.buy, m = MUEBLES[id]; if (S.money < m.p) return sfx('no'); S.money -= m.p; R.today.spent += m.p; S.home[id] = true; ui.setMoney(S.money, true); W.home.fur[id].visible = true; const wp = new THREE.Vector3(); W.home.fur[id].getWorldPosition(wp); sfx('stamp'); sfx('fanfare'); burst('confetti', wp.x, 1.6, wp.z, 50); burst('spark', wp.x, 1, wp.z, 16); save(); openCatalog(true); });
}
function openPause() {
  snap(); saveMid();
  const saveCfg = () => { localStorage.setItem('pantastic-cfg', JSON.stringify(CFG)); setVolume(CFG.mus, CFG.sfx); setQuality(CFG.q); };
  const can = mode === 'play' && !R.ended, shot = saves.getShot(slot);
  const sh = ui.modal(`<button class="x">✕</button><h2>Pausa</h2><div class="sub">El obrador espera. Día ${S.day} · ${S.money} ${coin}</div>
    <div class="psave lib-c${slot}"><div class="ph">${shot ? `<img src="${shot}" alt="">` : ''}</div><div class="pi"><b>${saves.nameOf(S, slot)}</b><small id="p-when">Se guarda sola. Recién guardada</small><div class="pb"><button class="btn sm" id="p-save">Guardar ahora</button><button class="btn sm" id="p-redo" ${can ? '' : 'disabled'}>Repetir el día desde la mañana</button></div></div></div>
    <div class="set"><span>Música</span><input type="range" min="0" max="1" step="0.05" value="${CFG.mus}" id="v-m"><span>Efectos</span><input type="range" min="0" max="1" step="0.05" value="${CFG.sfx}" id="v-s"><span>Gráficos</span><span class="seg"><button data-q="alta" class="btn sm ${CFG.q === 'alta' ? 'main' : ''}">Nítidos</button> <button data-q="media" class="btn sm ${CFG.q === 'media' ? 'main' : ''}">Ligeros</button></span></div>
    <div class="lbl">Controles</div><div class="ctl"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>moverse (o clic en el suelo)</span><span><kbd>E</kbd></span><span>acción; mantener para confirmar</span><span><kbd>F</kbd></span><span>mantener: que corra el reloj</span><span><kbd>L</kbd></span><span>libreta</span><span><kbd>B</kbd></span><span>cartel «Vuelvo enseguida»</span><span><kbd>M</kbd></span><span>silenciar</span></div>
    <div class="bfoot"><button class="btn" id="p-title">Cambiar de libreta</button><span class="grow">Tus partidas están en la pantalla de título.</span><button class="btn main" id="p-go">Seguir horneando</button></div>`, 'paper');
  sh.querySelector('.x').onclick = sh.querySelector('#p-go').onclick = () => ui.closeModal(); sh.querySelector('#p-title').onclick = () => { saveMid(); jump(null); };
  sh.querySelector('#p-save').onclick = (e) => { snap(); saveMid(); sfx('stamp'); ui.saved('Guardada'); const b = e.currentTarget; b.textContent = '¡Guardada!'; sh.querySelector('#p-when').textContent = 'Guardada ahora mismo, con foto nueva'; const im = sh.querySelector('.ph'); im.innerHTML = `<img src="${saves.getShot(slot)}" alt="">`; setTimeout(() => { if (b.isConnected) b.textContent = 'Guardar ahora'; }, 1400); };
  const redo = sh.querySelector('#p-redo'); redo.onclick = () => { if (!redo.dataset.sure) { redo.dataset.sure = 1; redo.textContent = '¿Seguro? Se pierde lo de hoy'; redo.classList.add('main'); sfx('tick'); return; } if (saves.rewind(slot, S.day)) { sfx('page'); ui.fade(1); setTimeout(() => jump(slot), 350); } else { sfx('no'); redo.textContent = 'No hay mañana guardada de hoy'; } };
  sh.querySelector('#v-m').oninput = (e) => { CFG.mus = Number(e.target.value); saveCfg(); }; sh.querySelector('#v-s').oninput = (e) => { CFG.sfx = Number(e.target.value); saveCfg(); sfx('pop'); };
  sh.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { CFG.q = b.dataset.q; saveCfg(); sh.querySelectorAll('[data-q]').forEach(x => x.classList.toggle('main', x === b)); });
  ui.onKey = (k) => { if (k === 'e' || k === 'enter') ui.closeModal(); }; sfx('page');
}
function ovenGauge(i, id) { return ui.anchor('gauge timer', `<div class="dial"><div class="ndl"></div>${img(id)}<b></b></div>`, [W.ovenSlots[i].p[0] + (i ? 1.0 : 1.2), W.ovenSlots[i].p[1] + (i ? 0.75 : 1.55), W.ovenSlots[i].p[2] + 0.3]); }
function saveMid() {
  if (mode !== 'play' || !R || R.ended || R.zone) return save();
  const strip = (b) => b && { id: b.id, n: b.n, stage: b.stage, knead: b.knead, q: b.q, burnt: b.burnt, tone: b.tone, t: b.t, need: b.need, tq: b.tq, score: b.score, scored: b.scored, o: b.o };
  S.mid = { day: S.day, time: R.time, shelf: R.shelf, ferm: R.ferm.map(strip), oven: R.oven.map(strip), cart: R.cart.map(strip), carry: strip(R.carry), fire: R.fire, spare: R.spare, dirt: R.dirt, clean: R.clean, oferta: R.oferta, recado: R.recado, lingered: R.lingered, today: R.today, orders: R.orders, chatted: R.chatted, streak: R.streak, mail: R.mail };
  save(); if (Date.now() - lastShot > 40000 && !ui.modalOpen && !ui.dialogOpen) snap();
}
function loadMid() {
  const m = S.mid; if (!m || m.day !== S.day) return; R.time = m.time; R.shelf = m.shelf || {}; R.fire = m.fire ?? 0.7; R.today = m.today; R.orders = m.orders || []; R.chatted = m.chatted || {}; R.streak = m.streak || 0; R.mail = m.mail; R.open = R.time >= T_OPEN; R.spare = m.spare || 0; refreshSpare(); R.dirt = m.dirt || []; R.clean = !!m.clean; R.oferta = m.oferta || null; R.recado = m.recado || null; R.lingered = m.lingered || {}; refreshDirt(); drawOferta(); if (m.carry?.stage === 'order' && !R.brb) { setBrb(true, true); R.autoBrb = true; }
  m.ferm.forEach((b, i) => { if (b) { R.ferm[i] = b; holderTray(W.fermSlots[i], b); } }); m.oven.forEach((b, i) => { if (b) { R.oven[i] = { ...b, look: -1, g: ovenGauge(i, b.id) }; holderTray(W.ovenSlots[i], R.oven[i]); } });
  m.cart.forEach((b, i) => { if (b && b.stage !== 'wood') { R.cart[i] = b; W.cartSlots[i].holder.add(makeTray(b.id, b.n, b.stage, b.burnt ? 1 : b.tone || 0)); } }); if (m.carry) setCarry(m.carry);
  R.spawns = R.spawns.filter(sp => sp.t > R.time + 2); R.repT = R.repT.filter(t => t > R.time); refreshBaskets(); drawOrders(); ui.setTime(R.time);
}
/** Lo que pasó mientras el juego estaba cerrado. */
function awayReport() {
  const h = Math.min(8, (Date.now() - (S.last || Date.now())) / 3600000); if (h < 0.17) return;
  let coins = 0; if (S.up.puesto || S.staff.chispa) coins = Math.round(h * ((lvl() + 1) * 3 + renown() * 2) * (S.up.puesto && S.staff.chispa ? 1.5 : 1));
  const madre = h >= 1, miel = vidaAway(h); if (madre) S.madreBuff = S.day; if (!coins && !madre && !miel) return; S.money += coins; R.madre = madre || R.madre; ui.setMoney(S.money, true); save();
  const txt = Math.floor(h) ? `${Math.floor(h)} h${Math.round((h % 1) * 60) > 5 ? ' y ' + Math.round((h % 1) * 60) + ' min' : ''}` : `${Math.round(h * 60)} min`;
  letter([`Has estado fuera ${txt}.`, coins ? `El ${S.up.puesto ? 'puesto de la plaza' : 'reparto'} siguió vendiendo: +${coins} monedas en la caja.` : 'El obrador ha estado tranquilo.', madre ? 'La masa madre ha tenido tiempo de sobra: hoy las masas suben un 20 % más rápido.' : 'Con una hora fuera, la masa madre coge fuerza y las masas suben antes.', miel].filter(Boolean), 'Mientras no estabas', () => sfx('coin'));
}

function checkLogros() {
  const C = S.cnt, T = S.total, H = NEIGH_ORDER.map(hearts), ok = {
    venta1: T.sold >= 1, v50: T.sold >= 50, v200: T.sold >= 200, v1000: T.sold >= 1000, e500: T.earned >= 500, e3000: T.earned >= 3000, e15000: T.earned >= 15000, s10: (C.star3 || 0) >= 10, s100: (C.star3 || 0) >= 100,
    rec5: S.recipes.length >= 5, rec10: S.recipes.length >= 10, h2: H.every(h => h >= 2), h5: H.some(h => h >= 5), ob6: UPG_ORDER.filter(x => S.up[x]).length >= 6, ob12: UPG_ORDER.every(x => S.up[x]), casa: comfort() >= MUE_ORDER.length, lata: (S.lata || 0) >= 200,
    racha: (C.tillBest || 0) >= 10, hacha: !!C.chop5, gato: (C.pets || 0) >= 5, brillo: (C.finds || 0) >= 20, patos: (C.ducks || 0) >= 12, patitos: (S.ducklings || 0) >= 6, anio: S.day > 28, hornada: (S.hornadas || 0) >= 1, hornada3: (S.hornadas || 0) >= 3, m3: BREAD_ORDER.some(b => mastery(b) >= 3), equipo: STAFF_ORDER.every(x => S.staff[x]) && S.up.miga,
  };
  Object.assign(ok, vidaLogros());
  let k = 0; for (const [id, name, , prize] of LOGROS) if (ok[id] && !S.ach[id]) { S.ach[id] = true; S.money += prize; setTimeout(() => { sfx('fanfare'); ui.setMoney(S.money, true); ui.toast(`★ Logro: ${name} · +${prize} <span class="coin sm"></span>`, 'gold'); }, 900 + 2700 * k++); }
  if (k) save();
}
function toggleBrb() { R.autoBrb = false; R.brb = !R.brb; W.brb.visible = R.brb; $('#brb').classList.toggle('hide', !R.brb); sfx(R.brb ? 'place' : 'bell'); ui.toast(R.brb ? (miga ? 'Cartel puesto. Miga se queda al mando.' : 'Cartel puesto: nadie entra ni se impacienta. A pasear.') : 'Cartel fuera: ¡abierto otra vez!'); }
function chat(st) {
  if (R.recado?.to === st.nb) setTimeout(() => recadoDone(st.nb, st), 600);
  const N = NEIGH[st.nb]; R.chatted[st.nb] = true; st.to = null; st.t = 6; pan.yawTo = Math.atan2(st.ch.x - pan.x, st.ch.z - pan.z);
  const story = hearts(st.nb) >= 4 && !S.story[st.nb]; if (story) S.story[st.nb] = true;
  talk(st, story ? STORY[st.nb] : [pick(N.charla)], () => { if (story) { addRep(3); ui.toast(`${face(st.nb, 'happy')} ${N.n} te ha contado algo que no cuenta a cualquiera. +3 ♥`, 'gold'); } const h0 = hearts(st.nb); gainPts(st.nb, 1); sfx('heart'); ui.float('♥', st.ch.x, 2.4, st.ch.z, 'heart'); st.ch.act('joy'); if (hearts(st.nb) >= 2 && !S.gave[st.nb]) { S.gave[st.nb] = true; setTimeout(() => talk(st, N.receta, () => unlock(N.gives, N.n)), 900); } save(); });
}
function find(f) {
  cnt('finds'); R.finds.splice(R.finds.indexOf(f), 1); W.findMesh[f.i].visible = false; sfx('perfect'); burst('spark', f.x, 0.6, f.z, 14); pan.act('joy');
  if (Math.random() < 0.5) { const n = 2 + Math.floor(Math.random() * 5); S.money += n; ui.setMoney(S.money, true); ui.float(`+${n}`, f.x, 1.4, f.z); ui.toast(`<span class="coin sm"></span> ${pick(HALLAZGO)}`); }
  else { const g = pick(['nueces', 'aceitunas', 'semillas', 'levadura']); S.ing[g] = (S.ing[g] || 0) + 1; ui.float(`+1 ${ING[g].n.toLowerCase()}`, f.x, 1.4, f.z, 'star'); ui.toast(`${iimg(g)}${pick(HALLAZGO)}`); }
  save();
}
function openMail() {
  const m = R.mail, N = NEIGH[m.from]; R.mail = null; sfx('page');
  letter([`Pan:`, m.text, m.gift.coins ? `(Dentro hay ${m.gift.coins} monedas envueltas en papel de periódico.)` : `(Dentro hay ${m.gift.n} de ${ING[m.gift.ing].n.toLowerCase()}.)`, `— ${N.n}`], 'Una carta en el buzón', () => { if (m.gift.coins) { S.money += m.gift.coins; ui.setMoney(S.money, true); sfx('coin'); } else { S.ing[m.gift.ing] = (S.ing[m.gift.ing] || 0) + m.gift.n; sfx('good'); ui.toast(`${iimg(m.gift.ing)}+${m.gift.n} ${ING[m.gift.ing].n.toLowerCase()}`, 'good'); } save(); });
}
function goalText() {
  if (R.zone === 'huerta') { const ps = S.plots.filter((p, i) => p && (i < 8 || S.rw.bancales)), rd = ps.filter(p => p.r).length, dry = ps.filter(p => !p.r && !p.w).length; return [ps.length ? `Huerto: ${rd ? rd + ' para cosechar · ' : ''}${dry ? dry + ' por regar' : rd ? 'lo demás, regado' : 'todo regado. Crecerá esta noche'}` : 'Elige un bancal y siembra algo de la estación', XI.item[ps.find(p => p.r)?.c || 'fresa']]; }
  if (R.fire < 0.3) return ['El fuego flojea: coge leña en la leñera (fuera, a la derecha del obrador) y échala al horno', XI.up.horno2];
  { const oo = R.orders.find(x => x.out && !x.done); if (oo) return [`Lleva el encargo a casa de ${NEIGH[oo.who].n}: sigue la flecha`, ICON[oo.bread]]; const o = S.tut >= 7 && R.orders.find(x => !x.done && ordHave(x) >= x.n); if (o) return [`Encargo de ${NEIGH[o.who].n} listo: prepáralo en la pizarra de la entrada`, ICON[o.bread]]; }
  if (S.tut < 7) return [['Ve a la mesa y prepara tu primera masa', ICON._masa], ['Lleva la masa a la fermentadora (el armario verde)', XI.up.fermenta], ['Cuando suba, llévala al horno', XI.up.horno2], ['Sácala cuando el pan de la barra esté en el dorado', ICON.barra], ['Deja el pan en el mostrador, por detrás', XI.up.bandeja], ['Atiende desde detrás del mostrador a quien venga', XI.face.lana.happy], ['Pide harina y levadura en la despensa: el colmado de Pipa', XI.ing.levadura]][S.tut];
  { const ft = freeTime(); if (ft) return [ft, ICON.hogaza]; }
  if (S.fiesta) { const o = R.orders.find(x => !x.done && !x.late); return o ? [`Encargo de ${NEIGH[o.who].n}: ${o.n} ${BREADS[o.bread].pl}. Se entrega en la pizarra de la entrada`, ICON[o.bread]] : ['Migas ya tiene su Hornada. Sube tu renombre, llena la vitrina y la casa.', ICON.rosca]; }
  if (S.recipes.includes('rosca')) return [`Ten 8 roscas en el mostrador al atardecer (${R.shelf.rosca?.length || 0} de 8)`, ICON.rosca];
  const got = NEIGH_ORDER.filter(id => S.gave[id]).length;
  return [`Gánate a los vecinos: ${got} de 7 fichas de la abuela`, ICON.hogaza];
}

// ---------- quién lleva el obrador ----------
const HEROES = [
  { id: 'pan', n: 'Pan', sub: 'La nieta de la abuela Hogaza', look: PAN_LOOK, quote: '«El horno me habla. Y casi siempre tiene razón.»', tags: ['Tararea al amasar', 'Regala el primer pan', 'No para quieta'], seal: '¡ELEGIDA!', gest: ['wave', 'toss', 'spin', 'knead', 'joy'] },
  { id: 'isart', n: 'Isart', sub: 'El nieto de la abuela Hogaza', look: ISART_LOOK, quote: '«Lo pruebo yo primero. Por control de calidad.»', tags: ['Madruga más que el gallo', 'Bautiza cada masa madre', 'Se ríe de sus chistes'], seal: '¡ELEGIDO!', gest: ['wave', 'hat', 'taste', 'knead', 'joy'] },
];
const heroTx = (() => { const T = [[/Querida Pan/g, 'Querido Isart'], [/mi niña/g, 'mi niño'], [/(, |¡|>|^)Pan(?=[!.?,:»<]|$)/g, '$1Isart'], [/despacha Pan/g, 'despacha Isart'], [/la nieta/g, 'el nieto'], [/\bhija\b/g, 'hijo'], [/chiquilla/g, 'chiquillo'], [/de niña/g, 'de niño'], [/Querida por/g, 'Querido por'], [/Amiga del/g, 'Amigo del'], [/Leñadora fina/g, 'Leñador fino'], [/Maestra panadera/g, 'Maestro panadero'], [/Maestra de/g, 'Maestro de'], [/Buena jefa/g, 'Buen jefe'], [/Jefa\b/g, 'Jefe'], [/jefa\b/g, 'jefe'], [/panadera a la que/g, 'panadero al que'], [/señora panadera/g, 'señor panadero'], [/la panadera/g, 'el panadero'], [/panadera/g, 'panadero'], [/más ligera/g, 'más ligero'], [/precio de amiga/g, 'precio de amigo']]; return (s) => { for (const [a, b] of T) s = s.replace(a, b); return s; }; })();
let PK = null;
/** Selector de protagonista: cae la noche en la plaza, quien está bajo el foco da un paso al frente y hace de las suyas; el otro espera detrás, de brazos cruzados. */
function startPick(i, onDone, onBack) {
  mode = 'pick'; scene.remove(pan.root); ui.prompt(null);
  const chs = HEROES.map((h, k) => { const ch = makeChar(h.look); ch.x = (k ? 1 : -1) * 1.5; ch.z = 2.3; ch.yaw = ch.yawTo = 0; scene.add(ch.root); return ch; });
  const beam = new THREE.Group(), spot = new THREE.SpotLight(0xffe4b0, 0, 18, 0.26, 0.6, 0); spot.position.set(0, 9, 2.6); beam.add(spot, spot.target); spot.target.position.set(0, 0.9, 0);
  const glow = (op) => new THREE.MeshBasicMaterial({ color: 0xffe2a6, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 1.15, 8.6, 40, 1, true), glow(0.05)); cone.position.set(0, 4.4, 0); const disc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), glow(0.12)); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.13; const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.2, 48), glow(0.3)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.135;
  const ball = gmesh(GG.sph(0.14, 14, 10), gmat('#f6e8cb', { rough: 0.9 }), { cast: false }); ball.visible = false; const loaf = makeBread('barra', 0); loaf.scale.setScalar(0.5); loaf.visible = false;
  beam.add(cone, disc, ring); scene.add(beam, ball, loaf);
  PK = { sel: 0, k: 0, t: 0, chs, beam, spot, cone, disc, ring, ball, loaf, bx: -0.6, bz: 3.5, gT: 0.7, gi: 0, oT: 2.5, done: false, sw: 0 };
  cam.zoomTo = 0.43; cam.pitchTo = 0.5; cam.yawTo = 0; chs[1].act('cross');
  const end = () => { for (const ch of chs) scene.remove(ch.root); scene.remove(beam, ball, loaf); PK = null; scene.add(pan.root); cam.pitchTo = 0.25; cam.zoomTo = 1; };
  const pick = (k) => { if (PK.done || k === PK.sel) return; PK.sel = k; PK.gT = 0.75; PK.gi = 0; PK.oT = 2.2; PK.sw = 1; ball.visible = loaf.visible = false; chs[k].action = null; chs[k].pop(5); chs[k].say('wow', 0.8); chs[1 - k].act('sad'); setTimeout(() => { if (PK && PK.sel === k && !PK.done) chs[1 - k].act('cross'); }, 900); sfx('whoosh'); sfx('pop'); cam.shake = 0.18; pickUI.set(k); };
  const pickUI = ui.pick(HEROES.map(h => ({ ...h, face: XI.face[h.id].happy })), {
    onSel: pick,
    onGo: () => { if (PK.done) return; PK.done = true; const ch = chs[PK.sel], ot = chs[1 - PK.sel]; ball.visible = loaf.visible = false; ch.act('joy'); ch.say('wow', 2); ch.pop(6); ot.act('clap'); ot.say('happy', 3); sfx('fanfare'); sfx('stamp'); burst('confetti', ch.x, 2.4, ch.z, 80, { spread: 2.4 }); burst('spark', ch.x, 1.2, ch.z, 30); cam.shake = 0.45; cam.zoomTo = 0.33; setTimeout(() => { ch.act('spin'); sfx('whoosh'); }, 850); setTimeout(() => ch.act('wave'), 1500); setTimeout(() => ui.fade(1), 2100); setTimeout(() => { const hero = HEROES[PK.sel].id; pickUI.close(); end(); cam.zoom = cam.zoomTo = 0.72; onDone(hero); ui.fade(0); }, 2750); },
    onBack: () => { if (PK.done) return; PK.done = true; sfx('page'); pickUI.close(); end(); mode = 'title'; onBack(); },
  });
}
function updatePick(dt) {
  const P = PK; if (!P) return; P.t += dt; P.k += (1 - P.k) * (1 - Math.exp(-dt * 2.4)); P.sw = Math.max(0, P.sw - dt * 2.2);
  const sel = P.chs[P.sel]; P.bx += (sel.x - P.bx) * (1 - Math.exp(-dt * 9)); P.bz += (sel.z - P.bz) * (1 - Math.exp(-dt * 9)); P.beam.position.set(P.bx, 0, P.bz);
  P.spot.intensity = (2.5 + P.sw * 1.6) * P.k; P.cone.material.opacity = (0.055 + Math.sin(P.t * 2.3) * 0.01 + P.sw * 0.05) * P.k; P.disc.material.opacity = 0.13 * P.k; P.ring.material.opacity = (0.3 + Math.sin(P.t * 3) * 0.08) * P.k; P.ring.scale.setScalar(1 + Math.sin(P.t * 3) * 0.015 + P.sw * 0.25);
  if (Math.random() < dt * 4) burst('flour', P.bx + (Math.random() - 0.5) * 1.2, 1.4 + Math.random() * 2.4, P.bz + (Math.random() - 0.5) * 0.8, 1);
  P.chs.forEach((ch, k) => {
    const on = k === P.sel, other = P.chs[1 - k], sd = k ? 1 : -1;
    // quien está bajo el foco da un paso al frente; el otro se queda detrás, a un lado
    const tx = on ? sd * 0.55 : sd * 1.75, tz = on ? 3.55 : 2.2, d = Math.hypot(tx - ch.x, tz - ch.z);
    if (d > 0.04) { const st = Math.min(d, dt * 4.2); ch.x += (tx - ch.x) / d * st; ch.z += (tz - ch.z) / d * st; ch.speed = 2.6; } else ch.speed = 0;
    if (on) {
      ch.yawTo = -sd * 0.1; ch.lookAt = null; if (ch.action === 'cross' || ch.action === 'sad') ch.action = null; if (ch.exprT < 0.2) ch.say('happy', 1.4);
      if (!P.done && d < 0.1) { P.gT -= dt; if (P.gT <= 0) { const g = HEROES[k].gest[P.gi++ % 5]; ch.act(g); P.gest = g; P.gAt = 0; if (g === 'knead') { burst('flour', ch.x, 1.0, ch.z + 0.45, 6); setTimeout(() => { if (ch.action === 'knead') ch.action = null; }, 1300); } if (g === 'joy' || g === 'spin') ch.pop(3); if (g === 'toss' || g === 'spin') sfx('whoosh'); if (g === 'hat' || g === 'taste') sfx('pop'); P.gT = g === 'knead' ? 2.0 : g === 'spin' ? 1.4 : 1.8; } }
      // atrezo del gesto: la bola de masa que sube y baja, y la barra que se prueba
      P.gAt = (P.gAt || 0) + dt; const sc = ch.scale;
      if (P.gest === 'toss' && ch.action === 'toss') { const u = clamp((P.gAt - 0.2) / 0.75, 0, 1); P.ball.visible = true; P.ball.position.set(ch.x, (1.25 + Math.sin(u * Math.PI) * 1.5) * sc, ch.z + 0.32); P.ball.scale.set(1 + Math.sin(u * 14) * 0.08, 1 - Math.sin(u * 14) * 0.08, 1); if (u >= 1 && !P.caught) { P.caught = true; burst('flour', ch.x, 1.3, ch.z + 0.35, 8); sfx('place'); ch.pop(2); } if (u < 1) P.caught = false; } else P.ball.visible = false;
      if (P.gest === 'taste' && ch.action === 'taste') { const kk = Math.min(1, Math.sin(clamp(P.gAt / 1.3, 0, 1) * Math.PI) * 1.7); P.loaf.visible = true; P.loaf.position.set(ch.x + 0.2 - kk * 0.14, (0.75 + kk * 0.42) * sc, ch.z + 0.3 + kk * 0.1); P.loaf.rotation.set(0, 1.1, 0.5 + kk * 0.5); if (kk > 0.98 && Math.random() < dt * 12) burst('crumb', ch.x, 1.15 * sc, ch.z + 0.42, 2); } else P.loaf.visible = false;
    } else {
      ch.yawTo = -sd * 0.55; ch.lookAt = other; if (!P.done && !ch.action && d < 0.1) ch.act('cross');
      P.oT -= dt; if (P.oT <= 0 && !P.done) { P.oT = 3 + Math.random() * 2; ch.say(Math.random() < 0.5 ? 'sad' : 'blink', 1.1); ch.pop(1.5); }
    }
    updateChar(ch, dt);
  });
}

// ---------- bucle ----------
function updatePlay(dt) {
  const busy = ui.modalOpen || ui.dialogOpen;
  if (R.decor) { updateDecor(dt); updateChar(pan, dt); pressE = false; ui.prompt(null); return; }
  // movimiento
  let mx = 0, mz = 0;
  if (!busy && mode === 'play' && !pan.goto) {
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1; if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (keys.has('w') || keys.has('arrowup')) mz -= 1; if (keys.has('s') || keys.has('arrowdown')) mz += 1;
  }
  if (pan.goto) {
    const g = pan.goto, dx = g.x - pan.x, dz = g.z - pan.z, d = Math.hypot(dx, dz);
    pan.vx = pan.vz = 0; pan.moveTo = null; if (d < 0.06) { pan.yawTo = g.yaw; pan.speed = 0; pan.goto = null; } else { const s = Math.min(d, 4 * dt); pan.x += dx / d * s; pan.z += dz / d * s; pan.yawTo = Math.atan2(dx, dz); pan.speed = 2.2; }
  } else {
    if (joy.on && !busy && mode === 'play') { mx = joy.x; mz = joy.y; }
    if (mx || mz) pan.moveTo = null;
    else if (pan.moveTo && !busy && mode === 'play') { const dx = pan.moveTo.x - pan.x, dz = pan.moveTo.z - pan.z; if (Math.hypot(dx, dz) < 0.18 || (pan.stuck || 0) > 0.4) { pan.moveTo = null; pan.stuck = 0; } else { mx = dx; mz = dz; } }
    const l = Math.hypot(mx, mz), sp = (R.carry ? 4.0 : 4.5) * (1 + comfort() * 0.03) * (bond('brinco', 5) ? 1.06 : 1) * (R.fed ? 1.08 : 1) * (joy.on ? Math.min(1, l) : 1);
    const tx = l ? mx / l * sp : 0, tz = l ? mz / l * sp : 0, k = 1 - Math.exp(-dt * (l ? 12 : 17));
    pan.vx = (pan.vx || 0) + (tx - (pan.vx || 0)) * k; pan.vz = (pan.vz || 0) + (tz - (pan.vz || 0)) * k;
    const v = Math.hypot(pan.vx, pan.vz);
    if (v > 0.06) {
      const p = collide(pan.x + pan.vx * dt, pan.z + pan.vz * dt, 0.3, R.zone ? W.zones[R.zone] : null), moved = Math.hypot(p[0] - pan.x, p[1] - pan.z) / dt; pan.x = p[0]; pan.z = p[1];
      if (l) pan.yawTo = Math.atan2(mx, mz); pan.speed = moved > 0.4 ? moved : 0; pan.stuck = moved < v * 0.35 ? (pan.stuck || 0) + dt : 0; if (moved < v * 0.35) { pan.vx *= 0.7; pan.vz *= 0.7; }
      if (pan.action === 'wave') pan.action = null;
      pan.stepT = (pan.stepT || 0) - dt * (moved / 3.4); if (pan.stepT < 0 && pan.speed) { pan.stepT = 0.27; sfx('step'); if (Math.random() < 0.5) burst('dust', pan.x, 0.08, pan.z, 1, { color: pan.z > 0.7 ? 0xe9dcc0 : 0xf6ead6 }); }
    } else { pan.speed = 0; pan.vx = pan.vz = 0; }
  }
  if (R.chopping && (mx || mz)) endChop(); if (R.fishing && (mx || mz)) endFish();
  updateChar(pan, dt); updateFlying(dt); updateDebris(dt); if (!R.zone) { updateEspino(dt); vidaUpdate(dt); }
  if (R.zone && zoneCh[R.zone]) for (const zc2 of zoneCh[R.zone]) { zc2.lookAt = zc2.sit ? null : pan; updateChar(zc2, dt); }
  if (busy) { ui.prompt(null); pressE = false; return; }
  // amasado
  if (mode === 'knead') { updateKnead(dt); pressE = false; ui.prompt(null); return; }
  if (R.autoBrb && R.carry?.stage !== 'order' && pan.z < 0.8 && Math.abs(pan.x) < 6.6) { R.autoBrb = false; setBrb(false); ui.toast('Cartel fuera: ¡abierto otra vez!'); }
  // reloj
  R.time += dt * MIN_PER_SEC; ui.setTime(R.time);
  if (!R.open && R.time >= T_OPEN) { R.open = true; sfx('bell'); ui.float('¡Abierto!', -7.4, 3.2, 1.5, 'star'); }
  if (R.time > 17.5 * 60) music('eve');
  // fermentadora y horno
  R.fermOpen = Math.max(0, (R.fermOpen || 0) - dt); updateTweens(dt);
  R.ferm.forEach((b, i) => { const led = W.fermLed[i]; if (!b) { led.emissive.set('#000000'); led.color.set('#6a6a6a'); return; } led.color.set(b.t >= b.need ? '#7bd389' : '#ffd166'); led.emissive.set(b.t >= b.need ? '#3fdc6a' : '#ffb020'); led.emissiveIntensity = b.t >= b.need ? 1.6 + Math.sin(tSec * 8) * 0.8 : 0.9; const was = b.t >= b.need; b.t += dt; const f = Math.min(1, b.t / b.need); const it = W.fermSlots[i].holder.children[0]?.userData.items; if (it) for (const d of it) { const k = 1 + f * 0.3; d.scale.set(k * 0.9, (1 + f * 0.55) * 0.9, k * 0.9); } if (!was && b.t >= b.need) { sfx('ding'); burst('steam', 3.0, W.fermSlots[i].p[1] + 0.3, -4.95, 5); ui.toast(`${img(b.id)}La masa de ${BREADS[b.id].n.toLowerCase()} ha subido`, 'good'); } });
  if (R.fermG) { const any = R.ferm.some(x => x); R.fermG.style.visibility = any ? 'visible' : 'hidden'; R.ferm.forEach((b, i) => { const e = R.fermG.querySelectorAll('.fb')[i]; e.className = 'fb' + (b ? (b.t >= b.need ? ' ok' : ' on') : ''); e.firstChild.style.transform = `scale(${b ? 0.25 + Math.min(1, b.t / b.need) * 0.75 : 0})`; }); }
  const bakingNow = R.oven.some(x => x); R.fire = Math.max(S.day < 3 ? 0.6 : 0, R.fire - dt * (bakingNow ? 0.004 : 0.0006) / (1 + trk('lena') * 0.12)); const heat = R.fire < 0.12 ? 0.25 : 0.6 + R.fire * 0.6;
  if (R.fireG) { R.fireG.querySelector('i').style.height = (R.fire * 100) + '%'; R.fireG.classList.toggle('low', R.fire < 0.25); R.fireG.style.opacity = R.fire < 0.3 || R.carry?.stage === 'wood' || Math.hypot(pan.x - 5.1, pan.z + 3.6) < 2.6 ? 1 : 0; }
  if (R.spare > 0 && R.fire < 0.5) { R.spare--; refreshSpare(); R.fire = Math.min(1, R.fire + 0.4); R.fireWarn = false; sfx('fire'); burst('spark', 5.1, 1.5, -4.3, 14, { color: 0xffa040 }); ui.float('El tronco de reserva, al fuego', 5.1, 2.6, -4.3, 'star'); }
  if (R.fire < 0.2 && !R.fireWarn) { R.fireWarn = true; ui.toast('El fuego del horno flojea. Hay leña en la leñera, fuera a la derecha.'); sfx('no'); }
  if (W.axe.userData.t > 0) { W.axe.userData.t -= dt; W.axe.rotation.z = 0.5 - Math.sin(Math.max(0, W.axe.userData.t) / 0.25 * Math.PI) * 1.3; }
  R.oven.forEach((b, i) => {
    if (!b) return; const t0 = b.t; b.t += dt * heat * (b.t < BAKE.gold0 ? (1 + trk('horno') * 0.08) * (1 + (S.pm || 0) * 0.04) : 1); b.g.querySelector('.ndl').style.transform = `rotate(${-135 + Math.min(1, b.t / BAKE.burnt) * 270}deg)`; const st = b.t < BAKE.gold0 ? '' : b.t <= BAKE.gold1 ? '¡ya!' : b.t < BAKE.burnt ? '¡ay!' : ''; const sp = b.g.querySelector('b'); if (sp.textContent !== st) sp.textContent = st;
    b.g.classList.toggle('ready', b.t >= BAKE.gold0 && b.t <= BAKE.gold1); b.g.classList.toggle('late', b.t > BAKE.gold1);
    if (t0 < BAKE.gold0 && b.t >= BAKE.gold0) { sfx('ding'); burst('steam', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.4, W.ovenSlots[i].p[2] + 0.5, 6); }
    if (b.t > BAKE.gold1 - 2.5 && b.t < BAKE.burnt && Math.floor(b.t * 2) !== Math.floor(t0 * 2)) sfx('tick');
    if (Math.random() < dt * 2) burst('steam', W.ovenSlots[i].p[0], W.ovenSlots[i].p[1] + 0.5, W.ovenSlots[i].p[2] + 0.45, 1);
  });
  updateCustomers(dt);
  // ambiente
  if (R.weather === 'lluvia' && !R.inHome) for (let i = 0; i < 14; i++) { const x = camTarget.x - 15 + Math.random() * 30, z = camTarget.z - 13 + Math.random() * 18; if (!(Math.abs(x) < 7.0 && z > -6.6 && z < 0.9)) burst('rain', x + 1.2, 9, z, 1); }
  for (const o of R.orders) if (!o.done && !o.late && R.time > o.by * 60) { o.late = true; drawOrders(); ui.toast(`${face(o.who, 'sad')} Se pasó la hora del encargo de ${NEIGH[o.who].n}. Aún puedes entregarlo, a media paga`); } watchOrders();
  { const fxk = season().fx; R.fxT -= dt; if (fxk && R.fxT < 0 && !R.inHome && R.weather !== 'lluvia') { R.fxT = fxk === 'snow' ? 0.05 : 0.5; const x = camTarget.x - 14 + Math.random() * 28, z = camTarget.z - 11 + Math.random() * 18; if (!(Math.abs(x) < 7 && z > -6.6 && z < 0.9)) burst(fxk === 'snow' ? 'snow' : 'leaf', x, fxk === 'snow' ? 7 : 3.5 + Math.random() * 2, z, 1, { color: fxk === 'petal' ? 0xffc2d4 : [0xe9a03b, 0xd9714e, 0xf2c14e][Math.floor(Math.random() * 3)] }); } }
  if (R.weather === 'viento') { R.leafT -= dt; if (R.leafT < 0) { R.leafT = 0.25; burst('leaf', camTarget.x - 12 + Math.random() * 8, 3 + Math.random() * 3, camTarget.z - 4 + Math.random() * 10, 1, { color: [0xffb7c9, 0xffd98a, 0xb9e38a][Math.floor(Math.random() * 3)] }); } }
  // ratos muertos: la primera vez que no hay nada que hacer, se enseña a dejar correr el reloj
  { const idle = R.open && !pan.speed && !R.carry && !R.zone && !R.cust.some(c => c.st === 'wait' || c.st === 'toSlot') && !R.oven.some(x => x); R.idleT = idle ? R.idleT + dt / (ffOn ? FF : 1) : 0; if (R.idleT > 20 && !S.ffTip && S.tut >= 5 && !ffOn) { S.ffTip = 1; sfx('ding'); ui.toast('<kbd>F</kbd> ¿Un rato muerto? Mantén F, o el reloj de arriba, y las horas corren hasta que pase algo', 'good'); } }
  // acción
  if (R.chopping) { updateChop(dt); ui.prompt(null); cur = null; const gg = goalText(); ui.setGoal(gg[0], gg[1]); return; }
  if (R.fishing) { updateFish(dt); ui.prompt(null); cur = null; marker.visible = false; return; }
  if (R.till) { updateTill(dt); }
  cur = findAction();
  pan.lookAt = cur?.cust ? cur.cust.ch : (pan.x > -1.6 && pan.x < -0.3 ? (R.slots.find(c => c && c.st === 'wait')?.ch || null) : null);
  if (pressE) eBuf = 0.2; else eBuf -= dt;
  if (cur?.cust && cur.cust !== lastCust) cur.cust.ch.pop(2); lastCust = cur?.cust || null;
  if (cur) {
    const ok = cur.ok !== false, run = () => { eBuf = 0; holdT = 0; if (cur.st && cur.fn !== openRecipes) { pan.goto = { x: cur.st.x, z: cur.st.z, yaw: cur.st.yaw }; } if (cur.face != null) pan.yawTo = cur.face; cur.fn(); };
    if (cur.hold && ok) { const down = keys.has('e') || keys.has(' ') || keys.has('enter') || joy.e; holdT = down ? holdT + dt / 0.8 : Math.max(0, holdT - dt * 3); if (down && Math.floor(holdT * 8) !== Math.floor((holdT - dt / 0.8) * 8)) sfx('tick'); ui.prompt(cur.text + ' (mantén)', cur.pos, true, Math.min(1, holdT)); if (holdT >= 1) run(); }
    else { holdT = 0; ui.prompt(cur.text, cur.pos, ok); if (ok ? eBuf > 0 : pressE) run(); }
    marker.visible = ok; marker.position.set(cur.pos[0], cur.pos[1] - 0.52 + Math.sin(tSec * 6) * 0.05, cur.pos[2]); marker.rotation.y = tSec * 2;
  } else { ui.prompt(null); holdT = 0; marker.visible = false; }
  pressE = false;
  const g = goalText(); ui.setGoal(g[0], g[1]);
  // fiesta y cierre
  if (S.recipes.includes('rosca') && R.time > 17.5 * 60 && (R.shelf.rosca?.length || 0) >= 8 && (!S.fiesta || S.day - (S.lastFiesta || 0) >= 7)) return startFiesta();
  if (R.time >= T_CLOSE && (!R.cust.some(c => c.st === 'wait' || c.st === 'toSlot' || c.st === 'find') || R.time > T_CLOSE + 30)) endDay();
}
/** El reloj solo corre si Pan está quieta y no hay nada que atender: se para solo al llegar alguien o al dorarse el pan. */
function ffWhy() {
  if (mode !== 'play' || !R || R.ended || ui.modalOpen || ui.dialogOpen || R.decor || R.chopping || R.fishing || R.till) return 'x';
  if (pan.speed > 0.2 || pan.goto || pan.moveTo) return 'x';
  if (R.slots.some(c => c && (c.st === 'wait' || c.st === 'toSlot')) && !R.brb) return 'Hay gente esperando en el mostrador';
  if (R.oven.some(b => b && b.t >= BAKE.gold0 - 1.2)) return 'El pan está a punto: ¡al horno!';
  if (R.time >= T_CLOSE - 12) return 'x';
  return '';
}
function frame(dt) {
  if (hitstop > 0) { hitstop -= dt; dt *= 0.06; }
  if (S && (mode === 'play' || mode === 'knead') && !frame.sub) S.played = (S.played || 0) + dt;
  tSec += dt; windU.value = tSec * (R?.weather === 'viento' ? 2.2 : 1);
  if (mode === 'play' || mode === 'knead') updatePlay(dt);
  else if (mode === 'score') { updateScore(dt); updateChar(pan, dt); pressE = false; }
  else if (mode === 'reveal') { updateReveal(dt); updateChar(pan, dt); if (miga) updateChar(miga, dt); if (leva) updateChar(leva, dt); ui.prompt(null); }
  else if (mode === 'fiesta') { updateFiesta(dt); updateChar(pan, dt); if (miga) updateChar(miga, dt); }
  else if (mode === 'title') { cam.yawTo = Math.sin(tSec * 0.1) * 0.35; updateChar(pan, dt); }
  else if (mode === 'pick') updatePick(dt);
  else { updateChar(pan, dt); if (R) for (const c of R.cust) updateChar(c.ch, dt); }
  if (mode === 'summary' && R?.ended && !ui.modalOpen && !ui.dialogOpen) { frame.sw = (frame.sw || 0) + dt; if (frame.sw > 2.2) { frame.sw = 0; R.showSum?.(); } } else frame.sw = 0;
  { const want = mode === 'pick' ? 20.7 : 9.5; frame.hr = frame.hr == null ? want : frame.hr + clamp(want - frame.hr, -dt * 9, dt * 9); }
  const hour = R ? R.time / 60 : frame.hr, wd = R ? { lluvia: 0.85, nubes: 0.45 }[R.weather] || 0 : 0;
  if (R?.decor) { const dg = W.home.fur[R.decor.own[R.decor.i]]; frame.df = { x: clamp(60 + dg.position.x, 58.6, 61.4), z: clamp(-3 + dg.position.z - 0.3, -4.2, -2.2) }; } else frame.df = null;
  const inside = pan.z < 0.8 && Math.abs(pan.x) < 6.6, inHome = R?.inHome && mode !== 'reveal';
  const zc = inHome ? W.zones[R.zone].cam : null;
  const focus = frame.df ? frame.df : inHome ? { x: clamp(pan.x, zc[0], zc[1]), z: clamp(pan.z - 0.5, zc[2], zc[3]) } : mode === 'reveal' && R.reveal[0] ? { x: clamp(UPG[R.reveal[0]].at[0], -11, 11), z: clamp(UPG[R.reveal[0]].at[2], -3.4, 8) } : mode === 'title' ? { x: 0, z: 0.5 } : mode === 'pick' && PK ? { x: PK.bx * 0.75, z: 5.25, y: 0.3 } : mode === 'knead' ? { x: 0.0, z: -4.5 } : mode === 'fiesta' && fiesta ? { x: fiesta.cx, z: fiesta.cz + 0.3 } : ui.dialogOpen && cur?.cust ? { x: -2, z: cur.cust.ch.z + 0.3 } : { x: clamp(pan.x + (pan.vx || 0) * 0.32, -18.5, 18.5), z: clamp(pan.z + (pan.vz || 0) * 0.22 + (inside ? -0.6 : 0.2), -3.4, 10.5) };
  updateCamera(dt, focus, frame.snap); frame.snap = false;
  { const on = R && !inHome && !inside && mode === 'play' ? 1 : 0; frame.see = frame.see == null ? on : frame.see + (on - frame.see) * Math.min(1, dt * 6); setSee(pan.x, 0.75, pan.z, frame.see); }
  setTimeOfDay(hour, wd); if (PK && PK.k > 0.001) { sun.intensity *= 1 - 0.72 * PK.k; hemi.intensity *= 1 - 0.5 * PK.k; fill.intensity *= 1 - 0.6 * PK.k; }
  updateWorld(dt, hour, { wind: R?.weather === 'viento', baking: R ? [!!R.oven[0], !!R.oven[1]] : null, fire: R?.fire, zone: R?.zone, fermOpen: R?.fermOpen > 0, fermBusy: R?.ferm.some(x => x) });
  // flecha del tutorial sobre el sitio al que toca ir, sonido ambiente y música más baja al hablar
  { const gp = R && mode === 'play' && S.tut < 7 ? [[0.8, 2.7, -5.0], [3.0, 3.3, -5.4], [5.1, 3.4, -4.6], [5.1, 3.4, -4.6], [-1.9, 2.5, -3.4], [-1.9, 2.5, -3.4], [6.1, 3.1, -2.25]][S.tut] : R && mode === 'play' && !R.zone && R.carry?.stage === 'order' ? [W.homes[R.orders[R.carry.o].who].door[0], 3.3, W.homes[R.orders[R.carry.o].who].door[1]] : R && mode === 'play' && !R.zone && R.orders.some(o => !o.done && !o.out && ordHave(o) >= o.n) ? [W.boardPos[0], 3.0, W.boardPos[1]] : null, far = gp && Math.hypot(pan.x - gp[0], pan.z - gp[2]) > 1.7; guide.visible = !!far; if (far) { guide.position.set(gp[0], gp[1] + Math.abs(Math.sin(tSec * 4)) * 0.3, gp[2]); guide.rotation.y = tSec * 3; } }
  if (ui.dialogOpen !== frame.dk) { frame.dk = ui.dialogOpen; duck(frame.dk); }
  if (R && mode === 'play' && !R.inHome) { frame.amb = (frame.amb || 2) - dt; if (frame.amb < 0) { frame.amb = 0.25 + Math.random() * 0.5; const outside = pan.z > 0.9 || Math.abs(pan.x) > 6.8; if (outside && R.weather !== 'lluvia' && light.night < 0.5 && Math.random() < 0.3) ambient('chirp'); if (Math.hypot(pan.x - 5.1, pan.z + 3.8) < 4 && Math.random() < 0.45 + R.fire * 0.4) ambient('crackle'); if (S.up.fuente && Math.hypot(pan.x + 10.2, pan.z - 7) < 5) ambient('water'); } }
  updateLife(dt, tSec, pan, { rain: R?.weather === 'lluvia', night: light.night > 0.6 || (R && season().n === 'invierno'), onFlush: () => sfx('whoosh') });
  updateParticles(dt); ui.update();
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const want = keys.has('f') || ffHold, why = want ? ffWhy() : 'x', on = want && why === '';
  if (on !== ffOn) { ffOn = on; document.body.classList.toggle('ff', on); if (on) sfx('whoosh'); }
  if (want && why && why !== 'x' && why !== loop.why) { ui.toast(why); sfx('no'); } loop.why = want ? why : null;
  frame(dt); if (on) { frame.sub = true; for (let i = 1; i < FF && ffWhy() === ''; i++) frame(dt); frame.sub = false; if (Math.floor(now / 140) !== Math.floor((now - dt * 1000) / 140)) sfx('tick'); }
  render(); requestAnimationFrame(loop);
}

// ---------- arranque ----------
function boot() {
  initGfx(document.getElementById('c')); initParticles(); buildWorld(); ui.init(renderIcons(), renderExtras(200, Object.fromEntries(Object.entries(W.home.fur).map(([id, g]) => { const c = g.clone(true); c.visible = true; c.position.set(0, 0, 0); c.rotation.set(0, id === 'sillon' ? 0.5 : 0, 0); return [id, c]; })), itemModels()));
  initVida({ get S() { return S; }, get R() { return R; }, pan, face, pick, lvl, hit, emote, talk, letter, travel, gainPts, addRep, cnt, save, checkLogros, refreshBaskets, takeE: () => { const e = pressE; pressE = false; return e; }, eDown: () => keys.has('e') || keys.has(' ') || keys.has('enter') || !!joy.e });
  scene.add(pan.root, marker, guide); initLife();
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase(); if (k === 'tab') e.preventDefault(); if (e.repeat) return; initAudio(); resumeAudio();
    if (k === 'm') return ui.toast(toggleMute() ? 'Sin sonido' : 'Con sonido');
    if (ui.dialogOpen) { if (k === 'e' || k === ' ' || k === 'enter') ui.dlgNext?.(); return; }
    if (ui.modalOpen) { if (k === 'escape') return ui.closeModal(); ui.onKey?.(k); return; }
    keys.add(k); if (mode === 'score') return scoreKey(k); if (mode === 'knead') return kneadKey(k); if (R?.decor && mode === 'play') return decorKey(k);
    if (k === 'e' || k === ' ' || k === 'enter') pressE = true;
    if ((k === 'l' || k === 'tab') && mode === 'play') openBook();
    if (k === 'b' && mode === 'play') toggleBrb();
    if (k === 'escape' && mode === 'play') openPause();
    if (k === 'q' && mode === 'play' && cur?.pick && cur.cust && !R.decor) openBasket(cur.pick, cur.cust);
    if (k === 'q' && mode === 'play' && cur?.gift && !R.decor) openGift(cur.gift);
    
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => { keys.clear(); ffHold = false; });
  { const ck = document.querySelector('#cal .clock'); ck.addEventListener('pointerdown', (e) => { e.stopPropagation(); ffHold = true; }); addEventListener('pointerup', () => { ffHold = false; }); addEventListener('pointercancel', () => { ffHold = false; }); }
  setInterval(() => { if (!TEST && S && mode === 'play' && !ui.modalOpen) saveMid(); }, 5000); addEventListener('visibilitychange', () => { if (document.hidden && S && !TEST) saveMid(); }); addEventListener('pagehide', () => { if (S && !TEST) saveMid(); });
  addEventListener('pointerdown', () => { initAudio(); resumeAudio(); });
  setVolume(CFG.mus, CFG.sfx); setQuality(CFG.q);
  const fit = () => { const st = document.documentElement.style, base = Math.min(innerWidth / 1280, innerHeight / 720), small = base < 0.8;
    // en pantallas pequeñas la interfaz no encoge con la ventana: se queda en un tamaño que se lee y las hojas se recolocan
    const z = small ? clamp(Math.min(0.8, innerWidth / 600), 0.5, 0.8) : Math.min(base, 1.3), zs = small ? clamp(Math.min(innerWidth / 900, innerHeight / 470), 0.5, 0.82) : Math.min(base, 1.3);
    st.setProperty('--z', z.toFixed(3)); st.setProperty('--zs', zs.toFixed(3)); st.setProperty('--vh', (innerHeight / zs / 100).toFixed(3) + 'px'); st.setProperty('--vw', (innerWidth / zs / 100).toFixed(3) + 'px'); document.body.classList.toggle('small', small); }; fit(); addEventListener('resize', fit);
  const cv = document.getElementById('c'), touch = matchMedia('(pointer: coarse)').matches; if (touch) $('#touch').classList.remove('hide');
  $('#prompt').addEventListener('pointerdown', (e) => { e.stopPropagation(); pressE = true; });
  cv.addEventListener('pointerdown', (e) => {
    if (ui.dialogOpen) return ui.dlgNext?.(); if (ui.modalOpen) return;
    if (mode === 'knead') { if (K?.phase === 'hold') keys.add('e'); else kneadKey(e.clientX < innerWidth / 2 ? 'a' : 'd'); return; }
    if (mode === 'reveal') { pressE = true; return; }
    if (mode !== 'play') return;
    if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.5) { joy.on = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0; return; }
    if (R.chopping || R.till) { pressE = true; return; }
    const g = groundAt(e.clientX, e.clientY); if (g) { pan.moveTo = { x: g.x, z: g.z }; pan.stuck = 0; burst('dust', g.x, 0.1, g.z, 3); }
  });
  addEventListener('pointermove', (e) => { if (joy.on && e.pointerId === joy.id) { const dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, d = Math.hypot(dx, dy), m = Math.min(1, d / 46); joy.x = d > 6 ? dx / d * m : 0; joy.y = d > 6 ? dy / d * m : 0; $('#stick i').style.transform = `translate(${joy.x * 34}px, ${joy.y * 34}px)`; } });
  const up = (e) => { if (joy.on && e.pointerId === joy.id) { joy.on = false; joy.x = joy.y = 0; $('#stick i').style.transform = ''; } keys.delete('e'); joy.e = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  $('#tapE').addEventListener('pointerdown', (e) => { e.stopPropagation(); initAudio(); resumeAudio(); if (ui.dialogOpen) return ui.dlgNext?.(); if (mode === 'knead') { if (K?.phase === 'hold') keys.add('e'); else kneadKey('e'); return; } pressE = true; joy.e = true; });
  $('#btn-lib').onclick = () => { if (mode === 'play' && !ui.modalOpen && !ui.dialogOpen) openBook(); };
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal' && mode === 'play') ui.closeModal(); });

  saves.migrate();
  const begin = (i, s) => {
    slot = i; saves.setCur(i); S = s || fresh(); S.name ||= saves.defName(i); S.look ||= {}; S.hero ||= 'pan'; ui.tx = S.hero === 'isart' ? heroTx : null; W.homeSign?.(S.hero === 'isart' ? 'Isart' : 'Pan'); if (Object.keys(S.look).length || S.hero === 'isart') rebuildPan(); S.build ||= []; S.baked ||= {}; S.wood ??= 6; S.lata ??= 0; S.home ||= {}; S.sup ||= {}; S.tr ||= {}; S.staff ||= {}; S.hornadas ??= 0; S.bond ||= {}; S.ach ||= {}; S.cnt ||= {}; S.look ||= {}; S.story ||= {}; S.homePos ||= {}; S.pm ??= 0; S.ayer ||= []; S.years ??= 0; S.style ||= 'miel'; vidaDefaults(S); applyUpgrades(); cam.yawTo = 0; cam.pitchTo = 0; cam.zoomTo = 0.72;
    if (!S.intro) { S.intro = true; mode = 'letter'; R = null; music('title'); pan.x = 1.6; pan.z = -2.6; letter(CARTA, 'Una carta dentro del horno', () => { startDay(true); ui.dayTitle('Día 1', 'lunes · el horno vuelve a encenderse'); sfx('day'); }); }
    else { startDay(); loadMid(); setTimeout(awayReport, 1200); }
  };
  if (TEST) { S = fresh(); vidaDefaults(S); S.intro = true; if (Q.has('rich')) { S.money = 3000; S.rep = 700; S.recipes = BREAD_ORDER.filter(x => x !== 'rosca'); NEIGH_ORDER.forEach(id => { S.met[id] = true; S.pts[id] = 20; S.gave[id] = true; }); S.tut = 7; S.roscaLetter = true; S.recipes.push('rosca'); for (const k in ING) S.ing[k] = 40; if (Q.has('up')) UPG_ORDER.forEach(id => S.up[id] = true); S.day = Number(Q.get('day') || 5); } applyUpgrades(); cam.zoom = cam.zoomTo = 0.72; startDay(true); frame.snap = true; }
  else {
    mode = 'title'; pan.x = 1.2; pan.z = 1.6; pan.act('wave'); cam.zoom = cam.zoomTo = 1.0; cam.pitchTo = 0.25; frame.snap = true; music('title');
    setInterval(() => { if (mode === 'title') pan.act('wave'); }, 4000);
    const go = sessionStorage.getItem('pantastic-go'); sessionStorage.removeItem('pantastic-go'); const rec = go != null ? saves.read(Number(go)) : null;
    if (rec) { cam.zoom = cam.zoomTo = 0.72; begin(Number(go), rec.S); }
    else { const title = () => openTitle({ onPlay: (i, s) => { initAudio(); resumeAudio(); if (s) begin(i, s); else startPick(i, (hero) => begin(i, { ...fresh(), hero }), title); }, sfx, faces: { pan: XI.face.pan.happy, isart: XI.face.isart.happy } }); title(); }
  }
  // API de pruebas
  window.game = {
    ready: true, get S() { return S; }, get R() { return R; }, get mode() { return mode; }, get K() { return K; }, pan, W, ui, cam,
    step(sec, h = 1 / 30) { for (let t = 0; t < sec; t += h) frame(h); render(); },
    tp(x, z, yaw) { pan.x = x; pan.z = z; if (yaw != null) pan.yaw = pan.yawTo = yaw; frame.snap = true; },
    key(k) { if (ui.dialogOpen) return ui.dlgNext?.(); if (ui.modalOpen) return ui.onKey?.(k); if (k === 'e') pressE = true; else if (k === 'l') openBook(); },
    stock(id, n = 4, q = 3) { (R.shelf[id] ||= []).push(...Array.from({ length: n }, () => ({ q }))); refreshBaskets(); },
    time(h) { R.time = h * 60; }, carry(id, stage = 'baked', q = 3) { setCarry({ id, n: batchN(), stage, q, knead: 1 }); },
    spawn(nb) { spawn(nb ? { nb } : { seed: Math.floor(Math.random() * 999) }); }, openBasket, espinoTalk, get espino() { return espino; },
    sim: {
      buy(id, n = 1) { const c = ingPrice(id) * n; if (S.money < c) return false; S.money -= c; R.today.spent += c; S.ing[id] = (S.ing[id] || 0) + n; return true; },
      dough(id) { if (R.carry || !canMake(id)) return false; for (const [k, n] of Object.entries(BREADS[id].ing)) S.ing[k] -= n; setCarry({ id, n: batchN(), stage: 'dough', knead: 0.8 }); return true; },
      track(id) { const c = trCost(id); if (S.money < c || trk(id) >= TRACKS[id].max) return false; S.money -= c; R.today.spent += c; S.tr[id] = trk(id) + 1; return true; },
      staff(id) { const P = STAFF[id]; if (S.staff[id] || P.lvl > lvl() || S.money < P.p) return false; S.money -= P.p; R.today.spent += P.p; S.staff[id] = true; applyUpgrades(); return true; },
      work(id) { const u = UPG[id]; if (S.up[id] || S.build.includes(id) || (u.lvl || 0) > lvl() || S.money < u.p) return false; S.money -= u.p; R.today.spent += u.p; S.build.push(id); return true; },
      fire() { R.fire = 1; }, info() { return { money: S.money, lvl: lvl(), day: S.day, time: R.time, n: batchN(), wages: wages(), rep: S.rep, recipes: S.recipes, shelf: Object.fromEntries(Object.entries(R.shelf).map(([k, a]) => [k, a.length])), ing: S.ing, today: R.today, tr: S.tr, up: Object.keys(S.up), staff: Object.keys(S.staff) }; },
      cost(kind, id) { return kind === 'track' ? (trk(id) >= TRACKS[id].max ? Infinity : trCost(id)) : kind === 'staff' ? (S.staff[id] || STAFF[id].lvl > lvl() ? Infinity : STAFF[id].p) : (S.up[id] || S.build.includes(id) || (UPG[id].lvl || 0) > lvl() ? Infinity : UPG[id].p); },
      price: (id) => priceOf(id), ingPrice: (id) => ingPrice(id), tracks: TRACK_ORDER, staffs: STAFF_ORDER, works: UPG_ORDER, breads: BREADS,
    }, vida: { give: giveItem, bagN, apply: applyVida, sell: openSell, gift: openGift, next: () => { S.day++; startDay(); } }, openBook, openShop, openLib: openBook, openWardrobe, rebuildPan, goHome, travel, openFonda, openMolino, openLata, openVitrina, openCatalog, endDay, startFiesta, unlock, startKnead, serve, letter,
  };
  if (!TEST) requestAnimationFrame(loop); else { frame(1 / 30); render(); }
  const bt = document.getElementById('boot'); bt.classList.add('out'); setTimeout(() => bt.remove(), 600);
}
Promise.race([Promise.all([document.fonts.load('800 20px "Baloo 2"'), document.fonts.load('20px "Patrick Hand"')]), new Promise(r => setTimeout(r, 2500))]).then(() => requestAnimationFrame(() => requestAnimationFrame(boot)));
