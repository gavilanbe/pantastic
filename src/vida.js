// La vida en Migas fuera del obrador: huerta, monte, río, zurrón, regalos, calendario, feria y almanaque.
import { scene, burst, cam, mesh, mat, G, toScreen } from './gfx.js';
import { W, collide } from './world.js';
import { makeChar, updateChar } from './chars.js';
import { makePlant, makeForage } from './items.js';
import { ui, coin, ICON, XI, $ } from './ui.js';
import { sfx, note, blip } from './audio.js';
import { ITEMS, ITEM_ORDER, CROPS, CROP_ORDER, FORAGE, FISH, TASTE, GIFT_SAY, BDAY, WEEK_EV, TRASTO_LOOK, ALM, ALM_ORDER, ALM_ORO, CARTA_ALM, OFICIOS, OFI_AT, RIBBON, NEIGH, NEIGH_ORDER, BREADS, SEASONS, DIAS, ING } from './data.js';

let c = null, trasto = null;
const SE_N = ['primavera', 'verano', 'otoño', 'invierno'], SE_C = ['#f29ab0', '#f2b84b', '#d9714e', '#8fc3ea'];
export const ii = (id) => `<img src="${XI.item[id]}" alt="">`;
const seIdx = (day = c.S.day) => Math.floor(((day - 1) % 28) / 7);
const yday = (day = c.S.day) => ((day - 1) % 28) + 1;
export const bagN = (id) => c.S.bag[id] || 0;
const bagIds = () => ITEM_ORDER.filter(id => bagN(id) > 0);
export function give(id, n = 1) { const first = !Object.keys(c.S.seen).length; c.S.bag[id] = bagN(id) + n; c.S.seen[id] = true; if (first && c.R) setTimeout(() => ui.toast(`${ii(id)} Al zurrón (libreta, L): se regala a los vecinos, se vende en la fonda, se enseña en la feria o va a la masa`, 'good'), 1700); }
function take(id, n = 1) { c.S.bag[id] = bagN(id) - n; if (c.S.bag[id] <= 0) delete c.S.bag[id]; }
export const ofLvl = (k) => { const x = c.S.xp[k] || 0; let l = 0; OFI_AT.forEach((a, i) => { if (x >= a) l = i; }); return l + 1; };
function xp(k, n) { const l0 = ofLvl(k); c.S.xp[k] = (c.S.xp[k] || 0) + n; if (ofLvl(k) > l0) setTimeout(() => { sfx('fanfare'); ui.toast(`★ ${OFICIOS[k].n}, nivel ${ofLvl(k)}: ${OFICIOS[k].perks[ofLvl(k) - 1]}`, 'gold'); }, 1300); }
export const sellPrice = (id, k = 1) => Math.max(1, Math.round(ITEMS[id].sell * k * (ofLvl('monte') >= 5 ? 1.2 : 1)));
const inSeasonItem = (id, se = seIdx()) => id === 'miel' || !!(CROPS[id]?.se.includes(se) || FORAGE[id]?.se.includes(se) || FISH[id]?.se.includes(se));
const plotOpen = (i) => i < 8 || !!c.S.rw.bancales;
const plotSeason = (crop, i, se = seIdx()) => CROPS[crop].se.includes(se) || (!!c.S.rw.invernadero && i < 4);
const needOf = (p) => p.again ? CROPS[p.c].re : CROPS[p.c].days;
const seedPrice = (id) => Math.max(1, Math.round(CROPS[id].seed * (ofLvl('huerta') >= 4 ? 0.75 : 1)));
const pagesDone = () => ALM_ORDER.filter(k => c.S.rw[ALM[k].rw]).length;
export const almDone = () => pagesDone() === ALM_ORDER.length;
/** Lo que vale de más un pan con toque, y su apellido. */
export const toqueK = (tq) => tq && ITEMS[tq]?.toque ? ITEMS[tq].toque.k * (c.S.rw.toques ? 1.15 : 1) : 1;
export const toqueName = (tq) => tq && ITEMS[tq]?.toque ? ' ' + ITEMS[tq].toque.n : '';
export const toqueFits = (tq, bread) => { const s = ITEMS[tq]?.toque?.sweet; return s == null || s === BREADS[bread].sweet; };
export const toqueList = () => ITEM_ORDER.filter(id => ITEMS[id].toque && bagN(id) > 0);
export const useToque = (tq) => take(tq, 1);

export function vidaDefaults(S) {
  S.bag ||= {}; S.seen ||= {}; S.plots ||= []; while (S.plots.length < 12) S.plots.push(null); S.xp ||= {}; S.alm ||= {}; S.rw ||= {}; S.taste ||= {}; S.gifted ||= {}; S.ribbon ||= {}; S.fishRec ||= {}; S.hive ??= 0;
  if (S.fish) { S.bag.trucha = (S.bag.trucha || 0) + S.fish; S.seen.trucha = true; S.fish = 0; }
}
export function initVida(ctx) { c = ctx; }

