// Productos de la huerta, el monte y el río: modelos para el mundo y para los iconos.
import { THREE, mat, mesh, group, G, blob, rnd, smoothNoise } from './gfx.js';
import { ITEMS } from './data.js';

const leafM = (c = '#5fae5a', sway = 0) => mat(c, { rough: 0.85, rim: 0.4, sway });
const leaf = (parent, p, s, r, c, sway = 0) => mesh(G.sph(1, 8, 6), leafM(c, sway), { parent, p, s, r });
function berry(c, s = 1) {
  const g = group();
  mesh(G.lathe([[0.001, 0], [0.07, 0.05], [0.115, 0.16], [0.095, 0.24], [0.001, 0.27]], 12), mat(c, { rough: 0.4, rim: 0.55 }), { parent: g });
  for (let i = 0; i < 5; i++) leaf(g, [Math.cos(i * 1.26) * 0.05, 0.268, Math.sin(i * 1.26) * 0.05], [0.055, 0.012, 0.03], [0, -i * 1.26, 0.25]);
  for (let i = 0; i < 9; i++) mesh(G.sph(0.008, 4, 3), mat('#ffe9a8'), { parent: g, p: [Math.cos(i * 2.4) * (0.07 + (i % 3) * 0.012), 0.07 + (i % 4) * 0.045, Math.sin(i * 2.4) * (0.07 + (i % 3) * 0.012)], cast: false });
  g.scale.setScalar(s); return g;
}
function fish(o) {
  const g = group(), body = mat(o.c, { rough: 0.35, rim: 0.6 }), fin = mat(o.fin, { rough: 0.5, side: THREE.DoubleSide });
  mesh(blob((x, y, z, v) => { const k = 1 - Math.pow(Math.abs(x), 2.2) * 0.75; return v.set(x * 0.5 * o.len, y * 0.15 * k * o.tall, z * 0.085 * k); }, { ws: 18, hs: 10 }), body, { parent: g, p: [0, 0.16, 0] });
  mesh(blob((x, y, z, v) => { const k = 1 - Math.pow(Math.abs(x), 2.2) * 0.75; return v.set(x * 0.46 * o.len, -Math.abs(y) * 0.12 * k * o.tall, z * 0.08 * k); }, { ws: 14, hs: 8 }), mat(o.belly, { rough: 0.4 }), { parent: g, p: [0, 0.15, 0] });
  mesh(G.cone(0.12, 0.2, 3), fin, { parent: g, p: [-0.5 * o.len - 0.04, 0.16, 0], r: [0, 0, -Math.PI / 2], s: [1.2 * o.tall, 1, 0.12] });
  mesh(G.cone(0.07, 0.13, 3), fin, { parent: g, p: [-0.05, 0.16 + 0.15 * o.tall, 0], r: [0, 0, -0.5], s: [1.4, 1, 0.12] });
  mesh(G.cone(0.04, 0.09, 3), fin, { parent: g, p: [0.08, 0.06, 0.05], r: [0.5, 0, 2.6], s: [1, 1, 0.15] });
  for (const sz of [-1, 1]) { mesh(G.sph(0.028, 8, 6), mat('#fffdf5', { rough: 0.2 }), { parent: g, p: [0.36 * o.len, 0.19, sz * 0.055] }); mesh(G.sph(0.014, 6, 5), mat('#2a2030', { rough: 0.2 }), { parent: g, p: [0.375 * o.len, 0.19, sz * 0.072] }); }
  if (o.stripe) mesh(G.cap(0.012, 0.42 * o.len, 6), mat(o.stripe, { rough: 0.4 }), { parent: g, p: [0, 0.165, 0.074], r: [0, 0, Math.PI / 2] });
  if (o.dots) for (let i = 0; i < 7; i++) mesh(G.sph(0.012, 5, 4), mat(o.dots), { parent: g, p: [-0.25 * o.len + i * 0.085 * o.len, 0.2 + (i % 2) * 0.03, 0.068 - Math.abs(i - 3) * 0.004], cast: false });
  if (o.barb) for (const sz of [-1, 1]) mesh(G.cyl(0.005, 0.003, 0.09, 4), mat('#8a7a4a'), { parent: g, p: [0.47 * o.len, 0.1, sz * 0.03], r: [0, 0, 0.5] });
  g.rotation.z = 0.08; return g;
}
const MODEL = {
  fresa() { const g = group(); [[0, 0, 0, 1, 0], [0.17, 0, 0.06, 0.85, 0.5], [-0.14, 0, 0.1, 0.8, -0.4]].forEach(([x, y, z, s, r]) => { const b = berry('#e2334a', s); b.position.set(x, y, z); b.rotation.z = r * 0.5; g.add(b); }); return g; },
  romero() {
    const g = group();
    for (let i = 0; i < 6; i++) { const s = group({ parent: g, p: [(i - 2.5) * 0.035, 0, (i % 2) * 0.03], r: [0, 0, (i - 2.5) * -0.12] }); mesh(G.cyl(0.008, 0.012, 0.5, 5), mat('#7a6a45'), { parent: s, p: [0, 0.25, 0] }); for (let k = 0; k < 9; k++) for (const sd of [-1, 1]) leaf(s, [sd * 0.03, 0.12 + k * 0.045, 0], [0.036, 0.007, 0.01], [0, 0, sd * 0.8], k % 2 ? '#6fa86a' : '#5f9a5a'); }
    mesh(G.tor(0.05, 0.012, 6, 12), mat('#e2c79c'), { parent: g, p: [0, 0.1, 0.015], r: [Math.PI / 2, 0, 0], s: [1.6, 1, 1] }); return g;
  },
  tomate() {
    const g = group();
    for (const [x, z, s] of [[-0.09, 0, 1], [0.13, 0.05, 0.85]]) { const t = group({ parent: g, p: [x, 0, z], s }); mesh(blob((bx, by, bz) => 1 + Math.cos(Math.atan2(bz, bx) * 5) * 0.03 * (1 - by * by), { ws: 16, hs: 10 }), mat('#e8452f', { rough: 0.3, rim: 0.6 }), { parent: t, p: [0, 0.13, 0], s: [0.15, 0.13, 0.15] }); for (let i = 0; i < 5; i++) leaf(t, [Math.cos(i * 1.26) * 0.05, 0.255, Math.sin(i * 1.26) * 0.05], [0.06, 0.008, 0.018], [0, -i * 1.26, 0.2], '#4f9a52'); mesh(G.cyl(0.012, 0.012, 0.06, 5), mat('#4f9a52'), { parent: t, p: [0, 0.28, 0] }); }
    return g;
  },
  girasol() {
    const g = group({ r: [-0.5, 0, 0] });
    mesh(G.cyl(0.16, 0.16, 0.05, 18), mat('#7a4a2a', { rough: 1 }), { parent: g, p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] });
    mesh(G.cyl(0.1, 0.1, 0.06, 14), mat('#5a3524', { rough: 1 }), { parent: g, p: [0, 0.3, 0.01], r: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; mesh(G.sph(1, 8, 5), mat(i % 2 ? '#ffd23e' : '#ffbf1f', { rough: 0.6, rim: 0.5 }), { parent: g, p: [Math.cos(a) * 0.23, 0.3 + Math.sin(a) * 0.23, -0.01], s: [0.1, 0.045, 0.02], r: [0, 0, a] }); }
    mesh(G.cyl(0.02, 0.025, 0.3, 6), mat('#6aa84f'), { parent: g, p: [0, 0.05, -0.08], r: [0.6, 0, 0] }); return g;
  },
  calabaza() {
    const g = group();
    mesh(blob((bx, by, bz) => 1 + Math.cos(Math.atan2(bz, bx) * 8) * 0.06 * (1 - by * by * 0.8), { ws: 32, hs: 14 }), mat('#f08a2e', { rough: 0.55, rim: 0.5 }), { parent: g, p: [0, 0.19, 0], s: [0.3, 0.2, 0.3] });
    mesh(G.cyl(0.03, 0.045, 0.12, 6), mat('#6a8a3f'), { parent: g, p: [0.01, 0.41, 0], r: [0, 0, 0.25] }); leaf(g, [0.1, 0.38, 0.03], [0.09, 0.01, 0.06], [0, 0.4, 0.3], '#5fae5a'); return g;
  },
  uva() {
    const g = group(), m = [mat('#7a4a9a', { rough: 0.3, rim: 0.7 }), mat('#6a3f8a', { rough: 0.3, rim: 0.7 })]; let k = 0;
    for (let row = 0; row < 4; row++) for (let i = 0; i <= 3 - row; i++) for (const z of row < 2 ? [-0.04, 0.04] : [0]) mesh(G.sph(0.055, 10, 8), m[k++ % 2], { parent: g, p: [(i - (3 - row) / 2) * 0.095, 0.3 - row * 0.085, z] });
    mesh(G.cyl(0.012, 0.012, 0.12, 5), mat('#7a6a45'), { parent: g, p: [0, 0.4, 0] }); leaf(g, [0.09, 0.42, 0], [0.1, 0.01, 0.07], [0, 0.3, 0.35], '#6aa84f'); return g;
  },
  col() {
    const g = group();
    mesh(G.sph(0.19, 14, 10), mat('#cfe6a8', { rough: 0.8, rim: 0.4 }), { parent: g, p: [0, 0.2, 0], s: [1, 0.86, 1] });
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; mesh(G.sph(1, 10, 6), mat(i % 2 ? '#7fbf6a' : '#8fcf7a', { rough: 0.85, rim: 0.4 }), { parent: g, p: [Math.cos(a) * 0.17, 0.14, Math.sin(a) * 0.17], s: [0.15, 0.17, 0.04], r: [0.35 * Math.sin(a), -a + Math.PI / 2, 0.35 * -Math.cos(a)] }); }
    return g;
  },
  ajo() {
    const g = group();
    for (const [x, z, s, r] of [[-0.08, 0, 1, 0.1], [0.12, 0.04, 0.85, -0.25]]) { const b = group({ parent: g, p: [x, 0, z], s, r: [0, 0, r] }); mesh(blob((bx, by, bz) => (1 + Math.cos(Math.atan2(bz, bx) * 6) * 0.05) * (by > 0 ? 1 - by * 0.25 : 1), { ws: 16, hs: 10 }), mat('#f6efe2', { rough: 0.7, rim: 0.4 }), { parent: b, p: [0, 0.12, 0], s: [0.13, 0.12, 0.13] }); mesh(G.cyl(0.012, 0.035, 0.16, 6), mat('#e9dcc0'), { parent: b, p: [0, 0.28, 0] }); mesh(G.cyl(0.03, 0.02, 0.02, 6), mat('#c9b48a'), { parent: b, p: [0, 0.005, 0] }); }
    return g;
  },
  esparrago() {
    const g = group();
    for (let i = 0; i < 5; i++) { const s = group({ parent: g, p: [(i - 2) * 0.04, 0, (i % 2) * 0.035], r: [0, 0, (i - 2) * -0.05] }); mesh(G.cyl(0.018, 0.02, 0.42, 6), mat('#7fb85a', { rough: 0.7 }), { parent: s, p: [0, 0.21, 0] }); mesh(G.lathe([[0.02, 0], [0.027, 0.04], [0.001, 0.12]], 6, false), mat('#4f8a4a', { rough: 0.7 }), { parent: s, p: [0, 0.42, 0] }); }
    mesh(G.tor(0.06, 0.012, 6, 12), mat('#e2664f'), { parent: g, p: [0, 0.14, 0.015], r: [Math.PI / 2, 0, 0], s: [1.6, 1, 1] }); return g;
  },
  menta() {
    const g = group();
    for (const [x, rz] of [[-0.06, 0.25], [0.06, -0.2], [0, 0]]) { const s = group({ parent: g, p: [x, 0, 0], r: [0, 0, rz] }); mesh(G.cyl(0.01, 0.012, 0.36, 5), mat('#5f9a5a'), { parent: s, p: [0, 0.18, 0] }); for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) leaf(s, [sd * 0.05, 0.1 + k * 0.08, k % 2 ? 0.02 : -0.02], [0.065 - k * 0.008, 0.01, 0.04], [0, k * 1.57, sd * 0.4], k % 2 ? '#62c98a' : '#4fb87a'); }
    return g;
  },
  mora() {
    const g = group(), r = rnd(9);
    for (const [x, z, c] of [[-0.1, 0, '#3a1f4a'], [0.1, 0.05, '#4a2a5a'], [0, -0.1, '#8a2a4a']]) { const b = group({ parent: g, p: [x, 0.09, z] }); for (let i = 0; i < 14; i++) { const a = r() * 6.28, e = (r() - 0.5) * 2.6; mesh(G.sph(0.036, 7, 5), mat(c, { rough: 0.25, rim: 0.7 }), { parent: b, p: [Math.cos(a) * Math.cos(e) * 0.06, Math.sin(e) * 0.07, Math.sin(a) * Math.cos(e) * 0.06] }); } mesh(G.cyl(0.008, 0.008, 0.05, 4), mat('#5f9a5a'), { parent: b, p: [0, 0.1, 0] }); }
    leaf(g, [0.02, 0.2, 0.02], [0.1, 0.01, 0.06], [0, 0.6, 0.2]); return g;
  },
  seta() {
    const g = group();
    for (const [x, z, s, rz] of [[-0.07, 0, 1, 0.08], [0.14, 0.06, 0.7, -0.2]]) { const m = group({ parent: g, p: [x, 0, z], s, r: [0, 0, rz] }); mesh(G.lathe([[0.06, 0], [0.05, 0.1], [0.055, 0.2]], 10, false), mat('#f6e2c4', { rough: 0.9 }), { parent: m }); mesh(G.lathe([[0.001, 0.19], [0.1, 0.18], [0.19, 0.24], [0.2, 0.28], [0.12, 0.3], [0.03, 0.27], [0.001, 0.265]], 16, false), mat('#e58a3a', { rough: 0.6, rim: 0.5 }), { parent: m }); for (let i = 0; i < 3; i++) mesh(G.tor(0.06 + i * 0.04, 0.006, 4, 14), mat('#c96a2a'), { parent: m, p: [0, 0.29 - i * 0.012, 0], r: [Math.PI / 2, 0, 0], cast: false }); }
    return g;
  },
  castana() {
    const g = group(), nut = (x, z, ry) => { const n = group({ parent: g, p: [x, 0.09, z], r: [0, ry, 0.15] }); mesh(G.lathe([[0.001, -0.09], [0.1, -0.07], [0.13, 0.0], [0.09, 0.08], [0.001, 0.14]], 12), mat('#7a4226', { rough: 0.22, rim: 0.7 }), { parent: n, s: [1, 1, 0.75] }); mesh(G.sph(0.09, 10, 6), mat('#c9a06a', { rough: 0.9 }), { parent: n, p: [0, -0.07, 0], s: [1, 0.25, 0.7] }); };
    nut(-0.1, 0.03, 0.3); nut(0.1, 0.08, -0.5);
    const bur = group({ parent: g, p: [0.03, 0.11, -0.13] }); mesh(G.sph(0.11, 10, 8), mat('#a8b85a', { rough: 1 }), { parent: bur }); const r = rnd(4); for (let i = 0; i < 26; i++) { const a = r() * 6.28, e = (r() - 0.2) * 1.6; mesh(G.cone(0.014, 0.08, 4), mat('#b9c96a'), { parent: bur, p: [Math.cos(a) * Math.cos(e) * 0.12, Math.sin(e) * 0.12, Math.sin(a) * Math.cos(e) * 0.12], r: [Math.sin(a) * (1.57 - e), 0, -Math.cos(a) * (1.57 - e)], cast: false }); }
    return g;
  },
  pinon() {
    const g = group(), cone = group({ parent: g, p: [-0.04, 0, 0], r: [0, 0, 0.12] });
    for (let k = 0; k < 7; k++) { const rr = 0.13 * Math.sin((k + 1.2) / 8.6 * Math.PI) + 0.02; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + k * 0.45; mesh(G.sph(1, 6, 5), mat(k % 2 ? '#8a5a34' : '#9a6a40', { rough: 0.9 }), { parent: cone, p: [Math.cos(a) * rr, 0.04 + k * 0.052, Math.sin(a) * rr], s: [0.05, 0.03, 0.045], r: [0, -a, 0.5] }); } }
    mesh(G.cyl(0.04, 0.06, 0.36, 8), mat('#6a4226'), { parent: cone, p: [0, 0.2, 0] });
    for (const [x, z, ry] of [[0.16, 0.1, 0.4], [0.22, 0.02, 1.2], [0.13, 0.17, 2]]) mesh(G.sph(1, 8, 6), mat('#f3e6c4', { rough: 0.5 }), { parent: g, p: [x, 0.02, z], s: [0.045, 0.02, 0.022], r: [0, ry, 0] });
    return g;
  },
  trucha: () => fish({ c: '#8fa9a0', belly: '#f3efe6', fin: '#b9a58a', len: 1, tall: 1, stripe: '#e89aa8', dots: '#3a4a44' }),
  barbo: () => fish({ c: '#a89a5a', belly: '#f0e6c0', fin: '#c98a4a', len: 1.15, tall: 0.9, barb: true }),
  dorada: () => fish({ c: '#f2b23a', belly: '#ffe9a8', fin: '#f08a3a', len: 1.05, tall: 1.35, dots: '#ffd866' }),
  anguila() {
    const g = group(), pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector3(-0.5 + t, 0.08 + Math.sin(t * 9) * 0.01, Math.sin(t * 7.5) * 0.13 * (1 - t * 0.3))); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 8), p = tg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const t = (v.x + 0.5), k = 0.45 + Math.sin(Math.min(1, t * 1.15) * Math.PI) * 0.6 + t * 0.25; const c = pts[Math.round(clamp01(t) * 14)]; p.setXYZ(i, v.x, c.y + (v.y - c.y) * k, c.z + (v.z - c.z) * k); } tg.computeVertexNormals();
    mesh(tg, mat('#4a5a4a', { rough: 0.25, rim: 0.7 }), { parent: g });
    mesh(G.sph(0.062, 10, 8), mat('#4a5a4a', { rough: 0.25, rim: 0.7 }), { parent: g, p: [0.5, 0.085, pts[14].z], s: [1.5, 0.9, 1] });
    for (const sz of [-1, 1]) mesh(G.sph(0.014, 6, 5), mat('#fffdf5'), { parent: g, p: [0.55, 0.11, pts[14].z + sz * 0.04] });
    return g;
  },
  cangrejo() {
    const g = group(), sh = mat('#c9553a', { rough: 0.4, rim: 0.6 }), dk = mat('#a8402a', { rough: 0.5 });
    mesh(G.sph(0.17, 14, 10), sh, { parent: g, p: [0, 0.13, 0], s: [1.25, 0.6, 1] });
    for (const sx of [-1, 1]) { for (let i = 0; i < 3; i++) mesh(G.cap(0.018, 0.14, 5), dk, { parent: g, p: [sx * 0.24, 0.08, -0.08 + i * 0.09], r: [0, 0, sx * 1.0] }); const arm = group({ parent: g, p: [sx * 0.2, 0.13, 0.15], r: [0, sx * 0.5, 0] }); mesh(G.cap(0.03, 0.1, 6), dk, { parent: arm, p: [sx * 0.05, 0, 0.05], r: [Math.PI / 2, 0, sx * -0.6] }); mesh(G.sph(0.07, 10, 8), sh, { parent: arm, p: [sx * 0.09, 0.02, 0.14], s: [0.9, 0.7, 1.3] }); mesh(G.cone(0.03, 0.09, 6), sh, { parent: arm, p: [sx * 0.06, 0.03, 0.24], r: [Math.PI / 2, 0, 0] }); mesh(G.cone(0.02, 0.07, 6), dk, { parent: arm, p: [sx * 0.12, 0.02, 0.23], r: [Math.PI / 2, 0, 0] }); mesh(G.cyl(0.008, 0.008, 0.07, 4), dk, { parent: g, p: [sx * 0.06, 0.24, 0.12] }); mesh(G.sph(0.022, 6, 5), mat('#2a2030'), { parent: g, p: [sx * 0.06, 0.285, 0.12] }); }
    return g;
  },
  miel() {
    const g = group();
    mesh(G.lathe([[0.001, 0], [0.16, 0], [0.19, 0.06], [0.19, 0.3], [0.13, 0.36], [0.13, 0.4], [0.001, 0.4]], 18, false), mat('#f2a62e', { rough: 0.15, rim: 0.7, emissive: '#c97a10', ei: 0.25 }), { parent: g });
    mesh(G.cyl(0.15, 0.15, 0.07, 18), mat('#fff3d8', { rough: 0.7 }), { parent: g, p: [0, 0.43, 0] }); mesh(G.tor(0.15, 0.012, 6, 18), mat('#e2664f'), { parent: g, p: [0, 0.4, 0], r: [Math.PI / 2, 0, 0] });
    mesh(G.box(0.2, 0.13, 0.02, 0.01), mat('#fffaf0'), { parent: g, p: [0, 0.18, 0.186] }); mesh(G.sph(0.03, 8, 6), mat('#f2b84b'), { parent: g, p: [0, 0.18, 0.196], s: [1, 1, 0.3] });
    return g;
  },
};
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
const protos = {};
export function makeItem(id) { if (!protos[id]) protos[id] = MODEL[id](); return protos[id].clone(true); }
export const itemModels = () => Object.fromEntries(Object.keys(ITEMS).map(id => [id, makeItem(id)]));

