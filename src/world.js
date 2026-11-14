// El pueblo de Migas y el obrador de Pan.
import { THREE, mat, basic, mesh, group, G, canvasTex, rnd, blob, smoothNoise, scene, light, burst, patch } from './gfx.js';
import { makeBread } from './breads.js';

export const W = {
  obstacles: [], circles: [], up: {}, lamps: [], windows: [], sails: null, ducks: [], t: 0,
  st: {
    mesa: { x: 0.8, z: -3.95, ox: 0.8, oz: -5.0, yaw: Math.PI, label: 'Amasar' },
    ferm: { x: 3.0, z: -4.3, ox: 3.0, oz: -5.35, yaw: Math.PI, label: 'Fermentadora' },
    horno: { x: 5.1, z: -3.55, ox: 5.1, oz: -5.0, yaw: Math.PI, label: 'Horno' },
    despensa: { x: 5.2, z: -2.2, ox: 6.2, oz: -2.2, yaw: Math.PI / 2, label: 'Despensa' },
    mostrador: { x: -1.0, z: -2.7, ox: -1.9, oz: -2.7, yaw: -Math.PI / 2, label: 'Mostrador' },
  },
  slots: [-4.35, -3.3, -2.25, -1.2].map(z => ({ x: -3.0, z })),
  baskets: [-4.6, -3.75, -2.9, -2.05, -1.2].map(z => ({ x: -1.9, z })),
  fermSlots: [], ovenSlots: [], basketGroups: [],
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
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2;
      for (let k = 0; k < 5; k++) { const yy = y + 8 + r() * 48; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(150, yy + r() * 10 - 5, 350, yy + r() * 10 - 5, 512, yy); g.stroke(); }
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
    const lm = (c) => mat(c, { map: T.leaf, rough: 1, sway: 0.03, rim: 0.45 });
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
  for (const wx of [w * 0.22]) {
    mesh(G.box(0.95, 0.95, 0.1, 0.08), mat('#fffaf0'), { parent: g, p: [wx, 1.45, d / 2 + 0.02] });
    const wm = mat('#bfe3ff', { rough: 0.3, emissive: '#ffcf70', ei: 0, nocache: true }); W.windows.push(wm);
    mesh(G.box(0.75, 0.75, 0.1, 0.05), wm, { parent: g, p: [wx, 1.45, d / 2 + 0.045] });
    mesh(G.box(0.05, 0.75, 0.11, 0.01), mat('#fffaf0'), { parent: g, p: [wx, 1.45, d / 2 + 0.05] });
    mesh(G.box(1.05, 0.2, 0.3, 0.06), mat('#c98a5a'), { parent: g, p: [wx, 0.88, d / 2 + 0.14] });
    for (let i = 0; i < 4; i++) mesh(G.sph(0.11, 8, 6), mat(['#ff7b8a', '#ffd166', '#ff9ac1', '#fff'][i]), { parent: g, p: [wx - 0.36 + i * 0.24, 1.04, d / 2 + 0.16] });
  }
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
  mesh(G.zbox(13.5, 0.16, 6.9, 1, 16), mat('#ffffff', { map: T.wood, rough: 0.75 }), { parent: B, p: [0, 0.02, -2.7], cast: false });
  mesh(G.zbox(13.9, 0.1, 7.2, 1, 16), mat('#e6d0ae', { rough: 1 }), { parent: B, p: [0, 0.0, -2.72], cast: false });
  // pared del fondo y laterales en corte
  const wallM = mat('#ffffff', { map: T.wall, rough: 0.95 });
  mesh(G.box(13.7, 4.1, 0.35, 0.08), wallM, { parent: B, p: [0, 2.05, -6.22] });
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); for (let i = 1; i <= 14; i++) sh.lineTo(6.9 * i / 14, 0); sh.lineTo(6.9, 0.95); sh.quadraticCurveTo(5.6, 1.0, 4.4, 2.3); sh.quadraticCurveTo(3.3, 4.1, 1.6, 4.1); for (let i = 3; i >= 0; i--) sh.lineTo(1.6 * i / 4, 4.1); sh.lineTo(0, 0);
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 12 });
    sg.rotateY(-Math.PI / 2); sg.translate(0.15, 0, 0);
    mesh(sg, mat('#fff1d6', { rough: 0.95 }), { parent: B, p: [s * 6.7, 0, -6.15] });
    mesh(G.zbox(0.34, 1.16, 6.9, 1, 16), mat('#a8d0b0', { rough: 0.7 }), { parent: B, p: [s * 6.7, 0.52, -2.7] });
    mesh(G.zbox(0.4, 0.09, 6.95, 1, 16), woodM, { parent: B, p: [s * 6.7, 1.14, -2.7] });
  }
  // tejado asomando por detrás y chimenea
  mesh(G.box(14.3, 0.3, 2.6, 0.1), mat('#ffffff', { map: T.roof, rough: 0.9 }), { parent: B, p: [0, 4.0, -7.2], r: [0.55, 0, 0] });
  mesh(G.box(14.4, 0.22, 0.5, 0.1), mat('#c9623f', { rough: 0.9 }), { parent: B, p: [0, 4.2, -6.3] });
  mesh(G.box(1.0, 2.0, 1.0, 0.1), mat('#ffffff', { map: T.brick }), { parent: B, p: [5.1, 5.0, -6.6] });
  mesh(G.box(1.25, 0.2, 1.25, 0.08), mat('#d9d2c4'), { parent: B, p: [5.1, 6.05, -6.6] });
  W.chimney = [5.1, 6.3, -6.6];
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
    const bg = group({ parent: B, p: [b.x, 1.09, b.z] });
    mesh(G.lathe([[0.001, 0], [0.3, 0], [0.37, 0.07], [0.4, 0.2], [0.37, 0.2], [0.33, 0.06], [0.001, 0.05]], 20, false), mat('#ffffff', { map: T.wicker, rough: 0.9 }), { parent: bg, s: [0.95, 1, 1.02] });
    mesh(G.cyl(0.3, 0.3, 0.02, 16), mat(['#fff6e4', '#ffe1e1', '#e4f3e0', '#fff6e4', '#e3ecfb'][i], { rough: 1 }), { parent: bg, p: [0, 0.075, 0] });
    const items = group({ parent: bg, p: [0, 0.09, 0] }); W.basketGroups.push({ g: bg, items, id: null, n: -1 });
  });
  // caja registradora
  const reg = group({ parent: B, p: [-1.9, 1.09, -0.72], r: [0, -Math.PI / 2, 0] });
  mesh(G.box(0.5, 0.26, 0.42, 0.06), mat('#e9785e', { rough: 0.5 }), { parent: reg, p: [0, 0.13, 0] });
  mesh(G.box(0.5, 0.2, 0.2, 0.05), mat('#e9785e', { rough: 0.5 }), { parent: reg, p: [0, 0.34, -0.1], r: [-0.3, 0, 0] });
  mesh(G.box(0.36, 0.11, 0.02, 0.01), mat('#fff9e0', { emissive: '#ffe9a0', ei: 0.3 }), { parent: reg, p: [0, 0.37, 0.0], r: [-0.3, 0, 0] });
  for (let i = 0; i < 6; i++) mesh(G.cyl(0.03, 0.03, 0.03, 8), mat('#fff6e4'), { parent: reg, p: [-0.15 + (i % 3) * 0.15, 0.27, 0.07 + Math.floor(i / 3) * 0.1] });
  mesh(G.sph(0.07, 12, 8), mat('#e9b949', { metal: 0.7, rough: 0.3 }), { parent: B, p: [-1.9, 1.16, -0.32], s: [1, 0.7, 1] });
  W.register = [-1.9, 1.5, -0.72];

  // ---- zona de tienda (izquierda) ----
  const sh = group({ parent: B, p: [-4.4, 0, -5.85] });               // estantería de exposición
  mesh(G.box(3.6, 2.6, 0.1, 0.03), mat('#f7e3bd'), { parent: sh, p: [0, 1.6, -0.12] });
  for (let i = 0; i < 3; i++) mesh(G.box(3.7, 0.08, 0.5, 0.03), woodM, { parent: sh, p: [0, 1.05 + i * 0.72, 0.1] });
  for (const s of [-1, 1]) mesh(G.box(0.1, 2.75, 0.52, 0.03), woodD, { parent: sh, p: [s * 1.85, 1.5, 0.1] });
  const deco = [['hogaza', -1.3, 0], ['barra', -0.45, 0, 1], ['centeno', 0.5, 0], ['brioche', 1.3, 0], ['chapata', -1.1, 1], ['rosca', -0.1, 1], ['caracola', 0.75, 1], ['mollete', 1.4, 1]];
  for (const [id, x, row, up] of deco) { const b = makeBread(id); b.position.set(x, 1.1 + row * 0.72, 0.12); b.scale.setScalar(0.9); if (up) { b.rotation.z = 1.25; b.position.y += 0.42; b.position.x += 0.1; } else b.rotation.y = x; sh.add(b); }
  for (let i = 0; i < 4; i++) { const j = group({ parent: sh, p: [-1.35 + i * 0.9, 2.53, 0.1] }); mesh(G.cyl(0.15, 0.13, 0.3, 12), mat(['#e9785e', '#ffd166', '#9ad1c0', '#c9a0dc'][i], { rough: 0.35, transparent: true, opacity: 0.92 }), { parent: j, p: [0, 0.15, 0] }); mesh(G.cyl(0.16, 0.16, 0.06, 12), woodD, { parent: j, p: [0, 0.32, 0] }); }
  // pizarra del día
  W.boardTex = canvasTex(512, 384, (g) => { g.fillStyle = '#3d5a4c'; g.fillRect(0, 0, 512, 384); });
  const bd = group({ parent: B, p: [-5.25, 1.0, -1.35], r: [0, Math.PI / 2 - 0.25, 0] });
  mesh(G.box(1.25, 1.0, 0.06, 0.03), woodD, { parent: bd, p: [0, 0.55, 0], r: [-0.16, 0, 0] });
  mesh(G.plane(1.12, 0.86), basic('#ffffff', { map: W.boardTex }), { parent: bd, p: [0, 0.55, 0.036], r: [-0.16, 0, 0], cast: false });
  mesh(G.box(0.06, 1.05, 0.06, 0.02), woodD, { parent: bd, p: [-0.5, 0.5, -0.3], r: [0.3, 0, 0] }); mesh(G.box(0.06, 1.05, 0.06, 0.02), woodD, { parent: bd, p: [0.5, 0.5, -0.3], r: [0.3, 0, 0] });
  W.circles.push([-5.25, -1.35, 0.55]);
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
  pot(B, -6.05, -5.5, 1.1); pot(B, -6.05, 0.1, 0.9, '#9ad1c0'); pot(B, 6.05, 0.1, 0.9, '#ffd166');
  W.circles.push([-6.05, -5.5, 0.4], [-6.05, 0.1, 0.35], [6.05, 0.1, 0.35]);

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
  // saco y cajas bajo la mesa
  sack(M, -0.6, 0.23, 0.05, 0.75); mesh(G.box(0.6, 0.36, 0.5, 0.04), woodM, { parent: M, p: [0.45, 0.41, 0.0] });
  W.dough = mesh(blob((x, y, z, v) => v.set(x * 0.3, y > 0 ? y * 0.2 : y * 0.08, z * 0.28), { ws: 24, hs: 16 }), mat('#f6e8cb', { rough: 0.9, rim: 0.4, nocache: true }), { parent: M, p: [-0.62, 1.0, 0.1] });
  W.dough.visible = false; W.doughWorld = [0.18, 1.15, -4.95];
  W.obstacles.push([-0.5, -5.8, 2.1, -4.35]);

  // ---- fermentadora ----
  const F = group({ parent: B, p: [3.0, 0.1, -5.45] });
  mesh(G.box(1.35, 2.05, 0.95, 0.09), mat('#9ad1c0', { rough: 0.55 }), { parent: F, p: [0, 1.025, 0] });
  mesh(G.box(1.12, 1.5, 0.08, 0.05), mat('#3a2a26', { rough: 0.9 }), { parent: F, p: [0, 1.12, 0.42] });
  W.fermGlow = mat('#ffd9a0', { emissive: '#ffb347', ei: 0.5, nocache: true });
  mesh(G.box(1.06, 1.44, 0.02, 0.01), W.fermGlow, { parent: F, p: [0, 1.12, 0.4], cast: false });
  for (let i = 0; i < 3; i++) mesh(G.box(1.08, 0.03, 0.2, 0.01), iron, { parent: F, p: [0, 0.5 + i * 0.5, 0.46] });
  mesh(G.box(1.2, 1.56, 0.03, 0.02), mat('#dff3ff', { transparent: true, opacity: 0.18, rough: 0.1 }), { parent: F, p: [0, 1.12, 0.6], cast: false });
  mesh(G.box(0.05, 0.6, 0.06, 0.02), cream, { parent: F, p: [0.5, 1.12, 0.64] });
  for (const lx of [-0.5, 0.5]) mesh(G.cyl(0.06, 0.05, 0.1, 8), iron, { parent: F, p: [lx, -0.03, 0.3] });
  mesh(G.box(0.5, 0.2, 0.04, 0.02), cream, { parent: F, p: [0, 1.96, 0.47] });
  for (let i = 0; i < 3; i++) mesh(G.sph(0.03, 8, 6), mat(['#ff7b6b', '#ffd166', '#7bd389'][i], { emissive: ['#ff7b6b', '#ffd166', '#7bd389'][i], ei: 0.6 }), { parent: F, p: [-0.14 + i * 0.14, 1.96, 0.5] });
  for (let i = 0; i < 3; i++) W.fermSlots.push({ p: [3.0, 0.63 + i * 0.5, -4.93], holder: group({ parent: B, p: [3.0, 0.63 + i * 0.5, -4.93], s: 0.85 }) });
  W.obstacles.push([2.2, -5.9, 3.8, -4.8]);

  // ---- horno de leña ----
  const H = group({ parent: B, p: [5.1, 0.1, -5.1] });
  const brickM = mat('#ffffff', { map: T.brick, rough: 0.95 });
  mesh(G.box(2.45, 1.0, 1.75, 0.08), mat('#ffffff', { map: T.stone, rough: 1 }), { parent: H, p: [0, 0.5, 0] });
  mesh(G.box(2.6, 0.14, 1.9, 0.05), mat('#cfc6b6', { rough: 0.9 }), { parent: H, p: [0, 1.04, 0] });
  const dome = new THREE.SphereGeometry(1.18, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 0.92, 0.74);
  mesh(dome, brickM, { parent: H, p: [0, 1.1, -0.05] });
  mesh(G.cyl(0.26, 0.3, 2.4, 14), mat('#cfc6b6', { rough: 0.9 }), { parent: H, p: [0, 3.2, -0.55] });
  const archShape = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(-w, h - w); s.absarc(0, h - w, w, Math.PI, 0, true); s.lineTo(w, 0); s.lineTo(-w, 0); return s; };
  const archG = (w, h, d) => new THREE.ExtrudeGeometry(archShape(w, h), { depth: d, bevelEnabled: false, curveSegments: 14 });
  mesh(archG(0.6, 0.86, 0.12), mat('#b9ae9c', { rough: 0.9 }), { parent: H, p: [0, 1.1, 0.78] });
  W.fire = [mat('#ffb04d', { emissive: '#ff8a2a', ei: 1.2, nocache: true }), mat('#ffb04d', { emissive: '#ff8a2a', ei: 0, nocache: true })];
  mesh(archG(0.5, 0.74, 0.02), mat('#2a1a16'), { parent: H, p: [0, 1.1, 0.9] });
  mesh(archG(0.44, 0.5, 0.02), W.fire[0], { parent: H, p: [0, 1.1, 0.915], cast: false });
  // boca de abajo: leñera o segunda boca
  mesh(archG(0.5, 0.62, 0.02), mat('#2a1a16'), { parent: H, p: [0, 0.14, 0.87] });
  W.logs = group({ parent: H, p: [0, 0.22, 0.82] });
  for (let i = 0; i < 5; i++) { const l = mesh(G.cyl(0.09, 0.09, 0.3, 8), mat('#b07a4c'), { parent: W.logs, p: [-0.22 + (i % 3) * 0.22 + (i > 2 ? 0.11 : 0), i > 2 ? 0.25 : 0.08, 0], r: [Math.PI / 2, 0, 0] }); mesh(G.cyl(0.07, 0.07, 0.31, 8), mat('#f0d2a0'), { parent: W.logs, p: l.position.toArray(), r: [Math.PI / 2, 0, 0] }); }
  W.mouth2 = mesh(archG(0.42, 0.5, 0.02), W.fire[1], { parent: H, p: [0, 0.16, 0.89], cast: false }); W.mouth2.visible = false;
  // pala
  const peel = group({ parent: B, p: [6.35, 0.1, -3.55], r: [0, 0, 0.1] });
  mesh(G.cyl(0.03, 0.03, 1.9, 8), woodM, { parent: peel, p: [0, 1.0, 0] }); mesh(G.box(0.36, 0.5, 0.04, 0.03), woodM, { parent: peel, p: [0, 2.1, 0] });
  W.ovenLight = new THREE.PointLight(0xff9a3c, 0, 7, 1.6); W.ovenLight.position.set(5.1, 1.5, -3.6); scene.add(W.ovenLight);
  for (let i = 0; i < 2; i++) W.ovenSlots.push({ p: [5.1, i ? 0.42 : 1.33, -4.3], holder: group({ parent: B, p: [5.1, i ? 0.42 : 1.3, -4.28], s: i ? 0.8 : 0.9 }) });
  W.obstacles.push([3.85, -5.9, 6.4, -4.1]);

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
  house(11.5, -14.5, { wall: '#fff3c9', roof: '#c9623f', w: 3.6, door: '#5873b8' }); house(-22, -3, { wall: '#e3eefa', roof: '#d9714e', rot: Math.PI / 2 });
  house(22, 2, { wall: '#ffe9d6', roof: '#c9805a', rot: -Math.PI / 2 }); house(-21, 12, { wall: '#fff0d8', roof: '#d9714e', rot: Math.PI / 2 * 0.9 }); house(20.5, 12.5, { wall: '#f1e9da', roof: '#b8604a', rot: -Math.PI / 2 });
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
  stalk.frustumCulled = false; stalk.castShadow = false; stalk.receiveShadow = true; scene.add(stalk);
  fence(-17.7, -0.75, -8.3, -0.75); fence(-8.3, -0.75, -8.3, -9); fence(-17.7, -9, -8.3, -9); fence(-17.7, -0.75, -17.7, -9);
  W.obstacles.push([-17.9, -9.2, -8.1, -0.55]);
  // espantapájaros
  const sc = group({ parent: scene, p: [-13, 0, -4.6] });
  mesh(G.cyl(0.05, 0.05, 2.2, 6), mat('#a9744b'), { parent: sc, p: [0, 1.1, 0] }); mesh(G.cyl(0.04, 0.04, 1.5, 6), mat('#a9744b'), { parent: sc, p: [0, 1.55, 0], r: [0, 0, Math.PI / 2] });
  mesh(G.sph(0.24, 12, 10), mat('#f1e2c4', { rough: 1 }), { parent: sc, p: [0, 2.15, 0] }); mesh(G.cone(0.4, 0.3, 12), mat('#e2b140'), { parent: sc, p: [0, 2.42, 0] });
  mesh(G.box(0.7, 0.75, 0.2, 0.08), mat('#e9785e', { rough: 1 }), { parent: sc, p: [0, 1.3, 0] });
  // árboles
  const trees = [[-11.5, 1.2, 1.05, 'naranjo'], [9.2, -1.0, 1.1, 'naranjo'], [-14.5, 9.4, 1.15, 'naranjo'], [15.3, 3.2, 1, 'naranjo'], [3.2, 8.6, 1.1, 'naranjo'], [-4.5, 9.6, 0.95, 'alamo'], [16.5, 9.5, 1.2, 'alamo'], [-17.5, 3.4, 1.1, 'alamo'],
  [8.8, -8.8, 1.2, 'alamo'], [-8.8, -15, 1.1, 'naranjo'], [0, -17.5, 1.2, 'alamo'], [8, -17.5, 1.1, 'naranjo'], [18, -10.5, 1.2, 'alamo'], [-20, -13, 1.2, 'alamo'], [-25, 5, 1.2, 'alamo'], [25, 8, 1.2, 'naranjo'], [-9, 13, 1.2, 'alamo'], [9, 13.5, 1.2, 'alamo'], [-1, 13, 1.1, 'naranjo'], [24, -6, 1.1, 'alamo'],
  [10.6, -4.6, 1, 'cipres'], [-9.6, -11.6, 1.1, 'cipres'], [7.3, -12.6, 1.05, 'cipres'], [17.6, -3, 0.9, 'cipres'], [-17.3, -11.3, 1, 'cipres']];
  trees.forEach((t, i) => tree(t[0], t[1], t[2], t[3], i + 1));
  // arbustos y matas
  for (const [x, z, s] of [[-7.9, -4.5, 0.8], [-8.1, -2.4, 0.65], [8, -3.5, 0.75], [7.9, -5.2, 0.9], [-15.8, 6.3, 0.8], [6.2, 9.4, 0.7], [14.2, 10.6, 0.9], [-7, 10.5, 0.8], [-12.6, -1.4, 0.6], [17.5, 6, 0.8]]) {
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
  const st = canvasTex(512, 256, (g) => {
    g.fillStyle = '#fff3d8'; g.beginPath(); g.roundRect(6, 6, 500, 244, 60); g.fill(); g.strokeStyle = '#c98a5a'; g.lineWidth = 12; g.stroke();
    g.fillStyle = '#7a4a2a'; g.font = '800 92px ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.textAlign = 'center'; g.fillText('Pantastic!', 256, 132);
    g.font = '700 38px ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.fillStyle = '#d98a3a'; g.fillText('· horno de leña ·', 256, 196);
  });
  W.sign = group({ parent: sg, p: [0.85, 3.05, 0] });
  mesh(G.box(1.5, 0.75, 0.07, 0.03), mat('#c98a5a'), { parent: W.sign, p: [0, -0.5, 0] });
  for (const s of [-1, 1]) mesh(G.plane(1.42, 0.68), basic('#ffffff', { map: st }), { parent: W.sign, p: [0, -0.5, s * 0.04], r: [0, s > 0 ? 0 : Math.PI, 0], cast: false });
  for (const s of [-1, 1]) mesh(G.cyl(0.012, 0.012, 0.14, 4), mat('#4a4654'), { parent: W.sign, p: [s * 0.55, -0.07, 0] });
  W.circles.push([-8.2, 1.5, 0.3]);

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
  for (let i = 0; i < 2; i++) {
    const d = group({ parent: P, s: i ? 0.8 : 1 });
    mesh(blob((x, y, z, vv) => vv.set(x * 0.2, y * 0.15 + 0.14, z * 0.3 + (y > 0 && z < 0 ? -0.05 : 0)), { ws: 14, hs: 10 }), mat('#fffdf5', { rough: 0.9 }), { parent: d });
    mesh(G.sph(0.13, 12, 10), mat('#fffdf5', { rough: 0.9 }), { parent: d, p: [0, 0.36, 0.2] });
    mesh(G.cone(0.06, 0.14, 8), mat('#ff9d2e'), { parent: d, p: [0, 0.34, 0.36], r: [Math.PI / 2, 0, 0], s: [1.3, 1, 0.6] });
    for (const s of [-1, 1]) mesh(G.sph(0.022, 6, 5), mat('#2a1d1a'), { parent: d, p: [s * 0.08, 0.4, 0.29] });
    W.ducks.push({ g: d, a: i * 3, r: 1.1 + i * 0.5 });
  }
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
  poles.forEach(([x, z]) => { mesh(G.cyl(0.05, 0.07, 3.5, 6), mat('#8f6a4a'), { parent: Fa, p: [x, 1.75, z] }); mesh(G.sph(0.09, 8, 6), mat('#e9b949'), { parent: Fa, p: [x, 3.55, z] }); });
  const lc = ['#ff7b8a', '#ffd166', '#7bd3c4', '#8fa8ff', '#ffa3d1', '#ffb86b'];
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1], pts = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, 3.45 - Math.sin(t * Math.PI) * 0.75, a[1] + (b[1] - a[1]) * t)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4), mat('#4a4654'), { parent: Fa, cast: false });
    for (let k = 1; k < 12; k += 2) { const lm = mat(lc[(i * 3 + k) % 6], { emissive: lc[(i * 3 + k) % 6], ei: 0.25, rough: 0.6, nocache: true }); W.lanterns.push(lm); const lg = group({ parent: Fa, p: [pts[k].x, pts[k].y - 0.2, pts[k].z] }); mesh(G.sph(0.17, 12, 10), lm, { parent: lg, s: [1, 1.15, 1] }); mesh(G.cyl(0.07, 0.07, 0.05, 8), mat('#e9b949'), { parent: lg, p: [0, 0.19, 0] }); mesh(G.cyl(0.07, 0.07, 0.05, 8), mat('#e9b949'), { parent: lg, p: [0, -0.19, 0] }); W.lanterns.push(lg); }
  }
  for (const id of ['jardin', 'terraza', 'farolillos']) W.up[id].visible = false;
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