// ---------- huerta ----------
function drawPlot(i) {
  const p = W.plots[i], s = c.S.plots[i]; p.holder.clear(); p.bed.color.set(s?.w ? '#6a4630' : '#9a6f4a'); p.drops.visible = !!s?.w && !s?.r; p.fert.visible = !!s?.f; p.star.visible = !!s?.r;
  if (s) { const need = needOf(s), f = s.r ? 1 : s.again ? 0.62 + 0.38 * s.d / need : s.d / need; p.holder.add(makePlant(s.c, f, !!s.r)); p.starY = s.c === 'girasol' ? 1.75 : s.c === 'uva' || s.c === 'tomate' ? 1.5 : 1.15; p.star.position.y = p.starY; }
}
export function applyVida() {
  const S = c.S; W.plotRow3.visible = !!S.rw.bancales; W.plotLock.visible = !S.rw.bancales; W.greenhouse.visible = !!S.rw.invernadero; W.sprinkler.visible = !!S.rw.aspersor; W.hive.visible = !!S.rw.colmena;
  W.hiveJars.forEach((j, k) => j.visible = k < (S.hive || 0)); W.scarfMat.color.set(almDone() ? '#f2c14e' : '#e2664f'); for (let i = 0; i < 12; i++) drawPlot(i);
}
function water(i) {
  const S = c.S, row = W.plots[i].row, ids = [i]; if (ofLvl('huerta') >= 2) for (const d of [-1, 1]) { const j = i + d; if (j >= 0 && j < 12 && W.plots[j].row === row) ids.push(j); }
  let n = 0; for (const j of ids) { const s = S.plots[j]; if (!s || s.w || s.r) continue; s.w = true; n++; drawPlot(j); const p = W.plots[j]; burst('rain', p.x, 1.1, p.z, 10); setTimeout(() => burst('steam', p.x, 0.3, p.z, 4), 260); }
  c.pan.act('give'); sfx('whoosh'); setTimeout(() => sfx('pop'), 200); if (n > 1) ui.float(`regados ${n}`, W.plots[i].x, 1.5, W.plots[i].z, 'star'); c.cnt('water', n); c.save();
}
function harvest(i) {
  const S = c.S, s = S.plots[i], C = CROPS[s.c], p = W.plots[i], bonus = (s.f ? 1 : 0) + (ofLvl('huerta') >= 3 && Math.random() < 0.34 ? 1 : 0), n = C.y + bonus;
  give(s.c, n); if (C.ing) S.ing[C.ing[0]] = (S.ing[C.ing[0]] || 0) + C.ing[1]; xp('huerta', 3 + (C.days > 3 ? 2 : 0)); c.cnt('harvest');
  if (s.f) s.f--; if (C.re) { s.r = false; s.d = 0; s.again = true; s.w = c.R.weather === 'lluvia' || !!S.rw.aspersor; } else S.plots[i] = null; drawPlot(i);
  c.pan.act('joy'); c.pan.pop(3); sfx('perfect'); note(4 + n); burst('spark', p.x, 0.8, p.z, 14); burst('leaf', p.x, 0.9, p.z, 6, { color: 0x7ccf7f });
  ui.float(`+${n} ${ITEMS[s.c].n.toLowerCase()}${bonus ? ' <small>¡de más!</small>' : ''}`, p.x, 1.6, p.z, 'star'); if (C.ing) setTimeout(() => ui.float(`+${C.ing[1]} ${ING[C.ing[0]].n.toLowerCase()}`, p.x, 1.3, p.z, 'star'), 350);
  const a = toScreen(p.x, 1, p.z), b = $('#btn-lib').getBoundingClientRect(); ui.fly(XI.item[s.c], a, { x: b.left + 20, y: b.top + 20 }, 620);
  c.checkLogros(); c.save();
}
function fertilize(i) { const S = c.S, s = S.plots[i]; S.compost--; s.f = ofLvl('huerta') >= 5 ? 2 : 1; drawPlot(i); c.pan.act('give'); sfx('place'); sfx('good'); burst('dust', W.plots[i].x, 0.4, W.plots[i].z, 8, { color: 0x5a3a26 }); ui.float('abonado: una pieza más', W.plots[i].x, 1.5, W.plots[i].z, 'star'); c.save(); }
function cropCard(id, i, plant) {
  const C = CROPS[id], S = c.S, ok = i == null || plotSeason(id, i), p = seedPrice(id);
  return `<div class="mue ${ok ? '' : 'off'}"><img src="${XI.item[id]}" alt=""><div class="nm">${ITEMS[id].n}</div><div class="ds">${C.se.map(s => `<i class="sed" style="background:${SE_C[s]}" title="${SE_N[s]}"></i>`).join('')} ${C.days} noches · da ${C.y}${C.ing ? ` y ${C.ing[1]} de ${ING[C.ing[0]].n.toLowerCase()}` : ''}${C.re ? ` · vuelve a dar cada ${C.re}` : ''}</div>${plant ? `<button class="btn sm ${S.money >= p ? 'main' : ''}" data-seed="${id}" ${S.money < p ? 'disabled' : ''}>Sembrar · ${p} ${coin}</button>` : `<span class="ds" style="min-height:0">semilla: ${p} ${coin} · se vende a ${sellPrice(id)}</span>`}</div>`;
}
function openSeeds(i) {
  const S = c.S, list = CROP_ORDER.filter(id => i == null || plotSeason(id, i)); sfx('page');
  const sh = ui.modal(`<button class="x">✕</button><h2>${i == null ? 'El semillero de la abuela' : '¿Qué sembramos aquí?'}</h2><div class="sub">${i == null ? 'Cada cosa a su tiempo. Riega cada día (o que llueva) y crecerá una noche. Lo que no sea de la estación se pierde cuando cambia.' : `Es ${SE_N[seIdx()]}${S.rw.invernadero && i < 4 ? ', pero bajo el invernadero crece de todo' : ''}. Hay que regar cada día para que crezca esa noche. Tienes ${S.money} ${coin}.`}</div>
    <div class="grid scroll" style="grid-template-columns:repeat(${Math.min(4, list.length)},1fr)">${list.map(id => cropCard(id, i, i != null)).join('')}</div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => { const id = b.dataset.seed, p = seedPrice(id); if (S.money < p) return sfx('no'); S.money -= p; c.R.today.spent += p; ui.setMoney(S.money, true); S.plots[i] = { c: id, d: 0, w: c.R.weather === 'lluvia' || !!S.rw.aspersor, f: 0 }; drawPlot(i); ui.closeModal(); c.pan.act('give'); sfx('place'); sfx('pop'); burst('dust', W.plots[i].x, 0.4, W.plots[i].z, 8, { color: 0x9a6f4a }); ui.float(`${ITEMS[id].n}: sembrado`, W.plots[i].x, 1.4, W.plots[i].z, 'star'); c.save(); });
}

// ---------- recolección ----------
function spawnForage(r) {
  const R = c.R, S = c.S, se = seIdx(); for (const f of R.forage || []) scene.remove(f.m); R.forage = []; if (S.day < 2) return;
  const n = 2 + (ofLvl('monte') >= 2 ? 1 : 0) + (ofLvl('monte') >= 4 ? 1 : 0);
  for (const place of ['pueblo', 'rio', 'molino']) {
    const ids = Object.keys(FORAGE).filter(id => FORAGE[id].se.includes(se) && FORAGE[id].at.includes(place)); if (!ids.length) continue;
    let spots = [...W.forageSpots[place]].sort(() => r() - 0.5); if (place === 'pueblo') spots = spots.filter(([x, z]) => { const q = collide(x, z, 0.45); return Math.hypot(q[0] - x, q[1] - z) < 0.02; });
    spots.slice(0, n).forEach(([x, z], k) => { const id = ids[Math.floor(r() * ids.length)], m = makeForage(id); m.position.set(x, 0, z); m.rotation.y = r() * 6; scene.add(m); R.forage.push({ id, x, z, zone: place === 'pueblo' ? null : place, m }); });
  }
}
function pickForage(f) {
  const R = c.R, n = ofLvl('monte') >= 3 && Math.random() < 0.34 ? 2 : 1; R.forage.splice(R.forage.indexOf(f), 1); scene.remove(f.m); give(f.id, n); xp('monte', 4); c.cnt('forage');
  c.pan.act('give'); c.pan.pop(3); sfx('perfect'); burst('spark', f.x, 0.5, f.z, 12); burst('leaf', f.x, 0.5, f.z, 5, { color: 0x7ccf7f }); ui.float(`+${n} ${ITEMS[f.id].n.toLowerCase()}`, f.x, 1.4, f.z, 'star');
  const a = toScreen(f.x, 0.6, f.z), b = $('#btn-lib').getBoundingClientRect(); ui.fly(XI.item[f.id], a, { x: b.left + 20, y: b.top + 20 }, 620); c.checkLogros(); c.save();
}

// ---------- pesca ----------
function pickFish() {
  const R = c.R, S = c.S, se = seIdx(), late = R.time > 15 * 60 || R.weather === 'lluvia';
  const ok = Object.keys(FISH).filter(id => FISH[id].se.includes(se) && (!FISH[id].late || late)), w = ok.map(id => FISH[id].w * (id === 'dorada' ? 1 + (ofLvl('rio') >= 4 ? 0.8 : 0) + (S.rw.cana ? 1.2 : 0) : id !== 'trucha' && ofLvl('rio') >= 4 ? 1.3 : 1));
  let x = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < ok.length; i++) { x -= w[i]; if (x <= 0) return ok[i]; } return 'trucha';
}
export function startFish() {
  const R = c.R, S = c.S, Z = W.zones.rio, quick = (ofLvl('rio') >= 3 ? 0.7 : 1) * (S.rw.cana ? 0.7 : 1);
  R.fishing = { st: 'wait', t: 0, bite: (1.6 + Math.random() * 4.4) * quick }; c.pan.goto = { x: Z.st.muelle[0], z: Z.st.muelle[1] + 0.25, yaw: Math.PI }; c.pan.act('give'); sfx('whoosh'); W.bobber.visible = true; W.bobber.position.y = 0.06;
  const rod = mesh(G.cyl(0.012, 0.02, 1.7, 5), mat(S.rw.cana ? '#e9b949' : '#c98a5a'), { p: [0, -0.3, 0.75], r: [1.25, 0, 0] }); rod.userData.rod = true; c.pan.arms[1].add(rod); setTimeout(() => burst('steam', Z.bob[0], 0.2, Z.bob[1], 4), 350);
}
export function endFish() { const R = c.R; if (R.fishing?.g) ui.unanchor(R.fishing.g); R.fishing = null; W.bobber.visible = false; c.pan.action = null; c.pan.arms[1].remove(...c.pan.arms[1].children.filter(o => o.userData.rod)); }
export function updateFish(dt) {
  const R = c.R, S = c.S, F = R.fishing, Z = W.zones.rio, pan = c.pan; F.t += dt; pan.arms[1].rotation.x = -0.9; const E = c.takeE();
  if (F.st === 'wait') {
    W.bobber.position.y = 0.06 + Math.sin(F.t * 3) * 0.02;
    if (E && F.t > 0.5) { ui.toast('Recoges el sedal. Nada todavía.'); return endFish(); }
    if (F.t > F.bite) { F.st = 'bite'; F.t = 0; sfx('pop'); c.emote([pan.x, 2.2, pan.z], '!', 800); burst('steam', Z.bob[0], 0.15, Z.bob[1], 6); }
  } else if (F.st === 'bite') {
    W.bobber.position.y = -0.06 + Math.sin(F.t * 30) * 0.03;
    if (E) {
      const x = Math.random(); if (x < 0.1) { sfx('perfect'); pan.act('joy'); if (x < 0.06) { const g = c.pick(['semillas', 'aceitunas']); S.ing[g] = (S.ing[g] || 0) + 1; ui.toast(`<img src="${XI.ing[g]}" alt="">Un tarro que flotaba río abajo. Dentro, ${ING[g].n.toLowerCase()}.`); } else { const n = 10 + Math.floor(Math.random() * 12); S.money += n; ui.setMoney(S.money, true); sfx('coin'); ui.toast(`<span class="coin sm"></span> Una bota vieja… con ${n} monedas dentro.`, 'gold'); } c.save(); return endFish(); }
      const sp = pickFish(), D = FISH[sp]; F.st = 'reel'; F.t = 0; F.sp = sp; F.fish = 0.5; F.tgt = 0.5; F.tgtT = 0; F.bar = 0.4; F.barV = 0; F.prog = 0.32; F.hw = (0.15 + (ofLvl('rio') >= 2 ? 0.03 : 0) + (S.rw.cana ? 0.035 : 0)) / Math.pow(D.dif, 0.35);
      sfx('good'); c.hit(0.05); cam.shake = 0.3; F.g = ui.anchor('gauge reel', `<div class="reel"><div class="rtrack"><div class="rzone"></div><div class="rfish">${S.seen[sp] ? ii(sp) : '<b>?</b>'}</div></div><div class="rprog"><i></i></div></div><div class="tk"><kbd>E</kbd> mantén para subir</div>`, [pan.x + 1.5, 2.6, pan.z]);
    } else if (F.t > 0.9) { sfx('meh'); ui.toast('Se escapó. Hay que pulsar en cuanto se hunda la boya.'); return endFish(); }
  } else {
    const D = FISH[F.sp]; F.tgtT -= dt; if (F.tgtT < 0) { F.tgtT = (0.35 + Math.random() * 0.8) / Math.sqrt(D.dif); F.tgt = 0.08 + Math.random() * 0.84; }
    F.fish += Math.sign(F.tgt - F.fish) * Math.min(Math.abs(F.tgt - F.fish), dt * 0.62 * D.dif);
    F.barV += (c.eDown() ? 2.6 : -2.2) * dt; F.barV *= Math.exp(-dt * 2.2); F.bar += F.barV * dt; if (F.bar < F.hw) { F.bar = F.hw; F.barV = Math.max(0, F.barV) * 0.3; } if (F.bar > 1 - F.hw) { F.bar = 1 - F.hw; F.barV = Math.min(0, F.barV); }
    const on = Math.abs(F.fish - F.bar) < F.hw; F.prog += dt * (on ? 0.36 : -0.22 * Math.sqrt(D.dif)); W.bobber.position.y = -0.03 + Math.sin(F.t * 18) * 0.04; if (Math.random() < dt * 5) burst('steam', Z.bob[0], 0.15, Z.bob[1], 1);
    const g = F.g; g.querySelector('.rzone').style.cssText = `bottom:${((F.bar - F.hw) * 100).toFixed(1)}%;height:${(F.hw * 200).toFixed(1)}%`; g.querySelector('.rfish').style.bottom = (F.fish * 100).toFixed(1) + '%'; g.querySelector('.rprog i').style.height = (Math.max(0, Math.min(1, F.prog)) * 100).toFixed(1) + '%'; g.classList.toggle('on', on);
    if (on && Math.floor(F.t * 6) !== Math.floor((F.t - dt) * 6)) sfx('tick');
    if (F.prog >= 1) {
      const sp = F.sp, n = ofLvl('rio') >= 5 && Math.random() < 0.25 ? 2 : 1, cm = Math.round(D.cm[0] + (D.cm[1] - D.cm[0]) * Math.pow(Math.random(), 1.6 - ofLvl('rio') * 0.15)), rec = cm > (S.fishRec[sp] || 0), first = !S.seen[sp];
      give(sp, n); if (rec) S.fishRec[sp] = cm; xp('rio', Math.round(5 * D.dif)); c.cnt('fish'); sfx('perfect'); c.hit(0.07); cam.shake = 0.5; pan.act('joy'); pan.say('wow', 1.6); burst('steam', Z.bob[0], 0.3, Z.bob[1], 14); burst('spark', pan.x, 1.6, pan.z, 12);
      ui.float(`¡${ITEMS[sp].n}!${n > 1 ? ' ×2' : ''}`, pan.x, 2.3, pan.z, 'star'); ui.toast(`${ii(sp)}${ITEMS[sp].n} de ${cm} cm${rec && !first ? ' · ¡tu récord!' : ''}${first ? ' · nueva en el almanaque' : ''}`, sp === 'dorada' || first ? 'gold' : 'good'); endFish(); c.checkLogros(); c.save();
    } else if (F.prog <= 0) { sfx('meh'); ui.toast(`Se soltó. ${S.seen[F.sp] ? 'Era ' + (F.sp === 'anguila' ? 'una' : 'un') + ' ' + ITEMS[F.sp].n.toLowerCase() : 'No llegaste a ver qué era'}.`); endFish(); }
  }
}

// ---------- vender y regalar ----------
export function openSell(title, sub, kf, who) {
  const S = c.S; let sold = 0;
  const draw = (keep) => {
    const ids = bagIds();
    const sh = ui.modal(`<button class="x">✕</button><h2>${title}</h2><div class="sub">${sub}</div>${ids.length ? `<div class="grid scroll" style="grid-template-columns:repeat(${Math.min(4, Math.max(2, ids.length))},1fr)">${ids.map(id => { const p = sellPrice(id, kf(id)); return `<div class="mue"><img src="${XI.item[id]}" alt=""><div class="nm">${ITEMS[id].n} <span style="color:#d9861c">×${bagN(id)}</span></div><div class="ds" style="min-height:0">${p} ${coin} cada una${kf(id) > 1 ? ' · <b style="color:#3f9a5a">hoy se paga más</b>' : ''}</div><div class="btnrow" style="justify-content:center"><button class="btn sm main" data-s="${id}" data-n="1">Vender 1</button>${bagN(id) > 1 ? `<button class="btn sm" data-s="${id}" data-n="${bagN(id)}">Todo · ${p * bagN(id)}</button>` : ''}</div></div>`; }).join('')}</div>` : '<div class="empty">El zurrón está vacío. Huerta, monte y río lo llenan.</div>'}`, 'paper');
    if (keep) sh.style.animation = 'none'; sh.querySelector('.x').onclick = () => ui.closeModal();
    sh.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const id = b.dataset.s, n = Number(b.dataset.n), p = sellPrice(id, kf(id)) * n; take(id, n); S.money += p; S.total.earned += p; c.R.today.zurron = (c.R.today.zurron || 0) + p; sold += p; ui.setMoney(S.money, true); sfx('coin'); if (who) c.gainPts(who, 0); c.save(); draw(true); });
  }; sfx('page'); draw();
}
const tierOf = (nb, id) => TASTE[nb].love.includes(id) ? 'love' : TASTE[nb].like.includes(id) ? 'like' : TASTE[nb].no.includes(id) ? 'no' : 'meh';
const TIER = { love: ['♥♥', 'le encanta', '#e2475a'], like: ['♥', 'le gusta', '#e98a9a'], meh: ['·', 'ni fu ni fa', '#a89a8a'], no: ['✗', 'no le gusta', '#7a8a9a'] };
export const canGift = (nb) => c.S.gifted[nb] !== c.S.day && bagIds().length > 0;
export function openGift(st) {
  const S = c.S, nb = st.nb, N = NEIGH[nb], ids = bagIds(), known = S.taste[nb] || {}, bd = BDAY[nb] === yday(); sfx('page');
  const sh = ui.modal(`<button class="x">✕</button><h2>Un regalo para ${N.n}</h2><div class="sub">${bd ? '¡Hoy es su cumpleaños! Lo que le des cuenta el triple. ' : ''}Un regalo al día. Lo que le encanta da mucho cariño; lo que no, ninguno. Lo que vayas descubriendo se apunta en la libreta.</div>
    <div class="grid scroll" style="grid-template-columns:repeat(${Math.min(5, Math.max(2, ids.length))},1fr)">${ids.map(id => { const t = known[id]; return `<button class="mue gift" data-g="${id}"><img src="${XI.item[id]}" alt=""><div class="nm">${ITEMS[id].n} <span style="color:#d9861c">×${bagN(id)}</span></div><div class="ds" style="min-height:0;color:${t ? TIER[t][2] : 'var(--soft)'}">${t ? `${TIER[t][0]} ${TIER[t][1]}` : '¿le gustará?'}</div></button>`; }).join('')}</div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal();
  sh.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { ui.closeModal(); doGift(st, b.dataset.g); });
}
function doGift(st, id) {
  const S = c.S, nb = st.nb, N = NEIGH[nb], t = tierOf(nb, id), bd = BDAY[nb] === yday(), pts = { love: 6, like: 3, meh: 1, no: 0 }[t] * (bd ? 3 : 1), isNew = !(S.taste[nb] || {})[id];
  take(id, 1); (S.taste[nb] ||= {})[id] = t; S.gifted[nb] = S.day; st.to = null; st.t = 7; c.pan.act('give'); c.pan.yawTo = Math.atan2(st.ch.x - c.pan.x, st.ch.z - c.pan.z); if (t === 'love') c.cnt('giftLove'); if (bd) c.cnt('bday');
  st.ch.act(t === 'no' ? 'sad' : t === 'meh' ? 'nod' : 'joy'); st.ch.say(t === 'love' ? 'wow' : t === 'no' ? 'sad' : 'happy', 2); sfx(t === 'love' ? 'fanfare' : t === 'no' ? 'meh' : 'heart');
  c.talk(st, [(bd ? '¡Te has acordado de mi cumpleaños! ' : '') + GIFT_SAY[t][nb]], () => {
    if (pts) { c.gainPts(nb, pts); ui.float(`${'♥'.repeat(t === 'love' ? 2 : 1)} +${pts}`, st.ch.x, 2.4, st.ch.z, 'heart'); if (t === 'love') { burst('confetti', st.ch.x, 2, st.ch.z, 24); c.addRep(2); } }
    if (isNew) ui.toast(`${ii(id)} Apuntado en la libreta: ${N.n} · ${ITEMS[id].n} ${TIER[t][0]} (${TIER[t][1]})`, t === 'love' ? 'gold' : ''); c.checkLogros(); c.save();
  });
}
export function tasteHTML(nb) {
  const k = c.S.taste[nb] || {}, row = (tier, lbl) => `<div class="lbl">${lbl}</div><div class="likes">${TASTE[nb][tier].map(id => `<span class="lk ${k[id] ? '' : 'unk'}" title="${k[id] ? ITEMS[id].n : '???'}">${ii(id)}</span>`).join('')}</div>`;
  return `${row('love', 'Regalos que le encantan')}${BDAY[nb] ? `<div class="bday">Cumple el ${((BDAY[nb] - 1) % 7) + 1} de ${SE_N[Math.floor((BDAY[nb] - 1) / 7)]}${c.S.gifted[nb] === c.S.day ? ' · hoy ya tiene regalo' : ''}</div>` : ''}`;
}

