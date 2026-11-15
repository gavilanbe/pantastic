// El pueblo de Migas y el obrador de Pan.
import { THREE, mat, basic, mesh, group, G, canvasTex, rnd, blob, smoothNoise, scene, light, burst, patch } from './gfx.js';
import { makeBread } from './breads.js';
import { logoCanvas } from './logo.js';
import { makeItem } from './items.js';

export const W = {
  obstacles: [], circles: [], up: {}, lamps: [], windows: [], sails: null, ducks: [], t: 0,
  st: {
    mesa: { x: 0.8, z: -3.95, ox: 0.8, oz: -5.0, yaw: Math.PI, label: 'Amasar' },
    ferm: { x: 2.5, z: -4.2, ox: 3.0, oz: -5.35, yaw: 2.72, label: 'Fermentadora' },
    horno: { x: 4.35, z: -3.3, ox: 5.1, oz: -4.6, yaw: 2.55, label: 'Horno' },
    despensa: { x: 5.2, z: -2.2, ox: 6.2, oz: -2.2, yaw: Math.PI / 2, label: 'Despensa' },
    mostrador: { x: -1.0, z: -2.7, ox: -1.9, oz: -2.7, yaw: -Math.PI / 2, label: 'Mostrador' },
    carro: { x: 4.95, z: -0.45, ox: 5.9, oz: -0.45, yaw: Math.PI / 2, label: 'Carro' },
  },
  slots: [-4.35, -3.3, -2.25, -1.2].map(z => ({ x: -3.0, z })),
  slotSets: { 4: [-4.35, -3.3, -2.25, -1.2], 5: [-5.0, -4.05, -3.1, -2.15, -1.2], 6: [-5.2, -4.4, -3.6, -2.8, -2.0, -1.2] }, zones: {}, travel: { fonda: [23.2, 4.3], molino: [-23.2, 4.3], rio: [2.0, 13.3] }, homes: { tejo: { out: [-26, 4.3], edge: true }, charca: { out: [26, 4.3], edge: true } }, benchSeats: [],
  baskets: [-5.0, -4.2, -3.4, -2.6, -1.8].map(z => ({ x: -1.9, z })),
  fermSlots: [], ovenSlots: [], cartSlots: [], basketGroups: [], wips: {}, leafReg: new Map(),
};
const SPAN = 64, X0 = -32, Z0 = -40, PX = 4096;
const u = (x) => (x - X0) / SPAN * PX, v = (z) => (z - Z0) / SPAN * PX, S = PX / SPAN;

// ---------- suelo pintado ----------
function groundTex() {
  return canvasTex(PX, PX, (g) => {
    const r = rnd(11);
    g.fillStyle = '#97d670'; g.fillRect(0, 0, PX, PX);
    for (let i = 0; i < 90; i++) {                       // manchas suaves
      const x = r() * PX, y = r() * PX, rad = 150 + r() * 420, gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const c = r() < 0.5 ? '120,200,95' : '178,228,125';
      gr.addColorStop(0, `rgba(${c},.34)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // motivo: espiguitas en tresbolillo
    const step = 0.82 * S;
    for (let j = 0; j < PX / step + 1; j++) for (let i = 0; i < PX / step + 1; i++) {
      const x = i * step + (j % 2) * step / 2, y = j * step * 0.86;
      g.save(); g.translate(x, y); g.rotate(((i * 7 + j * 3) % 5 - 2) * 0.12);
      g.fillStyle = (i + j) % 3 ? 'rgba(108,186,84,.55)' : 'rgba(190,236,140,.6)';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 7, 0, 8, 3.6, s * 0.75, 0, 7); g.fill(); }
      g.beginPath(); g.ellipse(0, -9, 3.6, 8, 0, 0, 7); g.fill();
      g.restore();
    }
    // caminos: capa aparte con adoquines y luego contorno
    const L = document.createElement('canvas'); L.width = L.height = PX; const p = L.getContext('2d');
    const paths = (c, extra, col) => {
      c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = (3.3 + extra) * S; c.beginPath();
      for (let x = -32; x <= 32; x += 1) { const z = 4.25 + Math.sin(x * 0.22) * 0.45; x === -32 ? c.moveTo(u(x), v(z)) : c.lineTo(u(x), v(z)); }
      c.stroke();
      c.lineWidth = (2.2 + extra) * S; c.beginPath(); c.moveTo(u(-9.8), v(4)); c.bezierCurveTo(u(-9.5), v(-2), u(-8.6), v(-6), u(-8.4), v(-9.5)); c.bezierCurveTo(u(-8), v(-11.5), u(-2), v(-10.4), u(5), v(-10.6)); c.stroke();   // al molino y las casas
      c.lineWidth = (1.9 + extra) * S; c.beginPath(); c.moveTo(u(9.5), v(4.6)); c.quadraticCurveTo(u(11.5), v(1), u(13.2), v(-3.4)); c.stroke();
      c.beginPath(); c.arc(u(-10.2), v(7.0), (3.3 + extra / 2) * S, 0, 7); c.fill();                      // plazoleta
      c.beginPath(); c.roundRect(u(-7.6 - extra / 2), v(0.2), (15.2 + extra) * S, (3.4 + extra / 2) * S, 0.9 * S); c.fill();  // porche
    };
    paths(g, 0.5, '#7fc063'); paths(g, 0.26, '#cdb98a');
    paths(p, 0, '#ecdcb6');
    p.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 70000; i++) {
      const x = r() * PX, y = r() * PX, w = (0.09 + r() * 0.1) * S, h = w * (0.6 + r() * 0.3);
      p.fillStyle = ['#f6ead0', '#e3cfa2', '#f0dfba', '#dcc594', '#f9f0dc'][Math.floor(r() * 5)];
      p.globalAlpha = 0.75; p.beginPath(); p.ellipse(x, y, w, h, r() * 3, 0, 7); p.fill();
      p.globalAlpha = 0.2; p.strokeStyle = '#a58f62'; p.lineWidth = 2; p.stroke();
    }
    p.globalAlpha = 1;
    // baldosas del porche
    p.save(); p.beginPath(); p.roundRect(u(-7.35), v(0.4), 14.7 * S, 2.95 * S, 0.7 * S); p.clip();
    const ts = 0.74 * S;
    for (let j = 0; j < 6; j++) for (let i = 0; i < 22; i++) {
      p.fillStyle = (i + j) % 2 ? '#f0b995' : '#f8d3b4'; p.fillRect(u(-7.6) + i * ts, v(0.3) + j * ts, ts, ts);
      p.fillStyle = 'rgba(255,255,255,.25)'; p.fillRect(u(-7.6) + i * ts, v(0.3) + j * ts, ts, 3);
      p.strokeStyle = 'rgba(150,90,60,.35)'; p.lineWidth = 3; p.strokeRect(u(-7.6) + i * ts, v(0.3) + j * ts, ts, ts);
    }
    p.restore();
    g.drawImage(L, 0, 0);
    // sombra de contacto alrededor del obrador y florecillas pintadas
    for (let i = 0; i < 1500; i++) {
      const x = r() * PX, y = r() * PX; const d = p.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3];
      if (d > 0) continue;
      g.fillStyle = ['#ffffff', '#fff3a8', '#ffd0dc', '#d7f3ff'][Math.floor(r() * 4)]; g.globalAlpha = 0.85;
      for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.257) * 5, y + Math.sin(k * 1.257) * 5, 3.4, 0, 7); g.fill(); }
      g.fillStyle = '#ffc94d'; g.beginPath(); g.arc(x, y, 2.8, 0, 7); g.fill(); g.globalAlpha = 1;
    }
  });
}

// ---------- texturas ----------
const T = {};
function tex() {
  T.wood = canvasTex(512, 512, (g, w, h) => {
    const r = rnd(3); g.fillStyle = '#d9a86c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const y = i * 64; g.fillStyle = ['#dcab70', '#d39f63', '#e2b47a', '#cf9a5d'][i % 4]; g.fillRect(0, y, w, 64);
      g.strokeStyle = 'rgba(120,70,30,.28)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      const off = (i % 2) * 256 + 90; g.beginPath(); g.moveTo(off, y); g.lineTo(off, y + 64); g.moveTo((off + 256) % 512, y); g.lineTo((off + 256) % 512, y + 64); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 5;
      for (let k = 0; k < 3; k++) { const yy = y + 8 + r() * 48; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(150, yy + r() * 10 - 5, 350, yy + r() * 10 - 5, 512, yy); g.stroke(); }
    }
  }, { repeat: [3.2, 1.7] });
  T.wall = canvasTex(1024, 512, (g, w, h) => {
    const r = rnd(5); g.fillStyle = '#fff1d6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '230,200,150'},.1)`; g.beginPath(); g.ellipse(r() * w, r() * h * 0.72, 30 + r() * 50, 10 + r() * 20, r() * 3, 0, 7); g.fill(); }
    const y0 = h * 0.7;
    for (let i = 0; i < 26; i++) for (let j = 0; j < 4; j++) {
      const x = i * 40 + (j % 2) * 20 - 20, y = y0 + j * 39;
      g.fillStyle = ['#a8d0b0', '#9cc6a6', '#b6dabb', '#a2ccae'][(i * 3 + j) % 4]; g.fillRect(x, y, 38, 37);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 3, y + 3, 32, 5);
    }
    g.fillStyle = '#c48a55'; g.fillRect(0, y0 - 14, w, 16); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, y0 - 14, w, 4);
  });
  T.tile = canvasTex(256, 256, (g) => {
    g.fillStyle = '#fbe9c6'; g.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = (i + j) % 2 ? '#f3c98a' : '#fff6e0'; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(i * 64 + 6, j * 64 + 6, 52, 6); if ((i + j) % 2) { g.fillStyle = '#e9b468'; g.beginPath(); g.moveTo(i * 64 + 32, j * 64 + 18); g.lineTo(i * 64 + 46, j * 64 + 32); g.lineTo(i * 64 + 32, j * 64 + 46); g.lineTo(i * 64 + 18, j * 64 + 32); g.fill(); } }
  }, { repeat: [5, 2.6] });
  T.wall2 = canvasTex(1024, 512, (g, w, h) => {
    const r = rnd(5); g.fillStyle = '#fff6e6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '240,214,170'},.1)`; g.beginPath(); g.ellipse(r() * w, r() * h * 0.72, 30 + r() * 50, 10 + r() * 20, r() * 3, 0, 7); g.fill(); }
    const y0 = h * 0.7;
    for (let i = 0; i < 26; i++) for (let j = 0; j < 4; j++) { const x = i * 40 + (j % 2) * 20 - 20, y = y0 + j * 39; g.fillStyle = ['#9fc4e8', '#fffaf0', '#8fb8e0', '#fffaf0'][(i + j * 2) % 4]; g.fillRect(x, y, 38, 37); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 3, y + 3, 32, 5); }
    g.fillStyle = '#f2b84b'; g.fillRect(0, y0 - 14, w, 16); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, y0 - 14, w, 4);
  });
  T.brick = canvasTex(512, 256, (g, w, h) => {
    const r = rnd(8); g.fillStyle = '#e9d9c2'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 8; j++) for (let i = -1; i < 9; i++) {
      g.fillStyle = ['#d98a5f', '#cf7c52', '#e29a70', '#c8734c', '#dd9068'][Math.floor(r() * 5)];
      g.beginPath(); g.roundRect(i * 64 + (j % 2) * 32 + 3, j * 32 + 3, 58, 26, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(i * 64 + (j % 2) * 32 + 7, j * 32 + 5, 50, 4);
    }
  }, { repeat: [2, 1] });
  T.roof = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#d9714e'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 9; j++) for (let i = -1; i < 9; i++) {
      const x = i * 64 + (j % 2) * 32, y = j * 60;
      g.fillStyle = ['#e2805a', '#d86f4b', '#e98d66', '#cf6644'][(i * 5 + j * 3 + 8) % 4];
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 62, y); g.lineTo(x + 62, y + 38); g.arc(x + 31, y + 38, 31, 0, Math.PI); g.fill();
      g.strokeStyle = 'rgba(110,40,20,.3)'; g.lineWidth = 3; g.beginPath(); g.arc(x + 31, y + 38, 30, 0.1, Math.PI - 0.1); g.stroke();
    }
  }, { repeat: [3, 2] });
  T.wicker = canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#c99755'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { g.fillStyle = (i + j) % 2 ? '#dbb070' : '#b98445'; g.beginPath(); g.roundRect(i * 16 + 1, j * 16 + 2, 14, 12, 5); g.fill(); }
  }, { repeat: [3, 1] });
  T.leaf = canvasTex(256, 256, (g, w, h) => {
    const r = rnd(2); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) { g.fillStyle = r() < 0.5 ? 'rgba(210,235,190,.9)' : 'rgba(255,255,235,.9)'; g.beginPath(); g.ellipse(r() * w, r() * h, 12, 6, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(150,200,150,.7)'; g.beginPath(); g.ellipse(r() * w, r() * h, 11, 5, r() * 3, 0, 7); g.fill(); }
  }, { repeat: [3, 2] });
  T.stone = canvasTex(256, 256, (g, w, h) => {
    const r = rnd(6); g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.fillStyle = ['#e6dfd2', '#cbc3b4', '#d2cabb'][i % 3]; g.beginPath(); g.roundRect(r() * w - 20, r() * h - 12, 50 + r() * 20, 26 + r() * 12, 10); g.fill(); }
  }, { repeat: [2, 1] });
}

