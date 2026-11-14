// Modelos de los diez panes (geometría deformada + color por vértice) e iconos.
import { THREE, mat, mesh, group, G, blob, rnd, smoothNoise, bend, clamp } from './gfx.js';
import { BREAD_ORDER } from './data.js';

const C = (h) => new THREE.Color(h);
const PALE = C('#f3dcab'), GOLD = C('#dc9a40'), DARK = C('#a25f26'), CREAM = C('#fbe9c0'), FLOUR = C('#fff8ea');
const ss = THREE.MathUtils.smoothstep;
const gauss = (x, w) => Math.exp(-(x * x) / (w * w));
const tmp = new THREE.Vector3();

function crust(y, a = PALE, b = GOLD, c = DARK) {
  const col = a.clone().lerp(b, ss(y, -0.5, 0.35));
  return col.lerp(c, ss(y, 0.55, 1) * 0.55);
}
function shaped(fn, o = {}) {
  let last = null;
  const g = blob((x, y, z, v) => { const r = fn(x, y, z); last = r[1]; return v.set(r[0][0], r[0][1], r[0][2]); }, { ws: o.ws || 44, hs: o.hs || 26, color: () => last });
  return mesh(g, mat(0xffffff, { vc: true, rough: o.rough ?? 0.78, rim: o.rim ?? 0.3, nocache: true }));
}
function sprinkle(parent, n, seed, posFn, geo, colors, o = {}) {
  const r = rnd(seed);
  const im = new THREE.InstancedMesh(geo, mat(0xffffff, { rough: o.rough ?? 0.7, nocache: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const pt = posFn(r, i); p.set(pt[0], pt[1], pt[2]);
    e.set(r() * 6, r() * 6, r() * 6); q.setFromEuler(e);
    const k = (o.s || 1) * (0.75 + r() * 0.5);
    s.set(k, k * (o.flat || 1), k * (o.long || 1));
    m.compose(p, q, s); im.setMatrixAt(i, m); im.setColorAt(i, C(colors[Math.floor(r() * colors.length)]));
  }
  im.castShadow = true; im.frustumCulled = false; parent.add(im); return im;
}
const flat = (y, k = 0.45) => (y < 0 ? y * k : y);

const MAKE = {
  barra() {
    const f = (x, y, z) => {
      const tp = 1 - Math.pow(Math.abs(x), 4) * 0.4;
      const q = (x * 0.5 + z * 0.14) / 0.19 + 0.5, s = q - Math.floor(q);
      const top = ss(y, 0.2, 0.6) * (Math.abs(x) < 0.86 ? 1 : 0);
      const m = gauss(s - 0.5, 0.17) * top;
      const ear = gauss(Math.abs(s - 0.5) - 0.24, 0.07) * top;
      const col = crust(y).lerp(CREAM, m * 0.9).lerp(DARK, ear * 0.55);
      col.lerp(FLOUR, ss(smoothNoise(x * 9, y * 9, z * 9), 0.45, 0.8) * 0.3 * top);
      return [[x * 0.5, flat(y) * 0.105 * tp + m * 0.012 - ear * 0.004, z * 0.115 * tp], col];
    };
    return shaped(f, { ws: 64, hs: 28 });
  },
  hogaza() {
    const f = (x, y, z) => {
      const top = ss(y, 0.3, 0.7);
      const m = Math.max(gauss(Math.abs(x) - 0.36, 0.075), gauss(Math.abs(z) - 0.36, 0.075)) * top;
      const r = Math.hypot(x, z), ring = ss(Math.sin(r * 34), 0.0, 0.6) * ss(y, 0.15, 0.5);
      const col = crust(y, PALE, C('#cf8a35'), C('#94531f')).lerp(FLOUR, ring * 0.5 * (1 - m)).lerp(CREAM, m * 0.9);
      col.lerp(DARK, gauss(Math.abs(Math.abs(x) - 0.36) - 0.1, 0.03) * top * 0.3);
      const k = 1 + smoothNoise(x * 3, y * 3, z * 3) * 0.03;
      return [[x * 0.26 * k, (y > 0 ? y * 0.19 : y * 0.07) + m * 0.014, z * 0.26 * k], col];
    };
    return shaped(f, { ws: 56, hs: 30 });
  },
  mollete() {
    const f = (x, y, z) => {
      const n = smoothNoise(x * 6 + 3, y * 6, z * 6);
      const col = C('#f4dfb4').lerp(C('#e2b877'), ss(y, -0.6, 0.1) * (1 - ss(y, 0.1, 0.6)) * 0.9).lerp(FLOUR, ss(y, 0.2, 0.7) * (0.55 + n * 0.45));
      const dimple = gauss(Math.hypot(x, z), 0.25) * (y > 0 ? 1 : 0);
      return [[x * 0.25, (y > 0 ? y * 0.1 : y * 0.045) - dimple * 0.012, z * 0.2], col];
    };
    return shaped(f, { rough: 0.95 });
  },
  centeno() {
    const f = (x, y, z) => {
      const n = smoothNoise(x * 5.5, y * 5.5 + 2, z * 5.5), crack = gauss(n, 0.16);
      const top = ss(y, -0.1, 0.4);
      const col = C('#8a5a34').lerp(C('#5e3a20'), ss(y, 0.5, 1) * 0.4).lerp(C('#efe2c8'), top * (1 - crack) * 0.75).lerp(C('#4f2f1a'), crack * top * 0.7);
      return [[x * 0.24, (y > 0 ? y * 0.17 : y * 0.06) - crack * top * 0.01, z * 0.24], col];
    };
    return shaped(f, { ws: 56, hs: 30, rough: 0.9 });
  },
  semillas() {
    const pos = (x, y, z) => { const tp = 1 - Math.pow(Math.abs(x), 3) * 0.3; return [x * 0.34, flat(y) * 0.15 * tp, z * 0.17 * tp]; };
    const f = (x, y, z) => {
      const m = gauss(z, 0.2) * ss(y, 0.4, 0.8) * (Math.abs(x) < 0.8 ? 1 : 0);
      const p = pos(x, y, z); p[1] += m * 0.012;
      return [p, crust(y, C('#d9b27a'), C('#b0733a'), C('#7c4a22')).lerp(C('#e9cfa0'), m * 0.9)];
    };
    const g = group({}, shaped(f));
    sprinkle(g, 90, 7, (r) => {
      const a = r() * Math.PI * 2, e = 0.15 + r() * 0.8; tmp.set(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e) * 0.99);
      if (Math.abs(tmp.z) < 0.22 && tmp.y > 0.5) tmp.z += 0.3 * Math.sign(tmp.z || 1); tmp.normalize();
      const p = pos(tmp.x, tmp.y, tmp.z); return [p[0], p[1] + 0.004, p[2]];
    }, G.sph(0.011, 6, 5), ['#3a2e20', '#f0e2b8', '#f0e2b8', '#8c8a5c', '#5b4630'], { flat: 0.5, long: 1.6 });
    return g;
  },
  chapata() {
    const pos = (x, y, z) => {
      const n = smoothNoise(x * 4, y * 4, z * 4) * 0.02;
      return [Math.sign(x) * Math.pow(Math.abs(x), 0.62) * 0.34, (y > 0 ? y * 0.085 : y * 0.035) + n * (y > 0 ? 1 : 0), Math.sign(z) * Math.pow(Math.abs(z), 0.62) * 0.2];
    };
    const f = (x, y, z) => {
      const n = smoothNoise(x * 7 + 1, y * 7, z * 7);
      return [pos(x, y, z), C('#f0d6a0').lerp(C('#d9a558'), ss(n, -0.3, 0.5) * 0.8).lerp(FLOUR, ss(n, 0.35, 0.8) * ss(y, 0, 0.5) * 0.7)];
    };
    const g = group({}, shaped(f));
    sprinkle(g, 11, 21, (r) => { const x = (r() - 0.5) * 1.5, z = (r() - 0.5) * 1.3; tmp.set(x, 0.75, z).normalize(); const p = pos(tmp.x, tmp.y, tmp.z); return [p[0], p[1] - 0.006, p[2]]; },
      G.sph(0.024, 10, 8), ['#55622f', '#3c4424', '#2f2a2a', '#6b7a3a'], { rough: 0.35, flat: 0.8 });
    return g;
  },
  nueces() {
    const pos = (x, y, z) => { const tp = 1 - Math.pow(Math.abs(x), 3) * 0.3; return [x * 0.3, flat(y) * 0.16 * tp, z * 0.18 * tp]; };
    const f = (x, y, z) => {
      const q = (x * 0.3 - z * 0.12) / 0.2 + 0.5, s = q - Math.floor(q), top = ss(y, 0.3, 0.7) * (Math.abs(x) < 0.8 ? 1 : 0);
      const m = gauss(s - 0.5, 0.15) * top; const p = pos(x, y, z); p[1] += m * 0.01;
      return [p, crust(y, C('#c99a66'), C('#99612f'), C('#6b3f1c')).lerp(C('#e2c090'), m * 0.9).lerp(FLOUR, ss(smoothNoise(x * 8, y * 8, z * 8), 0.3, 0.8) * 0.35 * top)];
    };
    const g = group({}, shaped(f));
    sprinkle(g, 12, 33, (r) => { const a = r() * 6.28, e = 0.2 + r() * 0.9; tmp.set(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)); const p = pos(tmp.x, tmp.y, tmp.z); return [p[0], p[1], p[2]]; },
      G.ico(0.024, 1), ['#b98a58', '#a47446', '#caa06e'], { flat: 0.8 });
    return g;
  },
  brioche() {
    const base = shaped((x, y, z) => {
      const a = Math.atan2(z, x), fl = 1 + 0.09 * Math.cos(a * 10) * (1 - ss(y, 0.0, 0.7));
      const w = 0.2 * fl * (y < 0 ? 0.8 + 0.2 * (1 + y) : 1);
      return [[x * w, y > 0 ? y * 0.13 : y * 0.1, z * w], C('#f3cf82').lerp(C('#e39a33'), ss(y, -0.2, 0.35)).lerp(C('#b9661e'), ss(y, 0.5, 1) * 0.8)];
    }, { rough: 0.38, rim: 0.4 });
    base.position.y = 0.1;
    const head = shaped((x, y, z) => [[x * 0.1, y * 0.09, z * 0.1], C('#e39a33').lerp(C('#b05f1b'), ss(y, 0, 0.9) * 0.9)], { ws: 24, hs: 16, rough: 0.34, rim: 0.4 });
    head.position.y = 0.245;
    const g = group({}, base, head);
    sprinkle(g, 9, 5, (r) => { const a = r() * 6.28, d = r() * 0.06; return [Math.cos(a) * d, 0.325 - d * 0.5, Math.sin(a) * d]; }, G.sph(0.012, 6, 5), ['#ffffff', '#fff6e0'], { rough: 0.5 });
    return g;
  },
  caracola() {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 5.2, r = 0.035 + t * 0.19; pts.push(new THREE.Vector3(Math.cos(a) * r, 0.07 + (1 - t) * 0.035, Math.sin(a) * r)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 120, 0.058, 12, false);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      c.copy(C('#f1cf8c')).lerp(C('#dd9a3c'), ss(y, 0.05, 0.11)).lerp(C('#b5681f'), ss(y, 0.115, 0.15) * 0.7);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const roll = mesh(geo, mat(0xffffff, { vc: true, rough: 0.42, rim: 0.4, nocache: true }));
    const g = group({}, roll);
    // tapa del extremo y pepitas de chocolate entre las vueltas
    mesh(G.sph(0.058, 12, 10), mat('#dd9a3c', { rough: 0.42 }), { p: pts[60].toArray(), parent: g });
    sprinkle(g, 22, 12, (r) => { const t = 0.08 + r() * 0.9, a = t * Math.PI * 5.2 + 0.2, rr = 0.035 + t * 0.19 + (r() - 0.5) * 0.05; return [Math.cos(a) * rr, 0.128 + (1 - t) * 0.03, Math.sin(a) * rr]; },
      G.sph(0.016, 7, 6), ['#4a2a1b', '#3a1f14', '#5c3524'], { rough: 0.3, flat: 0.8 });
    return g;
  },
  coca() {
    const pos = (x, y, z) => [x * 0.33, y > 0 ? y * 0.045 : y * 0.025, z * 0.2];
    const g = group({}, shaped((x, y, z) => { const n = smoothNoise(x * 9, y * 9, z * 9), edge = ss(Math.hypot(x, z * 1.1), 0.7, 1); return [pos(x, y, z), C('#f6dfae').lerp(C('#dd9a3c'), edge * 0.9 + ss(n, 0.1, 0.7) * 0.35).lerp(C('#fff8ea'), ss(n, -0.6, -0.1) * 0.5 * (1 - edge))]; }, { rough: 0.6 }));
    sprinkle(g, 46, 4, (r) => { const a = r() * 6.28, d = Math.sqrt(r()) * 0.8; tmp.set(Math.cos(a) * d, 0.6, Math.sin(a) * d).normalize(); const p = pos(tmp.x, tmp.y, tmp.z); return [p[0], p[1] + 0.004, p[2]]; }, G.sph(0.009, 6, 5), ['#ffffff', '#fff6e0'], { rough: 0.4 });
    sprinkle(g, 16, 9, (r) => { const a = r() * 6.28, d = Math.sqrt(r()) * 0.75; tmp.set(Math.cos(a) * d, 0.7, Math.sin(a) * d).normalize(); const p = pos(tmp.x, tmp.y, tmp.z); return [p[0], p[1] + 0.006, p[2]]; }, G.sph(0.016, 8, 6), ['#f1dcae', '#e9cf9a'], { flat: 0.6, long: 1.9 });
    return g;
  },
  calabaza() {
    const g = group({}, shaped((x, y, z) => { const a = Math.atan2(z, x), lobe = 1 + Math.cos(a * 8) * 0.07 * (1 - Math.abs(y) * 0.6), groove = gauss(Math.cos(a * 8) + 1, 0.35); return [[x * 0.24 * lobe, y > 0 ? y * 0.17 : y * 0.07, z * 0.24 * lobe], C('#f2b45a').lerp(C('#d9812a'), ss(y, -0.2, 0.7) * 0.8).lerp(C('#a85a1c'), groove * 0.5 * ss(y, 0, 0.5))]; }, { ws: 56, hs: 28 }));
    mesh(G.cyl(0.02, 0.03, 0.06, 6), mat('#6a7a3a'), { parent: g, p: [0, 0.185, 0] });
    sprinkle(g, 14, 6, (r) => { const a = r() * 6.28, d = 0.03 + r() * 0.1; return [Math.cos(a) * d, 0.168 - d * 0.25, Math.sin(a) * d]; }, G.sph(0.014, 7, 5), ['#dfe8c0', '#c9d3a0'], { flat: 0.5, long: 1.8 });
    return g;
  },
  rosca() {
    const geo = new THREE.TorusGeometry(0.19, 0.08, 18, 48);
    geo.rotateX(-Math.PI / 2); geo.scale(1, 0.82, 1); geo.translate(0, 0.066, 0);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)), cut = gauss(((a * 8 / (Math.PI * 2)) % 1 + 1) % 1 - 0.5, 0.12) * ss(y, 0.08, 0.12);
      c.copy(C('#f2d291')).lerp(C('#d98c2e'), ss(y, 0.02, 0.09)).lerp(C('#a85c1c'), ss(y, 0.1, 0.132) * 0.75).lerp(C('#f6dfae'), cut * 0.6);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const g = group({}, mesh(geo, mat(0xffffff, { vc: true, rough: 0.36, rim: 0.4, nocache: true })));
    const on = (r, jitter = 0.035) => { const a = r() * 6.28, rr = 0.19 + (r() - 0.5) * jitter * 2; return [Math.cos(a) * rr, 0.128, Math.sin(a) * rr]; };
    sprinkle(g, 40, 3, (r) => on(r, 0.045), G.sph(0.011, 6, 5), ['#ffffff'], { rough: 0.5 });
    sprinkle(g, 7, 8, (r, i) => { const a = i / 7 * 6.28 + 0.2; return [Math.cos(a) * 0.19, 0.134, Math.sin(a) * 0.19]; }, G.box(0.05, 0.022, 0.03, 0.01), ['#e2485a', '#59b56a', '#f09a3a'], { rough: 0.25 });
    sprinkle(g, 10, 14, (r) => on(r), G.sph(0.02, 8, 6), ['#f5e3bf', '#ecd5a8'], { flat: 0.25, long: 1.7 });
    return g;
  },
};

