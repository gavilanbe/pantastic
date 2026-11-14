// Personajes: Pan (humana) y los vecinos animales. Caras pintadas en lienzo, cuerpo de piezas rígidas.
import { THREE, mat, mesh, group, G, canvasTex, rnd, Spring, angLerp, clamp, lerp, blob } from './gfx.js';

const HEAD_Y = 1.1, R = 0.4;
const faceCache = new Map();

// ---------- caras ----------
function ell(g, x, y, rx, ry, fill, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
function arc(g, x, y, r, a0, a1, col, w) { g.beginPath(); g.arc(x, y, r, a0, a1); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); }

function drawFace(g, L, ex) {
  const W = 512, H = 256, cx = 128, sp = L.sp;
  g.fillStyle = L.fur; g.fillRect(0, 0, W, H);
  if (sp === 'liebre' || sp === 'raton') { g.fillStyle = L.skin; g.fillRect(0, 180, 256, 80); }
  if (sp === 'zorro') { g.fillStyle = L.skin; g.fillRect(60, 220, 136, 40); }
  g.translate(0, -20);
  let ey = 136, dx = 40, eyeCol = '#2a1d1a', eyeRx = 11, eyeRy = 16, mouthY = 176, drawEyes = true, cheeks = '#ff9c8e';
  // marcas por especie
  if (sp === 'pan') { ey = 138; dx = 41; eyeRx = 11.5; eyeRy = 16; mouthY = 181; cheeks = '#f08f83'; }
  if (sp === 'tejon') {
    g.fillStyle = L.skin; g.fillRect(40, 0, 176, H);
    g.fillStyle = '#3b3a42';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 22, 0); g.lineTo(cx + s * 70, 0); g.quadraticCurveTo(cx + s * 78, 120, cx + s * 58, 178); g.quadraticCurveTo(cx + s * 34, 190, cx + s * 24, 160); g.quadraticCurveTo(cx + s * 30, 70, cx + s * 22, 0); g.fill(); }
    eyeCol = '#fdfaf2'; cheeks = null;
  }
  if (sp === 'zorro') {
    g.fillStyle = L.skin;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx, 150); g.quadraticCurveTo(cx + s * 30, 120, cx + s * 100, 150); g.quadraticCurveTo(cx + s * 120, 230, cx + s * 40, 256); g.lineTo(cx, 256); g.fill(); }
    ell(g, cx, 176, 30, 26, L.skin);
  }
  if (sp === 'liebre' || sp === 'raton') { ell(g, cx, 178, 40, 30, L.skin); g.fillStyle = L.skin; g.fillRect(0, 205, 256, 60); }
  if (sp === 'oveja') { ell(g, cx, 150, 104, 96, L.skin); }
  if (sp === 'erizo') { ell(g, cx, 150, 112, 100, L.skin); }
  if (sp === 'rana') { g.fillStyle = L.skin; g.beginPath(); g.ellipse(cx, 250, 150, 62, 0, 0, Math.PI * 2); g.fill(); drawEyes = false; mouthY = 170; }
  if (sp === 'buho') {
    for (const s of [-1, 1]) { ell(g, cx + s * 42, 134, 44, 46, L.skin); arc(g, cx + s * 42, 134, 44, 0, Math.PI * 2, '#8a6648', 3); }
    ell(g, cx, 230, 90, 50, L.skin); eyeRx = 13; eyeRy = 17; dx = 42; ey = 134; cheeks = null;
  }
  // mofletes
  if (cheeks) { g.globalAlpha = sp === 'pan' ? 0.42 : 0.5; ell(g, cx - dx - 24, ey + 27, 16, 11, cheeks); ell(g, cx + dx + 24, ey + 27, 16, 11, cheeks); g.globalAlpha = 1; }
  if (sp === 'pan') {
    g.globalAlpha = 0.4; g.fillStyle = '#b06f55';
    for (const s of [-1, 1]) for (const [fx, fy] of [[14, 14], [22, 20], [30, 13], [38, 19], [9, 22]]) { g.beginPath(); g.arc(cx + s * (dx - 28 + fx), ey + fy + 3, 1.7, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    // manchita de harina
    g.globalAlpha = 0.85; ell(g, cx + dx + 30, ey + 40, 9, 5, '#fffaf0', -0.4); g.globalAlpha = 1;
  }
  // ojos
  const blink = ex === 'blink', happy = ex === 'happy', wow = ex === 'wow';
  if (drawEyes) for (const s of [-1, 1]) {
    const x = cx + s * dx;
    if (blink) arc(g, x, ey - 2, 11, 0.15, Math.PI - 0.15, eyeCol, 4.5);
    else if (happy) arc(g, x, ey + 6, 12, Math.PI + 0.25, -0.25, eyeCol, 5);
    else {
      ell(g, x, ey, eyeRx * (wow ? 1.1 : 1), eyeRy * (wow ? 1.12 : 1), eyeCol);
      if (sp === 'pan') ell(g, x, ey + 2, eyeRx - 3.5, eyeRy - 4.5, '#5a3622');
      if (sp === 'pan') ell(g, x, ey + 3, 5, 7, '#24140f');
      ell(g, x - 3.5, ey - 6, 4, 5, sp === 'tejon' ? '#3b3a42' : '#ffffff');
      if (sp !== 'tejon') ell(g, x + 4, ey + 6, 2, 2.5, 'rgba(255,255,255,.75)');
      if (sp === 'tejon') ell(g, x, ey + 1, 6, 9, '#2a1d1a');
    }
    if (sp === 'pan') {
      // pestaña con rabillo y ceja
      if (!blink && !happy) { g.beginPath(); g.moveTo(x - s * 11, ey - 12); g.quadraticCurveTo(x, ey - 20, x + s * 13, ey - 10); g.lineTo(x + s * 19, ey - 14); g.strokeStyle = '#24140f'; g.lineWidth = 3.6; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
      g.beginPath(); g.moveTo(x - s * 13, ey - 33 - (wow ? 5 : 0)); g.quadraticCurveTo(x + s * 2, ey - 41 - (wow ? 5 : 0), x + s * 17, ey - 32 - (wow ? 4 : 0)); g.strokeStyle = '#33221c'; g.lineWidth = 4.2; g.stroke();
    }
    if (sp === 'oveja') { g.beginPath(); g.moveTo(x - 12, ey - 24); g.lineTo(x + 12, ey - 26); g.strokeStyle = 'rgba(60,40,40,.5)'; g.lineWidth = 3; g.stroke(); }
  }
  // hocico y boca
  const talk = ex === 'talk';
  const mc = sp === 'pan' ? '#a84a48' : '#3a2622';
  if (sp === 'pan') {
    arc(g, cx - 1, ey + 21, 4, 0.3, Math.PI - 0.6, 'rgba(160,100,80,.7)', 2.2);
    ell(g, cx - 8, ey + 21, 2.3, 2.3, '#e8b23c'); ell(g, cx - 8.6, ey + 20.4, 0.9, 0.9, '#fff3c0');
    if (happy || talk || wow) {
      g.beginPath(); g.moveTo(cx - 19, mouthY - 5); g.quadraticCurveTo(cx, mouthY - 1, cx + 19, mouthY - 5); g.quadraticCurveTo(cx + 14, mouthY + (talk ? 12 : 15), cx, mouthY + (talk ? 13 : 16)); g.quadraticCurveTo(cx - 14, mouthY + (talk ? 12 : 15), cx - 19, mouthY - 5); g.fillStyle = '#7c2f33'; g.fill();
      g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(cx - 20, mouthY - 6, 40, 8); ell(g, cx, mouthY + 15, 11, 6, '#e77b7b'); g.restore();
      g.strokeStyle = mc; g.lineWidth = 2.5; g.stroke();
    } else { g.beginPath(); g.moveTo(cx - 16, mouthY - 3); g.quadraticCurveTo(cx, mouthY + 9, cx + 16, mouthY - 3); g.strokeStyle = mc; g.lineWidth = 4; g.lineCap = 'round'; g.stroke(); }
  } else if (sp === 'rana') {
    g.beginPath(); g.moveTo(cx - 62, mouthY - 6); g.quadraticCurveTo(cx, mouthY + (happy ? 34 : 16), cx + 62, mouthY - 6);
    if (talk || happy) { g.quadraticCurveTo(cx, mouthY + (talk ? 44 : 40), cx - 62, mouthY - 6); g.fillStyle = '#7c2f33'; g.fill(); }
    g.strokeStyle = '#2f4a22'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke();
    ell(g, cx - 9, 140, 2.5, 3.5, '#2f4a22'); ell(g, cx + 9, 140, 2.5, 3.5, '#2f4a22');
    g.globalAlpha = 0.5; ell(g, cx - 74, 150, 15, 10, '#ff9c8e'); ell(g, cx + 74, 150, 15, 10, '#ff9c8e'); g.globalAlpha = 1;
  } else if (sp !== 'buho') {
    const ny = ey + 26;
    ell(g, cx, ny, sp === 'oveja' ? 8 : 9, 6.5, sp === 'raton' || sp === 'liebre' ? '#e88a96' : '#2a1d1a');
    ell(g, cx - 2.5, ny - 2, 2.5, 1.6, 'rgba(255,255,255,.55)');
    g.strokeStyle = mc; g.lineWidth = 3.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, ny + 6); g.lineTo(cx, ny + 13); g.stroke();
    if (talk || happy) { g.beginPath(); g.moveTo(cx - 13, ny + 13); g.quadraticCurveTo(cx, ny + 15, cx + 13, ny + 13); g.quadraticCurveTo(cx, ny + (talk ? 34 : 38), cx - 13, ny + 13); g.fillStyle = '#7c2f33'; g.fill(); g.stroke(); }
    else { g.beginPath(); g.moveTo(cx - 13, ny + 11); g.quadraticCurveTo(cx - 6, ny + 19, cx, ny + 13); g.quadraticCurveTo(cx + 6, ny + 19, cx + 13, ny + 11); g.stroke(); }
  }
}
function faceTex(L, ex) {
  const key = L.key + ex;
  if (!faceCache.has(key)) faceCache.set(key, canvasTex(512, 256, (g) => drawFace(g, L, ex)));
  return faceCache.get(key);
}

// ---------- ropa ----------
const shirtCache = new Map();
function shirtTex(L) {
  const k = L.shirt + L.pat; if (!shirtCache.has(k)) shirtCache.set(k, shirtTex0(L)); return shirtCache.get(k);
}
function shirtTex0(L) {
  return canvasTex(256, 128, (g, W, H) => {
    g.fillStyle = L.shirt; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.28;
    if (L.pat === 'raya') { g.fillStyle = '#fff'; for (let y = 6; y < H; y += 22) g.fillRect(0, y, W, 9); }
    if (L.pat === 'punto') { g.fillStyle = '#fff'; for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) { g.beginPath(); g.arc(x * 22 + (y % 2) * 11 + 5, y * 22 + 10, 4, 0, 7); g.fill(); } }
    if (L.pat === 'cuadros') { g.fillStyle = '#000'; for (let x = 0; x < W; x += 32) g.fillRect(x, 0, 12, H); for (let y = 0; y < H; y += 32) g.fillRect(0, y, W, 12); g.fillStyle = '#fff'; for (let x = 20; x < W; x += 32) g.fillRect(x, 0, 2, H); }
    if (L.pat === 'rombos') { g.fillStyle = '#fff'; for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) { const px = x * 30 + (y % 2) * 15, py = y * 28 + 6; g.beginPath(); g.moveTo(px, py - 11); g.lineTo(px + 9, py); g.lineTo(px, py + 11); g.lineTo(px - 9, py); g.fill(); } }
    g.globalAlpha = 1;
    // cuello y bajo
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, W, 9);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, H - 12, W, 12);
  });
}
function petoTex() {
  return canvasTex(512, 256, (g, W, H) => {
    const r = rnd(4);
    g.fillStyle = '#fbf3e3'; g.fillRect(0, 0, W, H);                       // camiseta
    const denim = (x, y, w, h) => {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.fillStyle = '#5f8fc4'; g.fillRect(x, y, w, h);
      g.globalAlpha = 0.16; g.strokeStyle = '#fff'; g.lineWidth = 1;
      for (let i = -H; i < W + H; i += 4) { g.beginPath(); g.moveTo(i, y + h); g.lineTo(i + h, y); g.stroke(); }
      g.globalAlpha = 0.12; g.fillStyle = '#1e3e6e'; for (let i = 0; i < 400; i++) g.fillRect(x + r() * w, y + r() * h, 2, 2);
      g.restore(); g.globalAlpha = 1;
    };
    denim(0, 118, W, 138);                                                  // pantalón
    denim(196, 52, 120, 70);                                                // peto
    for (const u of [212, 300, 20, 492]) denim(u - 13, 0, 26, u > 100 && u < 400 ? 58 : 122);   // tirantes
    g.strokeStyle = '#f0b65e'; g.lineWidth = 2.2; g.setLineDash([6, 4]);
    g.strokeRect(202, 58, 108, 60); g.strokeRect(232, 78, 48, 30);
    g.beginPath(); g.moveTo(0, 126); g.lineTo(190, 126); g.moveTo(322, 126); g.lineTo(W, 126); g.stroke();
    g.setLineDash([]);
    for (const u of [212, 300]) { g.beginPath(); g.arc(u, 62, 6, 0, 7); g.fillStyle = '#e9b949'; g.fill(); g.beginPath(); g.arc(u - 1.5, 60.5, 2, 0, 7); g.fillStyle = '#fff4c4'; g.fill(); }
    g.globalAlpha = 0.7; ell(g, 330, 170, 16, 9, '#fffaf0', 0.5); g.globalAlpha = 1;   // harina
    g.fillStyle = 'rgba(20,40,80,.25)'; g.fillRect(0, 118, W, 5);
  });
}