// ---------- el buhonero y la feria ----------
function openTrasto() {
  const S = c.S, R = c.R; sfx('bell');
  const draw = (keep) => {
    const sh = ui.modal(`<button class="x">✕</button><h2>La manta de Don Trasto</h2><div class="sub">«Género de otros pueblos y de otras estaciones, señora panadera. Y si le sobra algo en el zurrón, yo lo coloco.» Tienes ${S.money} ${coin}.</div>
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">${R.trastoStock.map((s, k) => `<div class="mue ${s.n ? '' : 'own'}"><img src="${s.id === 'abono' ? XI.up.huerto : XI.item[s.id]}" alt=""><div class="nm">${s.id === 'abono' ? 'Saco de abono' : ITEMS[s.id].n}</div><div class="ds">${s.id === 'abono' ? `Tres paladas para el huerto. Tienes ${S.compost || 0}.` : 'Fuera de temporada. ' + (ALM_ORDER.some(p => !S.rw[ALM[p].rw] && ALM[p].need.includes(s.id) && !(S.alm[p] || [])[ALM[p].need.indexOf(s.id)]) ? '<b style="color:#3f9a5a">Falta en tu almanaque.</b>' : '')}</div>${s.n ? `<button class="btn sm ${S.money >= s.p ? 'main' : ''}" data-b="${k}" ${S.money < s.p ? 'disabled' : ''}>${s.p} ${coin} · quedan ${s.n}</button>` : '<span class="sealed" style="font-size:15px">VENDIDO</span>'}</div>`).join('')}</div>
      <div class="bfoot"><button class="btn" id="t-sell">Venderle del zurrón</button><span class="grow">Paga un 20 % más que la fonda.</span></div>`, 'paper');
    if (keep) sh.style.animation = 'none'; sh.querySelector('.x').onclick = () => ui.closeModal();
    sh.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const s = R.trastoStock[b.dataset.b]; if (S.money < s.p || !s.n) return sfx('no'); S.money -= s.p; R.today.spent += s.p; s.n--; if (s.id === 'abono') S.compost = (S.compost || 0) + 3; else give(s.id, 1); ui.setMoney(S.money, true); sfx('stamp'); sfx('coin'); trasto?.act('joy'); c.save(); draw(true); });
    sh.querySelector('#t-sell').onclick = () => openSell('Vender a Don Trasto', '«Todo tiene comprador en algún pueblo.» Paga un 20 % más que la fonda.', () => 1.2);
  }; draw();
}
function feriaScore() {
  const R = c.R, rows = bagIds().map(id => ({ icon: XI.item[id], n: ITEMS[id].n, pts: inSeasonItem(id) && id !== 'miel' ? 2 : 1, note: inSeasonItem(id) && id !== 'miel' ? 'de temporada' : '' }));
  Object.keys(R.shelf).filter(id => R.shelf[id].some(l => l.q === 3 && !l.old && !l.burnt)).slice(0, 4).forEach(id => rows.push({ icon: ICON[id], n: BREADS[id].n, pts: 1, note: 'pan de ★★★' }));
  const tot = rows.reduce((a, r) => a + r.pts, 0); let tier = 0; RIBBON.forEach((rb, i) => { if (rb && tot >= rb.at) tier = i; }); return { rows, tot, tier };
}
function openFeria() {
  const S = c.S, R = c.R, sc = feriaScore(), se = seIdx(), best = S.ribbon[se] || 0, done = S.ribbonDay === S.day; sfx('page');
  const sh = ui.modal(`<button class="x">✕</button><h2>Concurso de cestas · feria de ${SE_N[se]}</h2><div class="sub">Don Ulular puntúa lo que enseñes: cada producto distinto del zurrón, un punto; si es de temporada, dos. Cada pan con piezas de ★★★ en el mostrador, otro. No se queda nada: solo mira. Bronce a los ${RIBBON[1].at}, plata a los ${RIBBON[2].at}, oro a los ${RIBBON[3].at}.</div>
    <div class="feria"><div class="fcol scroll">${sc.rows.length ? sc.rows.map((r, i) => `<div class="frow" style="animation-delay:${(0.15 + i * 0.09).toFixed(2)}s"><img src="${r.icon}" alt=""><span>${r.n}${r.note ? ` <small>${r.note}</small>` : ''}</span><b>+${r.pts}</b></div>`).join('') : '<div class="empty">Hoy no traes nada que enseñar.</div>'}</div>
    <div class="fres"><div class="pic"><img src="${XI.face.ulular[sc.tier ? 'happy' : 'idle']}" alt=""></div><div class="ftot">${sc.tot}<small>puntos</small></div>${sc.tier ? `<div class="rib" style="--rc:${RIBBON[sc.tier].c}">${RIBBON[sc.tier].n}</div><div class="ds">${RIBBON[sc.tier].coins} ${coin} y +${RIBBON[sc.tier].rep} ♥</div>` : `<div class="ds">Te faltan ${RIBBON[1].at - sc.tot} para el bronce.</div>`}
    ${done ? '<span class="sealed" style="font-size:15px">YA PRESENTADA</span>' : `<button class="btn ${sc.tier ? 'main' : ''}" id="f-go" ${sc.tier ? '' : 'disabled'}>Presentar la cesta</button>`}<div class="ds">Tu mejor cinta de ${SE_N[se]}: ${best ? RIBBON[best].n.toLowerCase() : 'ninguna todavía'}</div></div></div>`, 'paper');
  sh.querySelector('.x').onclick = () => ui.closeModal(); const go = sh.querySelector('#f-go');
  if (go) go.onclick = () => { const rb = RIBBON[sc.tier]; S.ribbonDay = S.day; S.ribbon[se] = Math.max(best, sc.tier); S.money += rb.coins; S.total.earned += rb.coins; R.today.zurron = (R.today.zurron || 0) + rb.coins; ui.setMoney(S.money, true); c.addRep(rb.rep); ui.closeModal(); sfx('fanfare'); c.pan.act('joy'); c.pan.say('wow', 2); burst('confetti', W.evSpot[0], 2.4, W.evSpot[1], 70, { spread: 2 }); ui.toast(`${ii('calabaza')} ${rb.n} en la feria de ${SE_N[se]}: +${rb.coins} <span class="coin sm"></span>`, 'gold'); c.checkLogros(); c.save(); };
}