const protos = {};
/** Devuelve un pan nuevo (clonado). tone: 0 normal, 1 muy tostado. */
export function makeBread(id, tone = 0) {
  if (!protos[id]) protos[id] = MAKE[id]();
  const b = protos[id].clone(true);
  if (tone > 0) b.traverse(o => {
    if (!o.isMesh) return;
    const src = o.material, m = src.clone();
    m.onBeforeCompile = src.onBeforeCompile; m.customProgramCacheKey = src.customProgramCacheKey;
    m.color.setRGB(1 - tone * 0.42, 1 - tone * 0.5, 1 - tone * 0.55); o.material = m;
  });
  b.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  b.userData.bread = id;
  return b;
}

let doughGeo;
export function makeDough(proofed = false, tint = '#f6e8cb') {
  if (!doughGeo) doughGeo = blob((x, y, z, v) => v.set(x * 0.15, y > 0 ? y * 0.11 : y * 0.05, z * 0.15), { ws: 20, hs: 14 });
  const m = mesh(doughGeo, mat(tint, { rough: 0.9, rim: 0.35 }));
  if (proofed) m.scale.set(1.25, 1.5, 1.25);
  return m;
}
export const DOUGH_TINT = { calabaza: '#f0c27a', coca: '#f8e6b4', centeno: '#b99a7c', semillas: '#dcc39a', nueces: '#d2b48c', brioche: '#f8e2a0', caracola: '#f3dba0', rosca: '#f6dfa6' };