// ---------- piezas ----------
function tree(x, z, s = 1, kind = 'naranjo', seed = 1) {
  const r = rnd(seed * 31 + 7), g = group({ p: [x, 0, z], s });
  const trunkM = mat('#a9744b', { rough: 0.95 });
  if (kind === 'cipres') {
    mesh(G.cyl(0.1, 0.14, 0.7, 8), trunkM, { parent: g, p: [0, 0.35, 0] });
    mesh(G.lathe([[0.001, 0.4], [0.5, 0.6], [0.62, 1.4], [0.5, 2.6], [0.28, 3.6], [0.001, 4.3]], 14), mat('#4f9a68', { map: T.leaf, rough: 1, sway: 0.012, rim: 0.4 }), { parent: g });
  } else {
    mesh(G.lathe([[0.3, 0], [0.19, 0.2], [0.15, 0.9], [0.17, 1.5], [0.001, 1.6]], 10), trunkM, { parent: g });
    const cols = kind === 'naranjo' ? ['#58b368', '#69c274', '#4fa862'] : ['#8ccf6d', '#9ad97a', '#7dc463'];
    const lm = (c) => { const m = mat(c, { map: T.leaf, rough: 1, sway: 0.03, rim: 0.45 }); W.leafReg.set(m, kind === 'naranjo' ? 'ever' : c); return m; };
    const puffs = [[0, 2.15, 0, 1.05], [-0.62, 1.8, 0.2, 0.72], [0.66, 1.85, 0.1, 0.74], [0.1, 1.75, 0.6, 0.66], [0, 2.75, -0.05, 0.7], [-0.2, 1.9, -0.55, 0.7]];
    puffs.forEach((p, i) => mesh(blob((bx, by, bz) => 1 + smoothNoise(bx * 2.2 + seed, by * 2.2, bz * 2.2 + i) * 0.1, { ws: 18, hs: 12 }), lm(cols[i % 3]), { parent: g, p: [p[0], p[1], p[2]], s: [p[3], p[3] * 0.86, p[3]] }));
    if (kind === 'naranjo') for (let i = 0; i < 9; i++) {
      const a = r() * 6.28, e = -0.2 + r() * 1.1, rr = 1.02;
      mesh(G.sph(0.1, 10, 8), mat('#ff9d2e', { rough: 0.55, rim: 0.5 }), { parent: g, p: [Math.cos(a) * Math.cos(e) * rr, 2.1 + Math.sin(e) * rr * 0.82, Math.sin(a) * Math.cos(e) * rr * 0.9 + 0.1] });
    }
  }
  scene.add(g); W.circles.push([x, z, 0.42 * s]);
  return g;
}
function house(x, z, o = {}) {
  const w = o.w || 4, d = o.d || 3.4, h = o.h || 2.5, g = group({ p: [x, 0, z], r: [0, o.rot || 0, 0] });
  mesh(G.box(w, h, d, 0.12), mat(o.wall || '#fff0d8', { rough: 0.95 }), { parent: g, p: [0, h / 2, 0] });
  mesh(G.box(w + 0.06, 0.5, d + 0.06, 0.1), mat(o.base || '#e2c9a4', { rough: 1 }), { parent: g, p: [0, 0.25, 0] });
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.35, 0); sh.lineTo(0, 1.55); sh.lineTo(w / 2 + 0.35, 0); sh.lineTo(-w / 2 - 0.35, 0);
  const rg = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }); rg.translate(0, 0, -(d + 0.6) / 2);
  mesh(rg, mat(o.roof || '#d9714e', { rough: 0.9 }), { parent: g, p: [0, h - 0.02, 0] });
  mesh(G.box(0.45, 0.9, 0.45, 0.06), mat('#f1dcc0'), { parent: g, p: [w * 0.25, h + 1.0, -0.3] });
  mesh(G.box(0.8, 1.35, 0.1, 0.08), mat(o.door || '#8f6a4a', { rough: 0.8 }), { parent: g, p: [-w * 0.18, 0.72, d / 2 + 0.02] });
  mesh(G.sph(0.05, 8, 6), mat('#e9b949', { metal: 0.6, rough: 0.3 }), { parent: g, p: [-w * 0.18 + 0.26, 0.72, d / 2 + 0.09] });
  for (const wx of (w > 3.7 ? [w * 0.22, -w * 0.42 + 0.1] : [w * 0.22]).slice(0, o.one ? 1 : 2)) { if (wx < 0 && Math.abs(wx + w * 0.18) < 0.9) continue;
    for (const sd of [-1, 1]) mesh(G.box(0.2, 0.95, 0.06, 0.02), mat(o.door || '#8f6a4a', { rough: 0.8 }), { parent: g, p: [wx + sd * 0.58, 1.45, d / 2 + 0.03] });
    mesh(G.box(0.95, 0.95, 0.1, 0.08), mat('#fffaf0'), { parent: g, p: [wx, 1.45, d / 2 + 0.02] });
    const wm = mat('#bfe3ff', { rough: 0.3, emissive: '#ffcf70', ei: 0, nocache: true }); W.windows.push(wm);
    mesh(G.box(0.75, 0.75, 0.1, 0.05), wm, { parent: g, p: [wx, 1.45, d / 2 + 0.045] });
    mesh(G.box(0.05, 0.75, 0.11, 0.01), mat('#fffaf0'), { parent: g, p: [wx, 1.45, d / 2 + 0.05] });
    mesh(G.box(1.05, 0.2, 0.3, 0.06), mat('#c98a5a'), { parent: g, p: [wx, 0.88, d / 2 + 0.14] });
    for (let i = 0; i < 4; i++) mesh(G.sph(0.11, 8, 6), mat(['#ff7b8a', '#ffd166', '#ff9ac1', '#fff'][i]), { parent: g, p: [wx - 0.36 + i * 0.24, 1.04, d / 2 + 0.16] });
  }
  if (o.owner) { const th = o.rot || 0, wp = (lx, lz) => [x + lx * Math.cos(th) + lz * Math.sin(th), z - lx * Math.sin(th) + lz * Math.cos(th)]; W.homes[o.owner] = { out: wp(-w * 0.18, d / 2 + 1.1), door: wp(-w * 0.18, d / 2 + 0.2), yaw: th };
    const nt = canvasTex(256, 80, (c) => { c.fillStyle = '#fff3d8'; c.beginPath(); c.roundRect(4, 4, 248, 72, 18); c.fill(); c.strokeStyle = '#c98a5a'; c.lineWidth = 7; c.stroke(); c.fillStyle = '#7a4a2a'; c.font = '800 36px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillText(o.name, 128, 52, 228); });
    mesh(G.box(0.86, 0.28, 0.05, 0.02), mat('#c98a5a'), { parent: g, p: [-w * 0.18, 1.62, d / 2 + 0.05] }); mesh(G.plane(0.82, 0.25), basic('#ffffff', { map: nt }), { parent: g, p: [-w * 0.18, 1.62, d / 2 + 0.08], cast: false }); mesh(G.box(0.9, 0.04, 0.5, 0.02), mat('#e2664f', { rough: 1 }), { parent: g, p: [-w * 0.18, 0.03, d / 2 + 0.4], cast: false }); }
  scene.add(g);
  const cs = Math.abs(Math.cos(o.rot || 0)), sn = Math.abs(Math.sin(o.rot || 0)), ww = (w * cs + d * sn) / 2 + 0.2, dd = (d * cs + w * sn) / 2 + 0.2;
  W.obstacles.push([x - ww, z - dd, x + ww, z + dd]);
  return g;
}
function lamp(x, z) {
  const g = group({ p: [x, 0, z] }), iron = mat('#4a4654', { rough: 0.6 });
  mesh(G.cyl(0.14, 0.2, 0.25, 10), iron, { parent: g, p: [0, 0.12, 0] });
  mesh(G.cyl(0.05, 0.06, 2.5, 8), iron, { parent: g, p: [0, 1.35, 0] });
  mesh(G.cyl(0.2, 0.08, 0.1, 10), iron, { parent: g, p: [0, 2.6, 0] });
  const gm = mat('#fff6d8', { emissive: '#ffc766', ei: 0, rough: 0.4, nocache: true }); W.lamps.push(gm);
  mesh(G.sph(0.2, 14, 10), gm, { parent: g, p: [0, 2.82, 0], s: [1, 1.15, 1], cast: false });
  mesh(G.cone(0.26, 0.2, 10), iron, { parent: g, p: [0, 3.1, 0] });
  scene.add(g); W.circles.push([x, z, 0.25]);
}
function bench(x, z, rot = 0) {
  const g = group({ p: [x, 0, z], r: [0, rot, 0] }), wm = mat('#c98a5a', { rough: 0.8 }), im = mat('#4a4654');
  for (let i = 0; i < 3; i++) mesh(G.box(1.5, 0.06, 0.15, 0.025), wm, { parent: g, p: [0, 0.46, -0.16 + i * 0.17] });
  for (let i = 0; i < 2; i++) mesh(G.box(1.5, 0.14, 0.05, 0.02), wm, { parent: g, p: [0, 0.72 + i * 0.2, -0.3], r: [-0.12, 0, 0] });
  for (const s of [-1, 1]) { mesh(G.box(0.06, 0.46, 0.45, 0.02), im, { parent: g, p: [s * 0.62, 0.23, -0.02] }); mesh(G.box(0.06, 0.6, 0.06, 0.02), im, { parent: g, p: [s * 0.62, 0.7, -0.3], r: [-0.12, 0, 0] }); }
  scene.add(g); W.obstacles.push(rot ? [x - 0.4, z - 0.85, x + 0.4, z + 0.85] : [x - 0.85, z - 0.4, x + 0.85, z + 0.3]);
  for (const sd of [-1, 1]) W.benchSeats.push({ x: x + sd * 0.4 * Math.cos(rot), z: z - sd * 0.4 * Math.sin(rot), yaw: rot, used: null });
  return g;
}
function flowers(list, parent = scene) {
  const stemG = G.cyl(0.015, 0.02, 0.3, 5), n = list.length;
  const stems = new THREE.InstancedMesh(stemG, mat('#5aa85a', { sway: 0.12 }), n);
  const heads = new THREE.InstancedMesh(new THREE.TorusGeometry(0.06, 0.045, 6, 10), mat('#ffffff', { sway: 0.12, rough: 0.8, nocache: true }), n);
  const cent = new THREE.InstancedMesh(G.sph(0.045, 8, 6), mat('#ffcf4d', { sway: 0.12 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  list.forEach((f, i) => {
    const h = f[3] || 0.3;
    m.compose(new THREE.Vector3(f[0], h / 2, f[1]), q.identity(), new THREE.Vector3(1, h / 0.3, 1)); stems.setMatrixAt(i, m);
    e.set(-Math.PI / 2 + 0.5, 0, i); q.setFromEuler(e);
    m.compose(new THREE.Vector3(f[0], h + 0.02, f[1] + 0.02), q, new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(i, m); cent.setMatrixAt(i, m);
    heads.setColorAt(i, c.set(f[2]));
  });
  for (const im of [stems, heads, cent]) { im.frustumCulled = false; im.castShadow = true; parent.add(im); }
}

// ---------- obrador ----------
function bakery() {
  const B = group(); scene.add(B);
  const woodM = mat('#c98a5a', { rough: 0.8 }), woodD = mat('#a36b42', { rough: 0.85 }), cream = mat('#fff6e4', { rough: 0.9 }), iron = mat('#4a4654', { rough: 0.55 });
  // suelo y zócalo
  W.floorMat = mat('#ffffff', { map: T.wood, rough: 0.75 });
  mesh(G.zbox(13.5, 0.16, 6.9, 1, 16), W.floorMat, { parent: B, p: [0, 0.02, -2.7], cast: false });
  mesh(G.zbox(13.9, 0.1, 7.2, 1, 16), mat('#e6d0ae', { rough: 1 }), { parent: B, p: [0, 0.0, -2.72], cast: false });
  // pared del fondo y laterales en corte
  const wallM = W.wallMat = mat('#ffffff', { map: T.wall, rough: 0.95 }); W.wainM = mat('#a8d0b0', { rough: 0.7, nocache: true });
  mesh(G.box(13.7, 4.1, 0.35, 0.08), wallM, { parent: B, p: [0, 2.05, -6.22] });
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); for (let i = 1; i <= 14; i++) sh.lineTo(6.9 * i / 14, 0); sh.lineTo(6.9, 0.95); sh.quadraticCurveTo(5.6, 1.0, 4.4, 2.3); sh.quadraticCurveTo(3.3, 4.1, 1.6, 4.1); for (let i = 3; i >= 0; i--) sh.lineTo(1.6 * i / 4, 4.1); sh.lineTo(0, 0);
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 12 });
    sg.rotateY(-Math.PI / 2); sg.translate(0.15, 0, 0);
    mesh(sg, mat('#fff1d6', { rough: 0.95 }), { parent: B, p: [s * 6.7, 0, -6.15] });
    mesh(G.zbox(0.34, 1.16, 6.9, 1, 16), W.wainM, { parent: B, p: [s * 6.7, 0.52, -2.7] });
    mesh(G.zbox(0.4, 0.09, 6.95, 1, 16), woodM, { parent: B, p: [s * 6.7, 1.14, -2.7] });
  }
  // tejado asomando por detrás y chimenea
  mesh(G.box(14.3, 0.3, 2.6, 0.1), mat('#ffffff', { map: T.roof, rough: 0.9 }), { parent: B, p: [0, 4.0, -7.2], r: [0.55, 0, 0] });
  mesh(G.box(14.4, 0.22, 0.5, 0.1), mat('#c9623f', { rough: 0.9 }), { parent: B, p: [0, 4.2, -6.3] });
  mesh(G.box(1.0, 2.0, 1.0, 0.1), mat('#ffffff', { map: T.brick }), { parent: B, p: [5.1, 5.0, -6.6] });
  mesh(G.box(1.25, 0.2, 1.25, 0.08), mat('#d9d2c4'), { parent: B, p: [5.1, 6.05, -6.6] });
  W.chimney = [5.1, 6.3, -6.6];
  const logoTex = new THREE.CanvasTexture(logoCanvas()); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 8; W.logoTex = logoTex;
  const Sg = group({ parent: B, p: [-1.2, 4.3, -6.25] });
  for (const x of [-2.1, 2.1]) mesh(G.box(0.14, 1.3, 0.14, 0.04), woodD, { parent: Sg, p: [x, 0.5, -0.16] });
  mesh(G.plane(6.2, 2.79), mat('#ffffff', { map: logoTex, alphaTest: 0.5, rough: 0.6, rim: 0, side: THREE.DoubleSide }), { parent: Sg, p: [0, 1.36, 0], cast: false });
  for (let i = 0; i < 11; i++) { const bm = mat('#fff3cf', { emissive: '#ffcc77', ei: 0.4, nocache: true }); W.lamps.push(bm); mesh(G.sph(0.075, 8, 6), bm, { parent: Sg, p: [-2.45 + i * 0.49, 0.12 - Math.sin(i / 10 * Math.PI) * 0.0, 0.05], cast: false }); }
  mesh(G.box(5.3, 0.1, 0.12, 0.03), woodD, { parent: Sg, p: [0, 0.12, -0.04] });
  // viga con lámparas
  mesh(G.box(13.2, 0.26, 0.26, 0.06), woodD, { parent: B, p: [0, 3.92, -5.5] });
  W.pendants = [];
  for (const x of [-4.4, -0.6, 1.95, 4.0]) {
    mesh(G.cyl(0.012, 0.012, 0.5, 5), iron, { parent: B, p: [x, 3.6, -5.5] });
    mesh(G.cone(0.3, 0.26, 16), mat('#f2b95a', { rough: 0.6, side: THREE.DoubleSide }), { parent: B, p: [x, 3.3, -5.5] });
    const bm = mat('#fff3cf', { emissive: '#ffcc77', ei: 0.4, nocache: true }); W.lamps.push(bm);
    mesh(G.sph(0.1, 10, 8), bm, { parent: B, p: [x, 3.2, -5.5], cast: false });
  }
  // manojos colgados de la viga
  for (const [x, c] of [[-2.9, '#e8c66a'], [-2.5, '#e0b85a'], [6.0, '#c9d39a']]) {
    const bun = group({ parent: B, p: [x, 3.6, -5.5], r: [0, x, Math.PI] });
    mesh(G.cone(0.14, 0.5, 8), mat(c, { rough: 1 }), { parent: bun }); mesh(G.cyl(0.04, 0.04, 0.2, 6), mat('#c9a56a'), { parent: bun, p: [0, 0.33, 0] });
  }

  // ---- mostrador (norte-sur) ----
  const C = group({ parent: B, p: [-1.9, 0.1, -2.95] });
  mesh(G.zbox(0.86, 0.9, 5.2, 1, 12), mat('#f4dcae', { rough: 0.85 }), { parent: C, p: [0, 0.45, 0] });
  mesh(G.zbox(1.02, 0.1, 5.4, 1, 12), woodM, { parent: C, p: [0, 0.94, 0] });
  mesh(G.zbox(0.9, 0.14, 5.24, 1, 12), woodD, { parent: C, p: [0, 0.07, 0] });
  for (let i = 0; i < 5; i++) {                                    // paneles con espiga
    mesh(G.box(0.04, 0.6, 0.86, 0.02), mat('#ffeccb'), { parent: C, p: [-0.435, 0.5, -2.05 + i * 1.02] });
    const sp = group({ parent: C, p: [-0.47, 0.5, -2.05 + i * 1.02] });
    mesh(G.cyl(0.012, 0.012, 0.36, 5), mat('#d9a441'), { parent: sp });
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) mesh(G.sph(0.035, 6, 5), mat('#e8b84e'), { parent: sp, p: [0, 0.02 + k * 0.055, s * 0.035], s: [0.5, 1.5, 0.8], r: [s * 0.5, 0, 0] });
  }
  W.obstacles.push([-2.42, -5.7, -1.38, -0.28]);
  // cestas
  W.baskets.forEach((b, i) => {
    const bg = group({ parent: B, p: [b.x, 1.09, b.z] }), wk = mat('#ffffff', { map: T.wicker, rough: 0.9 });
    mesh(G.box(0.8, 0.05, 0.72, 0.02), wk, { parent: bg, p: [0, 0.025, 0] });
    for (const sd of [-1, 1]) { mesh(G.box(0.8, 0.17, 0.05, 0.02), wk, { parent: bg, p: [0, 0.1, sd * 0.335] }); mesh(G.box(0.05, 0.17, 0.72, 0.02), wk, { parent: bg, p: [sd * 0.375, 0.1, 0] }); }
    mesh(G.box(0.7, 0.012, 0.62, 0.004), mat(['#fff6e4', '#ffe1e1', '#e4f3e0', '#fff6e4', '#e3ecfb'][i], { rough: 1 }), { parent: bg, p: [0, 0.056, 0] });
    const items = group({ parent: bg, p: [0, 0.062, 0] });
    // cartelito de precio en su pinza, mirando a quien compra y a la cámara
    const tagTex = canvasTex(128, 96, (g) => { g.clearRect(0, 0, 128, 96); }), tag = group({ parent: bg, p: [-0.47, 0.19, 0.2], r: [0, -0.95, 0] });
    mesh(G.cyl(0.012, 0.012, 0.16, 5), mat('#4a4654'), { parent: tag, p: [0, -0.1, 0] }); mesh(G.cyl(0.05, 0.06, 0.03, 10), mat('#4a4654'), { parent: tag, p: [0, -0.175, 0] });
    for (const sd of [-1, 1]) mesh(G.plane(0.3, 0.225), basic('#ffffff', { map: tagTex }), { parent: tag, p: [0, 0.06, sd * 0.004], r: [0, sd > 0 ? 0 : Math.PI, 0], cast: false });
    tag.visible = false; W.basketGroups.push({ g: bg, items, id: null, n: -1, tag, tagTex });
  });
  // bolsas de papel, pinzas y bote de propinas
  const kraft = mat('#d9b98a', { rough: 1 });
  for (let i = 0; i < 4; i++) mesh(G.box(0.24, 0.012, 0.3, 0.004), kraft, { parent: B, p: [-1.62, 1.1 + i * 0.013, -1.3], r: [0, 0.1 * i - 0.1, 0] });
  mesh(G.box(0.2, 0.26, 0.12, 0.02), kraft, { parent: B, p: [-1.62, 1.28, -1.3], r: [0, 0.2, 0] });
  const tong = group({ parent: B, p: [-1.62, 1.11, -2.2], r: [0, 0.5, 0] }); for (const sd of [-1, 1]) mesh(G.box(0.03, 0.012, 0.34, 0.004), mat('#c3ccd4', { metal: 0.6, rough: 0.3 }), { parent: tong, p: [sd * 0.018, 0, 0], r: [0, sd * 0.07, 0] });
  W.tipJar = group({ parent: B, p: [-1.9, 1.09, -0.5] });
  W.tipFill = mesh(G.cyl(0.12, 0.11, 0.26, 16), mat('#f5c33b', { rough: 0.35, metal: 0.6 }), { parent: W.tipJar, p: [0, 0.14, 0] }); W.tipFill.scale.y = 0.05;
  mesh(G.cyl(0.145, 0.13, 0.3, 16), mat('#e8f6ff', { transparent: true, opacity: 0.28, rough: 0.05 }), { parent: W.tipJar, p: [0, 0.15, 0], cast: false });
  mesh(G.box(0.17, 0.09, 0.01, 0.004), cream, { parent: W.tipJar, p: [0.07, 0.15, 0.125], r: [0, 0.5, 0] }); mesh(G.box(0.1, 0.02, 0.012, 0.004), mat('#e2664f'), { parent: W.tipJar, p: [0.07, 0.15, 0.131], r: [0, 0.5, 0] });
  // cubo con tapa: basura, o compost cuando hay huerto
  const Bn = group({ parent: B, p: [-0.92, 0.1, -5.42] }); W.binMat = mat('#8f6a4a', { rough: 0.85, nocache: true });
  mesh(G.lathe([[0.001, 0], [0.24, 0], [0.3, 0.62], [0.32, 0.64], [0.001, 0.64]], 16, false), W.binMat, { parent: Bn }); for (const y of [0.14, 0.5]) mesh(G.tor(0.27 + y * 0.06, 0.018, 6, 18), mat('#4a4654', { metal: 0.5, rough: 0.4 }), { parent: Bn, p: [0, y, 0], r: [Math.PI / 2, 0, 0] });
  W.binLid = group({ parent: Bn, p: [0, 0.66, -0.3] }); mesh(G.cyl(0.33, 0.33, 0.05, 16), W.binMat, { parent: W.binLid, p: [0, 0, 0.3] }); mesh(G.sph(0.05, 8, 6), mat('#4a4654'), { parent: W.binLid, p: [0, 0.05, 0.3] });
  W.binLeaf = mesh(G.sph(1, 8, 6), mat('#58b368'), { parent: Bn, p: [0, 0.4, 0.3], s: [0.1, 0.13, 0.02] }); W.binLeaf.visible = false; W.binPos = [-0.92, 1.0, -5.42]; W.binOpen = 0; W.circles.push([-0.92, -5.42, 0.36]);
  // caja registradora de las de palanca: cajón que salta, visor y campanilla
  const reg = W.reg = group({ parent: B, p: [-1.9, 1.09, -0.98], r: [0, Math.PI / 2 - 0.45, 0] }), red = mat('#e2664f', { rough: 0.45 }), brass = mat('#e9b949', { metal: 0.75, rough: 0.28 });
  mesh(G.box(0.58, 0.19, 0.46, 0.04), red, { parent: reg, p: [0, 0.095, 0] });
  W.regDrawer = group({ parent: reg, p: [0, 0.08, 0.02] }); mesh(G.box(0.5, 0.1, 0.44, 0.02), brass, { parent: W.regDrawer }); mesh(G.sph(0.03, 8, 6), red, { parent: W.regDrawer, p: [0, 0, 0.23] });
  for (let i = 0; i < 4; i++) mesh(G.cyl(0.035, 0.035, 0.02, 10), mat('#f5c33b', { metal: 0.6, rough: 0.3 }), { parent: W.regDrawer, p: [-0.16 + i * 0.105, 0.055, 0.12] });
  mesh(G.box(0.52, 0.3, 0.26, 0.07), red, { parent: reg, p: [0, 0.33, -0.08] });
  const kp = group({ parent: reg, p: [0, 0.25, 0.13], r: [0.55, 0, 0] }); mesh(G.box(0.48, 0.04, 0.2, 0.015), mat('#b9483a', { rough: 0.5 }), { parent: kp });
  W.regKeys = []; for (let i = 0; i < 9; i++) W.regKeys.push(mesh(G.cyl(0.026, 0.026, 0.035, 10), i % 4 ? cream : brass, { parent: kp, p: [-0.16 + (i % 5) * 0.08, 0.035, -0.045 + Math.floor(i / 5) * 0.085] }));
  W.regTex = canvasTex(128, 64, (g) => { g.fillStyle = '#fffbe6'; g.fillRect(0, 0, 128, 64); });
  mesh(G.box(0.4, 0.17, 0.06, 0.03), brass, { parent: reg, p: [0, 0.57, -0.08], r: [-0.25, 0, 0] });
  for (const sd of [-1, 1]) mesh(G.plane(0.34, 0.12), basic('#ffffff', { map: W.regTex }), { parent: reg, p: [0, 0.57, -0.08 + sd * 0.033], r: [-0.25 * sd, sd > 0 ? 0 : Math.PI, 0], cast: false });
  W.regCrank = group({ parent: reg, p: [0.3, 0.3, -0.05] }); mesh(G.cyl(0.018, 0.018, 0.2, 6), brass, { parent: W.regCrank, p: [0.03, 0.09, 0] }); mesh(G.sph(0.045, 10, 8), mat('#2a1d1a', { rough: 0.4 }), { parent: W.regCrank, p: [0.03, 0.2, 0] });
  W.regBell = mesh(G.sph(0.075, 12, 8), brass, { parent: reg, p: [-0.16, 0.71, -0.1], s: [1, 0.7, 1] }); mesh(G.sph(0.018, 6, 5), brass, { parent: reg, p: [-0.16, 0.77, -0.1] });
  W.register = [-1.9, 1.75, -0.98]; W.regOpen = 0;

  // ---- zona de tienda (izquierda) ----
  const sh = group({ parent: B, p: [-4.4, 0, -5.85] });               // estantería de exposición
  mesh(G.box(3.6, 2.6, 0.1, 0.03), mat('#f7e3bd'), { parent: sh, p: [0, 1.6, -0.12] });
  for (let i = 0; i < 3; i++) mesh(G.box(3.7, 0.08, 0.5, 0.03), woodM, { parent: sh, p: [0, 1.05 + i * 0.72, 0.1] });
  for (const s of [-1, 1]) mesh(G.box(0.1, 2.75, 0.52, 0.03), woodD, { parent: sh, p: [s * 1.85, 1.5, 0.1] });
  const deco = [['hogaza', -1.3, 0], ['barra', -0.45, 0, 1], ['centeno', 0.5, 0], ['brioche', 1.3, 0], ['chapata', -1.1, 1], ['rosca', -0.1, 1], ['caracola', 0.75, 1], ['mollete', 1.4, 1]];
  for (const [id, x, row, up] of deco) { const b = makeBread(id); b.position.set(x, 1.1 + row * 0.72, 0.12); b.scale.setScalar(0.9); if (up) { b.scale.setScalar(0.78); b.rotation.y = 0.12; } else b.rotation.y = x; sh.add(b); }
  for (let i = 0; i < 4; i++) { const j = group({ parent: sh, p: [-1.35 + i * 0.9, 2.53, 0.1] }); mesh(G.cyl(0.15, 0.13, 0.3, 12), mat(['#e9785e', '#ffd166', '#9ad1c0', '#c9a0dc'][i], { rough: 0.35, transparent: true, opacity: 0.92 }), { parent: j, p: [0, 0.15, 0] }); mesh(G.cyl(0.16, 0.16, 0.06, 12), woodD, { parent: j, p: [0, 0.32, 0] }); }
  mesh(G.plane(2.9, 1.305), mat('#ffffff', { map: W.logoTex, alphaTest: 0.5, rough: 0.6, rim: 0 }), { parent: B, p: [-4.4, 3.42, -6.03], cast: false });
  // pizarra del día: caballete de cara a la entrada, con sus cuatro patas en el suelo
  W.boardTex = canvasTex(512, 384, (g) => { g.fillStyle = '#3d5a4c'; g.fillRect(0, 0, 512, 384); });
  W.boardPos = [-5.15, -0.55];
  const bd = group({ parent: B, p: [W.boardPos[0], 0.1, W.boardPos[1]], r: [0, 0.38, 0] });
  const front = group({ parent: bd, r: [-0.2, 0, 0] });
  mesh(G.box(1.5, 1.14, 0.06, 0.03), woodD, { parent: front, p: [0, 0.86, 0] });
  mesh(G.plane(1.36, 1.0), basic('#ffffff', { map: W.boardTex }), { parent: front, p: [0, 0.86, 0.034], cast: false });
  for (const sx of [-1, 1]) mesh(G.box(0.075, 1.52, 0.075, 0.02), woodM, { parent: front, p: [sx * 0.73, 0.74, -0.01] });
  mesh(G.box(1.42, 0.05, 0.13, 0.02), woodM, { parent: front, p: [0, 0.27, 0.07] });
  mesh(G.box(0.12, 0.03, 0.03, 0.01), cream, { parent: front, p: [-0.3, 0.31, 0.09], r: [0, 0.3, 0] }); mesh(G.box(0.09, 0.03, 0.03, 0.01), mat('#ffb3c9'), { parent: front, p: [0.25, 0.31, 0.08], r: [0, -0.4, 0] });
  const back = group({ parent: bd, p: [0, 1.47, -0.3], r: [0.3, 0, 0] });
  for (const sx of [-1, 1]) mesh(G.box(0.07, 1.54, 0.07, 0.02), woodD, { parent: back, p: [sx * 0.6, -0.77, 0] });
  mesh(G.box(1.27, 0.06, 0.06, 0.02), woodD, { parent: back, p: [0, -0.9, 0] }); mesh(G.box(1.5, 0.08, 0.1, 0.03), woodM, { parent: bd, p: [0, 1.47, -0.3] });
  W.circles.push([W.boardPos[0], W.boardPos[1] - 0.3, 0.62]);
  // reloj
  const ck = group({ parent: B, p: [-1.9, 3.25, -6.0] });
  mesh(G.cyl(0.4, 0.4, 0.1, 28), woodD, { parent: ck, r: [Math.PI / 2, 0, 0] });
  mesh(G.cyl(0.33, 0.33, 0.11, 28), cream, { parent: ck, r: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 12; i++) mesh(G.sph(0.02, 6, 5), iron, { parent: ck, p: [Math.sin(i * 0.5236) * 0.27, Math.cos(i * 0.5236) * 0.27, 0.06] });
  W.hh = group({ parent: ck, p: [0, 0, 0.07] }); mesh(G.box(0.035, 0.17, 0.015, 0.006), iron, { parent: W.hh, p: [0, 0.075, 0] });
  W.mh = group({ parent: ck, p: [0, 0, 0.08] }); mesh(G.box(0.025, 0.26, 0.015, 0.006), mat('#e9785e'), { parent: W.mh, p: [0, 0.12, 0] });
  // ventana redonda, alfombra y plantas
  const wm = mat('#bfe3ff', { rough: 0.25, emissive: '#bfe3ff', ei: 0.35 });
  mesh(G.cyl(0.62, 0.62, 0.1, 28), woodM, { parent: B, p: [-6.5, 2.35, -4.3], r: [0, 0, Math.PI / 2] });
  mesh(G.cyl(0.52, 0.52, 0.12, 28), wm, { parent: B, p: [-6.5, 2.35, -4.3], r: [0, 0, Math.PI / 2] });
  mesh(G.box(0.14, 1.06, 0.06, 0.02), woodM, { parent: B, p: [-6.5, 2.35, -4.3] }); mesh(G.box(0.14, 0.06, 1.06, 0.02), woodM, { parent: B, p: [-6.5, 2.35, -4.3] });
  const rug = canvasTex(256, 256, (g) => { g.fillStyle = '#e9785e'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#fff1d6'; g.lineWidth = 10; g.strokeRect(18, 18, 220, 220); g.lineWidth = 4; g.strokeRect(36, 36, 184, 184); g.fillStyle = '#ffd166'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(62 + i * 44, 62 + j * 44, 7, 0, 7); g.fill(); } });
  mesh(G.zbox(2.4, 0.03, 3.2, 1, 8), mat('#ffffff', { map: rug, rough: 1 }), { parent: B, p: [-4.3, 0.115, -2.9], cast: false });
  pot(B, -6.05, -5.5, 1.1); pot(B, -6.05, 0.1, 0.9, '#9ad1c0');
  W.circles.push([-6.05, -5.5, 0.4], [-6.05, 0.1, 0.35]);

  // ---- mesa de amasar ----
  const M = group({ parent: B, p: [0.8, 0.1, -5.05] });
  mesh(G.box(2.3, 0.12, 1.15, 0.05), mat('#f3ebe0', { rough: 0.5 }), { parent: M, p: [0, 0.86, 0] });
  mesh(G.box(2.2, 0.16, 1.05, 0.04), woodM, { parent: M, p: [0, 0.73, 0] });
  for (const [lx, lz] of [[-1, -0.42], [1, -0.42], [-1, 0.42], [1, 0.42]]) mesh(G.box(0.14, 0.7, 0.14, 0.04), woodD, { parent: M, p: [lx, 0.35, lz] });
  mesh(G.box(2.0, 0.06, 0.9, 0.02), woodD, { parent: M, p: [0, 0.2, 0] });
  mesh(G.cyl(0.4, 0.42, 0.012, 24), mat('#fffaf0', { rough: 1 }), { parent: M, p: [-0.62, 0.925, 0.1], s: [1.0, 1, 0.9], cast: false });
  const pin = group({ parent: M, p: [0.78, 0.975, -0.25], r: [0, 0.5, 0] });
  mesh(G.cyl(0.055, 0.055, 0.45, 12), mat('#e2b47a'), { parent: pin, r: [0, 0, Math.PI / 2] });
  for (const s of [-1, 1]) mesh(G.cyl(0.022, 0.022, 0.14, 8), woodD, { parent: pin, p: [s * 0.29, 0, 0], r: [0, 0, Math.PI / 2] });
  mesh(G.lathe([[0.001, 0], [0.16, 0], [0.26, 0.16], [0.24, 0.16], [0.15, 0.03], [0.001, 0.03]], 18, false), mat('#9ad1c0', { rough: 0.4 }), { parent: M, p: [0.2, 0.92, -0.3] });
  mesh(G.sph(0.2, 12, 8), mat('#fffaf0', { rough: 1 }), { parent: M, p: [0.2, 0.98, -0.3], s: [1, 0.4, 1] });
  // báscula, rasqueta, montón de harina y bote de utensilios
  const sc = group({ parent: M, p: [0.75, 0.92, 0.3], r: [0, -0.3, 0] }); mesh(G.box(0.34, 0.1, 0.26, 0.03), mat('#e2664f', { rough: 0.5 }), { parent: sc, p: [0, 0.05, 0] }); mesh(G.cyl(0.03, 0.03, 0.08, 8), iron, { parent: sc, p: [0, 0.13, 0] }); mesh(G.lathe([[0.001, 0], [0.1, 0], [0.19, 0.07], [0.18, 0.07], [0.09, 0.012], [0.001, 0.012]], 16, false), mat('#cfd8df', { metal: 0.5, rough: 0.3 }), { parent: sc, p: [0, 0.17, 0] }); mesh(G.cyl(0.07, 0.07, 0.02, 14), cream, { parent: sc, p: [0, 0.06, 0.135], r: [Math.PI / 2, 0, 0] });
  mesh(G.cone(0.2, 0.16, 14), mat('#fffaf0', { rough: 1 }), { parent: M, p: [-0.05, 0.99, -0.34] });
  mesh(G.box(0.22, 0.012, 0.14, 0.004), mat('#cfd8df', { metal: 0.5, rough: 0.3 }), { parent: M, p: [-0.2, 0.93, 0.42], r: [0, 0.4, 0] }); mesh(G.box(0.22, 0.03, 0.04, 0.012), woodD, { parent: M, p: [-0.23, 0.94, 0.48], r: [0, 0.4, 0] });
  const ut = group({ parent: M, p: [1.0, 0.92, -0.38] }); mesh(G.cyl(0.1, 0.09, 0.22, 12), mat('#9ad1c0', { rough: 0.4 }), { parent: ut, p: [0, 0.11, 0] }); for (let i = 0; i < 3; i++) { mesh(G.cyl(0.012, 0.012, 0.34, 5), woodM, { parent: ut, p: [-0.04 + i * 0.04, 0.3, 0], r: [0, 0, -0.2 + i * 0.2] }); mesh(G.sph(0.04, 8, 6), woodM, { parent: ut, p: [-0.075 + i * 0.075, 0.47, 0], s: [1, 1.3, 0.5] }); }
  W.mixer = group({ parent: M, p: [0.95, 0.92, 0.05], s: 0.85 }); { const rd = mat('#e2664f', { rough: 0.4 }), stl = mat('#cfd8df', { metal: 0.5, rough: 0.3 }); mesh(G.box(0.5, 0.1, 0.62, 0.04), rd, { parent: W.mixer, p: [0, 0.05, 0] }); mesh(G.box(0.2, 0.6, 0.2, 0.06), rd, { parent: W.mixer, p: [0, 0.38, -0.2] }); mesh(G.box(0.24, 0.2, 0.5, 0.08), rd, { parent: W.mixer, p: [0, 0.68, 0] }); mesh(G.lathe([[0.001, 0], [0.14, 0], [0.24, 0.2], [0.22, 0.2], [0.13, 0.03], [0.001, 0.03]], 16, false), stl, { parent: W.mixer, p: [0, 0.1, 0.12] }); W.mixerHook = mesh(G.box(0.14, 0.03, 0.03, 0.01), stl, { parent: W.mixer, p: [0, 0.3, 0.12] }); mesh(G.cyl(0.02, 0.02, 0.3, 6), stl, { parent: W.mixer, p: [0, 0.44, 0.12] }); } W.mixer.visible = false; W.mixerSpin = 0;
  // saco y cajas bajo la mesa
  sack(M, -0.6, 0.23, 0.05, 0.75); mesh(G.box(0.6, 0.36, 0.5, 0.04), woodM, { parent: M, p: [0.45, 0.41, 0.0] });
  W.dough = mesh(blob((x, y, z, v) => v.set(x * 0.3, y > 0 ? y * 0.2 : y * 0.08, z * 0.28), { ws: 24, hs: 16 }), mat('#f6e8cb', { rough: 0.9, rim: 0.4, nocache: true }), { parent: M, p: [-0.62, 1.0, 0.1] });
  W.dough.visible = false; W.doughWorld = [0.18, 1.15, -4.95];
  W.obstacles.push([-0.5, -5.8, 2.1, -4.35]);

  // ---- fermentadora: armario hueco con raíles, puerta de cristal y pilotos ----
  const F = group({ parent: B, p: [3.0, 0.1, -5.45] }), teal = mat('#9ad1c0', { rough: 0.55 }), tealD = mat('#7fbfae', { rough: 0.55 });
  mesh(G.box(1.4, 2.05, 0.08, 0.03), tealD, { parent: F, p: [0, 1.025, -0.44] });
  for (const sx of [-1, 1]) mesh(G.box(0.09, 2.05, 0.96, 0.03), teal, { parent: F, p: [sx * 0.655, 1.025, 0] });
  mesh(G.box(1.4, 0.26, 0.96, 0.05), teal, { parent: F, p: [0, 1.93, 0] }); mesh(G.box(1.4, 0.2, 0.96, 0.05), teal, { parent: F, p: [0, 0.1, 0] });
  W.fermGlow = mat('#f6d6a6', { emissive: '#ffb347', ei: 0.3, nocache: true });
  mesh(G.box(1.2, 1.56, 0.02, 0.01), W.fermGlow, { parent: F, p: [0, 1.0, -0.39], cast: false });
  mesh(G.box(1.22, 0.02, 0.84, 0.005), mat('#3a2a26', { rough: 0.9 }), { parent: F, p: [0, 0.21, 0], cast: false });
  // baldas de rejilla de lado a lado: la bandeja descansa encima
  const fsteel = mat('#c3ccd4', { rough: 0.35, metal: 0.5 });
  for (let i = 0; i < 3; i++) { const y = 0.42 + i * 0.5; for (const sx of [-1, 1]) mesh(G.box(0.06, 0.05, 0.84, 0.012), fsteel, { parent: F, p: [sx * 0.58, y - 0.012, 0.02] }); for (const z of [-0.36, 0.4]) mesh(G.box(1.2, 0.03, 0.03, 0.01), fsteel, { parent: F, p: [0, y, z] }); for (let k = 0; k < 6; k++) mesh(G.box(0.022, 0.022, 0.78, 0.008), fsteel, { parent: F, p: [-0.45 + k * 0.18, y, 0.02] }); }
  for (const sx of [-1, 1]) mesh(G.box(0.02, 1.58, 0.84, 0.005), mat('#f1d7ae', { rough: 0.9 }), { parent: F, p: [sx * 0.605, 1.0, 0.02], cast: false });
  for (const lx of [-0.5, 0.5]) mesh(G.cyl(0.06, 0.05, 0.1, 8), iron, { parent: F, p: [lx, -0.03, 0.3] });
  // panel de arriba: dial y pilotos de cada balda
  mesh(G.box(0.9, 0.17, 0.03, 0.02), cream, { parent: F, p: [-0.12, 1.93, 0.485] });
  mesh(G.cyl(0.075, 0.075, 0.03, 16), mat('#fffdf5'), { parent: F, p: [-0.4, 1.93, 0.5], r: [Math.PI / 2, 0, 0] }); W.fermDial = group({ parent: F, p: [-0.4, 1.93, 0.52] }); mesh(G.box(0.014, 0.065, 0.008, 0.003), mat('#e2664f'), { parent: W.fermDial, p: [0, 0.028, 0] });
  W.fermLed = []; for (let i = 0; i < 3; i++) { const lm = mat('#6a6a6a', { emissive: '#000000', ei: 1, rough: 0.3, nocache: true }); W.fermLed.push(lm); mesh(G.sph(0.034, 10, 8), lm, { parent: F, p: [-0.12 + i * 0.13, 1.93, 0.505], cast: false }); }
  // puerta con bisagra a la izquierda
  W.fermDoor = group({ parent: F, p: [0.66, 0, 0.5] });
  for (const [x, y, w, h] of [[-0.66, 0.3, 1.32, 0.1], [-0.66, 1.75, 1.32, 0.1], [-0.05, 1.025, 0.1, 1.55], [-1.27, 1.025, 0.1, 1.55]]) mesh(G.box(w, h, 0.06, 0.02), teal, { parent: W.fermDoor, p: [x, y, 0] });
  mesh(G.box(1.14, 1.38, 0.025, 0.01), mat('#dff3ff', { transparent: true, opacity: 0.2, rough: 0.08 }), { parent: W.fermDoor, p: [-0.66, 1.025, 0], cast: false });
  mesh(G.box(0.05, 0.5, 0.07, 0.02), cream, { parent: W.fermDoor, p: [-1.2, 1.025, 0.06] });
  for (let i = 0; i < 3; i++) W.fermSlots.push({ p: [3.0, 0.535 + i * 0.5, -5.43], holder: group({ parent: B, p: [3.0, 0.535 + i * 0.5, -5.43], s: 1.12 }) });
  W.obstacles.push([2.2, -5.9, 3.8, -4.8]);

  // ---- horno de leña: bóveda, boca en túnel con solera y llamas, hueco de abajo ----
  const H = group({ parent: B, p: [5.1, 0.1, -5.1] });
  const brickM = mat('#ffffff', { map: T.brick, rough: 0.95 }), stoneM = mat('#ffffff', { map: T.stone, rough: 1 }), soot = mat('#2a1a16', { rough: 1 });
  mesh(G.box(2.45, 1.0, 1.75, 0.08), stoneM, { parent: H, p: [0, 0.5, 0] });
  mesh(G.box(2.7, 0.14, 2.32, 0.05), mat('#cfc6b6', { rough: 0.9 }), { parent: H, p: [0, 1.04, 0.26] });
  const dome = new THREE.SphereGeometry(1.18, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 0.92, 0.74);
  mesh(dome, brickM, { parent: H, p: [0, 1.1, -0.05] });
  mesh(G.cyl(0.26, 0.3, 2.4, 14), mat('#cfc6b6', { rough: 0.9 }), { parent: H, p: [0, 3.2, -0.55] });
  const archShape = (w, h) => { const sp = new THREE.Shape(); sp.moveTo(-w, 0); sp.lineTo(-w, h - w); sp.absarc(0, h - w, w, Math.PI, 0, true); sp.lineTo(w, 0); sp.lineTo(-w, 0); return sp; };
  const archG = (w, h, d) => new THREE.ExtrudeGeometry(archShape(w, h), { depth: d, bevelEnabled: false, curveSegments: 14 });
  const ring = archShape(0.8, 1.12); ring.holes.push(new THREE.Path(archShape(0.52, 0.8).getPoints(14)));
  const ringG = new THREE.ExtrudeGeometry(ring, { depth: 0.78, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 14 }); { const pa = ringG.attributes.position, na = ringG.attributes.normal, ua = ringG.attributes.uv; for (let q = 0; q < pa.count; q++) { const fz = Math.abs(na.getZ(q)) > 0.6; ua.setXY(q, fz ? pa.getX(q) * 0.42 : pa.getZ(q) * 0.42 + Math.atan2(pa.getY(q) - 0.3, pa.getX(q)) * 0.3, fz ? pa.getY(q) * 0.84 : pa.getZ(q) * 0.84); } }
  mesh(ringG, brickM, { parent: H, p: [0, 1.11, 0.5] });
  mesh(G.box(0.3, 0.26, 0.1, 0.04), mat('#cfc6b6', { rough: 0.9 }), { parent: H, p: [0, 2.12, 1.26] });
  mesh(archG(0.53, 0.81, 0.02), soot, { parent: H, p: [0, 1.11, 0.5] });
  W.fire = [mat('#ffb04d', { emissive: '#ff8a2a', ei: 1.2, nocache: true }), mat('#ffb04d', { emissive: '#ff8a2a', ei: 0, nocache: true })];
  mesh(archG(0.44, 0.5, 0.02), W.fire[0], { parent: H, p: [0, 1.11, 0.525], cast: false });
  const flameM = mat('#ffd27a', { emissive: '#ff9a2a', ei: 2.2, rough: 0.6, nocache: true }), flameC = mat('#fff3c0', { emissive: '#ffd060', ei: 2.6, nocache: true });
  W.flames = [];
  const fireSet = (parent, x0, y, z, n, sc) => { const g = group({ parent, p: [x0, y, z], s: sc }), list = []; for (let i = 0; i < n; i++) { const fx = -0.3 + i * 0.6 / (n - 1), fl = group({ parent: g, p: [fx, 0, (i % 2) * 0.06] }); mesh(G.cone(0.09, 0.34, 7), flameM, { parent: fl, p: [0, 0.17, 0], cast: false }); mesh(G.cone(0.045, 0.2, 6), flameC, { parent: fl, p: [0, 0.1, 0.03], cast: false }); list.push(fl); } for (let i = 0; i < 4; i++) { mesh(G.cyl(0.05, 0.05, 0.36, 7), mat('#5a3524', { rough: 1 }), { parent: g, p: [-0.24 + i * 0.16, 0.04, 0.02], r: [Math.PI / 2, 0, 0.3 - i * 0.2] }); mesh(G.sph(0.04, 6, 5), mat('#ff7a2a', { emissive: '#ff5a1a', ei: 2 }), { parent: g, p: [-0.2 + i * 0.14, 0.06, 0.1], cast: false }); } W.flames.push({ g, list }); return g; };
  fireSet(H, 0, 1.12, 0.6, 5, 1);
  // hueco bajo la repisa: leñera, o segunda boca cuando se abre
  for (const sx of [-1, 1]) mesh(G.box(0.16, 0.92, 0.52, 0.04), stoneM, { parent: H, p: [sx * 0.68, 0.46, 1.13] });
  mesh(G.box(1.24, 0.9, 0.03, 0.01), soot, { parent: H, p: [0, 0.46, 0.89] });
  mesh(G.box(1.24, 0.05, 0.5, 0.01), mat('#b9ae9c', { rough: 1 }), { parent: H, p: [0, 0.025, 1.13], cast: false });
  W.logs = group({ parent: H, p: [0, 0.14, 1.12] });
  for (let i = 0; i < 5; i++) { const l = mesh(G.cyl(0.11, 0.11, 0.42, 8), mat('#b07a4c'), { parent: W.logs, p: [-0.28 + (i % 3) * 0.28 + (i > 2 ? 0.14 : 0), i > 2 ? 0.27 : 0.08, 0], r: [Math.PI / 2, 0, 0] }); mesh(G.cyl(0.085, 0.085, 0.43, 8), mat('#f0d2a0'), { parent: W.logs, p: l.position.toArray(), r: [Math.PI / 2, 0, 0] }); }
  W.mouth2 = group({ parent: H }); mesh(G.box(1.0, 0.5, 0.02, 0.01), W.fire[1], { parent: W.mouth2, p: [0, 0.4, 0.91], cast: false }); fireSet(W.mouth2, 0, 0.06, 0.96, 4, 0.8); W.flames[1].lower = true; W.mouth2.visible = false;
  // pala
  const peel = group({ parent: B, p: [6.35, 0.1, -3.35], r: [0, 0, 0.1] });
  mesh(G.cyl(0.03, 0.03, 1.9, 8), woodM, { parent: peel, p: [0, 1.0, 0] }); mesh(G.box(0.36, 0.5, 0.04, 0.03), woodM, { parent: peel, p: [0, 2.1, 0] });
  W.ovenLight = new THREE.PointLight(0xff9a3c, 0, 7, 1.6); W.ovenLight.position.set(5.1, 1.6, -3.7); scene.add(W.ovenLight);
  W.ovenSlots.push({ p: [5.1, 1.23, -4.22], holder: group({ parent: B, p: [5.1, 1.23, -4.22], s: 0.9 }) }, { p: [5.1, 0.16, -3.98], holder: group({ parent: B, p: [5.1, 0.16, -3.98], s: 0.82 }) });
  W.obstacles.push([3.85, -5.9, 6.4, -3.7]);

  // ---- despensa (pared derecha) ----
  const D = group({ parent: B, p: [6.25, 0.1, -2.25], r: [0, -Math.PI / 2, 0] });
  mesh(G.box(2.3, 2.3, 0.1, 0.03), mat('#f7e3bd'), { parent: D, p: [0, 1.25, -0.2] });
  for (let i = 0; i < 4; i++) mesh(G.box(2.4, 0.07, 0.5, 0.03), woodM, { parent: D, p: [0, 0.12 + i * 0.72, 0] });
  for (const s of [-1, 1]) mesh(G.box(0.09, 2.4, 0.5, 0.03), woodD, { parent: D, p: [s * 1.2, 1.2, 0] });
  const jc = ['#f6ecd6', '#c9a36e', '#7a6a45', '#5f6b3a', '#a8774a', '#5a3524', '#ffe07a', '#ffffff'];
  for (let i = 0; i < 8; i++) {
    const j = group({ parent: D, p: [-0.9 + (i % 4) * 0.6, 0.88 + Math.floor(i / 4) * 0.72, 0.02] });
    mesh(G.cyl(0.17, 0.16, 0.36, 14), mat('#eaf6ff', { transparent: true, opacity: 0.35, rough: 0.1 }), { parent: j, p: [0, 0.18, 0], cast: false });
    mesh(G.cyl(0.15, 0.14, 0.24 + (i % 3) * 0.04, 14), mat(jc[i], { rough: 0.9 }), { parent: j, p: [0, 0.14, 0] });
    mesh(G.cyl(0.18, 0.18, 0.06, 14), mat(i % 2 ? '#e9785e' : '#c98a5a'), { parent: j, p: [0, 0.38, 0] });
  }
  sack(D, -0.7, 0.16, 0.05, 1); sack(D, 0.05, 0.16, 0.08, 0.9, '#e8d4b0'); sack(D, 0.75, 0.16, 0.02, 0.8, '#d9c39a');
  for (let i = 0; i < 3; i++) mesh(G.box(0.5, 0.22, 0.34, 0.04), mat(['#e9785e', '#9ad1c0', '#ffd166'][i]), { parent: D, p: [-0.75 + i * 0.75, 2.42, 0] });
  W.obstacles.push([5.75, -3.5, 6.5, -1.0]);
  // carro de bandejas: donde dejar lo que llevas en las manos
  const K = group({ parent: B, p: [5.9, 0.1, -0.45] }), steel = mat('#b9c3cc', { rough: 0.35, metal: 0.5 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { mesh(G.cyl(0.03, 0.03, 1.85, 8), steel, { parent: K, p: [sx * 0.36, 0.98, sz * 0.5] }); mesh(G.sph(0.07, 10, 8), mat('#4a4654'), { parent: K, p: [sx * 0.36, 0.05, sz * 0.5] }); }
  for (let i = 0; i < 3; i++) { for (const sx of [-1, 1]) mesh(G.box(0.04, 0.04, 1.0, 0.012), steel, { parent: K, p: [sx * 0.33, 0.42 + i * 0.5, 0] }); mesh(G.box(0.66, 0.015, 1.0, 0.005), mat('#cfd8df', { rough: 0.4, metal: 0.4 }), { parent: K, p: [0, 0.425 + i * 0.5, 0] }); W.cartSlots.push({ p: [5.9, 0.56 + i * 0.5, -0.45], holder: group({ parent: B, p: [5.9, 0.545 + i * 0.5, -0.45], r: [0, Math.PI / 2, 0], s: 0.98 }) }); }
  for (const sz of [-1, 1]) mesh(G.box(0.76, 0.04, 0.04, 0.012), steel, { parent: K, p: [0, 1.88, sz * 0.5] });
  W.obstacles.push([5.45, -1.0, 6.4, 0.12]);
  // obras: reforma (banderines y plantas colgadas)
  const Rf = group({ parent: B }); W.up.reforma = Rf; Rf.visible = false;
  const bc = ['#e2664f', '#f2b84b', '#6fbfae', '#fff6e2', '#8fa8ff'];
  for (let i = 0; i < 26; i++) { const x = -6.2 + i * 0.496, y = 3.72 - Math.sin((i % 6.5) / 6.5 * Math.PI) * 0.16; const t = mesh(G.cone(0.17, 0.3, 3), mat(bc[i % 5], { rough: 0.9, side: THREE.DoubleSide }), { parent: Rf, p: [x, y - 0.17, -5.3], r: [Math.PI, 0.52, 0], s: [1, 1, 0.12] }); }
  for (const x of [-3.5, 2.95]) { const pl = group({ parent: Rf, p: [x, 3.2, -5.5] }); mesh(G.cyl(0.01, 0.01, 0.6, 4), iron, { parent: pl, p: [0, 0.32, 0] }); mesh(G.sph(0.2, 12, 8), mat('#e9785e', { rough: 0.7 }), { parent: pl, s: [1, 0.75, 1] }); for (let k = 0; k < 7; k++) mesh(G.sph(1, 8, 6), mat(k % 2 ? '#58b368' : '#7ccf7f', { sway: 0.02 }), { parent: pl, p: [Math.cos(k * 0.9) * 0.2, -0.05 - (k % 3) * 0.14, Math.sin(k * 0.9) * 0.2], s: [0.07, 0.22, 0.1] }); }
  // cartel y taburete de Miga
  W.stool = group({ parent: B, p: [-1.0, 0.1, -3.85] }); mesh(G.cyl(0.26, 0.26, 0.08, 14), woodM, { parent: W.stool, p: [0, 0.34, 0] }); for (let i = 0; i < 3; i++) mesh(G.cyl(0.03, 0.04, 0.34, 6), woodD, { parent: W.stool, p: [Math.cos(i * 2.09) * 0.17, 0.16, Math.sin(i * 2.09) * 0.17] });
  W.stool.visible = false;
  // paredes
  W.obstacles.push([-6.95, -6.6, 6.95, -5.92], [-6.95, -6.6, -6.42, 0.62], [6.42, -6.6, 6.95, 0.62]);
  return B;
}
function pot(parent, x, z, s = 1, c = '#e9785e') {
  const g = group({ parent, p: [x, 0.1, z], s });
  mesh(G.lathe([[0.001, 0], [0.2, 0], [0.28, 0.4], [0.3, 0.42], [0.001, 0.42]], 14, false), mat(c, { rough: 0.7 }), { parent: g });
  for (let i = 0; i < 7; i++) { const a = i * 0.9; mesh(G.sph(1, 10, 8), mat(i % 2 ? '#58b368' : '#7ccf7f', { rough: 0.8, sway: 0.02 }), { parent: g, p: [Math.cos(a) * 0.14, 0.7 + (i % 3) * 0.16, Math.sin(a) * 0.14], s: [0.09, 0.3, 0.16], r: [Math.cos(a) * 0.5, a, Math.sin(a) * 0.5] }); }
}
function sack(parent, x, y, z, s = 1, c = '#f1e2c4') {
  const g = group({ parent, p: [x, y, z], s });
  mesh(blob((bx, by, bz, vv) => { const k = 1 - Math.pow(Math.abs(by), 3) * 0.25; return vv.set(bx * 0.3 * k, by * 0.42 + 0.4, bz * 0.24 * k); }, { ws: 16, hs: 12 }), mat(c, { rough: 1 }), { parent: g });
  mesh(G.cyl(0.1, 0.16, 0.12, 10), mat(c, { rough: 1 }), { parent: g, p: [0, 0.84, 0] });
  mesh(G.tor(0.11, 0.02, 6, 12), mat('#c98a5a'), { parent: g, p: [0, 0.8, 0], r: [Math.PI / 2, 0, 0] });
  mesh(G.box(0.26, 0.2, 0.02, 0.01), mat('#e9785e'), { parent: g, p: [0, 0.42, 0.24] });
}

// ---------- exterior ----------
function outside() {
  const r = rnd(77);
  // lomas del fondo
  for (const [x, z, s, c] of [[-20, -30, 9, '#8bcf6c'], [-4, -34, 11, '#7fc766'], [14, -31, 10, '#8bcf6c'], [28, -26, 8, '#93d470'], [-30, -22, 8, '#93d470']])
    mesh(G.sph(1, 24, 12), mat(c, { rough: 1, rim: 0.2 }), { parent: scene, p: [x, -s * 0.35, z], s: [s * 1.5, s * 0.7, s], cast: false });
  // casas
  house(-3.5, -12.8, { wall: '#ffe9d6', roof: '#d9714e' }); house(3.6, -13.4, { wall: '#e7f1e1', roof: '#c9805a', w: 3.6, door: '#5d7a55' });
  house(14.6, -5.6, { wall: '#fde3c9', roof: '#b8604a', rot: -Math.PI / 2, w: 3.8 }); house(-13.5, -12.5, { wall: '#f6e6f0', roof: '#d9714e', w: 3.4, door: '#7b5ea7' });
  house(11.5, -14.5, { wall: '#fff3c9', roof: '#c9623f', w: 3.6, door: '#5873b8' }); house(-22, -3, { wall: '#e3eefa', roof: '#d9714e', rot: Math.PI / 2, owner: 'lana', name: 'Doña Lana' });
  house(22, 2, { wall: '#ffe9d6', roof: '#c9805a', rot: -Math.PI / 2, owner: 'brinco', name: 'Brinco' }); house(-21, 12, { wall: '#fff0d8', roof: '#d9714e', rot: Math.PI / 2, owner: 'pua', name: 'Púa y su abuelo' }); house(20.5, 12.5, { wall: '#f1e9da', roof: '#b8604a', rot: -Math.PI / 2, owner: 'zarza', name: 'Zarza' }); house(22, -5.3, { wall: '#efe6f6', roof: '#7b5ea7', rot: -Math.PI / 2, w: 3.4, door: '#7b5ea7', owner: 'ulular', name: 'Don Ulular' });
  // molino
  const mill = group({ parent: scene, p: [-14.5, 0, -19.5] });
  mesh(G.lathe([[1.9, 0], [1.75, 0.6], [1.35, 4.4], [1.3, 5], [0.001, 5]], 20, false), mat('#fff6ea', { rough: 0.95 }), { parent: mill });
  mesh(G.cone(1.6, 1.5, 20), mat('#d9714e', { rough: 0.9 }), { parent: mill, p: [0, 5.7, 0] });
  mesh(G.box(0.8, 1.3, 0.12, 0.3), mat('#8f6a4a'), { parent: mill, p: [0, 0.65, 1.86] });
  W.sails = group({ parent: mill, p: [0, 4.6, 1.5] });
  mesh(G.cyl(0.14, 0.14, 0.5, 10), mat('#8f6a4a'), { parent: W.sails, r: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 4; i++) { const sg = group({ parent: W.sails, r: [0, 0, i * Math.PI / 2] }); mesh(G.box(0.1, 3.4, 0.08, 0.03), mat('#8f6a4a'), { parent: sg, p: [0, 1.7, 0] }); mesh(G.box(0.8, 2.5, 0.04, 0.02), mat('#fff3d8', { rough: 1 }), { parent: sg, p: [0.42, 2.05, 0.02] }); }
  // trigal con valla
  const N = 2600, stalk = new THREE.InstancedMesh(G.cone(0.05, 0.9, 5), mat('#ffffff', { sway: 0.16, rough: 0.9, nocache: true }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const x = -17.3 + r() * 8.6, z = -8.6 + r() * 7.6, h = 0.8 + r() * 0.5;
    e.set((r() - 0.5) * 0.2, r() * 6, (r() - 0.5) * 0.2); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x, h * 0.45, z), q, new THREE.Vector3(1.3, h, 1.3)); stalk.setMatrixAt(i, m4);
    stalk.setColorAt(i, c.set(['#f3cf63', '#e9bd4b', '#f7dc85', '#e2b140'][i % 4]));
  }
  stalk.frustumCulled = false; stalk.castShadow = false; stalk.receiveShadow = true; scene.add(stalk); W.wheat = stalk;
  fence(-17.7, -0.75, -8.3, -0.75); fence(-8.3, -0.75, -8.3, -9); fence(-17.7, -9, -8.3, -9); fence(-17.7, -0.75, -17.7, -9);
  W.obstacles.push([-17.9, -9.2, -8.1, -0.55]);
  // espantapájaros
  const sc = group({ parent: scene, p: [-13, 0, -4.6] });
  mesh(G.cyl(0.05, 0.05, 2.2, 6), mat('#a9744b'), { parent: sc, p: [0, 1.1, 0] }); mesh(G.cyl(0.04, 0.04, 1.5, 6), mat('#a9744b'), { parent: sc, p: [0, 1.55, 0], r: [0, 0, Math.PI / 2] });
  mesh(G.sph(0.24, 12, 10), mat('#f1e2c4', { rough: 1 }), { parent: sc, p: [0, 2.15, 0] }); mesh(G.cone(0.4, 0.3, 12), mat('#e2b140'), { parent: sc, p: [0, 2.42, 0] });
  mesh(G.box(0.7, 0.75, 0.2, 0.08), mat('#e9785e', { rough: 1 }), { parent: sc, p: [0, 1.3, 0] });
  // árboles
  const trees = [[-11.5, 1.2, 1.05, 'naranjo'], [11.6, 0.6, 1.1, 'naranjo'], [-14.5, 9.4, 1.15, 'naranjo'], [15.3, 3.2, 1, 'naranjo'], [3.2, 8.6, 1.1, 'naranjo'], [-4.5, 9.6, 0.95, 'alamo'], [18.6, 11.6, 1.2, 'alamo'], [-17.5, 3.4, 1.1, 'alamo'],
  [8.8, -8.8, 1.2, 'alamo'], [-8.8, -15, 1.1, 'naranjo'], [0, -17.5, 1.2, 'alamo'], [8, -17.5, 1.1, 'naranjo'], [18, -10.5, 1.2, 'alamo'], [-20, -13, 1.2, 'alamo'], [-25, 5, 1.2, 'alamo'], [25, 8, 1.2, 'naranjo'], [-9, 13, 1.2, 'alamo'], [9, 13.5, 1.2, 'alamo'], [-1, 13, 1.1, 'naranjo'], [24, -6, 1.1, 'alamo'],
  [10.6, -4.6, 1, 'cipres'], [-9.6, -11.6, 1.1, 'cipres'], [7.3, -12.6, 1.05, 'cipres'], [17.6, -3, 0.9, 'cipres'], [-17.3, -11.3, 1, 'cipres']];
  trees.forEach((t, i) => tree(t[0], t[1], t[2], t[3], i + 1));
  // arbustos y matas
  for (const [x, z, s] of [[-7.9, -4.5, 0.8], [-8.1, -2.4, 0.65], [7.9, -5.2, 0.9], [-15.8, 6.3, 0.8], [6.2, 9.4, 0.7], [14.2, 10.6, 0.9], [-7, 10.5, 0.8], [-12.6, -1.4, 0.6], [17.5, 6, 0.8]]) {
    const b = group({ parent: scene, p: [x, 0, z], s });
    for (const [bx, by, bz, bs] of [[0, 0.42, 0, 0.62], [0.45, 0.32, 0.1, 0.44], [-0.42, 0.34, -0.06, 0.46], [0.05, 0.3, 0.4, 0.4]]) mesh(G.sph(1, 14, 10), mat('#6cc070', { map: T.leaf, rough: 1, sway: 0.02, rim: 0.4 }), { parent: b, p: [bx, by, bz], s: [bs, bs * 0.85, bs] });
    for (let i = 0; i < 5; i++) mesh(G.sph(0.06, 6, 5), mat(i % 2 ? '#ff8fa3' : '#fff3a8'), { parent: b, p: [Math.cos(i * 1.4) * 0.45, 0.5 + (i % 3) * 0.15, Math.sin(i * 1.4) * 0.4 + 0.15] });
    W.circles.push([x, z, 0.55 * s]);
  }
  // flores sueltas y briznas
  const fl = []; const fc = ['#ff8fa3', '#ffffff', '#ffd166', '#c9a0ff', '#ff9d5c', '#9fd8ff'];
  const free = (x, z) => !(x > -7.9 && x < 7.9 && z > -6.8 && z < 3.8) && !(z > 2.2 && z < 6.3) && !(x < -8 && x > -18 && z < -0.4 && z > -9.3) && Math.hypot(x + 10.2, z - 7) > 3.6 && Math.hypot(x - 12, z - 8.6) > 3.2 && !(x > -11.2 && x < -7.6 && z < 4);
  for (let i = 0; i < 46; i++) { const cx = -19 + r() * 38, cz = -9 + r() * 21, col = fc[Math.floor(r() * fc.length)]; for (let k = 0; k < 5; k++) { const x = cx + (r() - 0.5) * 1.3, z = cz + (r() - 0.5) * 1.3; if (free(x, z)) fl.push([x, z, col, 0.22 + r() * 0.16]); } }
  flowers(fl);
  const tuftN = 700, tuft = new THREE.InstancedMesh(G.cone(0.06, 0.28, 4), mat('#74c35c', { sway: 0.2, rough: 1 }), tuftN);
  for (let i = 0; i < tuftN; i++) { let x, z, k = 0; do { x = -24 + r() * 48; z = -16 + r() * 30; } while (!free(x, z) && k++ < 20); e.set(0, r() * 6, (r() - 0.5) * 0.5); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, 0.12, z), q, new THREE.Vector3(1, 0.7 + r() * 0.8, 1)); tuft.setMatrixAt(i, m4); }
  tuft.frustumCulled = false; tuft.receiveShadow = true; scene.add(tuft);
  // farolas, bancos, buzón
  lamp(-7.3, 3.9); lamp(7.3, 3.9); lamp(-14.6, 6.4); lamp(14.6, 6.2); lamp(-8.6, -8);
  bench(-10.2, 10.75, Math.PI); bench(-13.9, 7.0, Math.PI / 2); bench(4.2, 6.75, Math.PI);
  const mb = group({ parent: scene, p: [7.9, 0, 1.5] });
  mesh(G.cyl(0.05, 0.05, 1.0, 6), mat('#8f6a4a'), { parent: mb, p: [0, 0.5, 0] }); mesh(G.box(0.4, 0.34, 0.5, 0.12), mat('#e9785e', { rough: 0.5 }), { parent: mb, p: [0, 1.12, 0] }); mesh(G.box(0.03, 0.24, 0.16, 0.01), mat('#ffd166'), { parent: mb, p: [0.21, 1.2, 0.05] });
  W.circles.push([7.9, 1.5, 0.3]);
  // cartel de la panadería
  const sg = group({ parent: scene, p: [-8.2, 0, 1.5] });
  mesh(G.cyl(0.07, 0.09, 3.3, 8), mat('#8f6a4a'), { parent: sg, p: [0, 1.65, 0] }); mesh(G.box(1.7, 0.08, 0.08, 0.03), mat('#8f6a4a'), { parent: sg, p: [0.75, 3.1, 0] }); mesh(G.sph(0.11, 8, 6), mat('#e9b949', { metal: 0.6, rough: 0.3 }), { parent: sg, p: [0, 3.36, 0] });
  W.sign = group({ parent: sg, p: [0.85, 3.05, 0] });
  for (const s of [-1, 1]) mesh(G.plane(1.72, 0.775), mat('#ffffff', { map: W.logoTex, alphaTest: 0.5, rough: 0.6, rim: 0 }), { parent: W.sign, p: [0, -0.5, s * 0.012], r: [0, s > 0 ? 0 : Math.PI, 0] });
  for (const s of [-1, 1]) mesh(G.cyl(0.012, 0.012, 0.14, 4), mat('#4a4654'), { parent: W.sign, p: [s * 0.55, -0.07, 0] });
  W.circles.push([-8.2, 1.5, 0.3]);

  // leñera y tocón (para alimentar el horno)
  const Le = group({ parent: scene, p: [8.0, 0, -3.3] });
  for (const sx of [-1, 1]) mesh(G.box(0.1, 1.3, 0.9, 0.03), mat('#8f6a4a'), { parent: Le, p: [sx * 0.75, 0.65, 0] });
  mesh(G.box(1.9, 0.08, 1.2, 0.03), mat('#d9714e', { rough: 0.9 }), { parent: Le, p: [0, 1.38, 0.05], r: [0.18, 0, 0] });
  W.woodLogs = [];
  for (let i = 0; i < 12; i++) { const row = Math.floor(i / 4), col = i % 4; const l = group({ parent: Le, p: [-0.5 + col * 0.33 + (row % 2) * 0.12, 0.14 + row * 0.26, 0] }); mesh(G.cyl(0.13, 0.13, 0.8, 9), mat('#b07a4c', { rough: 0.95 }), { parent: l, r: [Math.PI / 2, 0, 0] }); mesh(G.cyl(0.1, 0.1, 0.81, 9), mat('#f0d2a0'), { parent: l, r: [Math.PI / 2, 0, 0] }); W.woodLogs.push(l); }
  const St = group({ parent: scene, p: [9.6, 0, -2.3] });
  mesh(G.cyl(0.36, 0.42, 0.45, 12), mat('#a9744b', { rough: 1 }), { parent: St, p: [0, 0.22, 0] }); mesh(G.cyl(0.33, 0.33, 0.02, 12), mat('#f0d2a0'), { parent: St, p: [0, 0.455, 0] });
  W.axe = group({ parent: St, p: [0.05, 0.46, 0], r: [0, 0.5, 0.5] }); mesh(G.cyl(0.025, 0.03, 0.75, 6), mat('#c98a5a'), { parent: W.axe, p: [0, 0.36, 0] }); mesh(G.box(0.26, 0.2, 0.04, 0.02), mat('#b9c3cc', { metal: 0.6, rough: 0.3 }), { parent: W.axe, p: [0.1, 0.66, 0] });
  W.stumpLog = group({ parent: St, p: [0, 0.71, 0.02] }); mesh(G.cyl(0.15, 0.15, 0.5, 10), mat('#b07a4c', { rough: 0.95 }), { parent: W.stumpLog }); mesh(G.cyl(0.125, 0.125, 0.51, 10), mat('#f0d2a0'), { parent: W.stumpLog }); W.stumpLog.visible = false;
  W.halfProto = group(); const hg = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 10, 1, false, 0, Math.PI); mesh(hg, mat('#b07a4c', { rough: 0.95, side: THREE.DoubleSide }), { parent: W.halfProto }); mesh(G.box(0.3, 0.5, 0.012, 0.004), mat('#f6dfb4'), { parent: W.halfProto });
  W.stumpPos = [9.6, 0.46, -2.3];
  W.circles.push([9.6, -2.3, 0.5]); W.obstacles.push([7.1, -3.95, 8.9, -2.7]);
  W.st.lena = { x: 8.0, z: -2.25, ox: 8.0, oz: -3.3, yaw: Math.PI };
  W.st.tocon = { x: 9.6, z: -1.45, ox: 9.6, oz: -2.3, yaw: Math.PI };
  // el carro de Pipa en la plaza
  const Ca = group({ parent: scene, p: [8.4, 0, 7.0], r: [0, -0.25, 0] });
  mesh(G.box(1.9, 0.5, 1.0, 0.05), mat('#6fbfae', { rough: 0.7 }), { parent: Ca, p: [0, 0.75, 0] }); mesh(G.box(2.0, 0.07, 1.1, 0.03), mat('#c98a5a'), { parent: Ca, p: [0, 1.03, 0] });
  for (const sx of [-1, 1]) { mesh(G.cyl(0.36, 0.36, 0.09, 16), mat('#8f6a4a'), { parent: Ca, p: [sx * 0.7, 0.36, 0.56], r: [Math.PI / 2, 0, 0] }); mesh(G.cyl(0.1, 0.1, 0.1, 8), mat('#e9b949'), { parent: Ca, p: [sx * 0.7, 0.36, 0.57], r: [Math.PI / 2, 0, 0] }); }
  for (const sx of [-1, 1]) mesh(G.cyl(0.035, 0.035, 1.5, 6), mat('#8f6a4a'), { parent: Ca, p: [sx * 0.92, 1.75, -0.4] });
  for (let i = 0; i < 6; i++) mesh(G.box(0.34, 0.05, 1.3, 0.02), mat(i % 2 ? '#fff6e2' : '#6fbfae', { rough: 0.9 }), { parent: Ca, p: [-0.85 + i * 0.34, 2.5, 0.05], r: [0.3, 0, 0] });
  sack(Ca, -0.6, 1.06, 0.05, 0.55); sack(Ca, -0.1, 1.06, -0.1, 0.5, '#e2c79c');
  for (let i = 0; i < 3; i++) { mesh(G.cyl(0.13, 0.12, 0.3, 12), mat(['#93a35a', '#6f5f40', '#ffe27a'][i], { rough: 0.5 }), { parent: Ca, p: [0.35 + i * 0.3, 1.22, 0.1] }); mesh(G.cyl(0.14, 0.14, 0.05, 12), mat('#e2664f'), { parent: Ca, p: [0.35 + i * 0.3, 1.39, 0.1] }); }
  W.obstacles.push([7.3, 6.3, 9.5, 7.75]); W.pipaSpot = [8.9, 8.15];
  // cartel de «Vuelvo enseguida» y casa de Pan
  const brbT = canvasTex(256, 128, (g) => { g.fillStyle = '#fff3d8'; g.beginPath(); g.roundRect(4, 4, 248, 120, 22); g.fill(); g.strokeStyle = '#c98a5a'; g.lineWidth = 9; g.stroke(); g.fillStyle = '#e2664f'; g.font = '900 42px "Baloo 2", ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.textAlign = 'center'; g.fillText('VUELVO', 128, 56); g.fillText('ENSEGUIDA', 128, 100, 220); });
  W.brb = group({ parent: scene, p: [-7.35, 2.05, 1.5] }); for (const sd of [-1, 1]) mesh(G.plane(0.9, 0.45), basic('#ffffff', { map: brbT }), { parent: W.brb, p: [0, -0.3, sd * 0.02], r: [0, sd > 0 ? 0 : Math.PI, 0], cast: false }); mesh(G.box(0.92, 0.47, 0.03, 0.01), mat('#c98a5a'), { parent: W.brb, p: [0, -0.3, 0] }); W.brb.visible = false;
  const hs = canvasTex(256, 96, (g) => { g.fillStyle = '#fff3d8'; g.beginPath(); g.roundRect(4, 4, 248, 88, 20); g.fill(); g.strokeStyle = '#c98a5a'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#7a4a2a'; g.font = '900 44px "Baloo 2", ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.textAlign = 'center'; g.fillText('Casa de Pan', 128, 62, 226); });
  const Hs = group({ parent: scene, p: [12.1, 0, -3.5], r: [0, -0.5, 0] }); mesh(G.cyl(0.05, 0.06, 1.1, 6), mat('#8f6a4a'), { parent: Hs, p: [0, 0.55, 0] }); mesh(G.box(1.0, 0.4, 0.06, 0.02), mat('#c98a5a'), { parent: Hs, p: [0, 1.15, 0] }); mesh(G.plane(0.94, 0.35), basic('#ffffff', { map: hs }), { parent: Hs, p: [0, 1.15, 0.035], cast: false });
  mesh(G.box(0.9, 0.04, 0.6, 0.02), mat('#e2664f', { rough: 1 }), { parent: scene, p: [12.55, 0.03, -5.15], r: [0, 0.05, 0], cast: false });
  W.circles.push([12.1, -3.5, 0.25]); W.homeSpot = [12.4, -5.1];
  // lo que brilla: hallazgos del día
  W.findSpots = [[-13, 4.2], [-6.5, 8.8], [1.5, 9.5], [6.5, 3.6], [14.5, 1.2], [15.5, 7.5], [-16, 8], [10.8, -1.2], [-9.5, -3.5], [-2, 6.5], [9.5, 10.5], [-12.5, 10.5]];
  W.findMesh = []; for (let i = 0; i < 5; i++) { const m = mesh(G.ico(0.11, 0), mat('#fff3a8', { emissive: '#ffd866', ei: 1.2, rough: 0.3 }), { parent: scene, cast: false }); m.visible = false; W.findMesh.push(m); }
  // fuente
  const F = group({ parent: scene, p: [-10.2, 0, 7.0] }), stoneM = mat('#ffffff', { map: T.stone, rough: 1 });
  mesh(G.lathe([[0.001, 0], [1.6, 0], [1.66, 0.12], [1.62, 0.5], [1.5, 0.56], [1.36, 0.5], [1.36, 0.18], [0.001, 0.18]], 30, false), stoneM, { parent: F });
  mesh(G.lathe([[0.3, 0.15], [0.2, 0.5], [0.16, 1.0], [0.55, 1.2], [0.6, 1.28], [0.5, 1.3], [0.12, 1.22], [0.1, 1.6], [0.001, 1.66]], 16), stoneM, { parent: F });
  W.fountainDry = group({ parent: F }); for (let i = 0; i < 9; i++) mesh(G.sph(0.09, 6, 4), mat(i % 2 ? '#c9a05a' : '#b98445'), { parent: W.fountainDry, p: [Math.cos(i * 2.2) * (0.5 + (i % 3) * 0.3), 0.2, Math.sin(i * 2.2) * (0.5 + (i % 3) * 0.3)], s: [1, 0.2, 1.4], r: [0, i, 0] });
  W.water = waterMat('#7fd3f0');
  W.fountainWet = group({ parent: F }); mesh(G.cyl(1.38, 1.38, 0.02, 30), W.water, { parent: W.fountainWet, p: [0, 0.44, 0], cast: false }); mesh(G.cyl(0.5, 0.5, 0.02, 20), W.water, { parent: W.fountainWet, p: [0, 1.27, 0], cast: false });
  for (let i = 0; i < 6; i++) mesh(G.cap(0.03, 0.75, 6), mat('#cdeffc', { transparent: true, opacity: 0.7, emissive: '#bfeaff', ei: 0.3 }), { parent: W.fountainWet, p: [Math.cos(i * 1.047) * 0.52, 0.85, Math.sin(i * 1.047) * 0.52], cast: false });
  W.fountainWet.visible = false; W.fountainPos = [-10.2, 7.0];
  W.circles.push([-10.2, 7.0, 1.8]);
  // estanque con patos
  const P = group({ parent: scene, p: [12, 0, 8.6] });
  const pg = new THREE.CircleGeometry(1, 40); const pp = pg.attributes.position; for (let i = 1; i < pp.count; i++) { const a = Math.atan2(pp.getY(i), pp.getX(i)), k = 1 + Math.sin(a * 3) * 0.1 + Math.cos(a * 2 + 1) * 0.12; pp.setXY(i, pp.getX(i) * k, pp.getY(i) * k); } pg.rotateX(-Math.PI / 2);
  mesh(pg, mat('#e3d2a4', { rough: 1 }), { parent: P, p: [0, 0.05, 0], s: [3.1, 1, 2.5], cast: false });
  W.pond = waterMat('#6cc7ea'); mesh(pg, W.pond, { parent: P, p: [0, 0.085, 0], s: [2.75, 1, 2.15], cast: false });
  for (let i = 0; i < 9; i++) { const a = 2.2 + i * 0.32, x = Math.cos(a) * 2.7, z = Math.sin(a) * 2.1 - 0.2; mesh(G.cyl(0.02, 0.03, 1 + (i % 3) * 0.3, 5), mat('#6aa84f', { sway: 0.06 }), { parent: P, p: [x, 0.5, z] }); if (i % 2) mesh(G.cap(0.05, 0.2, 6), mat('#8a5a34', { sway: 0.06 }), { parent: P, p: [x, 1.05 + (i % 3) * 0.14, z] }); }
  for (const [x, z, s] of [[-0.9, 0.5, 0.5], [0.7, -0.8, 0.4], [1.3, 0.7, 0.45]]) { mesh(G.cyl(s, s, 0.02, 14), mat('#5cb85c'), { parent: P, p: [x, 0.05, z], cast: false }); mesh(G.sph(0.09, 8, 6), mat('#ffb3c9'), { parent: P, p: [x + 0.1, 0.1, z], s: [1, 0.7, 1] }); }
  const duck = (kind, sc) => {
    const C = { macho: ['#d8d0c2', '#2f7d4f', '#8a5a3c', '#f2c14e'], hembra: ['#b9946a', '#a37f58', '#8f6a48', '#e9a53a'], blanco: ['#fffdf5', '#fffdf5', '#f1ece0', '#ff9d2e'], pollo: ['#ffd95a', '#ffe27a', '#f2c14e', '#ff9d2e'] }[kind];
    const d = group({ parent: P, s: sc }), body = group({ parent: d });
    mesh(blob((x, y, z, vv) => { const tail = z < -0.3 ? (-z - 0.3) * 0.5 : 0; return vv.set(x * 0.2 * (1 - tail * 0.5), y * 0.15 + 0.13 + tail * 0.16, z * 0.32); }, { ws: 16, hs: 12 }), mat(C[0], { rough: 0.9, rim: 0.4 }), { parent: body });
    if (kind === 'macho') mesh(G.sph(0.13, 12, 8), mat(C[2], { rough: 0.9 }), { parent: body, p: [0, 0.13, 0.2], s: [1.1, 0.9, 0.8] });
    const wings = [-1, 1].map(sd => mesh(blob((x, y, z, vv) => vv.set(x * 0.04, y * 0.09, z * 0.2), { ws: 10, hs: 8 }), mat(kind === 'macho' ? '#9a8f84' : C[2], { rough: 0.95 }), { parent: body, p: [sd * 0.17, 0.19, -0.05], r: [0, sd * 0.12, sd * -0.25] }));
    if (kind === 'macho') mesh(G.tor(0.05, 0.02, 6, 10, Math.PI * 1.3), mat('#3a3a44'), { parent: body, p: [0, 0.3, -0.34], r: [0, Math.PI / 2, 0.6] });
    const neck = group({ parent: d, p: [0, 0.22, 0.2] }); mesh(G.cyl(0.055, 0.07, 0.2, 10), mat(C[1], { rough: 0.9 }), { parent: neck, p: [0, 0.08, 0.02], r: [0.25, 0, 0] });
    if (kind === 'macho') mesh(G.tor(0.062, 0.012, 6, 14), mat('#fffdf5'), { parent: neck, p: [0, 0.07, 0.02], r: [Math.PI / 2 - 0.25, 0, 0] });
    const head = group({ parent: neck, p: [0, 0.21, 0.07] }); mesh(G.sph(0.11, 14, 10), mat(C[1], { rough: 0.85, rim: 0.4 }), { parent: head, s: [1, 0.95, 1.05] });
    mesh(G.box(0.1, 0.03, 0.14, 0.012), mat(C[3], { rough: 0.5 }), { parent: head, p: [0, -0.02, 0.14] }); mesh(G.box(0.085, 0.02, 0.11, 0.008), mat('#d98a2a', { rough: 0.5 }), { parent: head, p: [0, -0.045, 0.12] });
    for (const sd of [-1, 1]) { mesh(G.sph(0.022, 8, 6), mat('#1f1512', { rough: 0.3 }), { parent: head, p: [sd * 0.075, 0.03, 0.065] }); mesh(G.sph(0.008, 5, 4), mat('#ffffff'), { parent: head, p: [sd * 0.083, 0.04, 0.078] }); if (kind !== 'macho') mesh(G.sph(0.03, 6, 5), mat('#ff9c8e', { transparent: true, opacity: 0.5 }), { parent: head, p: [sd * 0.085, -0.02, 0.05], s: [0.4, 1, 1] }); }
    const ring = mesh(G.tor(0.3, 0.018, 4, 22), mat('#ffffff', { transparent: true, opacity: 0.5, rough: 1 }), { parent: P, r: [Math.PI / 2, 0, 0], cast: false });
    return { g: d, body, neck, head, wings, ring, kind, sc, x: 0, z: 0, yaw: 0, dab: 0, dabT: 3 + Math.random() * 6 };
  };
  W.ducks.push(Object.assign(duck('macho', 1), { a: 0, r: 1.2 }), Object.assign(duck('hembra', 0.95), { a: 2.4, r: 0.8 }), Object.assign(duck('blanco', 0.9), { a: 4.3, r: 1.5 }));
  W.ducklings = []; for (let i = 0; i < 6; i++) { const dk = duck('pollo', 0.42); dk.g.visible = dk.ring.visible = false; dk.lag = (i + 1) * 0.55; W.ducklings.push(dk); }
  W.duckFeedT = 0; W.duckTrail = [];
  // banco de Don Espino, mirando al estanque
  bench(15.35, 7.7, -Math.PI / 2); W.benchSeats.splice(-2, 2); W.espinoSeat = { x: 15.35, z: 7.5, yaw: -Math.PI / 2 - 0.15 }; W.duckShore = [1.75, -0.6];
  W.circles.push([12, 8.6, 2.75]); W.pondPos = [12, 8.6];

  // ---- mejoras visibles ----
  // jardineras
  const J = group({ parent: scene }); W.up.jardin = J;
  const jl = [];
  for (const x of [-6.0, -3.6, 3.6, 6.0]) { mesh(G.box(1.5, 0.34, 0.42, 0.08), mat('#c98a5a', { rough: 0.8 }), { parent: J, p: [x, 0.19, 3.25] }); mesh(G.box(1.36, 0.1, 0.3, 0.04), mat('#6b4a3a'), { parent: J, p: [x, 0.33, 3.25] }); for (let i = 0; i < 7; i++) jl.push([x - 0.58 + i * 0.19, 3.25 + (i % 2 ? 0.06 : -0.05), ['#ff8fa3', '#ffd166', '#ffffff', '#ff9d5c', '#c9a0ff'][i % 5], 0.52 + (i % 3) * 0.06]); }
  flowers(jl, J);
  // terraza
  const Tz = group({ parent: scene }); W.up.terraza = Tz; W.seats = [];
  for (const [x, z, c] of [[9.9, 1.2, '#e9785e'], [12.6, 0.6, '#9ad1c0']]) {
    const t = group({ parent: Tz, p: [x, 0, z] });
    mesh(G.cyl(0.6, 0.6, 0.07, 22), mat('#fffaf0', { rough: 0.6 }), { parent: t, p: [0, 0.72, 0] }); mesh(G.cyl(0.05, 0.05, 0.7, 8), mat('#4a4654'), { parent: t, p: [0, 0.36, 0] }); mesh(G.cyl(0.3, 0.34, 0.05, 14), mat('#4a4654'), { parent: t, p: [0, 0.03, 0] });
    mesh(G.cyl(0.03, 0.03, 2.6, 6), mat('#fffaf0'), { parent: t, p: [0, 1.5, 0] });
    const par = new THREE.ConeGeometry(1.35, 0.55, 12, 1, true); const pc = new Float32Array(par.attributes.position.count * 3), cc = new THREE.Color();
    for (let i = 0; i < par.attributes.position.count; i++) { const a = Math.atan2(par.attributes.position.getZ(i), par.attributes.position.getX(i)); cc.set(Math.floor((a + Math.PI) / (Math.PI / 6) + 0.001) % 2 ? c : '#fffaf0'); pc.set([cc.r, cc.g, cc.b], i * 3); }
    par.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    mesh(par.toNonIndexed(), mat('#ffffff', { vc: true, side: THREE.DoubleSide, rough: 0.9, flat: true, nocache: true }), { parent: t, p: [0, 2.65, 0] });
    for (const s of [-1, 1]) { const ch = group({ parent: t, p: [s * 0.95, 0, 0.1] }); mesh(G.cyl(0.26, 0.26, 0.06, 14), mat(c), { parent: ch, p: [0, 0.4, 0] }); for (let i = 0; i < 4; i++) mesh(G.cyl(0.025, 0.025, 0.4, 5), mat('#4a4654'), { parent: ch, p: [Math.cos(i * 1.57 + 0.78) * 0.18, 0.2, Math.sin(i * 1.57 + 0.78) * 0.18] }); mesh(G.box(0.06, 0.4, 0.44, 0.03), mat(c), { parent: ch, p: [s * 0.24, 0.62, 0] }); W.seats.push({ x: x + s * 0.95, z: z + 0.1, yaw: -s * Math.PI / 2 + s * 0.5, used: null }); }
  }
  // farolillos
  const Fa = group({ parent: scene }); W.up.farolillos = Fa; W.lanterns = [];
  const poles = [[-13, 2.5], [-6.5, 6.6], [0, 2.9], [6.5, 6.6], [13, 2.5]];
  W.condCircles = { farolillos: poles.map(([x, z]) => [x, z, 0.16]) };
  poles.forEach(([x, z]) => { mesh(G.cyl(0.05, 0.07, 3.5, 6), mat('#8f6a4a'), { parent: Fa, p: [x, 1.75, z] }); mesh(G.sph(0.09, 8, 6), mat('#e9b949'), { parent: Fa, p: [x, 3.55, z] }); });
  const lc = ['#ff7b8a', '#ffd166', '#7bd3c4', '#8fa8ff', '#ffa3d1', '#ffb86b'];
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1], pts = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, 3.45 - Math.sin(t * Math.PI) * 0.75, a[1] + (b[1] - a[1]) * t)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4), mat('#4a4654'), { parent: Fa, cast: false });
    for (let k = 1; k < 12; k += 2) { const lm = mat(lc[(i * 3 + k) % 6], { emissive: lc[(i * 3 + k) % 6], ei: 0.25, rough: 0.6, nocache: true }); W.lanterns.push(lm); const lg = group({ parent: Fa, p: [pts[k].x, pts[k].y - 0.2, pts[k].z] }); mesh(G.sph(0.17, 12, 10), lm, { parent: lg, s: [1, 1.15, 1] }); mesh(G.cyl(0.07, 0.07, 0.05, 8), mat('#e9b949'), { parent: lg, p: [0, 0.19, 0] }); mesh(G.cyl(0.07, 0.07, 0.05, 8), mat('#e9b949'), { parent: lg, p: [0, -0.19, 0] }); W.lanterns.push(lg); }
  }
  // huerto de la abuela
  const Hu = group({ parent: scene, p: [-15, 0, 1.25] }); W.up.huerto = Hu;
  mesh(G.box(2.7, 0.12, 2.0, 0.05), mat('#8a5f3f', { rough: 1 }), { parent: Hu, p: [0, 0.05, 0] });
  for (let k = 0; k < 3; k++) { mesh(G.box(2.4, 0.14, 0.34, 0.07), mat('#75492e', { rough: 1 }), { parent: Hu, p: [0, 0.12, -0.62 + k * 0.62] }); for (let i = 0; i < 6; i++) { const x = -1 + i * 0.4, z = -0.62 + k * 0.62; if (k === 0) { mesh(G.cyl(0.015, 0.015, 0.5, 4), mat('#8a9a5a', { sway: 0.05 }), { parent: Hu, p: [x, 0.42, z] }); mesh(G.sph(0.11, 8, 6), mat('#e9d27a', { sway: 0.05 }), { parent: Hu, p: [x, 0.7, z], s: [1, 0.5, 1] }); } else if (k === 1) for (let l = 0; l < 4; l++) mesh(G.sph(1, 8, 6), mat(l % 2 ? '#58b368' : '#7ccf7f', { sway: 0.03 }), { parent: Hu, p: [x + Math.cos(l * 1.57) * 0.07, 0.3, z + Math.sin(l * 1.57) * 0.07], s: [0.05, 0.16, 0.09], r: [Math.cos(l * 1.57) * 0.5, l, Math.sin(l * 1.57) * 0.5] }); else { mesh(G.sph(0.12, 8, 6), mat('#6aa84f', { sway: 0.02 }), { parent: Hu, p: [x, 0.3, z] }); mesh(G.sph(0.045, 6, 5), mat(i % 2 ? '#3c4424' : '#6b7a3a', { rough: 0.3 }), { parent: Hu, p: [x + 0.07, 0.36, z + 0.08] }); } } }
  mesh(G.box(0.5, 0.3, 0.4, 0.04), mat('#c98a5a'), { parent: Hu, p: [1.0, 0.3, 0.9], r: [0, 0.3, 0] }); for (let i = 0; i < 5; i++) mesh(G.sph(0.08, 8, 6), mat(['#a47446', '#6b7a3a', '#b98a58'][i % 3]), { parent: Hu, p: [0.9 + (i % 3) * 0.1, 0.48, 0.85 + (i % 2) * 0.1] });
  // puesto de la plaza
  const Pu = group({ parent: scene, p: [-4.2, 0, 7.5] }); W.up.puesto = Pu;
  mesh(G.box(2.3, 0.85, 0.95, 0.06), mat('#f4dcae', { rough: 0.85 }), { parent: Pu, p: [0, 0.43, 0] }); mesh(G.box(2.45, 0.09, 1.1, 0.04), mat('#c98a5a'), { parent: Pu, p: [0, 0.9, 0] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(G.cyl(0.045, 0.045, 2.5, 6), mat('#8f6a4a'), { parent: Pu, p: [sx * 1.16, 1.25, sz * 0.5] });
  for (let i = 0; i < 8; i++) mesh(G.box(0.34, 0.05, 1.5, 0.02), mat(i % 2 ? '#fff6e2' : '#e2664f', { rough: 0.9 }), { parent: Pu, p: [-1.19 + i * 0.34, 2.55, 0.06], r: [0.28, 0, 0] });
  for (let i = 0; i < 8; i++) mesh(G.sph(0.17, 10, 6, ), mat(i % 2 ? '#fff6e2' : '#e2664f', { rough: 0.9 }), { parent: Pu, p: [-1.19 + i * 0.34, 2.33, 0.78], s: [1, 0.8, 0.25] });
  W.stallItems = group({ parent: Pu, p: [0, 0.95, 0] });
  for (const [id, x] of [['hogaza', -0.75], ['barra', 0], ['mollete', 0.7]]) { const bb = makeBread(id); bb.position.set(x, 0, 0.1); bb.scale.setScalar(0.7); bb.rotation.y = x + 0.4; W.stallItems.add(bb); }
  W.cond = { puesto: [-5.5, 6.9, -2.9, 8.15], huerto: [-16.5, 0.1, -13.5, 2.4] };
  // molino arreglado: banderín y aspas nuevas
  W.up.molino = group({ parent: scene, p: [-14.5, 0, -19.5] });
  mesh(G.cyl(0.04, 0.04, 1.6, 5), mat('#8f6a4a'), { parent: W.up.molino, p: [0, 7.2, 0] }); mesh(G.cone(0.3, 0.7, 3), mat('#e2664f', { side: THREE.DoubleSide }), { parent: W.up.molino, p: [0.36, 7.7, 0], r: [0, 0, -Math.PI / 2], s: [1, 1, 0.1] });
  for (const id of ['jardin', 'terraza', 'farolillos', 'huerto', 'puesto', 'molino']) W.up[id].visible = false;
  // valla de «en obras»
  W.wipProto = group();
  for (const sx of [-1, 1]) { mesh(G.box(0.08, 0.9, 0.08, 0.02), mat('#f2b84b'), { parent: W.wipProto, p: [sx * 0.6, 0.45, 0.14], r: [0.3, 0, 0] }); mesh(G.box(0.08, 0.9, 0.08, 0.02), mat('#f2b84b'), { parent: W.wipProto, p: [sx * 0.6, 0.45, -0.14], r: [-0.3, 0, 0] }); }
  for (let i = 0; i < 7; i++) mesh(G.box(0.21, 0.26, 0.06, 0.01), mat(i % 2 ? '#fff6e2' : '#e2664f'), { parent: W.wipProto, p: [-0.63 + i * 0.21, 0.72, 0] });
  mesh(G.cone(0.18, 0.5, 10), mat('#f08a3c'), { parent: W.wipProto, p: [1.05, 0.25, 0.2] }); mesh(G.cyl(0.24, 0.24, 0.04, 10), mat('#f08a3c'), { parent: W.wipProto, p: [1.05, 0.02, 0.2] }); mesh(G.cyl(0.13, 0.15, 0.1, 10), mat('#fff6e2'), { parent: W.wipProto, p: [1.05, 0.26, 0.2] });
  W.mounts = [];
  for (let i = 0; i < 11; i++) { const mm = new THREE.MeshBasicMaterial({ color: 0xa9c4e6 }), far = i % 2; const m = new THREE.Mesh(new THREE.ConeGeometry(9 + r() * 7, 9 + r() * 8, 5 + Math.floor(r() * 3)), mm); m.position.set(-70 + i * 14 + r() * 6, -14 + r() * 2 - far * 2, -86 - far * 14); m.rotation.y = r() * 3; m.frustumCulled = false; scene.add(m); W.mounts.push({ m: mm, far }); if (i % 3 === 0) { const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.4, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); cap.position.copy(m.position); cap.position.y += m.geometry.parameters.height / 2 - 1.6; cap.frustumCulled = false; scene.add(cap); W.mounts.push({ m: cap.material, snow: 1 }); } }
  // nubes (sin curvatura para que floten en el cielo)
  W.clouds = [];
  for (let i = 0; i < 7; i++) {
    const cg = group({ parent: scene, p: [-40 + i * 14 + r() * 6, -3 + r() * 5, -52 - r() * 10], s: 2.2 + r() * 1.6 });
    const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
    for (const [x, y, s] of [[0, 0, 1.2], [1.2, -0.1, 0.9], [-1.2, -0.15, 0.85], [0.5, 0.5, 0.8], [-0.5, 0.4, 0.7]]) { const mm = new THREE.Mesh(G.sph(1, 12, 8), cm); mm.position.set(x, y, 0); mm.scale.set(s, s * 0.7, s * 0.5); mm.frustumCulled = false; cg.add(mm); }
    W.clouds.push({ g: cg, m: cm, v: 0.25 + r() * 0.25 });
  }
}
function fence(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.9), wm = mat('#f1e2c4', { rough: 0.9 });
  const g = group({ parent: scene, p: [x0, 0, z0], r: [0, -Math.atan2(z1 - z0, x1 - x0), 0] });
  for (let i = 0; i <= n; i++) { mesh(G.box(0.12, 0.8, 0.12, 0.04), wm, { parent: g, p: [i * len / n, 0.4, 0] }); mesh(G.sph(0.08, 6, 5), wm, { parent: g, p: [i * len / n, 0.82, 0] }); }
  for (const y of [0.3, 0.6]) mesh(G.zbox(len, 0.08, 0.05, 14, 1), wm, { parent: g, p: [len / 2, y, 0] });
}
function waterMat(col) {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, 256, 256); const r = rnd(4);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const x = r() * 256, y = r() * 256, w = 20 + r() * 30; for (const ox of [0, -256, 256]) { g.beginPath(); g.moveTo(x + ox, y); g.quadraticCurveTo(x + ox + w / 2, y - 8, x + ox + w, y); g.stroke(); } }
  }, { repeat: [2, 2] });
  return mat('#ffffff', { map: t, rough: 0.15, transparent: true, opacity: 0.92, rim: 0.5 });
}