// ---------- pelo de Pan ----------
function hairGeo() {
  const N = 56, M = 22, pos = [], col = [], idx = [];
  const rx = 0.43 * 1.1, ry = 0.385 * 1.16, rz = 0.4 * 1.12;
  const open = 1.0, c0 = new THREE.Color('#33211c'), c1 = new THREE.Color('#1f1412'), c2 = new THREE.Color('#5a3b2e'), c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const phi = -Math.PI + (i / N) * Math.PI * 2, ap = Math.abs(phi);
    // dentro de la abertura de la cara, el pelo es un flequillo cortina; fuera, melena larga
    const w = THREE.MathUtils.smoothstep(ap, open - 0.2, open + 0.12);
    const fringe = lerp(0.74, 1.38, Math.pow(clamp(ap / open, 0, 1), 1.5)) - Math.exp(-ap * ap / 0.004) * 0.1;
    const thEnd = lerp(fringe, Math.PI * 0.5, w);
    const drop = w * lerp(0.6, 0.72, THREE.MathUtils.smoothstep(ap, 1.2, 2.6));
    const arcLen = thEnd * 0.42, total = arcLen + drop;
    for (let j = 0; j <= M; j++) {
      const s = (j / M) * total; let x, y, z;
      if (s <= arcLen || drop === 0) {
        const th = Math.min(thEnd, s / 0.42);
        x = Math.sin(phi) * Math.sin(th) * rx; y = Math.cos(th) * ry; z = Math.cos(phi) * Math.sin(th) * rz;
      } else {
        const d = (s - arcLen) / drop, bulge = 1 + Math.sin(d * Math.PI) * 0.06 - d * d * 0.2;
        x = Math.sin(phi) * rx * bulge; y = -d * drop; z = Math.cos(phi) * rz * bulge - d * 0.03;
        if (z > 0) z -= d * 0.05;                 // las puntas de delante se recogen hacia los hombros
      }
      pos.push(x, y, z);
      const t = j / M, sheen = Math.exp(-Math.pow((t - 0.2) / 0.09, 2)) * 0.6;
      c.copy(c0).lerp(c1, t * 0.6).lerp(c2, sheen * (0.5 + 0.5 * Math.sin(phi * 9)));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- construcción ----------
let hairG;
export function makeChar(look) {
  const L = { ...look }; L.key = L.key || [L.sp, L.fur, L.skin, L.shirt, L.pat].join('|');
  const sp = L.sp, isPan = sp === 'pan';
  const furM = mat(L.fur, { rough: 0.9, rim: 0.34 }), skinM = mat(L.skin, { rough: 0.85, rim: 0.3 });
  const root = group(), body = group({ parent: root });

  // torso
  const torsoMat = mat(0xffffff, { map: isPan ? petoTex() : shirtTex(L), rough: 0.88, rim: 0.3 });
  const torso = mesh(G.lathe([[0.001, 0.2], [0.19, 0.2], [0.265, 0.3], [0.26, 0.46], [0.2, 0.64], [0.135, 0.76], [0.001, 0.8]], 26), torsoMat, { parent: body });
  if (sp === 'buho') torso.scale.set(1.12, 1, 1.05);

  // piernas
  const legs = [];
  for (const s of [-1, 1]) {
    const piv = group({ parent: body, p: [s * 0.115, 0.26, 0] });
    mesh(G.cap(0.082, 0.09), isPan ? mat('#5f8fc4', { rough: 0.9 }) : furM, { parent: piv, p: [0, -0.1, 0] });
    const shoe = isPan ? mat('#fdf8ee', { rough: 0.6 }) : (sp === 'buho' || sp === 'rana' ? mat(sp === 'buho' ? '#e9a53a' : L.fur) : mat(L.acc2 || '#6b4a3a', { rough: 0.7 }));
    mesh(G.sph(0.1, 14, 10), shoe, { parent: piv, p: [0, -0.2, 0.035], s: [1, 0.62, 1.35] });
    if (isPan) mesh(G.sph(0.1, 14, 10), mat('#e8b23c', { rough: 0.6 }), { parent: piv, p: [0, -0.225, 0.035], s: [1.04, 0.3, 1.4] });
    legs.push(piv);
  }
  // brazos
  const arms = [];
  for (const s of [-1, 1]) {
    const piv = group({ parent: body, p: [s * 0.2, 0.67, 0] });
    piv.rotation.z = s * 0.28;
    if (sp === 'buho') {
      mesh(blob((x, y, z, v) => v.set(x * 0.07, y * 0.24 - 0.2, z * 0.16), { ws: 14, hs: 10 }), furM, { parent: piv });
    } else {
      const armM = isPan ? skinM : furM;
      mesh(G.cap(0.062, 0.2), armM, { parent: piv, p: [0, -0.15, 0] });
      mesh(G.sph(0.082, 14, 10), isPan ? skinM : (sp === 'tejon' ? mat('#3b3a42') : armM), { parent: piv, p: [0, -0.3, 0] });
      if (isPan) mesh(G.sph(0.09, 14, 10), mat('#fbf3e3', { rough: 0.9 }), { parent: piv, p: [0, -0.03, 0], s: [1, 0.8, 1] });
      else mesh(G.cap(0.07, 0.1), mat(L.shirt, { rough: 0.9 }), { parent: piv, p: [0, -0.08, 0] });
    }
    arms.push(piv);
  }

  // cabeza
  const head = group({ parent: body, p: [0, HEAD_Y, 0] });
  const hs = sp === 'rana' ? [1.2, 0.86, 1.0] : sp === 'buho' ? [1.08, 1.0, 0.98] : isPan ? [1.075, 0.96, 1.0] : [1.1, 0.95, 1.0];
  const faceMat = mat(0xffffff, { map: faceTex(L, 'idle'), rough: 0.86, rim: 0.3 });
  const skull = mesh(G.sph(R, 36, 26), faceMat, { parent: head, s: hs });
  const dark = mat('#2a1d1a', { rough: 0.5 });

  if (isPan) {
    hairG = hairG || hairGeo();
    mesh(hairG, mat(0xffffff, { vc: true, rough: 0.5, rim: 0.5, side: THREE.DoubleSide, nocache: true }), { parent: head, p: [0, 0.035, -0.012] });
    // forro interior para que la melena tenga cuerpo
    mesh(G.sph(R * 1.0, 20, 14), mat('#1f1412', { rough: 0.8 }), { parent: head, p: [0, -0.02, -0.08], s: [1.08, 0.98, 0.9] });
    const gold = mat('#e9b949', { rough: 0.28, metal: 0.75, rim: 0.5 });
    for (const s of [-1, 1]) {
      mesh(G.sph(0.06, 10, 8), skinM, { parent: head, p: [s * 0.41, -0.07, 0.13], s: [0.6, 1, 0.8] });
      mesh(G.tor(0.062, 0.016, 8, 20), gold, { parent: head, p: [s * 0.455, -0.19, 0.15], r: [0, s * 1.2, 0] });
    }
  } else {
    const inner = mat(sp === 'zorro' ? '#fff6ea' : '#f2a7a7', { rough: 0.9 });
    if (sp === 'oveja') {
      const wool = mat(L.fur, { rough: 1, rim: 0.45 });
      const pts = [[0, 0.36, 0.1, 0.2], [-0.2, 0.33, 0.12, 0.17], [0.2, 0.33, 0.12, 0.17], [-0.34, 0.2, 0.02, 0.17], [0.34, 0.2, 0.02, 0.17], [0, 0.32, -0.16, 0.24], [-0.26, 0.16, -0.22, 0.22], [0.26, 0.16, -0.22, 0.22], [0, 0.05, -0.34, 0.24], [-0.24, -0.1, -0.26, 0.2], [0.24, -0.1, -0.26, 0.2], [-0.1, 0.4, 0.22, 0.13], [0.11, 0.41, 0.2, 0.12]];
      for (const p of pts) mesh(G.sph(1, 12, 9), wool, { parent: head, p: [p[0], p[1], p[2]], s: p[3] });
      for (const s of [-1, 1]) mesh(G.sph(0.1, 12, 8), skinM, { parent: head, p: [s * 0.44, 0.02, 0.04], s: [1.5, 0.6, 0.9], r: [0, 0, s * -0.5] });
    }
    if (sp === 'tejon' || sp === 'erizo') for (const s of [-1, 1]) {
      mesh(G.sph(0.1, 12, 8), sp === 'tejon' ? mat('#3b3a42') : furM, { parent: head, p: [s * 0.3, 0.3, 0], s: [1, 1, 0.5] });
      mesh(G.sph(0.06, 10, 8), sp === 'tejon' ? mat('#fdfaf2') : inner, { parent: head, p: [s * 0.3, 0.3, 0.03], s: [1, 1, 0.5] });
    }
    if (sp === 'raton') for (const s of [-1, 1]) {
      mesh(G.sph(0.2, 16, 10), furM, { parent: head, p: [s * 0.36, 0.3, -0.02], s: [1, 1, 0.3] });
      mesh(G.sph(0.14, 14, 10), inner, { parent: head, p: [s * 0.36, 0.3, 0.02], s: [1, 1, 0.3] });
    }
    if (sp === 'liebre') for (const s of [-1, 1]) {
      const e = group({ parent: head, p: [s * 0.15, 0.3, -0.02], r: [-0.12, 0, s * -0.16] });
      mesh(G.sph(1, 14, 12), furM, { parent: e, p: [0, 0.3, 0], s: [0.1, 0.36, 0.06] });
      mesh(G.sph(1, 12, 10), inner, { parent: e, p: [0, 0.3, 0.035], s: [0.055, 0.28, 0.04] });
      e.userData.ear = s; head.userData['ear' + s] = e;
    }
    if (sp === 'zorro') for (const s of [-1, 1]) {
      const e = group({ parent: head, p: [s * 0.25, 0.3, 0], r: [0, 0, s * -0.3] });
      mesh(G.cone(0.15, 0.3, 12), furM, { parent: e, p: [0, 0.08, 0], s: [1, 1, 0.55] });
      mesh(G.cone(0.09, 0.2, 10), inner, { parent: e, p: [0, 0.06, 0.035], s: [1, 1, 0.5] });
      mesh(G.cone(0.07, 0.12, 10), mat('#4a2f25'), { parent: e, p: [0, 0.2, 0], s: [1, 1, 0.55] });
    }
    if (sp === 'buho') {
      for (const s of [-1, 1]) mesh(G.cone(0.08, 0.2, 8), furM, { parent: head, p: [s * 0.27, 0.36, 0], r: [0, 0, s * -0.6] });
      mesh(G.cone(0.055, 0.12, 8), mat('#e9a53a', { rough: 0.5 }), { parent: head, p: [0, -0.0, 0.4], r: [Math.PI * 0.62, 0, 0] });
    }
    if (sp === 'rana') for (const s of [-1, 1]) {
      mesh(G.sph(0.15, 16, 12), furM, { parent: head, p: [s * 0.21, 0.3, 0.1] });
      mesh(G.sph(0.105, 14, 10), mat('#fffdf5', { rough: 0.4 }), { parent: head, p: [s * 0.21, 0.31, 0.19] });
      const pup = mesh(G.sph(0.058, 12, 8), dark, { parent: head, p: [s * 0.21, 0.335, 0.272], s: [1.25, 1.45, 0.5] });
      head.userData['pup' + s] = pup;
    }
    if (sp === 'erizo') {
      const spike = mat('#6b4d3c', { rough: 0.95 }), tip = mat('#d9c3a3');
      const r = rnd(9);
      for (let i = 0; i < 34; i++) {
        const a = Math.PI * 0.5 + (r() - 0.5) * Math.PI * 1.25, e = -0.3 + r() * 1.5;
        const d = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), -Math.abs(Math.sin(a) * Math.cos(e)) - 0.05).normalize();
        if (d.z > -0.05 && d.y < 0.75) continue;
        const sg = group({ parent: head, p: [d.x * 0.4, d.y * 0.36, d.z * 0.38] });
        sg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        mesh(G.cone(0.065, 0.2, 7), i % 3 ? spike : tip, { parent: sg, p: [0, 0.07, 0] });
      }
    }
    // nariz en relieve
    if (sp !== 'buho' && sp !== 'rana') mesh(G.sph(0.035, 10, 8), sp === 'raton' || sp === 'liebre' ? mat('#e88a96', { rough: 0.4 }) : mat('#2a1d1a', { rough: 0.35 }), { parent: head, p: [0, -0.068, 0.39], s: [1.25, 0.9, 0.7] });
  }
  // accesorios
  const A = L.acc;
  if (A === 'gafas') {
    const fr = mat('#c9455a', { rough: 0.4 });
    for (const s of [-1, 1]) mesh(G.tor(0.085, 0.013, 6, 20), fr, { parent: head, p: [s * 0.14, 0.05, 0.39], r: [-0.12, s * 0.3, 0] });
    mesh(G.cyl(0.011, 0.011, 0.1, 6), fr, { parent: head, p: [0, 0.055, 0.42], r: [0, 0, Math.PI / 2] });
  }
  if (A === 'gorra') {
    const capM = mat('#5b4a3a', { rough: 0.95 });
    mesh(G.sph(0.33, 18, 12), capM, { parent: head, p: [0, 0.2, -0.02], s: [1.12, 0.5, 1.05] });
    mesh(G.cyl(0.2, 0.22, 0.03, 16), capM, { parent: head, p: [0, 0.14, 0.33], s: [1, 1, 0.7], r: [0.5, 0, 0] });
  }
  if (A === 'cinta') mesh(G.tor(0.39, 0.035, 8, 28), mat('#ff6f61', { rough: 0.9 }), { parent: head, p: [0, 0.2, 0], r: [Math.PI / 2 - 0.12, 0, 0], s: [1.08, 1, 1] });
  if (A === 'gorro') {
    const w = mat('#fffdf7', { rough: 0.95 });
    mesh(G.cyl(0.2, 0.19, 0.16, 18), w, { parent: head, p: [0, 0.36, -0.05] });
    for (let i = 0; i < 5; i++) mesh(G.sph(0.14, 12, 10), w, { parent: head, p: [Math.cos(i * 1.257) * 0.12, 0.5, Math.sin(i * 1.257) * 0.12 - 0.05] });
    mesh(G.sph(0.15, 12, 10), w, { parent: head, p: [0, 0.54, -0.05] });
  }
  if (A === 'lazo') {
    const b = group({ parent: head, p: [0.2, 0.33, 0.14], r: [0.3, 0, -0.3] }), bm = mat('#ff7b9c', { rough: 0.8 });
    for (const s of [-1, 1]) mesh(G.sph(0.09, 10, 8), bm, { parent: b, p: [s * 0.09, 0, 0], s: [1, 0.75, 0.5] });
    mesh(G.sph(0.045, 8, 6), bm, { parent: b });
  }
  if (A === 'pajarita') {
    const bm = mat('#d1495b', { rough: 0.8 });
    for (const s of [-1, 1]) mesh(G.cone(0.07, 0.12, 8), bm, { parent: body, p: [s * 0.065, 0.74, 0.17], r: [0, 0, s * Math.PI / 2], s: [1, 1, 0.5] });
    mesh(G.sph(0.035, 8, 6), bm, { parent: body, p: [0, 0.74, 0.18] });
  }
  if (A === 'cartera') {
    const lm = mat('#8a5a34', { rough: 0.7 });
    mesh(G.tor(0.27, 0.022, 6, 24), lm, { parent: body, p: [0, 0.5, 0], r: [Math.PI / 2, 0.75, 0], s: [1, 1, 1.5] });
    mesh(G.box(0.22, 0.18, 0.09, 0.03), lm, { parent: body, p: [0.27, 0.3, 0.06] });
    mesh(G.box(0.22, 0.09, 0.1, 0.03), mat('#a06a3c', { rough: 0.7 }), { parent: body, p: [0.27, 0.35, 0.065] });
    mesh(G.box(0.1, 0.07, 0.01, 0.004), mat('#fffdf7'), { parent: body, p: [0.27, 0.42, 0.04], r: [0.2, 0, 0.2] });
  }
  if (A === 'delantal') {
    mesh(G.cyl(0.272, 0.268, 0.2, 20, true), mat('#fffaf0', { rough: 0.95, side: THREE.DoubleSide }), { parent: body, p: [0, 0.36, 0.006] });
  }
  // cola
  let tail = null;
  if (sp === 'zorro') { tail = group({ parent: body, p: [0, 0.32, -0.2], r: [-0.9, 0, 0] }); mesh(G.sph(1, 14, 12), furM, { parent: tail, p: [0, 0.2, 0], s: [0.13, 0.26, 0.13] }); mesh(G.sph(1, 12, 10), mat('#fff6ea'), { parent: tail, p: [0, 0.37, 0], s: [0.1, 0.13, 0.1] }); }
  if (sp === 'liebre' || sp === 'oveja') tail = mesh(G.sph(0.09, 10, 8), mat(sp === 'liebre' ? '#fff3df' : L.fur, { rough: 1 }), { parent: body, p: [0, 0.32, -0.26] });
  if (sp === 'raton') { tail = group({ parent: body, p: [0, 0.28, -0.22], r: [-1.1, 0, 0] }); mesh(G.cap(0.018, 0.34, 6), mat('#e8a0a8'), { parent: tail, p: [0, 0.18, 0] }); }
  if (sp === 'tejon') tail = mesh(G.sph(0.1, 10, 8), furM, { parent: body, p: [0, 0.3, -0.26], s: [0.9, 0.8, 1.3] });

  const carryAnchor = group({ parent: body, p: [0, 0.5, 0.42] });
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  skull.receiveShadow = false;

  const ch = {
    L, root, body, head, arms, legs, tail, torso, carryAnchor, faceMat,
    x: 0, z: 0, yaw: 0, yawTo: 0, speed: 0, phase: Math.random() * 6, t: Math.random() * 10,
    carry: false, action: null, at: 0, talking: false, expr: 'idle', exprT: 0, blinkT: 1 + Math.random() * 3,
    sq: new Spring(1, 220, 13), scale: L.scale || 1, sit: false, lookAt: null,
    say(ex, time = 1.2) { this.expr = ex; this.exprT = time; },
    act(name) { this.action = name; this.at = 0; },
    pop(f = 3) { this.sq.kick(f); },
  };
  root.scale.setScalar(ch.scale);
  return ch;
}