/** Bandeja de madera con n piezas (masa, masa fermentada o pan). */
export function makeTray(id, n, stage, tone = 0) {
  const g = group();
  mesh(G.box(0.92, 0.035, 0.6, 0.015), mat('#c9a06a', { rough: 0.7 }), { parent: g, p: [0, 0.018, 0] });
  mesh(G.box(0.88, 0.012, 0.56, 0.005), mat('#f1e6d2', { rough: 0.95 }), { parent: g, p: [0, 0.04, 0] });
  const cols = n > 6 ? 4 : n > 4 ? 3 : 2, rows = n > 8 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const cx = (i % cols - (cols - 1) / 2) * (0.84 / cols), cz = (Math.floor(i / cols) - (rows - 1) / 2) * (0.54 / rows);
    let it;
    if (stage === 'baked') { it = makeBread(id, tone); it.scale.setScalar(n > 8 ? 0.34 : n > 6 ? 0.4 : n > 4 ? 0.5 : 0.62); it.rotation.y = (id === 'barra' || id === 'semillas' || id === 'nueces' || id === 'chapata') ? Math.PI / 2 + (i % 2 ? 0.08 : -0.08) : i * 1.3; }
    else { it = makeDough(stage === 'proofed', DOUGH_TINT[id]); it.scale.multiplyScalar(n > 8 ? 0.5 : n > 6 ? 0.6 : n > 4 ? 0.75 : 0.9); }
    it.position.set(cx, 0.046 + (stage === 'baked' ? 0 : 0.04), cz);
    g.add(it);
  }
  g.userData.items = g.children.slice(2);
  return g;
}

/** Dibuja un icono de cada pan con un renderizador pequeño y devuelve {id: dataURL}. */
export function renderIcons(size = 160) {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(size, size); r.setPixelRatio(1);
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(24, 1, 0.1, 10);
  cam.position.set(0, 1.25, 1.35); cam.lookAt(0, 0.06, 0);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xd8b890, 1.5));
  const d = new THREE.DirectionalLight(0xfff2dc, 2.2); d.position.set(-1, 2, 1.5); sc.add(d);
  const k = bend.k.value; bend.k.value = 0;
  const out = {};
  for (const id of [...BREAD_ORDER, '_masa']) {
    const b = id === '_masa' ? makeDough(true) : makeBread(id);
    if (id === '_masa') b.scale.multiplyScalar(1.6);
    b.rotation.y = id === 'barra' ? -0.6 : -0.4;
    if (id === 'barra') b.scale.setScalar(0.92);
    sc.add(b); r.render(sc, cam); out[id] = r.domElement.toDataURL('image/png'); sc.remove(b);
  }
  bend.k.value = k;
  r.dispose(); r.forceContextLoss?.();
  return out;
}
export { clamp };