// ---------- el almanaque ----------
function almSlot(pg, k) { return !!(c.S.alm[pg] || [])[k]; }
function almDeliver(pg, k) {
  const S = c.S, A = ALM[pg], need = A.need[k]; S.alm[pg] ||= [];
  if (need === 'oro') { if (S.money < ALM_ORO) return false; S.money -= ALM_ORO; c.R.today.spent += ALM_ORO; ui.setMoney(S.money, true); S.alm[pg][k] = true; }
  else if (need === 'pan3') { const used = S.alm[pg].filter(x => typeof x === 'string'), id = Object.keys(c.R.shelf).find(b => !used.includes(b) && c.R.shelf[b].some(l => l.q === 3 && !l.old && !l.burnt)); if (!id) return false; const a = c.R.shelf[id]; a.splice(a.findIndex(l => l.q === 3 && !l.old && !l.burnt), 1); c.refreshBaskets(); S.alm[pg][k] = id; }
  else { if (!bagN(need)) return false; take(need, 1); S.alm[pg][k] = true; }
  sfx('stamp'); if (A.need.every((_, j) => almSlot(pg, j))) { S.rw[A.rw] = true; applyVida(); setTimeout(() => { sfx('fanfare'); burst('confetti', c.pan.x, 2, c.pan.z, 60); ui.toast(`${ii('miel')} Página «${A.n}» completa: ${A.rn}. ${A.rd}`, 'gold'); }, 500); if (almDone()) setTimeout(() => { if (!ui.modalOpen) c.letter(CARTA_ALM, 'Entre las últimas páginas del almanaque', () => { sfx('fanfare'); ui.toast('El espantapájaros luce la bufanda dorada de la abuela. +500 <span class="coin sm"></span>', 'gold'); }); S.money += 500; ui.setMoney(S.money, true); c.save(); }, 3600); }
  c.checkLogros(); c.save(); return true;
}
const canDeliver = (pg, k) => { const S = c.S, need = ALM[pg].need[k]; if (almSlot(pg, k)) return false; if (need === 'oro') return S.money >= ALM_ORO; if (need === 'pan3') { const used = (S.alm[pg] || []).filter(x => typeof x === 'string'); return Object.keys(c.R.shelf).some(b => !used.includes(b) && c.R.shelf[b].some(l => l.q === 3 && !l.old && !l.burnt)); } return bagN(need) > 0; };
export const almReady = () => ALM_ORDER.some(pg => !c.S.rw[ALM[pg].rw] && ALM[pg].need.some((_, k) => canDeliver(pg, k)));