export function updateChar(ch, dt) {
  ch.t += dt; ch.at += dt;
  const mv = clamp(ch.speed / 2.2, 0, 1.3);
  ch.phase += dt * (5 + ch.speed * 3.2) * (mv > 0.05 ? 1 : 0);
  ch.yaw = angLerp(ch.yaw, ch.yawTo, 1 - Math.exp(-dt * 11));
  ch.root.position.x = ch.x; ch.root.position.z = ch.z; ch.root.rotation.y = ch.yaw;
  const s = Math.sin(ch.phase), c = Math.cos(ch.phase);
  const sq = ch.sq.step(Math.min(dt, 0.03));
  const breathe = 1 + Math.sin(ch.t * 2.1) * 0.012;
  ch.body.scale.set(1 / Math.sqrt(sq), sq * breathe, 1 / Math.sqrt(sq));
  let by = Math.abs(s) * 0.05 * mv, lean = 0.1 * mv, aL = -s * 0.75 * mv, aR = s * 0.75 * mv, lL = s * 0.8 * mv, lR = -s * 0.8 * mv, azL = -0.28, azR = 0.28, headX = 0, headZ = Math.sin(ch.t * 1.1) * 0.03, roll = c * 0.05 * mv;
  if (ch.carry) { aL = aR = -1.28 + Math.abs(s) * 0.05 * mv; azL = -0.08; azR = 0.08; lean = 0.02; }
  const a = ch.action, at = ch.at;
  if (a === 'knead') { aL = -1.0 + Math.sin(at * 11) * 0.3; aR = -1.0 + Math.sin(at * 11 + 2.2) * 0.3; azL = 0.05; azR = -0.05; by -= 0.03 + Math.abs(Math.sin(at * 11)) * 0.03; lean = 0.22; headX = 0.18; }
  else if (a === 'wave') { aR = 0; azR = 2.5 + Math.sin(at * 13) * 0.35; headZ = -0.1; if (at > 1.3) ch.action = null; }
  else if (a === 'joy') { const j = Math.abs(Math.sin(at * 7)); by += j * 0.26 * (at < 0.9 ? 1 : 0); azL = -2.4; azR = 2.4; aL = aR = 0; if (at > 0.95) ch.action = null; }
  else if (a === 'give') { const k = Math.sin(clamp(at / 0.5, 0, 1) * Math.PI); aR = -1.4 * k; azR = 0.1; lean = 0.12 * k; if (at > 0.5) ch.action = null; }
  else if (a === 'nod') { headX = Math.sin(at * 12) * 0.2 * (1 - at / 0.7); if (at > 0.7) ch.action = null; }
  else if (a === 'dance') { by += Math.abs(Math.sin(at * 6)) * 0.12; azL = -1.6 - Math.sin(at * 6) * 0.8; azR = 1.6 - Math.sin(at * 6) * 0.8; aL = aR = 0; roll = Math.sin(at * 6) * 0.12; headZ = Math.sin(at * 6) * 0.14; lL = Math.sin(at * 6) * 0.3; lR = -lL; }
  else if (a === 'sad') { headX = 0.25; if (at > 1.4) ch.action = null; }
  if (ch.sit) { lL = lR = -1.45; by -= 0.14; }
  ch.body.position.y = by; ch.body.rotation.x = lean; ch.body.rotation.z = roll;
  ch.arms[0].rotation.x = aL; ch.arms[1].rotation.x = aR; ch.arms[0].rotation.z = azL; ch.arms[1].rotation.z = azR;
  ch.legs[0].rotation.x = lL; ch.legs[1].rotation.x = lR;
  ch.head.rotation.x = headX - 0.2 + Math.sin(ch.t * 0.9) * 0.02; ch.head.rotation.z = headZ - roll * 0.6;
  ch.head.position.y = HEAD_Y + Math.sin(ch.phase * 2) * 0.008 * mv;
  if (ch.tail) ch.tail.rotation.z = Math.sin(ch.t * 3 + ch.phase) * 0.18;
  for (const sgn of [-1, 1]) { const e = ch.head.userData['ear' + sgn]; if (e) e.rotation.x = -0.12 + Math.sin(ch.t * 1.7 + sgn) * 0.05 - mv * 0.25 + Math.abs(s) * 0.12 * mv; }
  // cara
  ch.blinkT -= dt; ch.exprT -= dt;
  let ex = ch.exprT > 0 ? ch.expr : 'idle';
  if (ch.talking) ex = Math.sin(ch.t * 22) > 0 ? 'talk' : (ch.exprT > 0 ? ch.expr : 'idle');
  else if (ex === 'idle' && ch.blinkT < 0.12) ex = 'blink';
  if (ch.blinkT < 0) ch.blinkT = 1.6 + Math.random() * 3.5;
  if (ex !== ch._ex) {
    ch._ex = ex; ch.faceMat.map = faceTex(ch.L, ex);
    if (ch.L.sp === 'rana') for (const sgn of [-1, 1]) ch.head.userData['pup' + sgn].scale.set(1.25, ex === 'blink' || ex === 'happy' ? 0.18 : 1.45, 0.5);
  }
}