// ---------- la casa de Pan por dentro (una maqueta aparte, lejos del pueblo) ----------
function home() {
  const HX = 60, HZ = -3, H = group({ parent: scene, p: [HX, 0, HZ] }), wood = mat('#c98a5a', { rough: 0.8 }), woodD = mat('#a36b42', { rough: 0.85 }), cream = mat('#fff6e4', { rough: 0.9 });
  W.home = { fur: {}, obst: [], g: H, trophies: group({ parent: H, p: [-0.6, 0, -2.78] }) };
  const ob = (x0, z0, x1, z1) => W.home.obst.push([HX + x0, HZ + z0, HX + x1, HZ + z1]);
  mesh(G.zbox(60, 0.1, 40, 1, 40), mat('#3a2a26', { rough: 1, rim: 0 }), { parent: H, p: [0, -0.1, 0], cast: false });
  mesh(G.zbox(8.2, 0.16, 6.2, 1, 12), mat('#ffffff', { map: T.wood, rough: 0.75 }), { parent: H, p: [0, 0.02, 0], cast: false });
  const wallT = canvasTex(512, 256, (g) => { g.fillStyle = '#f9e3d2'; g.fillRect(0, 0, 512, 256); g.fillStyle = 'rgba(226,102,79,.16)'; for (let i = 0; i < 16; i++) g.fillRect(i * 32 + 10, 0, 12, 256); g.fillStyle = '#c98a5a'; g.fillRect(0, 232, 512, 24); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, 232, 512, 5); });
  mesh(G.box(8.6, 3.5, 0.3, 0.08), mat('#ffffff', { map: wallT, rough: 0.95 }), { parent: H, p: [0, 1.75, -3.25] });
  for (const sx of [-1, 1]) { mesh(G.zbox(0.3, 3.5, 2.4, 1, 5), mat('#f9e3d2', { rough: 0.95 }), { parent: H, p: [sx * 4.2, 1.75, -2.05] }); mesh(G.zbox(0.3, 1.2, 3.9, 1, 8), mat('#f9e3d2', { rough: 0.95 }), { parent: H, p: [sx * 4.2, 0.6, 1.1] }); mesh(G.zbox(0.36, 0.1, 3.95, 1, 8), wood, { parent: H, p: [sx * 4.2, 1.22, 1.1] }); }
  // ventana con cortinas
  const wm = mat('#bfe3ff', { rough: 0.25, emissive: '#bfe3ff', ei: 0.35 });
  mesh(G.box(1.7, 1.3, 0.1, 0.05), wood, { parent: H, p: [-2.9, 2.2, -3.1] }); mesh(G.box(1.5, 1.1, 0.12, 0.03), wm, { parent: H, p: [-2.9, 2.2, -3.08] }); mesh(G.box(0.06, 1.1, 0.14, 0.01), wood, { parent: H, p: [-2.9, 2.2, -3.07] }); mesh(G.box(1.5, 0.06, 0.14, 0.01), wood, { parent: H, p: [-2.9, 2.2, -3.07] });
  for (const sx of [-1, 1]) mesh(blob((x, y, z, v) => v.set(x * 0.22 * (1 + Math.sin(y * 9) * 0.12), y * 0.75, z * 0.08), { ws: 12, hs: 12 }), mat('#e2664f', { rough: 1 }), { parent: H, p: [-2.9 + sx * 0.95, 2.15, -3.0] });
  mesh(G.cyl(0.025, 0.025, 2.3, 6), woodD, { parent: H, p: [-2.9, 2.92, -3.0], r: [0, 0, Math.PI / 2] });
  // cama
  const B = group({ parent: H, p: [2.75, 0.1, -1.75] }); const quilt = canvasTex(256, 256, (g) => { const c = ['#e2664f', '#f2b84b', '#6fbfae', '#fff6e2', '#8fa8ff', '#f6b8a6']; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = c[(i * 3 + j * 5) % 6]; g.fillRect(i * 64, j * 64, 64, 64); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.setLineDash([6, 5]); g.strokeRect(i * 64 + 5, j * 64 + 5, 54, 54); } });
  mesh(G.box(1.8, 0.4, 2.5, 0.08), woodD, { parent: B, p: [0, 0.2, 0] }); mesh(G.box(1.66, 0.3, 2.36, 0.12), cream, { parent: B, p: [0, 0.5, 0] }); mesh(G.box(1.72, 0.14, 1.6, 0.07), mat('#ffffff', { map: quilt, rough: 1 }), { parent: B, p: [0, 0.66, 0.4] });
  mesh(G.box(1.1, 0.2, 0.5, 0.1), mat('#fffdf5', { rough: 1 }), { parent: B, p: [0, 0.72, -0.85] }); mesh(G.box(1.9, 1.3, 0.14, 0.12), wood, { parent: B, p: [0, 0.65, -1.25] });
  ob(1.75, -3.1, 3.75, -0.4);
  // mesita con la lata de la abuela
  const D = group({ parent: H, p: [-3.2, 0.1, -2.45] }); mesh(G.box(1.2, 0.08, 0.8, 0.03), wood, { parent: D, p: [0, 0.8, 0] }); for (const [lx, lz] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) mesh(G.box(0.08, 0.8, 0.08, 0.02), woodD, { parent: D, p: [lx, 0.4, lz] });
  const tin = group({ parent: D, p: [0.1, 0.84, 0] }); mesh(G.cyl(0.26, 0.26, 0.34, 20), mat('#e2664f', { rough: 0.35, metal: 0.4 }), { parent: tin, p: [0, 0.17, 0] }); mesh(G.cyl(0.275, 0.275, 0.07, 20), mat('#f2b84b', { rough: 0.3, metal: 0.6 }), { parent: tin, p: [0, 0.36, 0] }); mesh(G.box(0.3, 0.16, 0.02, 0.01), cream, { parent: tin, p: [0, 0.17, 0.255] }); W.home.tin = tin;
  mesh(G.cyl(0.05, 0.07, 0.3, 8), mat('#9ad1c0'), { parent: D, p: [-0.4, 0.99, -0.1] }); mesh(G.sph(0.09, 8, 6), mat('#ff8fa3'), { parent: D, p: [-0.4, 1.2, -0.1] });
  ob(-3.9, -2.95, -2.5, -1.95);
  // vitrina de trofeos
  const V = group({ parent: H, p: [-0.6, 0.1, -2.82] }); mesh(G.box(2.3, 2.5, 0.1, 0.03), mat('#f7e3bd'), { parent: V, p: [0, 1.3, -0.16] }); for (let i = 0; i < 4; i++) mesh(G.box(2.4, 0.07, 0.5, 0.03), wood, { parent: V, p: [0, 0.3 + i * 0.72, 0] }); for (const sx of [-1, 1]) mesh(G.box(0.09, 2.6, 0.5, 0.03), woodD, { parent: V, p: [sx * 1.2, 1.3, 0] });
  ob(-1.9, -3.1, 0.7, -2.5);
  // mesa camilla con el catálogo
  const C = group({ parent: H, p: [3.2, 0.1, 1.5] }); mesh(G.cyl(0.55, 0.55, 0.06, 20), wood, { parent: C, p: [0, 0.7, 0] }); mesh(G.cyl(0.5, 0.62, 0.62, 20, true), mat('#6fbfae', { rough: 1, side: THREE.DoubleSide }), { parent: C, p: [0, 0.38, 0] });
  mesh(G.box(0.42, 0.03, 0.56, 0.01), mat('#f2b84b'), { parent: C, p: [0.05, 0.75, 0], r: [0, 0.3, 0] }); mesh(G.box(0.3, 0.012, 0.2, 0.005), cream, { parent: C, p: [0.05, 0.77, -0.08], r: [0, 0.3, 0] });
  mesh(G.lathe([[0.001, 0], [0.09, 0], [0.13, 0.1], [0.09, 0.2], [0.001, 0.22]], 12), mat('#e2664f', { rough: 0.4 }), { parent: C, p: [-0.25, 0.73, 0.2] });
  W.home.obst.push([HX + 2.65, HZ + 0.95, HX + 3.75, HZ + 2.05]);
  // armario con espejo
  const Ar = group({ parent: H, p: [-3.62, 0.1, -0.55] }); mesh(G.box(0.7, 2.3, 1.5, 0.06), woodD, { parent: Ar, p: [0, 1.15, 0] }); for (const sz of [-1, 1]) { mesh(G.box(0.05, 2.0, 0.66, 0.03), wood, { parent: Ar, p: [0.36, 1.18, sz * 0.36] }); mesh(G.sph(0.035, 8, 6), mat('#e9b949', { metal: 0.6, rough: 0.3 }), { parent: Ar, p: [0.4, 1.15, sz * 0.08] }); } mesh(G.box(0.02, 1.2, 0.42, 0.01), mat('#cfe8f5', { rough: 0.1, metal: 0.4 }), { parent: Ar, p: [0.39, 1.35, -0.36] }); mesh(G.box(0.76, 0.1, 1.56, 0.04), wood, { parent: Ar, p: [0, 2.32, 0] });
  ob(-4.0, -1.35, -3.2, 0.25);
  // felpudo de salida
  mesh(G.box(1.4, 0.04, 0.7, 0.02), mat('#e2664f', { rough: 1 }), { parent: H, p: [0, 0.12, 2.75], cast: false });
  // muebles que se compran
  const F = W.home.fur, f = (id, x, z, ry = 0) => (F[id] = group({ parent: H, p: [x, 0.1, z], r: [0, ry, 0] }));
  const rugT = canvasTex(256, 256, (g) => { const c = ['#e2664f', '#fff6e2', '#f2b84b', '#6fbfae', '#fff6e2', '#8fa8ff']; for (let i = 0; i < 6; i++) { g.fillStyle = c[i]; g.beginPath(); g.arc(128, 128, 128 - i * 21, 0, 7); g.fill(); } });
  mesh(G.cyl(1.5, 1.5, 0.03, 36), mat('#ffffff', { map: rugT, rough: 1 }), { parent: f('alfombra', 0, 0.4), p: [0, 0.015, 0], cast: false });
  const pl = f('planta', 3.55, -0.05); mesh(G.lathe([[0.001, 0], [0.24, 0], [0.33, 0.5], [0.36, 0.52], [0.001, 0.52]], 14, false), mat('#fff6e4', { rough: 0.7 }), { parent: pl }); for (let i = 0; i < 8; i++) { const a = i * 0.8, st = group({ parent: pl, p: [0, 0.5, 0], r: [0.5 + (i % 3) * 0.2, a, 0] }); mesh(G.cyl(0.015, 0.02, 0.9, 5), mat('#5aa85a'), { parent: st, p: [0, 0.45, 0] }); mesh(G.sph(1, 12, 8), mat(i % 2 ? '#4fa862' : '#69c274', { rough: 0.7 }), { parent: st, p: [0, 0.98, 0], s: [0.24, 0.3, 0.04] }); }
  const la = f('lampara', -3.55, 2.45); mesh(G.cyl(0.2, 0.24, 0.06, 14), woodD, { parent: la, p: [0, 0.03, 0] }); mesh(G.cyl(0.03, 0.03, 1.7, 8), woodD, { parent: la, p: [0, 0.88, 0] }); mesh(G.cyl(0.2, 0.36, 0.42, 16, true), mat('#f2b84b', { rough: 0.8, side: THREE.DoubleSide, emissive: '#ffb347', ei: 0.5 }), { parent: la, p: [0, 1.85, 0] }); const lb = mat('#fff3cf', { emissive: '#ffcc77', ei: 0.4, nocache: true }); W.lamps.push(lb); mesh(G.sph(0.1, 10, 8), lb, { parent: la, p: [0, 1.8, 0], cast: false });
  const cu = f('cuadro', 1.2, -3.07); cu.position.y = 0; const pt = canvasTex(256, 256, (g) => { g.fillStyle = '#bfe0c8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f4cfae'; g.beginPath(); g.arc(128, 120, 62, 0, 7); g.fill(); g.fillStyle = '#e9e4ea'; g.beginPath(); g.arc(128, 78, 56, Math.PI, 0); g.fill(); g.beginPath(); g.arc(128, 44, 26, 0, 7); g.fill(); g.fillStyle = '#2a1d1a'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(128 + sx * 24, 120, 7, 10, 0, 0, 7); g.fill(); } g.strokeStyle = '#a84a48'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(128, 138, 20, 0.3, Math.PI - 0.3); g.stroke(); g.fillStyle = '#fff6e4'; g.fillRect(40, 196, 176, 60); g.fillStyle = 'rgba(240,143,131,.5)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(128 + sx * 44, 140, 12, 8, 0, 0, 7); g.fill(); } });
  mesh(G.box(1.0, 1.15, 0.08, 0.03), mat('#e9b949', { rough: 0.35, metal: 0.5 }), { parent: cu, p: [0, 2.12, 0] }); mesh(G.plane(0.82, 0.97), basic('#ffffff', { map: pt }), { parent: cu, p: [0, 2.12, 0.045], cast: false });
  const si = f('sillon', -3.0, 1.2, Math.PI / 2), sm = mat('#8fa8ff', { rough: 1 }); mesh(G.box(1.1, 0.5, 1.0, 0.16), sm, { parent: si, p: [0, 0.3, 0] }); mesh(G.box(1.1, 1.0, 0.3, 0.14), sm, { parent: si, p: [0, 0.75, -0.42] }); for (const sx of [-1, 1]) { mesh(G.box(0.26, 0.5, 0.95, 0.12), sm, { parent: si, p: [sx * 0.55, 0.52, 0.02] }); mesh(G.box(0.2, 0.5, 0.22, 0.09), sm, { parent: si, p: [sx * 0.5, 1.12, -0.36] }); } mesh(G.box(0.7, 0.16, 0.6, 0.07), mat('#f2b84b', { rough: 1 }), { parent: si, p: [0, 0.6, 0.08] });
  const gr = f('gramola', 1.15, -2.72); mesh(G.box(0.7, 0.75, 0.55, 0.05), woodD, { parent: gr, p: [0, 0.38, 0] }); mesh(G.cyl(0.24, 0.24, 0.03, 20), mat('#2a1d1a', { rough: 0.3 }), { parent: gr, p: [0, 0.78, 0.02] }); mesh(G.cyl(0.07, 0.07, 0.035, 12), mat('#e2664f'), { parent: gr, p: [0, 0.785, 0.02] }); const horn = new THREE.ConeGeometry(0.34, 0.6, 16, 1, true); mesh(horn, mat('#e9b949', { rough: 0.3, metal: 0.7, side: THREE.DoubleSide }), { parent: gr, p: [0.25, 1.25, -0.1], r: [0.5, 0, -2.4] }); mesh(G.cyl(0.02, 0.02, 0.4, 6), mat('#e9b949', { metal: 0.7, rough: 0.3 }), { parent: gr, p: [0.26, 0.95, -0.2] });
  const ba = f('baul', 1.3, -0.2); mesh(G.box(1.1, 0.5, 0.6, 0.06), woodD, { parent: ba, p: [0, 0.25, 0] }); mesh(G.box(1.14, 0.2, 0.64, 0.1), wood, { parent: ba, p: [0, 0.56, 0] }); for (const sx of [-1, 1]) mesh(G.box(0.08, 0.72, 0.66, 0.02), mat('#e9b949', { metal: 0.6, rough: 0.3 }), { parent: ba, p: [sx * 0.36, 0.34, 0] }); mesh(G.box(0.12, 0.14, 0.04, 0.02), mat('#e9b949', { metal: 0.6, rough: 0.3 }), { parent: ba, p: [0, 0.42, 0.31] });
  const li = f('libros', -1.9, 2.45, 0); mesh(G.box(1.3, 1.7, 0.4, 0.04), woodD, { parent: li, p: [0, 0.85, 0] }); for (let r2 = 0; r2 < 3; r2++) { mesh(G.box(1.18, 0.05, 0.36, 0.01), wood, { parent: li, p: [0, 0.3 + r2 * 0.5, 0.03] }); for (let b2 = 0; b2 < 7; b2++) mesh(G.box(0.12, 0.3 + (b2 % 3) * 0.05, 0.24, 0.015), mat(['#e2664f', '#6fbfae', '#f2b84b', '#8fa8ff', '#fff6e4', '#c9556b', '#7fae6a'][(b2 + r2 * 2) % 7], { rough: 0.8 }), { parent: li, p: [-0.48 + b2 * 0.16, 0.5 + r2 * 0.5, 0.08], r: [0, 0, b2 === 5 ? 0.25 : 0] }); }
  const te = f('tetera', 1.2, 2.2); mesh(G.cyl(0.36, 0.36, 0.05, 16), wood, { parent: te, p: [0, 0.55, 0] }); mesh(G.cyl(0.05, 0.07, 0.55, 8), woodD, { parent: te, p: [0, 0.27, 0] }); mesh(G.cyl(0.2, 0.24, 0.04, 12), woodD, { parent: te, p: [0, 0.02, 0] }); mesh(G.sph(0.14, 12, 10), mat('#8fa8ff', { rough: 0.35 }), { parent: te, p: [-0.05, 0.7, 0], s: [1, 0.85, 1] }); mesh(G.tor(0.07, 0.018, 6, 12, Math.PI), mat('#8fa8ff', { rough: 0.35 }), { parent: te, p: [-0.2, 0.7, 0], r: [0, 0, Math.PI / 2] }); mesh(G.cone(0.03, 0.14, 6), mat('#8fa8ff', { rough: 0.35 }), { parent: te, p: [0.11, 0.73, 0], r: [0, 0, -1.1] }); mesh(G.cyl(0.06, 0.045, 0.07, 10), cream, { parent: te, p: [0.17, 0.615, 0.12] });
  for (const id in F) { F[id].visible = false; F[id].userData.home = [F[id].position.x, F[id].position.z, F[id].rotation.y]; }
  W.home.light = new THREE.PointLight(0xffe2bd, 0, 14, 1.2); W.home.light.position.set(HX, 2.6, HZ + 0.5); scene.add(W.home.light);
  W.zones.home = { b: [56.45, 63.55, -5.6, -0.15], obst: W.home.obst, cam: [58.6, 61.4, -4.2, -2.2], zoom: 0.62, enter: [60, -0.9, Math.PI], back: [12.2, -4.6, -1.2] };
  W.home.st = { cama: [HX + 1.35, HZ - 1.7, Math.PI / 2], lata: [HX - 3.1, HZ - 1.55, Math.PI], vitrina: [HX - 0.6, HZ - 2.1, Math.PI], catalogo: [HX + 2.35, HZ + 1.5, Math.PI / 2], armario: [HX - 2.75, HZ - 0.55, -Math.PI / 2], salir: [HX, HZ + 2.6, 0] };
}

