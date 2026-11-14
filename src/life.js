// Vida ambiental: mariposas, gorriones que echan a volar y un gato de plaza.
import { THREE, mat, mesh, group, G, blob, scene } from './gfx.js';

const flies = [], birds = []; export const cat = { x: -13.9, z: 7.0, g: null, t: 0, purr: 0 };
const SPOTS = [[-12.5, 4.6], [-6, 5.2], [2.5, 5.6], [8, 4.4], [-3, 8.2], [6.5, 9], [-15, 8.5], [13.5, 4.5], [-9, 2.4], [10.5, 1.2]];
const PERCH = [[-11.5, 3.6, 1.2], [3.2, 3.4, 8.6], [15.3, 3.3, 3.2], [-14.5, 3.6, 9.4], [-4.5, 3.2, 9.6], [11.6, 3.4, 0.6]];

export function initLife() {
  const cols = ['#ffd166', '#ff9ac1', '#9fd8ff', '#ffffff', '#c9a0ff', '#ffb86b'];
  for (let i = 0; i < 6; i++) {
    const g = group({ parent: scene }), wm = mat(cols[i], { rough: 0.8, side: THREE.DoubleSide });
    const wl = group({ parent: g }), wr = group({ parent: g });
    mesh(G.sph(1, 8, 6), wm, { parent: wl, p: [-0.07, 0, 0], s: [0.075, 0.008, 0.06], cast: false }); mesh(G.sph(1, 8, 6), wm, { parent: wr, p: [0.07, 0, 0], s: [0.075, 0.008, 0.06], cast: false });
    mesh(G.cap(0.012, 0.07, 4), mat('#4a3a30'), { parent: g, r: [Math.PI / 2, 0, 0], cast: false });
    const s = SPOTS[i % SPOTS.length]; g.position.set(s[0], 0.8, s[1]);
    flies.push({ g, wl, wr, to: [s[0], s[1]], t: Math.random() * 9, ph: Math.random() * 6 });
  }
  for (let i = 0; i < 5; i++) {
    const g = group({ parent: scene }), bm = mat(i % 2 ? '#a9826a' : '#8f7462', { rough: 0.95 });
    mesh(blob((x, y, z, v) => v.set(x * 0.085, y * 0.075 + 0.085, z * 0.12), { ws: 10, hs: 8 }), bm, { parent: g });
    mesh(G.sph(0.06, 10, 8), bm, { parent: g, p: [0, 0.16, 0.09] }); mesh(G.sph(0.045, 8, 6), mat('#f1e2cc'), { parent: g, p: [0, 0.075, 0.07], s: [1, 0.9, 1.1] });
    mesh(G.cone(0.018, 0.045, 5), mat('#e9a53a'), { parent: g, p: [0, 0.155, 0.155], r: [Math.PI / 2, 0, 0] });
    for (const sd of [-1, 1]) mesh(G.sph(0.01, 5, 4), mat('#2a1d1a'), { parent: g, p: [sd * 0.03, 0.175, 0.135] });
    mesh(G.box(0.05, 0.012, 0.1, 0.004), bm, { parent: g, p: [0, 0.1, -0.14], r: [0.4, 0, 0] });
    const wings = [-1, 1].map(sd => mesh(G.sph(1, 8, 6), mat('#7a6050', { rough: 0.95 }), { parent: g, p: [sd * 0.08, 0.1, 0], s: [0.03, 0.05, 0.09] }));
    const s = SPOTS[(i * 3 + 1) % SPOTS.length]; g.position.set(s[0] + i * 0.35, 0, s[1] + (i % 2) * 0.4);
    birds.push({ g, wings, st: 'ground', t: Math.random() * 3, hop: 0, vy: 0, home: [s[0] + i * 0.35, s[1] + (i % 2) * 0.4], to: null });
  }
  // gato
  const c = cat.g = group({ parent: scene, p: [cat.x, 0.47, cat.z], r: [0, 1.2, 0] }), fur = mat('#f0a85a', { rough: 0.95, rim: 0.35 }), wh = mat('#fff6ea', { rough: 0.95 });
  mesh(blob((x, y, z, v) => v.set(x * 0.2, y * 0.15 + 0.14, z * 0.3), { ws: 14, hs: 10 }), fur, { parent: c });
  const hd = cat.head = group({ parent: c, p: [0, 0.27, 0.26] }); mesh(G.sph(0.15, 14, 10), fur, { parent: hd, s: [1.1, 0.95, 1] }); mesh(G.sph(0.07, 10, 8), wh, { parent: hd, p: [0, -0.04, 0.11], s: [1.3, 0.8, 0.8] }); mesh(G.sph(0.018, 6, 5), mat('#e88a96'), { parent: hd, p: [0, -0.02, 0.165] });
  for (const sd of [-1, 1]) { mesh(G.cone(0.06, 0.1, 4), fur, { parent: hd, p: [sd * 0.1, 0.14, 0] }); cat['eye' + sd] = mesh(G.sph(0.022, 6, 5), mat('#2a1d1a'), { parent: hd, p: [sd * 0.06, 0.03, 0.135], s: [1, 0.25, 0.5] }); }
  cat.tail = group({ parent: c, p: [0, 0.14, -0.28] }); mesh(G.cap(0.035, 0.34, 6), fur, { parent: cat.tail, p: [0.16, 0.02, 0], r: [0, 0, Math.PI / 2 - 0.3] });
  for (const sd of [-1, 1]) mesh(G.sph(0.06, 8, 6), wh, { parent: c, p: [sd * 0.09, 0.03, 0.27], s: [1, 0.6, 1.3] });
}
export function updateLife(dt, t, pan, o = {}) {
  const hide = !!o.rain;
  for (const f of flies) {
    f.g.visible = !hide && !o.night; if (!f.g.visible) continue; f.t -= dt;
    if (f.t < 0) { const s = SPOTS[Math.floor(Math.random() * SPOTS.length)]; f.to = [s[0] + Math.random() * 3 - 1.5, s[1] + Math.random() * 3 - 1.5]; f.t = 3 + Math.random() * 5; }
    const p = f.g.position, dx = f.to[0] - p.x, dz = f.to[1] - p.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(1.1, d);
    p.x += dx / d * sp * dt + Math.sin(t * 3 + f.ph) * 0.5 * dt; p.z += dz / d * sp * dt + Math.cos(t * 2.3 + f.ph) * 0.5 * dt; p.y = 0.75 + Math.sin(t * 2.1 + f.ph) * 0.25 + Math.sin(t * 5.3 + f.ph) * 0.06;
    f.g.rotation.y = Math.atan2(dx, dz); const w = Math.sin(t * 22 + f.ph) * 0.95; f.wl.rotation.z = w; f.wr.rotation.z = -w;
  }
  for (const b of birds) {
    b.g.visible = !hide; if (hide) continue; const p = b.g.position; b.t -= dt;
    const near = Math.hypot(pan.x - p.x, pan.z - p.z) < 2.3;
    if (b.st === 'ground') {
      if (near) { b.st = 'fly'; const pe = PERCH[Math.floor(Math.random() * PERCH.length)]; b.to = [pe[0] + Math.random() - 0.5, pe[1], pe[2] + Math.random() - 0.5]; b.t = 7 + Math.random() * 6; o.onFlush?.(p.x, p.z); }
      else if (b.t < 0) { b.t = 0.5 + Math.random() * 1.8; if (Math.random() < 0.6) { b.hop = 1; b.g.rotation.y += (Math.random() - 0.5) * 1.6; } else b.peck = 0.5; }
      if (b.hop > 0) { b.hop -= dt * 4; const k = Math.max(0, b.hop); p.y = Math.sin((1 - k) * Math.PI) * 0.09; p.x += Math.sin(b.g.rotation.y) * dt * 0.7; p.z += Math.cos(b.g.rotation.y) * dt * 0.7; }
      b.peck = Math.max(0, (b.peck || 0) - dt); b.g.rotation.x = b.peck > 0 ? Math.sin(b.peck * 25) * 0.5 + 0.4 : 0;
      b.wings.forEach((w, i) => w.rotation.z = 0);
    } else {
      const dx = b.to[0] - p.x, dy = b.to[1] - p.y, dz = b.to[2] - p.z, d = Math.hypot(dx, dy, dz);
      if (d > 0.15) { const sp = 6; p.x += dx / d * sp * dt; p.y += dy / d * sp * dt + (b.st === 'fly' ? 0.9 * dt : 0); p.z += dz / d * sp * dt; b.g.rotation.y = Math.atan2(dx, dz); b.g.rotation.x = -0.3; b.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * Math.sin(t * 34) * 1.1); }
      else if (b.st === 'fly') { b.g.rotation.x = 0; b.wings.forEach(w => w.rotation.z = 0); if (b.t < 0) { b.st = 'land'; const s = SPOTS[Math.floor(Math.random() * SPOTS.length)]; b.to = [s[0] + Math.random() * 2 - 1, 0, s[1] + Math.random() * 2 - 1]; } }
      else { b.st = 'ground'; p.y = 0; b.g.rotation.x = 0; b.t = 1; }
    }
  }
  cat.g.visible = !hide; cat.t += dt; cat.purr = Math.max(0, cat.purr - dt);
  cat.tail.rotation.y = Math.sin(t * (cat.purr > 0 ? 6 : 1.4)) * 0.5; const close = Math.hypot(pan.x - cat.x, pan.z - cat.z) < 3;
  cat.head.rotation.y += ((close ? Math.max(-0.9, Math.min(0.9, Math.atan2(pan.x - cat.x, pan.z - cat.z) - 1.2)) : 0) - cat.head.rotation.y) * (1 - Math.exp(-dt * 5));
  for (const sd of [-1, 1]) cat['eye' + sd].scale.y = close && cat.purr <= 0 ? 1.2 : 0.25; cat.g.scale.y = 1 + Math.sin(t * 2) * 0.02 + (cat.purr > 0 ? Math.sin(t * 30) * 0.012 : 0);
}