// ---------- pestañas de la libreta ----------
const whenHTML = (id) => { const se = CROPS[id]?.se || FORAGE[id]?.se || FISH[id]?.se; return se ? se.map(s => `<span class="sechip" style="background:${SE_C[s]}">${SE_N[s]}</span>`).join('') : '<span class="sechip" style="background:#c9a06a">todo el año</span>'; };
const whereTxt = (id) => CROPS[id] ? `Del huerto: ${CROPS[id].days} noches regadas${CROPS[id].re ? `, y vuelve a dar cada ${CROPS[id].re}` : ''}.` : FORAGE[id] ? `Silvestre: ${FORAGE[id].at.map(a => ({ pueblo: 'por las afueras del pueblo', rio: 'a la orilla del río', molino: 'junto al molino' })[a]).join(', ')}.` : FISH[id] ? `Del río${FISH[id].late ? ', de tarde o con lluvia' : ''}.${c.S.fishRec[id] ? ` Tu récord: ${c.S.fishRec[id]} cm.` : ''}` : 'De la colmena del huerto: un tarro al día.';
export const VIDA_TABS = [['zurron', 'Zurrón'], ['almanaque', 'Almanaque'], ['calendario', 'Calendario']];
export function vidaTab(tab, redraw) {
  const S = c.S, R = c.R;
  if (tab === 'zurron') {
    const ofi = Object.keys(OFICIOS).map(k => { const l = ofLvl(k), x = S.xp[k] || 0, a = OFI_AT[l - 1], b = OFI_AT[l]; return `<div class="ofi" title="${OFICIOS[k].perks.slice(1, l).join(' · ') || 'Aún sin ventajas'}"><b>${OFICIOS[k].n}</b><span>nv ${l}</span><div class="minibar"><i style="width:${b ? Math.round((x - a) / (b - a) * 100) : 100}%"></i></div></div>`; }).join('');
    return { list: ITEM_ORDER, cols: 5, hint: 'mirar', sel: bagIds()[0] || ITEM_ORDER.find(id => S.seen[id]) || ITEM_ORDER[0],
      left: `<h2>Zurrón</h2><div class="sub">Lo que dan el huerto, el monte y el río. Se regala, se vende, se enseña en la feria o va a la masa como toque.</div><div class="ofis">${ofi}</div><div class="thumbs c5 scroll">${ITEM_ORDER.map(id => `<button class="th ${S.seen[id] ? '' : 'unk'}" data-id="${id}"><span class="stk">${ii(id)}</span>${bagN(id) ? `<span class="mini">${bagN(id)}</span>` : ''}</button>`).join('')}</div>`,
      detail(id) {
        const I = ITEMS[id]; if (!S.seen[id]) return `<div class="det"><div class="big"><div class="doily"><img src="${XI.item[id]}" style="filter:brightness(0) opacity(.16)" alt=""></div><div><h3>¿¿¿???</h3><div class="ds">${CROPS[id] ? 'Algo que se siembra.' : FORAGE[id] ? 'Algo que crece solo por ahí.' : FISH[id] ? 'Algo que nada.' : 'Algo dulce y lento.'}</div></div></div><div class="lbl">Cuándo</div><div>${whenHTML(id)}</div></div>`;
        const fans = NEIGH_ORDER.filter(nb => (S.taste[nb] || {})[id] === 'love' || (S.taste[nb] || {})[id] === 'like');
        return `<div class="det"><div class="big"><div class="doily">${ii(id)}</div><div><h3>${I.n}</h3><div class="ds">${I.d}</div></div></div>
          <div class="lbl">Cuándo y dónde</div><div>${whenHTML(id)}</div><div class="ds" style="font:700 16px var(--hand);color:var(--soft);margin-top:6px">${whereTxt(id)}</div>
          ${I.toque ? `<div class="lbl">Como toque en la masa</div><div class="ds" style="font:700 16px var(--hand);color:var(--soft)">Pan «${I.toque.n}»: vale un ${Math.round((toqueK(id) - 1) * 100)} % más. ${I.toque.sweet === 1 ? 'Solo en panes dulces.' : I.toque.sweet === 0 ? 'Solo en panes salados.' : 'Pega con todo.'}</div>` : ''}
          <div class="lbl">A quién le hace ilusión</div><div class="likes">${fans.length ? fans.map(nb => `<span class="lk" title="${NEIGH[nb].n}"><img src="${XI.face[nb].happy}" alt=""></span>`).join('') : '<span class="ds" style="font:700 16px var(--hand);color:var(--soft)">Aún no lo sabes. Regálalo y verás.</span>'}</div>
          <div class="from"><span>En el zurrón: <b>${bagN(id)}</b></span><span style="margin-left:auto">La fonda lo paga a <b>${sellPrice(id)}</b> ${coin}</span></div></div>`;
      } };
  }
  if (tab === 'almanaque') {
    const icon = (pg) => pg === 'horno' ? ICON.hogaza : XI.item[ALM[pg].need[0]];
    return { list: ALM_ORDER, cols: 4, hint: 'entregar', sel: ALM_ORDER.find(pg => !S.rw[ALM[pg].rw] && ALM[pg].need.some((_, k) => canDeliver(pg, k))) || ALM_ORDER.find(pg => !S.rw[ALM[pg].rw]) || ALM_ORDER[0],
      left: `<h2>El almanaque</h2><div class="sub">La abuela apuntaba lo que daba Migas cada estación. ${pagesDone()} de ${ALM_ORDER.length} páginas. Cada una devuelve algo al huerto, al río o al horno.</div><div class="thumbs scroll">${ALM_ORDER.map(pg => { const A = ALM[pg], n = A.need.filter((_, k) => almSlot(pg, k)).length, ok = !!S.rw[A.rw], can = !ok && A.need.some((_, k) => canDeliver(pg, k)); return `<button class="th photo" data-id="${pg}"><span class="stk"><img src="${icon(pg)}" alt=""></span><span class="cap">${A.n}</span><span class="mini ${ok ? '' : can ? 'red' : 'grey'}">${ok ? '✓' : n + '/' + A.need.length}</span></button>`; }).join('')}</div>`,
      detail(pg) {
        const A = ALM[pg], ok = !!S.rw[A.rw];
        return `<div class="det"><div class="big"><div class="blue"><img src="${icon(pg)}" alt=""></div><div><h3>Página: ${A.n}</h3><div class="ds">${pg === 'horno' ? 'Tres panes distintos, cada uno con una pieza de ★★★ en el mostrador.' : pg === 'despensa' ? 'Lo que nunca faltaba en su alacena, y un pellizco para el bote del pueblo.' : pg === 'rio' ? 'Los cinco que nadan frente al muelle. Alguno solo sale de tarde.' : `Lo que da Migas en ${A.n.toLowerCase()}. Si se te pasa la estación, Don Trasto lo trae los miércoles.`}</div></div></div>
          <div class="lbl">Hay que traer</div><div class="slots">${A.need.map((nd, k) => { const got = almSlot(pg, k), can = canDeliver(pg, k), given = (S.alm[pg] || [])[k], pic = nd === 'oro' ? '<span class="coin"></span>' : nd === 'pan3' ? `<img src="${typeof given === 'string' ? ICON[given] : ICON.barra}" ${got ? '' : 'style="filter:brightness(0) opacity(.2)"'} alt="">` : `<img src="${XI.item[nd]}" ${got || S.seen[nd] ? '' : 'style="filter:brightness(0) opacity(.2)"'} alt="">`, nm = nd === 'oro' ? `${ALM_ORO} monedas` : nd === 'pan3' ? (typeof given === 'string' ? BREADS[given].n : 'Un pan de ★★★') : S.seen[nd] || got ? ITEMS[nd].n : '???'; return `<button class="slot ${got ? 'got' : can ? 'can' : ''}" data-k="${k}" ${can ? '' : 'disabled'}>${pic}<b>${nm}</b><small>${got ? 'entregado' : can ? 'entregar' : nd === 'oro' ? 'te faltan ' + (ALM_ORO - S.money) : nd === 'pan3' ? 'ninguno a la vista' : 'no llevas'}</small></button>`; }).join('')}</div>
          <div class="lbl">Lo que devuelve</div><div style="display:flex;align-items:center;gap:14px;min-height:60px">${ok ? '<span class="sealed">CONSEGUIDO</span>' : ''}<div><b style="font-size:18px">${A.rn}</b><div class="ds" style="font:700 16px var(--hand);color:var(--soft)">${A.rd}</div></div></div>
          <div class="from"><span>Almanaque: <b>${pagesDone()} de ${ALM_ORDER.length}</b></span><span style="margin-left:auto">${almDone() ? 'Completo. La bufanda es tuya.' : 'Al completarlo, la abuela dejó algo escrito.'}</span></div></div>`;
      },
      bind(right, pg) { right.querySelectorAll('.slot.can').forEach(b => b.onclick = () => { if (almDeliver(pg, Number(b.dataset.k))) redraw(); }); },
      act(right) { right.querySelector('.slot.can')?.click(); } };
  }
  // calendario
  const days = Array.from({ length: 28 }, (_, i) => 'd' + (i + 1)), today = yday(), bdOf = (d) => NEIGH_ORDER.find(nb => BDAY[nb] === d), y0 = S.day - today;
  return { list: days, cols: 7, hint: 'mirar', sel: 'd' + today,
    left: `<h2>Calendario</h2><div class="sub">Año ${Math.floor((S.day - 1) / 28) + 1} en Migas. Cuatro estaciones de una semana.</div><div class="calhead">${DIAS.map(d => `<span>${d.slice(0, 2)}</span>`).join('')}</div><div class="thumbs cal scroll">${days.map((id, i) => { const d = i + 1, wd = i % 7, se = Math.floor(i / 7), nb = bdOf(d), ev = WEEK_EV[wd]; return `<button class="th day ${d === today ? 'today' : d < today ? 'past' : ''}" data-id="${id}" style="--sc:${SE_C[se]}"><em>${wd + 1}</em>${nb ? `<img class="bd ${S.met[nb] ? '' : 'unk'}" src="${XI.face[nb].happy}" alt="">` : ''}${ev ? `<i class="ev e${wd}" title="${ev.n}"></i>` : ''}</button>`; }).join('')}</div><div class="calkey"><span><i class="ev e2"></i>mercadillo</span><span><i class="ev e4"></i>lonja</span><span><i class="ev e6"></i>feria</span>${[0, 1, 2, 3].map(s => `<span><i class="sed" style="background:${SE_C[s]}"></i>${SE_N[s]}${S.ribbon[s] ? ' ' + ['', '🥉', '🥈', '🥇'][S.ribbon[s]] : ''}</span>`).join('')}</div>`,
    detail(id) {
      const d = Number(id.slice(1)), wd = (d - 1) % 7, se = Math.floor((d - 1) / 7), nb = bdOf(d), ev = WEEK_EV[wd], rel = d - today, when = rel === 0 ? 'Hoy' : rel === 1 ? 'Mañana' : rel > 0 ? `Dentro de ${rel} días` : `Hace ${-rel} días · vuelve en ${28 + rel}`;
      const grp = (title, ids) => ids.length ? `<div class="lbl">${title}</div><div class="likes">${ids.map(x => `<span class="lk ${S.seen[x] ? '' : 'unk'}" title="${S.seen[x] ? ITEMS[x].n : '???'}">${ii(x)}</span>`).join('')}</div>` : '';
      return `<div class="det"><div class="big"><div class="calbig" style="--sc:${SE_C[se]}"><small>${DIAS[wd]}</small><b>${wd + 1}</b><em>${SE_N[se]}</em></div><div><h3>${when}</h3><div class="ds">${ev ? `<b>${ev.n}.</b> ${ev.d}` : 'Un día de diario: horno, mostrador y lo que apetezca.'}${nb ? `<br>${S.met[nb] ? `<b>Cumpleaños de ${NEIGH[nb].n}.</b> Un regalo ese día cuenta el triple.` : 'Alguien que aún no conoces cumple años.'}` : ''}${wd === 6 ? '<br>Al día siguiente cambia la estación: lo sembrado que no sea de la nueva, se pierde.' : ''}</div></div></div>
        ${grp(`Se siembra en ${SE_N[se]}`, CROP_ORDER.filter(x => CROPS[x].se.includes(se)))}${grp('Sale por el monte', Object.keys(FORAGE).filter(x => FORAGE[x].se.includes(se)))}${grp('Pica en el río', Object.keys(FISH).filter(x => FISH[x].se.includes(se)))}
        <div class="from"><span>Se llevan: <b>${SEASONS[se].up.filter(x => S.recipes.includes(x)).map(x => BREADS[x].n.toLowerCase()).join(', ') || 'los panes de siempre'}</b></span></div></div>`;
    } };
}