// ---------- la fonda de Charca y el molino de Tejo (maquetas aparte) ----------
function places() {
  const wood = mat('#c98a5a', { rough: 0.8 }), woodD = mat('#a36b42', { rough: 0.85 }), cream = mat('#fff6e4', { rough: 0.9 }), iron = mat('#4a4654', { rough: 0.55 });
  // --- fonda ---
  { const HX = 92, HZ = -3, H = group({ parent: scene, p: [HX, 0, HZ] }), obst = [], ob = (x0, z0, x1, z1) => obst.push([HX + x0, HZ + z0, HX + x1, HZ + z1]);
    mesh(G.zbox(60, 0.1, 40, 1, 40), mat('#33302a', { rough: 1, rim: 0 }), { parent: H, p: [0, -0.1, 0], cast: false });
    mesh(G.zbox(9.2, 0.16, 6.6, 1, 12), mat('#ffffff', { map: T.tile, rough: 0.7 }), { parent: H, p: [0, 0.02, 0], cast: false });
    mesh(G.box(9.6, 3.6, 0.3, 0.08), mat('#dfeecb', { rough: 0.95 }), { parent: H, p: [0, 1.8, -3.45] }); mesh(G.box(9.6, 1.1, 0.34, 0.04), mat('#7fae6a', { rough: 0.8 }), { parent: H, p: [0, 0.6, -3.44] });
    for (const sx of [-1, 1]) { mesh(G.zbox(0.3, 3.6, 2.4, 1, 5), mat('#dfeecb', { rough: 0.95 }), { parent: H, p: [sx * 4.7, 1.8, -2.25] }); mesh(G.zbox(0.3, 1.2, 4.3, 1, 8), mat('#dfeecb', { rough: 0.95 }), { parent: H, p: [sx * 4.7, 0.6, 1.1] }); mesh(G.zbox(0.36, 0.1, 4.35, 1, 8), wood, { parent: H, p: [sx * 4.7, 1.22, 1.1] }); }
    // barra con cazuelas
    mesh(G.box(4.2, 1.0, 0.8, 0.06), woodD, { parent: H, p: [-2.1, 0.6, -1.7] }); mesh(G.box(4.4, 0.1, 0.96, 0.04), wood, { parent: H, p: [-2.1, 1.14, -1.7] }); ob(-4.4, -2.2, 0.1, -1.2);
    mesh(G.box(4.2, 0.08, 0.5, 0.03), wood, { parent: H, p: [-2.1, 2.3, -3.15] }); for (let i = 0; i < 6; i++) { mesh(G.lathe([[0.001, 0], [0.13, 0], [0.17, 0.2], [0.15, 0.22], [0.001, 0.22]], 12, false), mat(['#e2664f', '#f2b84b', '#6fbfae', '#8fa8ff', '#fff6e4', '#c98a5a'][i], { rough: 0.5 }), { parent: H, p: [-3.8 + i * 0.68, 2.34, -3.15] }); }
    const pot = group({ parent: H, p: [-3.3, 1.19, -1.7] }); mesh(G.cyl(0.3, 0.26, 0.34, 16), mat('#4a4654', { rough: 0.5, metal: 0.4 }), { parent: pot, p: [0, 0.17, 0] }); mesh(G.cyl(0.27, 0.27, 0.02, 16), mat('#d98a3a', { rough: 0.6 }), { parent: pot, p: [0, 0.32, 0] }); W.fondaPot = [HX - 3.3, 1.7, HZ - 1.7];
    for (let i = 0; i < 3; i++) mesh(G.cyl(0.14, 0.1, 0.02, 14), cream, { parent: H, p: [-1.6 + i * 0.5, 1.2, -1.6] });
    const mt = canvasTex(256, 192, (g) => { g.fillStyle = '#3d5a4c'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#fff6da'; g.font = '800 34px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.fillText('Menú del día', 128, 46); g.font = '700 24px "Baloo 2", sans-serif'; g.fillStyle = '#ffd98a'; g.fillText('Potaje · pan · flan', 128, 96); g.fillStyle = '#c9f0d0'; g.fillText('8 monedas', 128, 146); });
    mesh(G.box(1.5, 1.15, 0.06, 0.03), woodD, { parent: H, p: [1.7, 2.2, -3.26] }); mesh(G.plane(1.36, 1.0), basic('#ffffff', { map: mt }), { parent: H, p: [1.7, 2.2, -3.22], cast: false });
    // mesas
    W.fondaSeats = [];
    for (const [x, z, c] of [[1.9, -0.9, '#e2664f'], [2.9, 1.4, '#f2b84b'], [-2.4, 1.5, '#6fbfae']]) { const t = group({ parent: H, p: [x, 0.1, z] }); mesh(G.cyl(0.62, 0.62, 0.07, 22), wood, { parent: t, p: [0, 0.72, 0] }); mesh(G.cyl(0.66, 0.8, 0.5, 22, true), mat(c, { rough: 1, side: THREE.DoubleSide }), { parent: t, p: [0, 0.5, 0] }); mesh(G.cyl(0.07, 0.1, 0.72, 8), woodD, { parent: t, p: [0, 0.36, 0] }); mesh(G.cyl(0.16, 0.12, 0.03, 12), cream, { parent: t, p: [0.2, 0.775, 0.1] }); const b = makeBread('hogaza'); b.scale.setScalar(0.42); b.position.set(-0.18, 0.76, -0.05); t.add(b);
      for (const sd of [-1, 1]) { const ch = group({ parent: t, p: [sd * 1.0, 0, 0] }); mesh(G.cyl(0.26, 0.26, 0.06, 14), woodD, { parent: ch, p: [0, 0.4, 0] }); for (let i = 0; i < 4; i++) mesh(G.cyl(0.03, 0.03, 0.4, 5), woodD, { parent: ch, p: [Math.cos(i * 1.57 + 0.78) * 0.18, 0.2, Math.sin(i * 1.57 + 0.78) * 0.18] }); mesh(G.box(0.06, 0.5, 0.46, 0.03), woodD, { parent: ch, p: [sd * 0.24, 0.66, 0] }); W.fondaSeats.push([HX + x + sd * 1.0, HZ + z, -sd * Math.PI / 2]); } obst.push([HX + x - 0.75, HZ + z - 0.7, HX + x + 0.75, HZ + z + 0.7]); }
    mesh(G.box(1.5, 0.04, 0.7, 0.02), mat('#7fae6a', { rough: 1 }), { parent: H, p: [0, 0.12, 2.95], cast: false });
    W.fondaLight = new THREE.PointLight(0xffe2bd, 0, 14, 1.2); W.fondaLight.position.set(HX, 2.7, HZ + 0.5); scene.add(W.fondaLight);
    W.zones.fonda = { b: [HX - 4.4, HX + 4.4, HZ - 0.95, HZ + 2.95], obst, cam: [HX - 1.6, HX + 1.6, HZ - 1.4, HZ + 0.6], zoom: 0.66, enter: [HX, HZ + 2.3, Math.PI], back: [22.0, 4.3, -Math.PI / 2], st: { charca: [HX - 2.1, HZ - 0.85], salir: [HX, HZ + 2.75] }, npc: [HX - 2.1, HZ - 2.5, 0] }; }
  // --- molino ---
  { const HX = -92, HZ = -3, H = group({ parent: scene, p: [HX, 0, HZ] }), obst = [];
    mesh(G.zbox(90, 0.1, 60, 1, 60), mat('#93d46c', { rough: 1, rim: 0 }), { parent: H, p: [0, -0.05, -6], cast: false });
    const pth = new THREE.CircleGeometry(1, 36); pth.rotateX(-Math.PI / 2); mesh(pth, mat('#ecdcb6', { rough: 1 }), { parent: H, p: [0, 0.012, -0.2], s: [5.6, 1, 3.4], cast: false }); mesh(G.zbox(2.6, 0.02, 5, 1, 8), mat('#ecdcb6', { rough: 1 }), { parent: H, p: [0, 0.006, 4.4], cast: false });
    mesh(G.lathe([[2.5, 0], [2.3, 0.7], [1.75, 5.6], [1.7, 6.3], [0.001, 6.3]], 22, false), mat('#fff6ea', { rough: 0.95 }), { parent: H, p: [0, 0, -4.2] }); mesh(G.cone(2.05, 1.9, 22), mat('#d9714e', { rough: 0.9 }), { parent: H, p: [0, 7.2, -4.2] });
    mesh(G.box(1.0, 1.7, 0.16, 0.4), mat('#8f6a4a'), { parent: H, p: [0, 0.85, -1.78] }); for (const [wx, wy] of [[-1.1, 2.6], [1.0, 3.9]]) mesh(G.cyl(0.3, 0.3, 0.1, 14), mat('#bfe3ff', { rough: 0.3 }), { parent: H, p: [wx, wy, -2.3 - wy * 0.11 + 0.4], r: [Math.PI / 2, 0, 0] });
    W.sails2 = group({ parent: H, p: [0, 5.8, -2.2] }); mesh(G.cyl(0.18, 0.18, 0.6, 10), mat('#8f6a4a'), { parent: W.sails2, r: [Math.PI / 2, 0, 0] }); for (let i = 0; i < 4; i++) { const sg = group({ parent: W.sails2, r: [0, 0, i * Math.PI / 2] }); mesh(G.box(0.13, 4.4, 0.1, 0.04), mat('#8f6a4a'), { parent: sg, p: [0, 2.2, 0] }); mesh(G.box(1.05, 3.2, 0.05, 0.02), mat('#fff3d8', { rough: 1 }), { parent: sg, p: [0.56, 2.65, 0.03] }); }
    obst.push([HX - 2.6, HZ - 7, HX + 2.6, HZ - 1.5]);
    for (const [x, z, s2, c] of [[2.6, -1.0, 1, '#fbf3e2'], [3.3, -1.3, 0.9, '#e2c79c'], [2.95, -0.4, 0.8, '#bfa68a'], [-3.0, -1.2, 1, '#fbf3e2']]) sack(H, x, 0, z, s2, c);
    const tb = group({ parent: H, p: [3.4, 0, 0.9] }); mesh(G.box(1.5, 0.08, 0.8, 0.03), wood, { parent: tb, p: [0, 0.78, 0] }); for (const [lx, lz] of [[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]]) mesh(G.box(0.08, 0.78, 0.08, 0.02), woodD, { parent: tb, p: [lx, 0.39, lz] }); mesh(G.box(0.34, 0.1, 0.26, 0.03), mat('#e2664f'), { parent: tb, p: [0.3, 0.87, 0] }); mesh(G.cone(0.16, 0.14, 12), cream, { parent: tb, p: [-0.3, 0.89, 0] });
    obst.push([HX + 2.3, HZ - 1.7, HX + 4.3, HZ + 1.4], [HX - 3.5, HZ - 1.7, HX - 2.5, HZ - 0.7]);
    for (let k = 0; k < 2; k++) { const fx = k ? 5.6 : -5.6; for (let i = 0; i < 8; i++) { mesh(G.box(0.12, 0.8, 0.12, 0.04), cream, { parent: H, p: [fx, 0.4, -3 + i * 0.9] }); } mesh(G.zbox(0.05, 0.08, 6.4, 1, 8), cream, { parent: H, p: [fx, 0.5, 0.1] }); }
    const NW = 900, wh = new THREE.InstancedMesh(G.cone(0.05, 0.9, 5), mat('#f3cf63', { sway: 0.16, rough: 0.9 }), NW), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), rr = rnd(5);
    for (let i = 0; i < NW; i++) { const sd = i % 2 ? 1 : -1; e.set(0, rr() * 6, (rr() - 0.5) * 0.2); q.setFromEuler(e); m4.compose(new THREE.Vector3(HX + sd * (6.4 + rr() * 6), 0.42, HZ - 4 + rr() * 8), q, new THREE.Vector3(1.3, 0.8 + rr() * 0.5, 1.3)); wh.setMatrixAt(i, m4); } wh.frustumCulled = false; scene.add(wh);
    W.zones.molino = { b: [HX - 5.2, HX + 5.2, HZ - 1.3, HZ + 5.6], obst, cam: [HX - 2.2, HX + 2.2, HZ - 0.4, HZ + 3], zoom: 0.8, enter: [HX, HZ + 4.8, Math.PI], back: [-22.0, 4.3, Math.PI / 2], st: { tejo: [HX + 2.0, HZ + 1.1], salir: [HX, HZ + 5.3] }, npc: [HX + 1.6, HZ + 0.1, 0.4] }; }
  // --- río ---
  { const HX = 0, HZ = 92, H = group({ parent: scene, p: [HX, 0, HZ] }), obst = [];
    mesh(G.zbox(90, 0.1, 60, 1, 60), mat('#93d46c', { rough: 1, rim: 0 }), { parent: H, p: [0, -0.05, 4], cast: false });
    mesh(G.zbox(90, 0.06, 1.6, 1, 3), mat('#e3d2a4', { rough: 1 }), { parent: H, p: [0, 0.03, -0.8], cast: false });
    W.river = waterMat('#6cc7ea'); W.river.map.repeat.set(14, 2); mesh(G.zbox(90, 0.04, 9, 1, 10), W.river, { parent: H, p: [0, 0.035, -5.9], cast: false });
    mesh(G.zbox(90, 0.1, 30, 1, 30), mat('#8ccf68', { rough: 1, rim: 0 }), { parent: H, p: [0, 0.03, -25.4], cast: false });
    for (let i = 0; i < 6; i++) { mesh(G.box(1.5, 0.08, 0.46, 0.03), wood, { parent: H, p: [0, 0.26, -0.5 - i * 0.5], r: [0, (i % 2 ? 0.03 : -0.03), 0] }); } for (const sx of [-1, 1]) for (const z of [-0.6, -1.9, -3.1]) mesh(G.cyl(0.07, 0.07, 0.9, 7), woodD, { parent: H, p: [sx * 0.72, 0.1, z] });
    for (let i = 0; i < 14; i++) { const x = -9 + i * 1.4 + (i % 3) * 0.3; if (Math.abs(x) < 1.4) continue; mesh(G.cyl(0.02, 0.03, 1 + (i % 3) * 0.3, 5), mat('#6aa84f', { sway: 0.06 }), { parent: H, p: [x, 0.5, -1.3 - (i % 2) * 0.3] }); if (i % 2) mesh(G.cap(0.05, 0.2, 6), mat('#8a5a34', { sway: 0.06 }), { parent: H, p: [x, 1.05 + (i % 3) * 0.14, -1.3 - (i % 2) * 0.3] }); }
    for (const [x, z, sc] of [[-3.2, -3.6, 0.5], [3.8, -5.4, 0.7], [-5.5, -6.6, 0.45], [5.6, -2.9, 0.4]]) mesh(blob((bx, by, bz) => 1 + smoothNoise(bx * 2, by * 2, bz * 2) * 0.18, { ws: 12, hs: 8 }), mat('#b9b3a6', { rough: 1 }), { parent: H, p: [x, 0.05, z], s: [sc, sc * 0.6, sc * 0.8] });
    for (const [x, z, sc] of [[-2.2, -4.8, 0.45], [2.4, -3.4, 0.38], [1.2, -7.2, 0.5]]) { mesh(G.cyl(sc, sc, 0.02, 14), mat('#5cb85c'), { parent: H, p: [x, 0.02, z], cast: false }); mesh(G.sph(0.08, 8, 6), mat('#ffb3c9'), { parent: H, p: [x + 0.1, 0.07, z], s: [1, 0.7, 1] }); }
    W.fishSh = []; for (let i = 0; i < 4; i++) W.fishSh.push({ m: mesh(G.sph(1, 8, 6), mat('#2f6f8f', { transparent: true, opacity: 0.45, rough: 1 }), { parent: H, p: [0, 0.005, -5], s: [0.3, 0.01, 0.1], cast: false }), a: i * 1.7, r: 1.5 + i * 0.9, z: -4 - i * 0.9 });
    W.bobber = group({ parent: H, p: [1.3, 0.1, -4.4] }); mesh(G.sph(0.09, 10, 8), mat('#e2664f', { rough: 0.4 }), { parent: W.bobber }); mesh(G.sph(0.091, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#fff6e4', { rough: 0.4 }), { parent: W.bobber }); W.bobber.visible = false;
    const bn = group({ parent: H, p: [3.6, 0, 1.4] }); for (let i = 0; i < 3; i++) mesh(G.box(1.5, 0.06, 0.15, 0.025), wood, { parent: bn, p: [0, 0.46, -0.16 + i * 0.17] }); for (const sx of [-1, 1]) mesh(G.box(0.06, 0.46, 0.45, 0.02), iron, { parent: bn, p: [sx * 0.62, 0.23, -0.02] });
    mesh(G.box(0.5, 0.36, 0.36, 0.05), mat('#9ad1c0', { rough: 0.6 }), { parent: H, p: [1.3, 0.18, 0.5] }); mesh(G.tor(0.16, 0.02, 6, 14, Math.PI), mat('#4a4654'), { parent: H, p: [1.3, 0.36, 0.5] });
    obst.push([HX - 30, HZ - 4, HX - 0.75, HZ - 0.35], [HX + 0.75, HZ - 4, HX + 30, HZ - 0.35], [HX + 2.8, HZ + 1.0, HX + 4.4, HZ + 1.75]);
    tree(HX - 4.6, HZ + 1.8, 1.45, 'alamo', 61); tree(HX + 6.4, HZ + 3.4, 1.2, 'alamo', 62); tree(HX - 7.5, HZ + 4.6, 1.1, 'naranjo', 63);
    W.zones.rio = { b: [HX - 8, HX + 8, HZ - 3.25, HZ + 5.6], obst, cam: [HX - 3, HX + 3, HZ - 2.2, HZ + 2.4], zoom: 0.78, enter: [HX, HZ + 4.8, Math.PI], back: [2.0, 12.3, Math.PI], st: { muelle: [HX, HZ - 2.9], salir: [HX, HZ + 5.3] }, bob: [HX + 1.3, HZ - 4.4] }; }
  // --- la huerta de la abuela, por dentro ---
  { const HX = -92, HZ = 60, H = group({ parent: scene, p: [HX, 0, HZ] }), obst = [], soil = mat('#b98a5f', { rough: 1, rim: 0 });
    mesh(G.zbox(80, 0.1, 56, 1, 56), mat('#93d46c', { rough: 1, rim: 0 }), { parent: H, p: [0, -0.05, -2], cast: false });
    mesh(G.zbox(9.6, 0.03, 7.4, 1, 10), soil, { parent: H, p: [0, 0.012, -1.0], cast: false }); mesh(G.zbox(1.6, 0.03, 3.6, 1, 6), mat('#e3d2a4', { rough: 1 }), { parent: H, p: [0, 0.014, 4.3], cast: false });
    W.plots = []; W.plotRow3 = group({ parent: H }); W.plotLock = group({ parent: H });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = -3 + c * 2, z = -3 + r * 2, g = group({ parent: r === 2 ? W.plotRow3 : H, p: [x, 0, z] }), bed = mat('#9a6f4a', { rough: 1, rim: 0, nocache: true });
      mesh(G.box(1.2, 0.2, 1.1, 0.09), bed, { parent: g, p: [0, 0.1, 0] });
      for (const sz of [-1, 1]) mesh(G.box(1.34, 0.16, 0.07, 0.02), wood, { parent: g, p: [0, 0.08, sz * 0.58] }); for (const sx of [-1, 1]) mesh(G.box(0.07, 0.16, 1.1, 0.02), wood, { parent: g, p: [sx * 0.64, 0.08, 0] });
      const drops = group({ parent: g, p: [0, 0.21, 0] }); for (let i = 0; i < 5; i++) mesh(G.sph(0.035, 6, 5), mat('#8fd3f2', { rough: 0.1, emissive: '#8fd3f2', ei: 0.3 }), { parent: drops, p: [Math.cos(i * 1.26) * 0.36, 0, Math.sin(i * 1.26) * 0.3], s: [1, 0.5, 1], cast: false }); drops.visible = false;
      const star = mesh(G.ico(0.07, 0), mat('#fff3a8', { emissive: '#ffd866', ei: 1.2, rough: 0.3 }), { parent: g, p: [0, 1.25, 0], cast: false }); star.visible = false;
      const fert = mesh(G.box(1.0, 0.03, 0.9, 0.01), mat('#5a3a26', { rough: 1 }), { parent: g, p: [0, 0.2, 0], cast: false }); fert.visible = false;
      W.plots.push({ x: HX + x, z: HZ + z, row: r, col: c, g, bed, drops, star, fert, holder: group({ parent: g, p: [0, 0.19, 0] }) }); obst.push([HX + x - 0.62, HZ + z - 0.57, HX + x + 0.62, HZ + z + 0.57]);
    }
    for (let i = 0; i < 16; i++) { const rr = rnd(i + 3), x = -3.8 + rr() * 7.6, z = 0.5 + rr() * 1.1; mesh(G.cone(0.05, 0.3 + rr() * 0.3, 4), mat(i % 2 ? '#7a9a4a' : '#8aa85a', { sway: 0.1 }), { parent: W.plotLock, p: [x, 0.15, z], cast: false }); if (i % 4 === 0) mesh(blob((bx, by, bz) => 1 + smoothNoise(bx * 2, by * 2 + i, bz * 2) * 0.2, { ws: 10, hs: 7 }), mat('#b9b3a6', { rough: 1 }), { parent: W.plotLock, p: [x, 0.05, z + 0.3], s: [0.22, 0.14, 0.18] }); }
    { const g = group({ parent: W.plotLock, p: [0, 0, 1.9], r: [0, 0, 0] }); mesh(G.cyl(0.05, 0.06, 1.0, 6), woodD, { parent: g, p: [0, 0.5, 0] }); const tx = canvasTex(320, 110, (c) => { c.fillStyle = '#fff3d8'; c.beginPath(); c.roundRect(4, 4, 312, 102, 18); c.fill(); c.strokeStyle = '#c98a5a'; c.lineWidth = 8; c.stroke(); c.fillStyle = '#7a4a2a'; c.font = '800 30px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillText('Tercera fila:', 160, 44); c.fillText('página de Primavera', 160, 82); }); mesh(G.box(1.5, 0.52, 0.06, 0.02), wood, { parent: g, p: [0, 1.0, 0] }); mesh(G.plane(1.44, 0.48), basic('#ffffff', { map: tx }), { parent: g, p: [0, 1.0, 0.035], cast: false }); }
    // invernadero sobre la primera fila
    W.greenhouse = group({ parent: H, p: [0, 0.05, -3] }); for (let i = 0; i < 5; i++) mesh(G.tor(1.0, 0.035, 6, 18, Math.PI), cream, { parent: W.greenhouse, p: [-4 + i * 2, 0, 0], r: [0, Math.PI / 2, 0] });
    { const cg = new THREE.CylinderGeometry(1.0, 1.0, 8, 18, 4, true, 0, Math.PI); cg.rotateZ(Math.PI / 2); cg.rotateX(-Math.PI / 2); mesh(cg, mat('#dff6ff', { transparent: true, opacity: 0.2, rough: 0.05, side: THREE.DoubleSide }), { parent: W.greenhouse, cast: false }); for (const z of [-1, 1]) mesh(G.box(8, 0.06, 0.06, 0.02), cream, { parent: W.greenhouse, p: [0, 0.02, z] }); mesh(G.box(8, 0.05, 0.05, 0.02), cream, { parent: W.greenhouse, p: [0, 1.0, 0] }); }
    // aspersor
    W.sprinkler = group({ parent: H, p: [0, 0, -1] }); mesh(G.cyl(0.03, 0.04, 0.6, 6), iron, { parent: W.sprinkler, p: [0, 0.3, 0] }); W.sprHead = group({ parent: W.sprinkler, p: [0, 0.62, 0] }); mesh(G.box(0.5, 0.05, 0.05, 0.02), mat('#e2664f'), { parent: W.sprHead }); for (const sx of [-1, 1]) mesh(G.sph(0.04, 6, 5), mat('#e9b949', { metal: 0.5, rough: 0.3 }), { parent: W.sprHead, p: [sx * 0.25, 0, 0] });
    // colmena
    W.hive = group({ parent: H, p: [5.3, 0, -3.3] }); for (const [lx, lz] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) mesh(G.box(0.07, 0.4, 0.07, 0.02), woodD, { parent: W.hive, p: [lx, 0.2, lz] });
    for (let i = 0; i < 3; i++) mesh(G.box(0.8 - i * 0.02, 0.3, 0.66, 0.04), mat(['#ffe9a8', '#fff3d8', '#bfe6d8'][i], { rough: 0.9 }), { parent: W.hive, p: [0, 0.55 + i * 0.31, 0] }); mesh(G.box(0.96, 0.08, 0.8, 0.03), mat('#d9714e', { rough: 0.9 }), { parent: W.hive, p: [0, 1.36, 0], r: [0.06, 0, 0] }); mesh(G.box(0.3, 0.05, 0.03, 0.01), mat('#5a3a26'), { parent: W.hive, p: [0, 0.46, 0.335] });
    W.hiveJars = []; for (let i = 0; i < 6; i++) { const j = makeItem('miel'); j.scale.setScalar(0.6); j.position.set(-0.75 + (i % 3) * 0.26, 0, 0.7 + Math.floor(i / 3) * 0.26); j.visible = false; W.hive.add(j); W.hiveJars.push(j); }
    W.bees = []; for (let i = 0; i < 5; i++) W.bees.push(mesh(G.sph(0.03, 6, 5), mat('#f2c14e', { emissive: '#f2c14e', ei: 0.4 }), { parent: W.hive, p: [0, 1, 0], s: [1.4, 1, 1], cast: false }));
    obst.push([HX + 4.8, HZ - 3.75, HX + 5.8, HZ - 2.85]);
    // espantapájaros con la bufanda de la abuela
    { const sc = group({ parent: H, p: [5.3, 0, 1.2], r: [0, -0.5, 0] }); mesh(G.cyl(0.05, 0.06, 2.0, 6), woodD, { parent: sc, p: [0, 1.0, 0] }); mesh(G.cyl(0.04, 0.04, 1.5, 6), woodD, { parent: sc, p: [0, 1.45, 0], r: [0, 0, Math.PI / 2] });
      mesh(G.box(0.62, 0.7, 0.3, 0.1), mat('#5873b8', { rough: 1 }), { parent: sc, p: [0, 1.25, 0] }); for (const sx of [-1, 1]) { mesh(G.cyl(0.11, 0.09, 0.6, 8), mat('#5873b8', { rough: 1 }), { parent: sc, p: [sx * 0.52, 1.45, 0], r: [0, 0, Math.PI / 2] }); for (let i = 0; i < 4; i++) mesh(G.cone(0.02, 0.2, 4), mat('#f3cf63'), { parent: sc, p: [sx * (0.86 + (i % 2) * 0.03), 1.42 + i * 0.03, (i - 1.5) * 0.03], r: [0, 0, -sx * 1.4] }); }
      mesh(G.sph(0.26, 14, 10), mat('#f0dcb4', { rough: 1 }), { parent: sc, p: [0, 1.86, 0] }); for (const sx of [-1, 1]) mesh(G.sph(0.035, 6, 5), mat('#33211c'), { parent: sc, p: [sx * 0.09, 1.9, 0.235] }); mesh(G.tor(0.07, 0.012, 5, 10, Math.PI), mat('#33211c'), { parent: sc, p: [0, 1.82, 0.24], r: [0, 0, Math.PI] });
      mesh(G.cyl(0.42, 0.44, 0.04, 16), mat('#e9c46a', { rough: 1 }), { parent: sc, p: [0, 2.06, 0], r: [0.1, 0, 0.08] }); mesh(G.cone(0.24, 0.3, 14), mat('#e9c46a', { rough: 1 }), { parent: sc, p: [0, 2.22, 0], r: [0.1, 0, 0.08] });
      W.scarfMat = mat('#e2664f', { rough: 1, nocache: true }); mesh(G.tor(0.2, 0.07, 8, 16), W.scarfMat, { parent: sc, p: [0, 1.63, 0], r: [Math.PI / 2, 0, 0] }); mesh(G.box(0.14, 0.5, 0.05, 0.02), W.scarfMat, { parent: sc, p: [0.14, 1.36, 0.17], r: [0, 0, -0.15] });
      obst.push([HX + 5.0, HZ + 0.9, HX + 5.6, HZ + 1.5]); }
    // pozo y caseta de aperos
    { const w = group({ parent: H, p: [-5.4, 0, 1.3] }); mesh(G.cyl(0.6, 0.66, 0.7, 16), mat('#d9d2c4', { map: T.stone, rough: 1 }), { parent: w, p: [0, 0.35, 0] }); mesh(G.cyl(0.48, 0.48, 0.04, 16), waterMat('#6cc7ea'), { parent: w, p: [0, 0.6, 0], cast: false }); for (const sx of [-1, 1]) mesh(G.box(0.09, 1.5, 0.09, 0.02), woodD, { parent: w, p: [sx * 0.56, 1.1, 0] }); mesh(G.cyl(0.05, 0.05, 1.2, 8), woodD, { parent: w, p: [0, 1.6, 0], r: [0, 0, Math.PI / 2] }); const rf = new THREE.CylinderGeometry(0.02, 0.75, 0.5, 4); rf.rotateY(Math.PI / 4); mesh(rf, mat('#d9714e', { rough: 0.9 }), { parent: w, p: [0, 2.05, 0], s: [1.15, 1, 0.8] }); mesh(G.cyl(0.13, 0.11, 0.2, 10), wood, { parent: w, p: [0, 1.2, 0] }); mesh(G.cyl(0.008, 0.008, 0.4, 4), mat('#e2c79c'), { parent: w, p: [0, 1.42, 0] }); obst.push([HX - 6.0, HZ + 0.7, HX - 4.8, HZ + 1.9]); }
    { const s2 = group({ parent: H, p: [-5.3, 0, -3.5] }); mesh(G.box(1.7, 1.7, 1.3, 0.08), mat('#c9a06a', { map: T.wood, rough: 0.9 }), { parent: s2, p: [0, 0.85, 0] }); const rf = new THREE.CylinderGeometry(0.02, 1.4, 0.8, 4); rf.rotateY(Math.PI / 4); mesh(rf, mat('#d9714e', { map: T.roof, rough: 0.9 }), { parent: s2, p: [0, 2.1, 0], s: [1, 1, 0.8] }); mesh(G.box(0.6, 1.1, 0.06, 0.04), woodD, { parent: s2, p: [-0.3, 0.6, 0.66] });
      for (let i = 0; i < 4; i++) mesh(G.box(0.2, 0.26, 0.03, 0.01), mat(['#e2664f', '#f2b84b', '#7cc47a', '#8fc3ea'][i]), { parent: s2, p: [0.25 + (i % 2) * 0.26, 1.2 - Math.floor(i / 2) * 0.32, 0.67] }); const can = group({ parent: s2, p: [1.15, 0, 0.6], r: [0, -0.6, 0] }); mesh(G.cyl(0.17, 0.15, 0.3, 12), mat('#8fc3ea', { rough: 0.4, metal: 0.3 }), { parent: can, p: [0, 0.15, 0] }); mesh(G.cyl(0.025, 0.035, 0.34, 6), mat('#8fc3ea', { rough: 0.4, metal: 0.3 }), { parent: can, p: [0.24, 0.24, 0], r: [0, 0, -0.9] }); mesh(G.tor(0.11, 0.015, 5, 12, Math.PI), mat('#6fa3ca'), { parent: can, p: [-0.14, 0.22, 0], r: [0, 0, Math.PI / 2] }); obst.push([HX - 6.3, HZ - 4.3, HX - 4.3, HZ - 2.7]); }
    // valla, cancela y árboles
    for (let i = 0; i < 15; i++) { const x = -7 + i; for (const z of [-4.9, 6.0]) { if (z > 0 && Math.abs(x) < 1.2) continue; mesh(G.box(0.12, 0.8, 0.12, 0.04), cream, { parent: H, p: [x, 0.4, z] }); } } for (const z of [-4.9]) mesh(G.box(14, 0.08, 0.05, 0.02), cream, { parent: H, p: [0, 0.52, z] }); for (const sx of [-1, 1]) mesh(G.box(5.9, 0.08, 0.05, 0.02), cream, { parent: H, p: [sx * 4.1, 0.52, 6.0] });
    for (const sx of [-1, 1]) { for (let i = 0; i < 11; i++) mesh(G.box(0.12, 0.8, 0.12, 0.04), cream, { parent: H, p: [sx * 7, 0.4, -4.9 + i * 1.09] }); mesh(G.zbox(0.05, 0.08, 10.9, 1, 10), cream, { parent: H, p: [sx * 7, 0.52, 0.55] }); }
    tree(HX - 9.2, HZ - 2.5, 1.3, 'naranjo', 71); tree(HX + 9.4, HZ + 1.5, 1.25, 'alamo', 72); tree(HX - 9, HZ + 4.6, 1.1, 'alamo', 73); tree(HX + 8.8, HZ - 6.4, 1.3, 'cipres', 74); tree(HX - 3.5, HZ - 7.2, 1.2, 'alamo', 75); tree(HX + 2.8, HZ - 7.6, 1.35, 'naranjo', 76);
    for (let i = 0; i < 40; i++) { const rr = rnd(i * 13 + 5), a = rr() * 6.28, d = 8 + rr() * 9; mesh(G.sph(0.09, 6, 5), mat(['#ff7b8a', '#ffd166', '#ff9ac1', '#ffffff', '#b9a8e8'][i % 5]), { parent: H, p: [Math.cos(a) * d, 0.12, Math.sin(a) * d * 0.7 - 1], s: [1, 0.5, 1], cast: false }); }
    W.zones.huerta = { b: [HX - 6.5, HX + 6.5, HZ - 4.4, HZ + 5.5], obst, cam: [HX - 3.2, HX + 3.2, HZ - 2.8, HZ + 2.4], zoom: 0.84, enter: [HX, HZ + 4.6, Math.PI], back: [-15, 3.2, 0], st: { salir: [HX, HZ + 5.2], colmena: [HX + 5.3, HZ - 2.4], caseta: [HX - 4.9, HZ - 2.2] } }; W.travel.huerta = [-15, 2.9];
  }
  // --- sitios donde brotan cosas del monte ---
  W.forageSpots = { pueblo: [[-18.6, 9.6], [17.6, 10.4], [-20.4, 1.4], [19.6, 0.9], [12.6, 11.9], [-6.2, 12.2], [7.4, 12.4], [-13.4, 11.8], [-21, 6.6], [20.8, 7.4]], rio: [[-5.5, 92.7], [5.3, 92.4], [-6.6, 95.2], [6.9, 93.7], [-2.7, 94.9], [3.3, 96.3], [-7.2, 93.6]], molino: [[-96.3, -1.5], [-95.6, 0.9], [-87.6, 0.5], [-93.8, 1.7], [-88.1, 2.0], [-96.6, -3.3], [-89.9, 1.9]] };
  // --- la manta del buhonero y la mesa de la feria (mismo rincón de la plaza, días distintos) ---
  { const EX = 1.0, EZ = 9.9; W.evSpot = [EX, EZ];
    const Tr = W.up.trasto = group({ parent: scene, p: [EX, 0, EZ] }); mesh(G.box(2.6, 0.03, 1.5, 0.01), mat('#7b5ea7', { rough: 1 }), { parent: Tr, p: [0, 0.03, 0], cast: false }); for (let i = 0; i < 6; i++) mesh(G.box(0.34, 0.032, 1.5, 0.01), mat('#f2c14e', { rough: 1 }), { parent: Tr, p: [-1.05 + i * 0.42, 0.032, 0], s: [0.3, 1, 1], cast: false });
    for (const [x, z, s2, ry] of [[-0.95, -0.3, 0.5, 0.2], [0.85, -0.35, 0.44, -0.3]]) { const cr = group({ parent: Tr, p: [x, 0, z], r: [0, ry, 0] }); mesh(G.box(s2 * 1.3, s2, s2, 0.03), wood, { parent: cr, p: [0, s2 / 2 + 0.03, 0] }); for (const k of [-1, 1]) mesh(G.box(s2 * 1.34, 0.05, 0.04, 0.01), woodD, { parent: cr, p: [0, s2 / 2 + 0.03 + k * s2 * 0.3, s2 / 2] }); }
    ['calabaza', 'uva', 'fresa', 'seta', 'miel', 'tomate'].forEach((id, i) => { const it = makeItem(id); it.scale.setScalar(0.8); it.position.set(-0.9 + (i % 3) * 0.75 + (i > 2 ? 0.2 : 0), i < 2 ? (i ? 0.47 : 0.53) : 0.05, i < 2 ? -0.32 : 0.3 + (i % 2) * 0.12); if (i === 1) it.position.x = 0.85; it.rotation.y = i * 1.1; Tr.add(it); });
    mesh(G.cyl(0.03, 0.03, 2.3, 6), woodD, { parent: Tr, p: [-1.4, 1.15, -0.6] }); const par = new THREE.ConeGeometry(1.25, 0.5, 10, 1, true); for (let i = 0; i < 1; i++) mesh(par, mat('#f2c14e', { rough: 1, side: THREE.DoubleSide }), { parent: Tr, p: [-1.4, 2.3, -0.6], r: [0.1, 0, 0.12] }); mesh(G.sph(0.06, 8, 6), mat('#7b5ea7'), { parent: Tr, p: [-1.43, 2.6, -0.62] });
    const lm = mat('#ffe9a8', { emissive: '#ffcf70', ei: 0.6, nocache: true }); W.lamps.push(lm); mesh(G.box(0.16, 0.22, 0.16, 0.03), lm, { parent: Tr, p: [1.2, 0.16, 0.5] }); mesh(G.cone(0.13, 0.1, 4), iron, { parent: Tr, p: [1.2, 0.32, 0.5], r: [0, Math.PI / 4, 0] });
    const Fe = W.up.feria = group({ parent: scene, p: [EX, 0, EZ] }); mesh(G.box(2.8, 0.08, 1.0, 0.03), wood, { parent: Fe, p: [0, 0.82, 0] }); for (const [lx, lz] of [[-1.25, -0.38], [1.25, -0.38], [-1.25, 0.38], [1.25, 0.38]]) mesh(G.box(0.09, 0.8, 0.09, 0.02), woodD, { parent: Fe, p: [lx, 0.4, lz] });
    const gt = canvasTex(128, 128, (c) => { c.fillStyle = '#fff6e4'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(226,102,79,.55)'; for (let i = 0; i < 4; i++) { c.fillRect(i * 32, 0, 16, 128); c.fillRect(0, i * 32, 128, 16); } }, { repeat: [6, 2] }); mesh(G.box(2.9, 0.03, 1.1, 0.01), mat('#ffffff', { map: gt, rough: 1 }), { parent: Fe, p: [0, 0.875, 0] }); mesh(G.box(2.9, 0.4, 0.02, 0.01), mat('#ffffff', { map: gt, rough: 1 }), { parent: Fe, p: [0, 0.68, 0.55] });
    W.feriaShow = group({ parent: Fe, p: [0, 0.9, 0] });
    for (const sx of [-1, 1]) mesh(G.cyl(0.04, 0.05, 2.8, 6), woodD, { parent: Fe, p: [sx * 1.6, 1.4, -0.5] }); const bt = canvasTex(512, 128, (c) => { c.fillStyle = '#e2664f'; c.beginPath(); c.roundRect(0, 8, 512, 104, 24); c.fill(); c.strokeStyle = '#fff3d8'; c.lineWidth = 6; c.setLineDash([16, 10]); c.strokeRect(14, 22, 484, 76); c.fillStyle = '#fff6e4'; c.font = '800 62px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillText('Concurso de cestas', 256, 82, 460); }); mesh(G.plane(3.1, 0.62), basic('#ffffff', { map: bt, transparent: true, side: THREE.DoubleSide }), { parent: Fe, p: [0, 2.5, -0.5], cast: false });
    for (let i = 0; i < 3; i++) { const rs = group({ parent: Fe, p: [-0.7 + i * 0.7, 0.62, 0.57] }); mesh(G.cyl(0.11, 0.11, 0.02, 14), mat(['#c98a5a', '#f2c14e', '#c9d1d9'][i], { metal: 0.5, rough: 0.35 }), { parent: rs, r: [Math.PI / 2, 0, 0] }); for (const sx of [-1, 1]) mesh(G.box(0.06, 0.2, 0.01, 0.005), mat('#5873b8'), { parent: rs, p: [sx * 0.04, -0.15, 0], r: [0, 0, sx * 0.2] }); }
    W.cond.trasto = [EX - 1.45, EZ - 0.85, EX + 1.45, EZ + 0.85]; W.cond.feria = [EX - 1.55, EZ - 0.7, EX + 1.55, EZ + 0.7]; Tr.visible = Fe.visible = false; W.trastoSpot = [EX + 0.2, EZ - 1.35];
  }
  // indicadores en los dos extremos de la calle
  for (const [x, z, txt, ry] of [[15.4, 2.4, 'Fonda  ›', -0.3], [-15.4, 6.3, '‹  Molino', 0.3], [22.4, 6.3, 'Fonda  ›', -0.3], [-22.4, 2.4, '‹  Molino', 0.3], [3.3, 12.4, 'Al río', 0]]) { const g = group({ parent: scene, p: [x, 0, z], r: [0, ry, 0] }); mesh(G.cyl(0.06, 0.08, 1.9, 6), mat('#8f6a4a'), { parent: g, p: [0, 0.95, 0] }); const tx = canvasTex(256, 96, (c) => { c.fillStyle = '#fff3d8'; c.beginPath(); c.roundRect(4, 4, 248, 88, 20); c.fill(); c.strokeStyle = '#c98a5a'; c.lineWidth = 8; c.stroke(); c.fillStyle = '#7a4a2a'; c.font = '800 46px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillText(txt, 128, 64); }); mesh(G.box(1.2, 0.46, 0.06, 0.02), mat('#c98a5a'), { parent: g, p: [0, 1.7, 0] }); mesh(G.plane(1.14, 0.42), basic('#ffffff', { map: tx }), { parent: g, p: [0, 1.7, 0.035], cast: false }); W.circles.push([x, z, 0.25]); }
}
/** Estilo del obrador tras la reforma. */
export function setDucklings(n) { W.ducklings.forEach((d, i) => { d.g.visible = d.ring.visible = i < n; }); }
export function setStyle(st) { const P = { miel: ['#ffffff', '#9fc4e8', '#ffffff'], mar: ['#cfe6f7', '#6f9fd1', '#eef6ff'], fresa: ['#ffd9dc', '#f2a3b3', '#fff1f1'], menta: ['#d6f2e2', '#7fbfa6', '#f1fff6'] }[st] || null; if (!P) return; W.floorMat.color.set(P[0]); W.wainM.color.set(P[1]); W.wallMat.color.set(P[2]); }

// ---------- API ----------
export function buildWorld() {
  tex();
  const gm = W.groundMat = mat('#ffffff', { map: groundTex(), rough: 1, rim: 0 });
  const pg = new THREE.PlaneGeometry(SPAN, SPAN, 8, 128); pg.rotateX(-Math.PI / 2);
  mesh(pg, gm, { parent: scene, p: [0, 0, -8], cast: false });
  bakery(); outside(); home(); places();
}
export function setUpgrade(id, on) {
  if (W.up[id]) W.up[id].visible = on;
  if (id === 'fuente') { W.fountainWet.visible = on; W.fountainDry.visible = !on; }
  if (id === 'horno2') { W.mouth2.visible = on; W.logs.visible = !on; }
  if (id === 'miga') W.stool.visible = on;
  if (id === 'huerto') { W.binMat.color.set(on ? '#6fa878' : '#8f6a4a'); W.binLeaf.visible = on; }
  if (id === 'reforma' && !on) { W.floorMat.color.set('#ffffff'); W.wallMat.color.set('#ffffff'); }
  if (id === 'reforma') { W.floorMat.map = on ? T.tile : T.wood; W.wallMat.map = on ? T.wall2 : T.wall; W.wainM.color.set(on ? '#9fc4e8' : '#a8d0b0'); W.floorMat.needsUpdate = W.wallMat.needsUpdate = true; }
  if (id === 'molino') W.millFast = on;
}
/** Tiñe suelo, hojas caducas y trigal según la estación. */
export function setSeason(se) {
  W.groundMat.color.setRGB(...se.ground); W.groundMat.emissive.setRGB(...(se.n === 'invierno' ? [0.27, 0.29, 0.34] : [0, 0, 0]));
  for (const [m, base] of W.leafReg) { m.color.set(base === 'ever' ? m.userData.base || (m.userData.base = '#' + m.color.getHexString()) : base); if (se.leaf && base !== 'ever') m.color.multiply(tmpC.setRGB(...se.leaf)); else if (se.leaf && se.n === 'invierno') m.color.lerp(tmpC.set('#e9f1f6'), 0.35); }
  W.wheat.material.color.set(se.wheat || '#ffffff'); W.wheat.scale.y = se.n === 'invierno' ? 0.35 : se.n === 'otoño' ? 0.6 : 1;
}
/** Pone o quita la valla de obras de una mejora encargada. */
export function setWip(id, at, on) {
  if (on && !W.wips[id]) { const g = W.wipProto.clone(true); const inside = Math.abs(at[0]) < 6.4 && at[2] < 0.5; g.position.set(at[0], inside ? 0.1 : 0, at[2] + (inside ? 1.0 : 0.6)); g.rotation.y = (at[0] * 7) % 0.6 - 0.3; scene.add(g); W.wips[id] = g; }
  if (!on && W.wips[id]) { scene.remove(W.wips[id]); delete W.wips[id]; }
}
let smokeT = 0; const tmpC = new THREE.Color();
export function updateWorld(dt, hour, o = {}) {
  W.t += dt; const t = W.t, n = light.night;
  W.sails.rotation.z -= dt * (o.wind ? 1.1 : 0.45) * (W.millFast ? 1.8 : 1);
  W.sign.rotation.z = Math.sin(t * 1.3) * (o.wind ? 0.12 : 0.04);
  for (const w of [W.water, W.pond]) { w.map.offset.x = t * 0.03; w.map.offset.y = Math.sin(t * 0.5) * 0.04; }
  W.duckFeedT = Math.max(0, W.duckFeedT - dt);
  W.ducks.forEach((d, i) => {
    d.a += dt * (0.22 + i * 0.03); let tx = Math.cos(d.a) * d.r * 1.3, tz = Math.sin(d.a) * d.r * 0.9;
    if (W.duckFeedT > 0) { tx = W.duckShore[0] - (i % 2) * 0.55; tz = W.duckShore[1] - 0.5 + i * 0.55; }
    const k = 1 - Math.exp(-dt * (W.duckFeedT > 0 ? 1.6 : 3)), ox = d.x, oz = d.z; d.x += (tx - d.x) * k; d.z += (tz - d.z) * k;
    const mv = Math.hypot(d.x - ox, d.z - oz) / Math.max(dt, 0.001); if (mv > 0.05) d.yaw = Math.atan2(d.x - ox, d.z - oz);
    d.dabT -= dt; if (d.dabT < 0) { d.dabT = 4 + Math.random() * 7; d.dab = W.duckFeedT > 0 ? 0.7 : 1.5; } d.dab = Math.max(0, d.dab - dt);
    const dk = d.dab > 0 ? Math.sin(Math.min(1, (W.duckFeedT > 0 ? 0.7 : 1.5) - d.dab < 0.3 ? ((W.duckFeedT > 0 ? 0.7 : 1.5) - d.dab) / 0.3 : d.dab / 0.3) * Math.PI / 2) : 0;
    d.g.position.set(d.x, 0.06 + Math.sin(t * 3 + i) * 0.012, d.z); d.g.rotation.y += (((d.yaw - d.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * (1 - Math.exp(-dt * 4)); d.g.rotation.x = dk * 1.15; d.g.rotation.z = Math.sin(t * 2 + i) * 0.05;
    d.neck.rotation.x = Math.sin(t * 1.3 + i * 2) * 0.12 - dk * 0.4; d.head.rotation.y = Math.sin(t * 0.7 + i) * 0.5; d.wings.forEach((w, q) => w.rotation.z = (q ? 1 : -1) * (-0.25 + (W.duckFeedT > 6.5 ? Math.sin(t * 30) * 0.7 : 0)));
    d.ring.position.set(d.x, 0.092, d.z); const rs = 0.6 + ((t * 0.7 + i * 0.37) % 1) * 1.0; d.ring.scale.setScalar(rs * d.sc); d.ring.material.opacity = 0.5 * (1 - ((t * 0.7 + i * 0.37) % 1));
    if (i === 1) { W.duckTrail.unshift([d.x, d.z, d.yaw]); if (W.duckTrail.length > 400) W.duckTrail.pop(); }
  });
  W.ducklings.forEach((d, i) => { if (!d.g.visible) return; const p = W.duckTrail[Math.min(W.duckTrail.length - 1, Math.round(d.lag / Math.max(dt, 0.016)))] || [0, 0, 0]; d.g.position.set(p[0] + Math.sin(i * 2.1) * 0.12, 0.07 + Math.sin(t * 5 + i) * 0.012, p[1] + Math.cos(i * 1.7) * 0.12); d.g.rotation.y = p[2]; d.head.rotation.y = Math.sin(t * 1.7 + i) * 0.6; d.ring.position.set(d.g.position.x, 0.092, d.g.position.z); const rs = 0.3 + ((t + i * 0.3) % 1) * 0.4; d.ring.scale.setScalar(rs); d.ring.material.opacity = 0.4 * (1 - ((t + i * 0.3) % 1)); });
  if (W.binOpen > 0) { W.binOpen -= dt; } W.binLid.rotation.x += ((W.binOpen > 0 ? -1.5 : 0) - W.binLid.rotation.x) * (1 - Math.exp(-dt * 14));
  for (const m of W.lamps) m.emissiveIntensity = 0.25 + n * 2.6;
  for (const m of W.windows) m.emissiveIntensity = n * 1.8;
  for (let i = 0; i < W.lanterns.length; i += 2) { W.lanterns[i].emissiveIntensity = 0.3 + n * 2.2 * (0.85 + Math.sin(t * 2 + i) * 0.15); W.lanterns[i + 1].rotation.z = Math.sin(t * 1.6 + i) * (o.wind ? 0.25 : 0.1); }
  W.home.light.intensity = o.zone === 'home' ? 1.0 + n * 2.6 : 0; W.fondaLight.intensity = o.zone === 'fonda' ? 1.2 + n * 2.6 : 0; W.sails2.rotation.z -= dt * 0.6; W.river.map.offset.x = t * 0.06; for (const f of W.fishSh) { f.a += dt * 0.5; f.m.position.set(Math.sin(f.a) * f.r * 2.4, 0.005, f.z + Math.cos(f.a * 0.7) * 0.5); f.m.rotation.y = Math.cos(f.a) > 0 ? 0 : Math.PI; }
  if (o.zone === 'huerta') { W.bees.forEach((b, i) => { const a = t * (1.6 + i * 0.3) + i * 2; b.position.set(Math.cos(a) * (0.6 + (i % 2) * 0.25), 1.0 + Math.sin(a * 1.7) * 0.3, 0.3 + Math.sin(a) * 0.5); }); if (W.sprinkler.visible) W.sprHead.rotation.y = t * 5; for (const p of W.plots) if (p.star.visible) { p.star.rotation.y = t * 2; p.star.position.y = p.starY + Math.sin(t * 3 + p.col) * 0.06; } }
  W.fermGlow.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.05;
  W.fermDoor.rotation.y += ((o.fermOpen ? 1.75 : 0) - W.fermDoor.rotation.y) * (1 - Math.exp(-dt * 12)); W.fermDial.rotation.z = -0.9 + Math.sin(t * 0.7) * 0.08 - (o.fermBusy ? 0.7 : 0);
  for (const fs of W.flames) { const pw = (o.fire ?? 0.6) * (fs.lower ? (o.baking?.[1] ? 1.15 : 0.85) : (o.baking?.[0] ? 1.15 : 0.9)); fs.list.forEach((fl, i) => { const k = 0.25 + pw * (0.85 + Math.sin(t * 11 + i * 2.1) * 0.22 + Math.sin(t * 23 + i) * 0.12); fl.scale.set(0.7 + pw * 0.5, Math.max(0.05, k * 1.5), 0.7 + pw * 0.5); fl.rotation.z = Math.sin(t * 7 + i) * 0.14; }); }
  const f = 1.1 + Math.sin(t * 9) * 0.18 + Math.sin(t * 23) * 0.1;
  const fl = 0.25 + (o.fire ?? 0.6) * 1.1;
  W.fire[0].emissiveIntensity = f * (o.baking?.[0] ? 1.5 : 0.9) * fl; W.fire[1].emissiveIntensity = f * (o.baking?.[1] ? 1.5 : 0.8) * fl;
  W.ovenLight.intensity = (2.5 + n * 6) * f * 0.5 * fl;
  W.regOpen = Math.max(0, W.regOpen - dt * 1.3); const ro = Math.sin(Math.min(1, W.regOpen * 1.6) * Math.PI / 2); W.regDrawer.position.z = 0.02 + ro * 0.24; W.regCrank.rotation.x = ro * 1.1; W.regBell.scale.y = 0.7 + Math.sin(W.regOpen * 40) * 0.12 * W.regOpen; W.regKeys.forEach((kk, i) => kk.position.y = 0.035 - (W.regOpen > 0.75 && i % 3 === Math.floor(t * 20) % 3 ? 0.015 : 0));
  if (W.mixerSpin > 0) { W.mixerSpin -= dt; W.mixerHook.rotation.y += dt * 22; W.mixer.rotation.z = Math.sin(t * 40) * 0.012; } else W.mixer.rotation.z = 0;
  for (const m of W.findMesh) if (m.visible) { m.rotation.y = t * 2; m.position.y = 0.35 + Math.sin(t * 3 + m.position.x) * 0.08; }
  W.hh.rotation.z = -(hour % 12) / 12 * Math.PI * 2; W.mh.rotation.z = -(hour % 1) * Math.PI * 2;
  for (const c of W.clouds) { c.g.position.x += dt * c.v; if (c.g.position.x > 52) c.g.position.x = -52; c.m.color.copy(light.skyBot).lerp(new THREE.Color(0xffffff), 0.75 - n * 0.35); }
  for (const mt of W.mounts) mt.m.color.copy(light.skyBot).lerp(tmpC.set(mt.snow ? 0xffffff : mt.far ? 0x9fb6de : 0x86a6d2), mt.snow ? 0.8 : mt.far ? 0.45 : 0.7);
  smokeT -= dt; if (smokeT < 0) { smokeT = 0.35; burst('steam', W.chimney[0], W.chimney[1], W.chimney[2], 1, { spread: 0.3 }); }
}
/** Dibuja la pizarra del día. */
export function drawBoard(title, lines) {
  const g = W.boardTex.userData.g;
  g.fillStyle = '#3d5a4c'; g.fillRect(0, 0, 512, 384);
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 512, (i * 53) % 384, 90, 8);
  g.textAlign = 'center'; g.fillStyle = '#fff6da'; g.font = '800 50px "Baloo 2", ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.fillText(title, 256, 70, 470);
  g.strokeStyle = '#ffd98a'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(70, 96); g.lineTo(442, 96); g.stroke(); g.setLineDash([]);
  g.font = '700 38px "Baloo 2", ui-rounded, "Arial Rounded MT Bold", sans-serif';
  lines.forEach((l, i) => { g.fillStyle = ['#ffd98a', '#ffffff', '#ffc2c2', '#c9f0d0'][i % 4]; g.fillText(l, 256, 160 + i * 62, 470); });
  W.boardTex.needsUpdate = true;
}
/** Colisión de un círculo (radio r) contra el decorado; devuelve posición corregida. */
export function collide(x, z, r = 0.3, zone = null) {
  if (zone) { for (const o of zone.obst) { const cx = Math.max(o[0], Math.min(x, o[2])), cz = Math.max(o[1], Math.min(z, o[3])); const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz); if (d < r && d > 0.0001) { x = cx + dx / d * r; z = cz + dz / d * r; } } return [Math.max(zone.b[0], Math.min(zone.b[1], x)), Math.max(zone.b[2], Math.min(zone.b[3], z))]; }
  for (let it = 0; it < 2; it++) {
    for (const o of [...W.obstacles, ...Object.keys(W.cond).filter(k => W.up[k].visible).map(k => W.cond[k])]) {
      const cx = Math.max(o[0], Math.min(x, o[2])), cz = Math.max(o[1], Math.min(z, o[3]));
      let dx = x - cx, dz = z - cz; const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d < 0.0001) { const l = x - o[0], rr = o[2] - x, tt = z - o[1], b = o[3] - z, m = Math.min(l, rr, tt, b); if (m === l) x = o[0] - r; else if (m === rr) x = o[2] + r; else if (m === tt) z = o[1] - r; else z = o[3] + r; }
        else { x = cx + dx / d * r; z = cz + dz / d * r; }
      }
    }
    for (const c of [...W.circles, ...(W.up.farolillos.visible ? W.condCircles.farolillos : [])]) { const dx = x - c[0], dz = z - c[1], d = Math.hypot(dx, dz), m = r + c[2]; if (d < m && d > 0.0001) { x = c[0] + dx / d * m; z = c[1] + dz / d * m; } }
  }
  x = Math.max(-23.6, Math.min(23.6, x)); z = Math.max(-5.6, Math.min(13.8, z));
  return [x, z];
}