// ---------- plantas del huerto ----------
/** Planta de un cultivo. f: 0…1 de crecimiento; ripe: con fruto. */
export function makePlant(id, f, ripe) {
  const g = group(), s = 0.35 + f * 0.65, gr = ['#58b368', '#6ac274', '#4fa862'];
  if (f < 0.12) { for (const sd of [-1, 1]) leaf(g, [sd * 0.035, 0.07, 0], [0.045, 0.01, 0.028], [0, 0, sd * 0.6], '#8fd97a', 0.05); mesh(G.cyl(0.008, 0.01, 0.07, 4), mat('#8fd97a'), { parent: g, p: [0, 0.035, 0] }); return g; }
  const bush = (n, h, w, cols = gr) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 0.4; mesh(G.sph(1, 8, 6), leafM(cols[i % cols.length], 0.04), { parent: g, p: [Math.cos(a) * w * 0.5, h * (0.5 + (i % 2) * 0.25), Math.sin(a) * w * 0.5], s: [w * 0.5, h * 0.42, w * 0.42], r: [0, -a, 0.3] }); } mesh(G.sph(1, 8, 6), leafM(cols[0], 0.04), { parent: g, p: [0, h * 0.75, 0], s: [w * 0.45, h * 0.4, w * 0.45] }); };
  const fruit = (n, y, rad, sc) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 1, it = makeItem(id); it.scale.setScalar(sc); it.position.set(Math.cos(a) * rad, y + (i % 2) * 0.06, Math.sin(a) * rad); it.rotation.y = -a; g.add(it); } };
  if (id === 'girasol') { mesh(G.cyl(0.02, 0.03, 1.1 * s, 6), mat('#6aa84f', { sway: 0.03 }), { parent: g, p: [0, 0.55 * s, 0] }); for (let i = 0; i < 4; i++) leaf(g, [(i % 2 ? 0.1 : -0.1), 0.25 * s + i * 0.16 * s, 0], [0.12 * s, 0.012, 0.07 * s], [0, 0, i % 2 ? -0.4 : 0.4], gr[i % 3], 0.03); if (ripe) { const h = makeItem('girasol'); h.scale.setScalar(0.95); h.rotation.x = 0.35; h.position.set(0, 1.1 * s - 0.2, 0.1); g.add(h); } else if (f > 0.6) mesh(G.sph(0.08, 8, 6), mat('#9aa84f', { sway: 0.03 }), { parent: g, p: [0, 1.1 * s, 0] }); }
  else if (id === 'calabaza') { for (let i = 0; i < 5; i++) { const a = i * 1.3; leaf(g, [Math.cos(a) * 0.22 * s, 0.1 + (i % 2) * 0.05, Math.sin(a) * 0.22 * s], [0.16 * s, 0.015, 0.13 * s], [0.2, -a, 0.2], gr[i % 3], 0.03); } mesh(G.tor(0.17 * s, 0.012, 5, 14), mat('#5f9a5a'), { parent: g, p: [0, 0.04, 0], r: [Math.PI / 2, 0, 0] }); if (ripe) { const p = makeItem('calabaza'); p.scale.setScalar(0.85); p.position.set(0.06, 0, 0.1); g.add(p); } else if (f > 0.55) mesh(G.sph(0.08 * s, 10, 8), mat('#b9c96a'), { parent: g, p: [0.06, 0.08, 0.1] }); }
  else if (id === 'tomate') { mesh(G.cyl(0.018, 0.018, 0.95, 5), mat('#a9744b'), { parent: g, p: [0, 0.47, -0.04] }); mesh(G.cyl(0.014, 0.018, 0.8 * s, 5), mat('#5f9a5a', { sway: 0.02 }), { parent: g, p: [0.02, 0.4 * s, 0] }); const n = Math.round(2 + f * 3); for (let k = 0; k < n; k++) for (const sd of [-1, 1]) leaf(g, [sd * 0.14, 0.2 + k * 0.15, (k % 2 ? 0.05 : -0.03)], [0.13, 0.014, 0.075], [0.2, k * 0.9, sd * 0.35], gr[(k + (sd > 0 ? 1 : 0)) % 3], 0.03); if (ripe) [[-0.15, 0.2, 0.13], [0.16, 0.36, 0.1], [-0.12, 0.52, 0.12]].forEach(([x, y, z], i) => { const it = makeItem('tomate'); it.scale.setScalar(0.58); it.position.set(x, y, z); it.rotation.y = i * 2; g.add(it); }); else if (f > 0.6) for (let i = 0; i < 3; i++) mesh(G.sph(0.045, 6, 5), mat('#a8c96a'), { parent: g, p: [i % 2 ? 0.15 : -0.14, 0.26 + i * 0.14, 0.12] }); }
  else if (id === 'uva') { for (const sx of [-0.3, 0.3]) mesh(G.cyl(0.02, 0.022, 0.92, 5), mat('#a9744b'), { parent: g, p: [sx, 0.46, 0] }); mesh(G.cyl(0.015, 0.015, 0.74, 5), mat('#a9744b'), { parent: g, p: [0, 0.86, 0], r: [0, 0, Math.PI / 2] }); mesh(G.cyl(0.016, 0.024, 0.86 * s, 5), mat('#7a6a45'), { parent: g, p: [0, 0.43 * s, 0.02], r: [0, 0, 0.12] }); const n = Math.round(1 + f * 5); for (let k = 0; k < n; k++) leaf(g, [-0.3 + (k + 0.5) / n * 0.6, 0.9 + (k % 2) * 0.03, (k % 2 ? 0.07 : -0.06)], [0.12, 0.014, 0.1], [(k % 2 ? 0.35 : -0.3), k * 1.3, 0], ['#6aa84f', '#7ab85a', '#5f9a4a'][k % 3], 0.03); if (ripe) [-0.19, 0.02, 0.2].forEach((x, i) => { const it = makeItem('uva'); it.scale.setScalar(0.55); it.position.set(x, 0.58 - (i % 2) * 0.05, 0.06); g.add(it); }); else if (f > 0.6) for (let i = 0; i < 3; i++) mesh(G.sph(0.035, 6, 5), mat('#a8c96a'), { parent: g, p: [-0.19 + i * 0.2, 0.74, 0.06] }); }
  else if (id === 'fresa') { const n = Math.round(4 + f * 4); for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 0.3; leaf(g, [Math.cos(a) * 0.17 * s, 0.09 + (i % 2) * 0.05, Math.sin(a) * 0.17 * s], [0.13 * s, 0.016, 0.09 * s], [Math.sin(a) * 0.3, -a, -Math.cos(a) * 0.1 + 0.25], gr[i % 3], 0.03); } leaf(g, [0, 0.16, 0], [0.1 * s, 0.03, 0.1 * s], [0, 0, 0], gr[1], 0.03); if (ripe) for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.9, it = makeItem('fresa'); it.scale.setScalar(0.55); it.position.set(Math.cos(a) * 0.27, 0.02, Math.sin(a) * 0.27); it.rotation.y = -a; g.add(it); } else if (f > 0.6) for (let i = 0; i < 4; i++) mesh(G.sph(0.03, 6, 5), mat('#ffffff'), { parent: g, p: [Math.cos(i * 1.6) * 0.2, 0.2, Math.sin(i * 1.6) * 0.2], s: [1, 0.5, 1], cast: false }); }
  else if (id === 'col') { const c = makeItem('col'); c.scale.setScalar(0.5 + f * 0.75); g.add(c); }
  else if (id === 'ajo' || id === 'romero') { const n = id === 'ajo' ? 5 : 9; for (let i = 0; i < n; i++) { const a = i / n * 6.283, rr = id === 'ajo' ? 0.06 : 0.1; mesh(G.cyl(0.006, 0.014, 0.5 * s, 4), mat(id === 'ajo' ? (i % 2 ? '#8fcf7a' : '#7fbf6a') : (i % 2 ? '#6fa86a' : '#5f9a5a'), { sway: 0.05 }), { parent: g, p: [Math.cos(a) * rr, 0.25 * s, Math.sin(a) * rr], r: [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25] }); } if (id === 'romero' && f > 0.5) bush(4, 0.36 * s, 0.3 * s, ['#6fa86a', '#5f9a5a', '#7ab87a']); if (ripe && id === 'ajo') mesh(G.sph(0.07, 8, 6), mat('#f6efe2'), { parent: g, p: [0, 0.03, 0], s: [1, 0.6, 1] }); if (ripe && id === 'romero') for (let i = 0; i < 6; i++) mesh(G.sph(0.022, 5, 4), mat('#b9a8e8'), { parent: g, p: [Math.cos(i) * 0.12, 0.3 + (i % 3) * 0.05, Math.sin(i) * 0.12], cast: false }); }
  else { bush(Math.round(3 + f * 2), 0.42 * s, 0.5 * s); if (ripe) fruit(3, 0.1, 0.2, 0.5); else if (f > 0.6) for (let i = 0; i < 4; i++) mesh(G.sph(0.022, 5, 4), mat('#ffffff'), { parent: g, p: [Math.cos(i * 1.6) * 0.16, 0.34, Math.sin(i * 1.6) * 0.16], cast: false }); }
  return g;
}
/** Mata silvestre con su fruto a la vista, para recolectar. */
export function makeForage(id) {
  const g = group(), r = rnd(id.length * 7 + id.charCodeAt(0));
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = 0.1 + r() * 0.26; mesh(G.cone(0.03, 0.2 + r() * 0.16, 4), mat(i % 2 ? '#6ac274' : '#58b368', { sway: 0.12 }), { parent: g, p: [Math.cos(a) * d, 0.1, Math.sin(a) * d], r: [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], cast: false }); }
  if (id === 'mora') { for (let i = 0; i < 5; i++) { const a = i * 1.26; mesh(G.sph(1, 8, 6), leafM(i % 2 ? '#4f9a52' : '#5fae5a', 0.04), { parent: g, p: [Math.cos(a) * 0.2, 0.26 + (i % 2) * 0.12, Math.sin(a) * 0.2], s: [0.24, 0.2, 0.22] }); } for (let i = 0; i < 3; i++) { const it = makeItem('mora'); it.scale.setScalar(0.62); it.position.set(Math.cos(i * 2.1 + 0.5) * 0.3, 0.3 + i * 0.07, Math.sin(i * 2.1 + 0.5) * 0.3); g.add(it); } return g; }
  if (id === 'menta') { for (let i = 0; i < 3; i++) { const it = makeItem('menta'); it.scale.setScalar(1.1); it.position.set(Math.cos(i * 2.1) * 0.14, 0, Math.sin(i * 2.1) * 0.14); it.rotation.y = i * 2; g.add(it); } return g; }
  if (id === 'esparrago') { for (let i = 0; i < 5; i++) { const a = i * 1.26, s = group({ parent: g, p: [Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13], r: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12] }); mesh(G.cyl(0.02, 0.024, 0.36 + (i % 2) * 0.1, 6), mat('#7fb85a'), { parent: s, p: [0, 0.2, 0] }); mesh(G.lathe([[0.022, 0], [0.03, 0.04], [0.001, 0.13]], 6, false), mat('#4f8a4a'), { parent: s, p: [0, 0.38 + (i % 2) * 0.05, 0] }); } return g; }
  const it = makeItem(id); it.scale.setScalar(id === 'seta' ? 1.35 : 1.15); it.position.y = 0.02; g.add(it);
  if (id === 'seta') { const it2 = makeItem('seta'); it2.scale.setScalar(0.9); it2.position.set(0.28, 0.01, -0.12); it2.rotation.y = 2; g.add(it2); }
  if (id === 'castana' || id === 'pinon') for (let i = 0; i < 4; i++) leaf(g, [Math.cos(i * 1.7) * 0.3, 0.02, Math.sin(i * 1.7) * 0.3], [0.1, 0.008, 0.06], [0, i, 0], id === 'pinon' ? '#4f8a5a' : ['#e9a03b', '#d9714e', '#f2c14e', '#c96a2a'][i]);
  return g;
}
/** Motas del toque sobre una pieza de pan ya hecha. */
const box = new THREE.Box3(), sz = new THREE.Vector3(), ct = new THREE.Vector3();
export function addToque(bread, itemId) {
  const c = ITEMS[itemId]?.toque?.c; if (!c) return bread;
  box.setFromObject(bread); box.getSize(sz); box.getCenter(ct); const sc = bread.scale.x || 1, m = mat(c, { rough: 0.5, rim: 0.5 });
  for (let i = 0; i < 6; i++) { const a = i * 2.4, d = 0.12 + (i % 3) * 0.1; mesh(G.sph(0.03, 6, 5), m, { parent: bread, p: [Math.cos(a) * sz.x * 0.5 * d * 2 / sc, (sz.y * (0.93 - d * d * 0.9)) / sc, Math.sin(a) * sz.z * 0.5 * d * 2 / sc], s: itemId === 'romero' ? [1.6, 0.4, 0.5] : [1, 0.7, 1], r: [0, a, 0], cast: false }); }
  return bread;
}