// ---------- día a día ----------
/** Noche (una sola vez por día) y preparación de la mañana. Devuelve líneas para la pizarra. */
export function vidaStartDay(first, r) {
  const S = c.S, R = c.R, se = seIdx(), wd = (S.day - 1) % 7, lines = [];
  if (!first && S.nightDay !== S.day) {
    let lost = 0, ready = 0, dry = 0;
    S.plots.forEach((p, i) => { if (!p) return; if (!plotSeason(p.c, i)) { S.plots[i] = null; lost++; return; } if (!p.r) { if (p.w) p.d++; else dry++; if (p.d >= needOf(p)) { p.r = true; ready++; } } p.w = false; });
    if (S.rw.colmena) S.hive = Math.min(6, (S.hive || 0) + 1);
    if (lost) setTimeout(() => ui.toast(`Cambio de estación: ${lost} ${lost === 1 ? 'bancal se ha quedado' : 'bancales se han quedado'} en rastrojo`), 7000);
    const rc = S.plots.find(p => p?.r)?.c; if (ready && rc) setTimeout(() => { sfx('good'); ui.toast(`${ii(rc)} En el huerto hay ${ready} ${ready === 1 ? 'bancal listo' : 'bancales listos'} para cosechar`, 'good'); }, 5600);
    else if (dry && S.up.huerto) setTimeout(() => ui.toast('Ayer se quedó el huerto sin regar: lo seco no crece'), 5600);
  }
  S.nightDay = S.day;
  if (R.weather === 'lluvia' || S.rw.aspersor) S.plots.forEach(p => { if (p && !p.r) p.w = true; });
  applyVida(); spawnForage(r);
  // mercadillo, feria y cumpleaños
  R.trasto = wd === 2 && S.day >= 3; W.up.trasto.visible = R.trasto; W.up.feria.visible = wd === 6 && S.day >= 7; R.feria = W.up.feria.visible;
  if (trasto) scene.remove(trasto.root);
  if (R.trasto) {
    trasto ||= makeChar(TRASTO_LOOK); trasto.x = W.trastoSpot[0]; trasto.z = W.trastoSpot[1]; trasto.yaw = trasto.yawTo = 0; scene.add(trasto.root);
    const out = ITEM_ORDER.filter(id => id !== 'miel' && id !== 'dorada' && !inSeasonItem(id, se)).sort(() => r() - 0.5), miss = out.filter(id => ALM_ORDER.some(p => !S.rw[ALM[p].rw] && ALM[p].need.includes(id) && !almSlot(p, ALM[p].need.indexOf(id))));
    R.trastoStock = [...new Set([...miss.slice(0, 2), ...out])].slice(0, 3).map(id => ({ id, p: ITEMS[id].sell * 3, n: 2 })); R.trastoStock.push({ id: 'abono', p: 24, n: 2 });
    lines.push('Mercadillo en la plaza'); if (!first) setTimeout(() => ui.toast('Miércoles de mercadillo: Don Trasto ha puesto la manta en la plaza, camino del río', 'good'), 8200);
  }
  if (R.feria) { W.feriaShow.clear(); if (!first) setTimeout(() => ui.toast('Hay concurso de cestas en la plaza: enseña tu zurrón antes de cerrar', 'good'), 8200); }
  if (wd === 4) lines.push('Lonja: pescado ×1,5');
  R.bday = NEIGH_ORDER.find(nb => BDAY[nb] === yday() && S.met[nb]) || null;
  if (R.bday) { lines.push(`Cumple ${NEIGH[R.bday].n}`); if (!first) setTimeout(() => { sfx('heart'); ui.toast(`${c.face(R.bday, 'happy')} Hoy es el cumpleaños de ${NEIGH[R.bday].n}: un regalo cuenta el triple`, 'gold'); }, 9600); }
  if (wd === 6 && !first && S.plots.some((p, i) => p && !plotSeason(p.c, i, (se + 1) % 4))) setTimeout(() => ui.toast('Mañana cambia la estación: cosecha lo que puedas, lo de esta se pierde'), 11000);
  // chip del día en el HUD
  let chip = $('#dc-ev'); if (!chip) { chip = document.createElement('div'); chip.id = 'dc-ev'; $('#chalks').prepend(chip); }
  const evs = []; if (R.trasto) evs.push('Mercadillo'); if (wd === 4) evs.push('Lonja'); if (R.feria) evs.push('Feria'); if (R.bday) evs.push(`Cumple ${NEIGH[R.bday].n}`); chip.textContent = evs.join(' · '); chip.classList.toggle('hide', !evs.length);
  return lines;
}
export function vidaUpdate(dt) { const R = c.R; if (R.trasto && trasto) { if (R.time > 17 * 60 && !ui.modalOpen) { R.trasto = false; W.up.trasto.visible = false; scene.remove(trasto.root); burst('dust', trasto.x, 0.5, trasto.z, 10); } else { trasto.lookAt = Math.hypot(c.pan.x - trasto.x, c.pan.z - trasto.z) < 4 ? c.pan : null; updateChar(trasto, dt); } } }
/** Acciones de la vida fuera del obrador. Devuelve la acción o null. */
export function vidaAction(px, pz, carry) {
  const S = c.S, R = c.R, near = (p, d) => Math.hypot(px - p[0], pz - p[1]) < d;
  for (const f of R.forage || []) if (f.zone === (R.zone || null) && Math.hypot(px - f.x, pz - f.z) < 1.25) return { text: `Coger ${ITEMS[f.id].n.toLowerCase()}`, pos: [f.x, 1.25, f.z], fn: () => pickForage(f) };
  if (R.zone === 'huerta') {
    const Z = W.zones.huerta;
    let bi = -1, bd = 1.35; W.plots.forEach((p, i) => { if (!plotOpen(i)) return; const d = Math.hypot(px - p.x, pz - p.z); if (d < bd) { bd = d; bi = i; } });
    if (bi >= 0) {
      const s = S.plots[bi], p = W.plots[bi], pos = [p.x, 1.55, p.z], face = Math.atan2(p.x - px, p.z - pz), mk = (o) => ({ pos, ...o, fn: () => { c.pan.yawTo = face; o.fn(); } });
      if (!s) return mk({ text: 'Sembrar', fn: () => openSeeds(bi) });
      if (s.r) return mk({ text: `Cosechar ${ITEMS[s.c].n.toLowerCase()}`, fn: () => harvest(bi) });
      if (!s.w) return mk({ text: `Regar ${ITEMS[s.c].n.toLowerCase()}`, fn: () => water(bi) });
      if ((S.compost || 0) > 0 && !s.f) return mk({ text: `Echar abono (tienes ${S.compost})`, fn: () => fertilize(bi) });
      const left = needOf(s) - s.d; return { pos, ok: false, text: `${ITEMS[s.c].n}: regado. ${left === 1 ? 'Mañana estará' : `Faltan ${left} noches`}`, fn: () => sfx('no') };
    }
    if (S.rw.colmena && near(Z.st.colmena, 1.5)) return S.hive > 0 ? { text: `Recoger la miel (${S.hive})`, pos: [Z.st.colmena[0], 2.1, Z.st.colmena[1] - 0.9], fn: () => { const n = S.hive; S.hive = 0; give('miel', n); applyVida(); c.pan.act('joy'); sfx('perfect'); burst('spark', Z.st.colmena[0], 1.2, Z.st.colmena[1] - 0.6, 14, { color: 0xf2c14e }); ui.float(`+${n} miel`, Z.st.colmena[0], 2, Z.st.colmena[1], 'star'); c.checkLogros(); c.save(); } } : { text: 'Las abejas trabajan. Mañana habrá miel', ok: false, pos: [Z.st.colmena[0], 2.1, Z.st.colmena[1] - 0.9], fn: () => sfx('no') };
    if (near(Z.st.caseta, 1.5)) return { text: 'Mirar el semillero', pos: [Z.st.caseta[0], 2.3, Z.st.caseta[1] - 0.8], fn: () => openSeeds(null) };
    if (near(Z.st.salir, 1.2)) return { text: 'Volver al pueblo', pos: [Z.st.salir[0], 1.2, Z.st.salir[1]], fn: () => c.travel(null) };
    return null;
  }
  if (R.zone) return null;
  if (R.trasto && trasto && near(W.evSpot, 2.5)) return { text: 'Ver la manta de Don Trasto', pos: [trasto.x, 2.4, trasto.z], fn: openTrasto, cust: { ch: trasto } };
  if (R.feria && near(W.evSpot, 2.4)) return { text: S.ribbonDay === S.day ? 'Concurso de cestas: ya presentada' : 'Presentar la cesta al concurso', pos: [W.evSpot[0], 2.2, W.evSpot[1]], fn: openFeria };
  if (near(W.travel.huerta, 1.5)) return S.up.huerto ? { text: carry ? 'Al huerto, con las manos libres' : 'Entrar al huerto', ok: !carry, pos: [W.travel.huerta[0], 1.9, W.travel.huerta[1] - 0.5], fn: () => carry ? sfx('no') : c.travel('huerta') } : (c.lvl() >= 1 ? { text: 'El huerto de la abuela, lleno de zarzas. Encarga la obra en la libreta', ok: false, pos: [W.travel.huerta[0], 1.9, W.travel.huerta[1] - 0.5], fn: () => sfx('no') } : null);
  return null;
}
/** Lo que espera mañana: se enseña en el cierre de caja. */
export function vidaTomorrow() {
  const S = c.S, R = c.R, d = S.day + 1, wd = (d - 1) % 7, out = [], nb = NEIGH_ORDER.find(n => BDAY[n] === yday(d) && S.met[n]);
  if (WEEK_EV[wd] && (wd !== 6 || d >= 7) && (wd !== 2 || d >= 3)) out.push(WEEK_EV[wd].n.toLowerCase() + (wd === 2 ? ' en la plaza' : wd === 6 ? ' y concurso de cestas' : ': el pescado se paga más'));
  if (nb) out.push(`cumpleaños de ${NEIGH[nb].n}`);
  const se2 = seIdx(d), ready = S.plots.filter((p, i) => p && plotSeason(p.c, i, se2) && (p.r || (p.w && p.d + 1 >= needOf(p)))).length, lost = S.plots.filter((p, i) => p && !plotSeason(p.c, i, se2)).length, dry = S.plots.filter((p, i) => p && !p.r && !p.w && plotSeason(p.c, i, se2)).length;
  if (ready) out.push(`${ready} ${ready === 1 ? 'bancal listo' : 'bancales listos'} en el huerto`); if (lost) out.push(`cambia la estación y se ${lost === 1 ? 'pierde 1 bancal' : `pierden ${lost} bancales`}`); else if (se2 !== seIdx()) out.push(`empieza ${se2 === 0 ? 'la' : 'el'} ${SE_N[se2]}`); if (dry) out.push(`${dry} sin regar no ${dry === 1 ? 'crecerá' : 'crecerán'}`);
  if (S.rw.colmena) out.push('un tarro de miel más');
  return out;
}
export function vidaAway(h) { const S = c.S; if (!S.rw.colmena) return null; const n = Math.min(6 - (S.hive || 0), Math.floor(h / 2)); if (n <= 0) return null; S.hive += n; applyVida(); return `Las abejas no han parado: ${n} ${n === 1 ? 'tarro' : 'tarros'} de miel esperando en la colmena.`; }
export function vidaLogros() {
  const S = c.S, C = S.cnt;
  return { huerta1: (C.harvest || 0) >= 1, zurron: bagIds().length >= 10, pesca5: Object.keys(FISH).every(id => S.seen[id]), regalo: (C.giftLove || 0) >= 1, gustos: Object.values(S.taste).reduce((a, t) => a + Object.keys(t).length, 0) >= 20, cinta: Object.values(S.ribbon).some(x => x >= 1), oro: Object.values(S.ribbon).some(x => x >= 3), alm3: pagesDone() >= 3, alm: almDone(), cumple: (C.bday || 0) >= 1, toque: (C.toque || 0) >= 20 };
}
export const fishK = () => (id) => FISH[id] && (c.S.day - 1) % 7 === 4 ? 1.5 : 1;