export const PAN_LOOK = { sp: 'pan', fur: '#f4cfae', skin: '#f4cfae', key: 'pan' };
export const MIGA_LOOK = { sp: 'raton', fur: '#b9b3c4', skin: '#f6eef0', shirt: '#f08a7b', pat: 'raya', acc: 'delantal', scale: 0.72 };

const V_SP = ['liebre', 'tejon', 'zorro', 'raton', 'oveja', 'rana', 'erizo', 'buho'];
const V_FUR = { liebre: ['#e9dccb', '#b89a86', '#f1c9a0'], tejon: ['#77737f', '#9a8f86'], zorro: ['#d9773c', '#c9a27a', '#e9a35e'], raton: ['#c9bfb4', '#a59ab0', '#e6d2bd'], oveja: ['#fbf3e4', '#e9e0ee', '#d9c9b8'], rana: ['#7fc47a', '#a9cf63', '#6bb8a4'], erizo: ['#9a7a62', '#7d6a5c'], buho: ['#b79a7c', '#8f8fa3', '#c9a98a'] };
const V_SKIN = { liebre: '#fff3df', tejon: '#f4f1ea', zorro: '#fff6ea', raton: '#f6eef0', oveja: '#f0d5c0', rana: '#eaf6cf', erizo: '#f6dcc0', buho: '#f3e3c8' };
const V_SHIRT = ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#b388c9', '#ef8fa6', '#5aa9a3', '#e9a03b', '#8d99ae'];
const V_PAT = ['liso', 'raya', 'punto', 'cuadros', 'rombos'];
export function randomLook(seed) {
  const r = rnd(seed * 7919 + 13); const sp = V_SP[Math.floor(r() * V_SP.length)];
  const f = V_FUR[sp];
  return { sp, fur: f[Math.floor(r() * f.length)], skin: V_SKIN[sp], shirt: V_SHIRT[Math.floor(r() * V_SHIRT.length)], pat: V_PAT[Math.floor(r() * V_PAT.length)], acc: r() < 0.18 ? ['cinta', 'lazo', 'gorra'][Math.floor(r() * 3)] : null, scale: 0.92 + r() * 0.1 };
}
