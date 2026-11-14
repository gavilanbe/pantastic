// Iconos renderizados en 3D para la interfaz: ingredientes, mejoras y retratos.
import { THREE, mat, mesh, group, G, blob, bend, rnd } from './gfx.js';
import { makeChar, updateChar, PAN_LOOK, MIGA_LOOK } from './chars.js';
import { makeTray, makeBread } from './breads.js';
import { NEIGH, PIPA_LOOK } from './data.js';

function sack(c, label, mark) {
  const g = group();
  mesh(blob((x, y, z, v) => { const k = 1 - Math.pow(Math.abs(y), 3) * 0.25 + Math.sin(y * 5 + x * 3) * 0.02; return v.set(x * 0.36 * k, y * 0.4 + 0.4, z * 0.25 * k); }, { ws: 22, hs: 16 }), mat(c, { rough: 1, rim: 0.35 }), { parent: g });
  mesh(G.cyl(0.2, 0.13, 0.16, 12), mat(c, { rough: 1 }), { parent: g, p: [0, 0.86, 0] });
  mesh(G.tor(0.115, 0.022, 6, 14), mat('#b9824a'), { parent: g, p: [0, 0.8, 0], r: [Math.PI / 2, 0, 0] });
  mesh(G.box(0.32, 0.26, 0.03, 0.02), mat(label, { rough: 0.8 }), { parent: g, p: [0, 0.4, 0.245] });
  mesh(G.cyl(0.012, 0.012, 0.16, 5), mat(mark), { parent: g, p: [0, 0.38, 0.265] });
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) mesh(G.sph(0.03, 6, 5), mat(mark), { parent: g, p: [s * 0.03, 0.38 + k * 0.045, 0.265], s: [0.5, 1.4, 0.5], r: [0, 0, s * -0.5] });
  return g;
}
function jar(fill, lid, bits) {
  const g = group(), r = rnd(5);
  mesh(G.cyl(0.24, 0.22, 0.46, 20), mat(fill, { rough: 0.8 }), { parent: g, p: [0, 0.25, 0] });
  for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = r() * 0.17; mesh(G.sph(bits.s, 8, 6), mat(bits.c[i % bits.c.length], { rough: bits.rough ?? 0.6 }), { parent: g, p: [Math.cos(a) * d, 0.48 + r() * 0.04, Math.sin(a) * d], s: bits.sc || [1, 1, 1], r: [r() * 3, r() * 3, 0] }); }
  mesh(G.cyl(0.27, 0.25, 0.62, 20), mat('#e8f6ff', { transparent: true, opacity: 0.3, rough: 0.05 }), { parent: g, p: [0, 0.31, 0], cast: false });
  mesh(G.cyl(0.28, 0.28, 0.1, 20), mat(lid, { rough: 0.6 }), { parent: g, p: [0, 0.67, 0] });
  mesh(G.box(0.26, 0.16, 0.02, 0.01), mat('#fffaf0'), { parent: g, p: [0, 0.27, 0.262] });
  return g;
}
const ING_MODEL = {
  harina: () => sack('#fbf3e2', '#7fb2d9', '#e3b043'),
  integral: () => sack('#e2c79c', '#a8703d', '#fff3d8'),
  centeno: () => sack('#bfa68a', '#5d4a3c', '#f0dcb4'),
  levadura() {
    const g = group();
    mesh(G.box(0.46, 0.3, 0.34, 0.05), mat('#ecdcb4', { rough: 0.95 }), { parent: g, p: [0, 0.2, 0] });
    mesh(G.box(0.48, 0.2, 0.36, 0.04), mat('#9fc3e6', { rough: 0.5, metal: 0.2 }), { parent: g, p: [0, 0.13, 0] });
    mesh(G.box(0.2, 0.12, 0.02, 0.01), mat('#fffaf0'), { parent: g, p: [0, 0.13, 0.185] });
    mesh(G.box(0.14, 0.03, 0.022, 0.005), mat('#e2664f'), { parent: g, p: [0, 0.14, 0.19] });
    for (const [x, z, s] of [[0.36, 0.14, 0.07], [0.42, -0.02, 0.05], [0.3, 0.26, 0.04]]) mesh(G.box(s, s * 0.8, s, 0.012), mat('#ecdcb4', { rough: 1 }), { parent: g, p: [x, s * 0.4, z], r: [0, x * 5, 0] });
    return g;
  },
  mantequilla() {
    const g = group();
    mesh(G.box(0.74, 0.02, 0.5, 0.008), mat('#fffaf0'), { parent: g, p: [0, 0.012, 0] });
    mesh(G.box(0.5, 0.22, 0.3, 0.05), mat('#ffe27a', { rough: 0.35, rim: 0.5 }), { parent: g, p: [-0.05, 0.13, 0] });
    mesh(G.box(0.1, 0.2, 0.3, 0.04), mat('#ffe890', { rough: 0.35 }), { parent: g, p: [0.3, 0.11, 0.03], r: [0, 0.25, 0.12] });
    mesh(G.tor(0.05, 0.022, 6, 12, 4.5), mat('#fff0a8', { rough: 0.35 }), { parent: g, p: [0.0, 0.27, 0.05], r: [Math.PI / 2, 0, 0.6] });
    return g;
  },
  azucar() {
    const g = group();
    mesh(G.box(0.4, 0.56, 0.26, 0.05), mat('#8fc3ea', { rough: 0.85 }), { parent: g, p: [0, 0.29, -0.04] });
    mesh(G.box(0.42, 0.1, 0.1, 0.03), mat('#bfe0f7', { rough: 0.85 }), { parent: g, p: [0, 0.57, -0.02], r: [0.3, 0, 0] });
    mesh(G.box(0.26, 0.2, 0.02, 0.01), mat('#fffaf0'), { parent: g, p: [0, 0.3, 0.095] });
    mesh(G.box(0.16, 0.035, 0.022, 0.005), mat('#e2664f'), { parent: g, p: [0, 0.33, 0.1] });
    for (const [x, y, z, ry] of [[0.34, 0.05, 0.16, 0.3], [0.2, 0.05, 0.26, -0.4], [0.3, 0.15, 0.2, 0.9]]) mesh(G.box(0.1, 0.1, 0.1, 0.018), mat('#ffffff', { rough: 0.6 }), { parent: g, p: [x, y, z], r: [0, ry, 0] });
    return g;
  },
  semillas: () => jar('#6f5f40', '#c98a5a', { s: 0.03, c: ['#3a2e20', '#f0e2b8', '#8c8a5c'], sc: [1, 0.5, 1.6] }),
  aceitunas: () => jar('#93a35a', '#e2664f', { s: 0.06, c: ['#55622f', '#6b7a3a', '#3c4424'], rough: 0.3 }),
  nueces() {
    const g = group(), r = rnd(3);
    mesh(G.lathe([[0.001, 0], [0.26, 0], [0.36, 0.1], [0.4, 0.3], [0.36, 0.3], [0.32, 0.1], [0.001, 0.08]], 22, false), mat('#c99755', { rough: 0.9 }), { parent: g });
    mesh(G.tor(0.39, 0.03, 6, 24), mat('#b98445'), { parent: g, p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 9; i++) { const a = i * 2.4, d = i ? 0.1 + (i % 3) * 0.09 : 0; mesh(blob((x, y, z) => 1 + Math.sin(x * 9) * Math.sin(y * 7) * Math.sin(z * 8) * 0.12, { ws: 12, hs: 9 }), mat(i % 2 ? '#b98a58' : '#a47446', { rough: 0.8 }), { parent: g, p: [Math.cos(a) * d, 0.3 + (i < 3 ? 0.08 : 0) + r() * 0.03, Math.sin(a) * d], s: [0.1, 0.085, 0.085], r: [r() * 3, r() * 3, 0] }); }
    return g;
  },
  chocolate() {
    const g = group({ r: [0, 0, 0.0] });
    const bar = group({ parent: g, p: [0, 0.3, 0], r: [-1.05, 0.3, 0.12] });
    mesh(G.box(0.46, 0.06, 0.7, 0.02), mat('#5a3524', { rough: 0.35, rim: 0.45 }), { parent: bar });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) mesh(G.box(0.19, 0.05, 0.15, 0.025), mat('#6b4030', { rough: 0.3, rim: 0.45 }), { parent: bar, p: [-0.11 + i * 0.22, 0.035, -0.25 + j * 0.17] });
    mesh(G.box(0.5, 0.08, 0.38, 0.02), mat('#e2664f', { rough: 0.7 }), { parent: bar, p: [0, 0.0, 0.17] });
    mesh(G.box(0.5, 0.085, 0.05, 0.01), mat('#f2c14e', { rough: 0.3, metal: 0.6 }), { parent: bar, p: [0, 0.0, -0.03] });
    mesh(G.box(0.3, 0.02, 0.14, 0.008), mat('#fff3d8'), { parent: bar, p: [0, 0.041, 0.19] });
    return g;
  },
};
const UP_MODEL = {
  bandeja: () => makeTray('barra', 6, 'baked'),
  jardin() {
    const g = group();
    mesh(G.box(0.9, 0.24, 0.3, 0.06), mat('#c98a5a', { rough: 0.8 }), { parent: g, p: [0, 0.12, 0] }); mesh(G.box(0.82, 0.06, 0.22, 0.03), mat('#6b4a3a'), { parent: g, p: [0, 0.23, 0] });
    ['#ff8fa3', '#ffd166', '#ffffff', '#ff9d5c', '#c9a0ff'].forEach((c, i) => { const x = -0.34 + i * 0.17, h = 0.2 + (i % 2) * 0.09; mesh(G.cyl(0.012, 0.012, h, 5), mat('#5aa85a'), { parent: g, p: [x, 0.25 + h / 2, 0] }); mesh(G.tor(0.05, 0.036, 6, 10), mat(c), { parent: g, p: [x, 0.27 + h, 0.01], r: [0.3, 0, 0] }); mesh(G.sph(0.036, 8, 6), mat('#ffcf4d'), { parent: g, p: [x, 0.27 + h, 0.02] }); });
    return g;
  },
  fermenta() {
    const g = group();
    mesh(G.box(0.55, 0.8, 0.4, 0.06), mat('#9ad1c0', { rough: 0.55 }), { parent: g, p: [0, 0.4, 0] });
    mesh(G.box(0.42, 0.56, 0.02, 0.01), mat('#ffd9a0', { emissive: '#ffb347', ei: 0.7 }), { parent: g, p: [0, 0.42, 0.2] });
    for (let i = 0; i < 2; i++) { mesh(G.box(0.42, 0.015, 0.06, 0.005), mat('#4a4654'), { parent: g, p: [0, 0.3 + i * 0.24, 0.215] }); for (const x of [-0.1, 0.1]) mesh(G.sph(0.07, 10, 8), mat('#f6e8cb'), { parent: g, p: [x, 0.35 + i * 0.24, 0.22], s: [1, 0.8, 0.6] }); }
    mesh(G.cap(0.03, 0.4, 8), mat('#fffaf0'), { parent: g, p: [0.4, 0.42, 0.05] }); mesh(G.cap(0.016, 0.24, 6), mat('#e2664f'), { parent: g, p: [0.4, 0.34, 0.07] }); mesh(G.sph(0.06, 10, 8), mat('#e2664f'), { parent: g, p: [0.4, 0.16, 0.06] });
    return g;
  },
  horno2() {
    const g = group(), dome = new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    mesh(G.box(0.86, 0.4, 0.6, 0.05), mat('#d9d2c4', { rough: 1 }), { parent: g, p: [0, 0.2, 0] }); mesh(dome, mat('#d98a5f', { rough: 0.95 }), { parent: g, p: [0, 0.4, 0], s: [1, 0.95, 0.72] });
    for (const [y, s] of [[0.5, 0.16], [0.16, 0.14]]) { mesh(G.cyl(s + 0.03, s + 0.03, 0.04, 16), mat('#2a1a16'), { parent: g, p: [0, y, 0.29], r: [Math.PI / 2, 0, 0], s: [1, 1, 1.15] }); mesh(G.cyl(s, s, 0.05, 16), mat('#ffb04d', { emissive: '#ff8a2a', ei: 1.3 }), { parent: g, p: [0, y, 0.3], r: [Math.PI / 2, 0, 0], s: [1, 1, 1.15] }); }
    return g;
  },
  terraza() {
    const g = group(), par = new THREE.ConeGeometry(0.55, 0.24, 12, 1, true);
    mesh(G.cyl(0.3, 0.3, 0.04, 20), mat('#fffaf0'), { parent: g, p: [0, 0.36, 0] }); mesh(G.cyl(0.025, 0.025, 1.1, 6), mat('#4a4654'), { parent: g, p: [0, 0.55, 0] }); mesh(G.cyl(0.16, 0.18, 0.03, 12), mat('#4a4654'), { parent: g, p: [0, 0.015, 0] });
    for (let i = 0; i < 12; i++) { const s = new THREE.ConeGeometry(0.55, 0.24, 1, 1, true, i * Math.PI / 6, Math.PI / 6); mesh(s, mat(i % 2 ? '#e9785e' : '#fffaf0', { side: THREE.DoubleSide, rough: 0.9, flat: true }), { parent: g, p: [0, 1.12, 0] }); }
    for (const s of [-1, 1]) { mesh(G.cyl(0.14, 0.14, 0.04, 12), mat('#e9785e'), { parent: g, p: [s * 0.5, 0.22, 0.12] }); mesh(G.cyl(0.02, 0.02, 0.22, 5), mat('#4a4654'), { parent: g, p: [s * 0.5, 0.11, 0.12] }); }
    return g;
  },
  farolillos() {
    const g = group();
    const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector3(-0.6 + t * 1.2, 0.85 - Math.sin(t * Math.PI) * 0.22, 0)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.012, 4), mat('#4a4654'), { parent: g });
    ['#ff7b8a', '#ffd166', '#7bd3c4'].forEach((c, i) => { const p = pts[2 + i * 3]; mesh(G.sph(0.17, 14, 10), mat(c, { emissive: c, ei: 0.7, rough: 0.6 }), { parent: g, p: [p.x, p.y - 0.2, 0], s: [1, 1.15, 1] }); for (const s of [-1, 1]) mesh(G.cyl(0.07, 0.07, 0.05, 8), mat('#e9b949'), { parent: g, p: [p.x, p.y - 0.2 + s * 0.19, 0] }); });
    return g;
  },
  huerto() {
    const g = group(); mesh(G.box(0.9, 0.1, 0.6, 0.04), mat('#8a5f3f', { rough: 1 }), { parent: g, p: [0, 0.05, 0] });
    for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) { const x = -0.33 + i * 0.22, z = -0.14 + k * 0.28; if (k) { mesh(G.sph(0.09, 8, 6), mat('#6aa84f'), { parent: g, p: [x, 0.17, z] }); mesh(G.sph(0.035, 6, 5), mat('#3c4424', { rough: 0.3 }), { parent: g, p: [x + 0.05, 0.22, z + 0.06] }); } else for (let l = 0; l < 4; l++) mesh(G.sph(1, 8, 6), mat(l % 2 ? '#58b368' : '#7ccf7f'), { parent: g, p: [x + Math.cos(l * 1.57) * 0.05, 0.2, z + Math.sin(l * 1.57) * 0.05], s: [0.04, 0.14, 0.07], r: [Math.cos(l * 1.57) * 0.5, l, Math.sin(l * 1.57) * 0.5] }); }
    mesh(G.cyl(0.02, 0.02, 0.5, 5), mat('#a9744b'), { parent: g, p: [0.38, 0.3, -0.2] }); mesh(G.box(0.26, 0.16, 0.03, 0.01), mat('#fff3d8'), { parent: g, p: [0.38, 0.5, -0.19] });
    return g;
  },
  reforma() {
    const g = group();
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) mesh(G.box(0.2, 0.04, 0.2, 0.01), mat((i + j) % 2 ? '#f3c98a' : '#fff6e0', { rough: 0.5 }), { parent: g, p: [-0.3 + i * 0.2, 0.02, -0.2 + j * 0.2] });
    mesh(G.box(0.82, 0.5, 0.05, 0.02), mat('#fff6e6'), { parent: g, p: [0, 0.3, -0.33] });
    for (let i = 0; i < 6; i++) mesh(G.box(0.125, 0.12, 0.02, 0.008), mat(i % 2 ? '#9fc4e8' : '#fffaf0', { rough: 0.4 }), { parent: g, p: [-0.34 + i * 0.136, 0.11, -0.3] });
    ['#e2664f', '#f2b84b', '#6fbfae', '#8fa8ff'].forEach((c, i) => mesh(G.cone(0.07, 0.13, 3), mat(c, { side: THREE.DoubleSide }), { parent: g, p: [-0.27 + i * 0.18, 0.44, -0.29], r: [Math.PI, 0.52, 0], s: [1, 1, 0.15] }));
    const br = group({ parent: g, p: [0.2, 0.06, 0.2], r: [0, 0.6, -1.0] }); mesh(G.cyl(0.018, 0.018, 0.42, 6), mat('#c98a5a'), { parent: br, p: [0, 0.2, 0] }); mesh(G.box(0.12, 0.06, 0.04, 0.01), mat('#8fa8ff'), { parent: br, p: [0, 0.43, 0] });
    return g;
  },
  molino() {
    const g = group();
    mesh(G.lathe([[0.26, 0], [0.24, 0.1], [0.18, 0.62], [0.001, 0.62]], 16, false), mat('#fff6ea'), { parent: g }); mesh(G.cone(0.22, 0.22, 16), mat('#d9714e'), { parent: g, p: [0, 0.73, 0] });
    const sa = group({ parent: g, p: [0, 0.56, 0.2], r: [0, 0, 0.5] }); for (let i = 0; i < 4; i++) { const b = group({ parent: sa, r: [0, 0, i * Math.PI / 2] }); mesh(G.box(0.025, 0.46, 0.02, 0.005), mat('#8f6a4a'), { parent: b, p: [0, 0.23, 0] }); mesh(G.box(0.12, 0.32, 0.012, 0.004), mat('#fff3d8'), { parent: b, p: [0.065, 0.28, 0] }); }
    mesh(G.box(0.1, 0.16, 0.02, 0.03), mat('#8f6a4a'), { parent: g, p: [0, 0.08, 0.25] });
    return g;
  },
  puesto() {
    const g = group();
    mesh(G.box(0.8, 0.3, 0.34, 0.03), mat('#f4dcae'), { parent: g, p: [0, 0.15, 0] }); mesh(G.box(0.86, 0.04, 0.4, 0.015), mat('#c98a5a'), { parent: g, p: [0, 0.32, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(G.cyl(0.018, 0.018, 0.86, 5), mat('#8f6a4a'), { parent: g, p: [sx * 0.4, 0.43, sz * 0.17] });
    for (let i = 0; i < 6; i++) mesh(G.box(0.15, 0.025, 0.56, 0.008), mat(i % 2 ? '#fff6e2' : '#e2664f'), { parent: g, p: [-0.375 + i * 0.15, 0.88, 0.03], r: [0.28, 0, 0] });
    for (const [id, x] of [['hogaza', -0.22], ['barra', 0.18]]) { const b = makeBread(id); b.scale.setScalar(0.42); b.position.set(x, 0.34, 0.03); b.rotation.y = 0.5; g.add(b); }
    return g;
  },
  fuente() {
    const g = group(), st = mat('#d9d2c4', { rough: 1 }), w = mat('#7fd3f0', { rough: 0.15 });
    mesh(G.lathe([[0.001, 0], [0.5, 0], [0.52, 0.04], [0.5, 0.18], [0.44, 0.2], [0.4, 0.16], [0.4, 0.06], [0.001, 0.06]], 24, false), st, { parent: g });
    mesh(G.lathe([[0.1, 0.05], [0.06, 0.2], [0.05, 0.36], [0.18, 0.42], [0.2, 0.46], [0.16, 0.47], [0.04, 0.44], [0.03, 0.56], [0.001, 0.58]], 14), st, { parent: g });
    mesh(G.cyl(0.41, 0.41, 0.02, 24), w, { parent: g, p: [0, 0.15, 0] }); mesh(G.cyl(0.165, 0.165, 0.02, 16), w, { parent: g, p: [0, 0.455, 0] });
    for (let i = 0; i < 5; i++) mesh(G.cap(0.012, 0.26, 5), mat('#cdeffc', { emissive: '#bfeaff', ei: 0.4 }), { parent: g, p: [Math.cos(i * 1.257) * 0.17, 0.31, Math.sin(i * 1.257) * 0.17] });
    return g;
  },
};

export function renderExtras(size = 200) {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(size, size); r.setPixelRatio(1);
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xd8b890, 1.5));
  const d = new THREE.DirectionalLight(0xfff2dc, 2.2); d.position.set(-1.2, 2.2, 2); sc.add(d);
  const k = bend.k.value; bend.k.value = 0;
  const box = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3();
  const shot = (obj, o = {}) => {
    sc.add(obj); obj.updateMatrixWorld(true); box.setFromObject(obj); box.getCenter(c); box.getSize(s);
    const m = Math.max(s.x, s.y * 1.05, s.z * 0.7) * (o.fit || 1);
    cam.position.set(c.x + m * (o.side ?? 0.5), c.y + m * (o.up ?? 1.15), c.z + m * 2.5); cam.lookAt(c.x, c.y, c.z);
    r.render(sc, cam); const url = r.domElement.toDataURL('image/png'); sc.remove(obj); return url;
  };
  const out = { ing: {}, up: {}, face: {} };
  for (const id in ING_MODEL) out.ing[id] = shot(ING_MODEL[id](), { fit: 1.02 });
  for (const id in UP_MODEL) out.up[id] = shot(UP_MODEL[id](), { fit: 1.02, up: id === 'bandeja' ? 1.6 : 0.9 });
  // retratos: busto mirando un poco de lado
  const bust = (look, ex) => {
    const ch = makeChar({ ...look, scale: 1 }); ch.blinkT = 9; if (ex !== 'idle') ch.say(ex, 9); ch.yaw = ch.yawTo = -0.28; updateChar(ch, 0.02);
    sc.add(ch.root); ch.root.updateMatrixWorld(true);
    const tall = look.sp === 'liebre' ? 0.22 : look.acc === 'gorro' ? 0.14 : 0;
    cam.position.set(0.25, 1.5 + tall * 0.5, 3.1 + tall * 1.6); cam.lookAt(0, 1.06 + tall * 0.5, 0);
    r.render(sc, cam); const url = r.domElement.toDataURL('image/png'); sc.remove(ch.root); return url;
  };
  const looks = { pan: PAN_LOOK, miga: MIGA_LOOK, pipa: PIPA_LOOK }; for (const id in NEIGH) looks[id] = NEIGH[id].look;
  for (const id in looks) out.face[id] = { idle: bust(looks[id], 'idle'), happy: bust(looks[id], 'happy'), talk: bust(looks[id], 'talk') };
  out.up.miga = out.face.miga.happy;
  bend.k.value = k; r.dispose(); r.forceContextLoss?.();
  return out;
}