// ---------- API ----------
export function buildWorld() {
  tex();
  const gm = mat('#ffffff', { map: groundTex(), rough: 1, rim: 0 });
  const pg = new THREE.PlaneGeometry(SPAN, SPAN, 8, 128); pg.rotateX(-Math.PI / 2);
  mesh(pg, gm, { parent: scene, p: [0, 0, -8], cast: false });
  bakery(); outside();
}
export function setUpgrade(id, on) {
  if (W.up[id]) W.up[id].visible = on;
  if (id === 'fuente') { W.fountainWet.visible = on; W.fountainDry.visible = !on; }
  if (id === 'horno2') { W.mouth2.visible = on; W.logs.visible = !on; }
  if (id === 'miga') W.stool.visible = on;
}
let smokeT = 0;
export function updateWorld(dt, hour, o = {}) {
  W.t += dt; const t = W.t, n = light.night;
  W.sails.rotation.z -= dt * (o.wind ? 1.1 : 0.45);
  W.sign.rotation.z = Math.sin(t * 1.3) * (o.wind ? 0.12 : 0.04);
  for (const w of [W.water, W.pond]) { w.map.offset.x = t * 0.03; w.map.offset.y = Math.sin(t * 0.5) * 0.04; }
  for (const d of W.ducks) { d.a += dt * 0.25; d.g.position.set(Math.cos(d.a) * d.r * 1.3, 0.02 + Math.sin(t * 3 + d.r) * 0.012, Math.sin(d.a) * d.r * 0.9); d.g.rotation.y = -d.a + Math.PI; d.g.rotation.z = Math.sin(t * 2 + d.r) * 0.05; }
  for (const m of W.lamps) m.emissiveIntensity = 0.25 + n * 2.6;
  for (const m of W.windows) m.emissiveIntensity = n * 1.8;
  for (let i = 0; i < W.lanterns.length; i += 2) { W.lanterns[i].emissiveIntensity = 0.3 + n * 2.2 * (0.85 + Math.sin(t * 2 + i) * 0.15); W.lanterns[i + 1].rotation.z = Math.sin(t * 1.6 + i) * (o.wind ? 0.25 : 0.1); }
  W.fermGlow.emissiveIntensity = 0.55 + Math.sin(t * 2) * 0.08;
  const f = 1.1 + Math.sin(t * 9) * 0.18 + Math.sin(t * 23) * 0.1;
  W.fire[0].emissiveIntensity = f * (o.baking?.[0] ? 1.5 : 0.9); W.fire[1].emissiveIntensity = f * (o.baking?.[1] ? 1.5 : 0.8);
  W.ovenLight.intensity = (2.5 + n * 6) * f * 0.5;
  W.hh.rotation.z = -(hour % 12) / 12 * Math.PI * 2; W.mh.rotation.z = -(hour % 1) * Math.PI * 2;
  for (const c of W.clouds) { c.g.position.x += dt * c.v; if (c.g.position.x > 52) c.g.position.x = -52; c.m.color.copy(light.skyBot).lerp(new THREE.Color(0xffffff), 0.75 - n * 0.35); }
  smokeT -= dt; if (smokeT < 0) { smokeT = 0.35; burst('steam', W.chimney[0], W.chimney[1], W.chimney[2], 1, { spread: 0.3 }); }
}
/** Dibuja la pizarra del día. */
export function drawBoard(title, lines) {
  const g = W.boardTex.userData.g;
  g.fillStyle = '#3d5a4c'; g.fillRect(0, 0, 512, 384);
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 512, (i * 53) % 384, 90, 8);
  g.textAlign = 'center'; g.fillStyle = '#fff6da'; g.font = '800 50px ui-rounded, "Arial Rounded MT Bold", sans-serif'; g.fillText(title, 256, 70);
  g.strokeStyle = '#ffd98a'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(70, 96); g.lineTo(442, 96); g.stroke(); g.setLineDash([]);
  g.font = '700 38px ui-rounded, "Arial Rounded MT Bold", sans-serif';
  lines.forEach((l, i) => { g.fillStyle = ['#ffd98a', '#ffffff', '#ffc2c2', '#c9f0d0'][i % 4]; g.fillText(l, 256, 160 + i * 62); });
  W.boardTex.needsUpdate = true;
}
/** Colisión de un círculo (radio r) contra el decorado; devuelve posición corregida. */
export function collide(x, z, r = 0.3, inside = true) {
  for (let it = 0; it < 2; it++) {
    for (const o of W.obstacles) {
      const cx = Math.max(o[0], Math.min(x, o[2])), cz = Math.max(o[1], Math.min(z, o[3]));
      let dx = x - cx, dz = z - cz; const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d < 0.0001) { const l = x - o[0], rr = o[2] - x, tt = z - o[1], b = o[3] - z, m = Math.min(l, rr, tt, b); if (m === l) x = o[0] - r; else if (m === rr) x = o[2] + r; else if (m === tt) z = o[1] - r; else z = o[3] + r; }
        else { x = cx + dx / d * r; z = cz + dz / d * r; }
      }
    }
    for (const c of W.circles) { const dx = x - c[0], dz = z - c[1], d = Math.hypot(dx, dz), m = r + c[2]; if (d < m && d > 0.0001) { x = c[0] + dx / d * m; z = c[1] + dz / d * m; } }
  }
  x = Math.max(-17, Math.min(17, x)); z = Math.max(-5.6, Math.min(11.5, z));
  return [x, z];
}
