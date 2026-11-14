// Motor gráfico: mundo en rodillo, materiales de juguete, luz por hora y posproceso.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };
export const bend = { k: { value: 0.0105 }, z: { value: 0 } };
export const windU = { value: 0 };

// ---------- materiales ----------
const VERT_HEAD = '#include <common>\nuniform float uBendK; uniform float uBendZ; uniform float uWind;';
const VERT_PROJ = (sway) => `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
vec4 bw = modelMatrix * mvPosition;
${sway ? `float sw = max(0.0, position.y) * ${sway.toFixed(3)};
bw.x += sin(uWind * 1.7 + bw.x * 0.8 + bw.z * 0.6) * sw;
bw.z += cos(uWind * 1.3 + bw.x * 0.5) * sw * 0.6;` : ''}
float bd = bw.z - uBendZ;
bw.y -= bd * bd * uBendK;
mvPosition = viewMatrix * bw;
gl_Position = projectionMatrix * mvPosition;`;

export function patch(m, o = {}) {
  const rim = o.rim ?? 0.22, sway = o.sway || 0;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBendK = bend.k; sh.uniforms.uBendZ = bend.z; sh.uniforms.uWind = windU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', VERT_HEAD).replace('#include <project_vertex>', VERT_PROJ(sway));
    if (m.isMeshStandardMaterial && rim > 0) {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
        float fr = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);
        outgoingLight += fr * ${rim.toFixed(3)} * (diffuseColor.rgb * 0.7 + vec3(0.30, 0.26, 0.2));
        #include <opaque_fragment>`);
    }
  };
  m.customProgramCacheKey = () => 'pp' + rim + '_' + sway;
  return m;
}

const cache = new Map();
/** Material mate de juguete. mat(0xffcc88) o mat('#fc8', {rough, emissive, map, sway, side, flat}) */
export function mat(color, o = {}) {
  const cacheable = !o.map && !o.nocache;
  const key = cacheable ? JSON.stringify([color, o]) : null;
  if (key && cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: o.rough ?? 0.82, metalness: o.metal ?? 0,
    map: o.map || null, side: o.side ?? THREE.FrontSide, flatShading: !!o.flat,
    emissive: new THREE.Color(o.emissive ?? 0x000000), emissiveIntensity: o.ei ?? 1,
    transparent: !!o.transparent, opacity: o.opacity ?? 1, vertexColors: !!o.vc,
    alphaTest: o.alphaTest ?? 0,
  });
  patch(m, { rim: o.rim, sway: o.sway });
  if (key) cache.set(key, m);
  return m;
}
export function basic(color, o = {}) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), map: o.map || null, transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.depthWrite ?? true, vertexColors: !!o.vc, toneMapped: o.toneMapped ?? true, blending: o.blending ?? THREE.NormalBlending });
  return patch(m);
}

// ---------- texturas por lienzo ----------
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.userData.canvas = c; t.userData.g = g;
  return t;
}
export function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------- geometría ----------
export function mesh(geo, material, o = {}) {
  const m = new THREE.Mesh(geo, material);
  if (o.p) m.position.set(...o.p);
  if (o.r) m.rotation.set(...o.r);
  if (o.s) typeof o.s === 'number' ? m.scale.setScalar(o.s) : m.scale.set(...o.s);
  m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true;
  m.frustumCulled = false;
  if (o.parent) o.parent.add(m);
  if (o.name) m.name = o.name;
  return m;
}
export function group(o = {}, ...kids) {
  const g = new THREE.Group();
  if (o.p) g.position.set(...o.p);
  if (o.r) g.rotation.set(...o.r);
  if (o.s) typeof o.s === 'number' ? g.scale.setScalar(o.s) : g.scale.set(...o.s);
  if (o.parent) o.parent.add(g);
  kids.forEach(k => k && g.add(k));
  return g;
}
const geoCache = new Map();
function gc(key, make) { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); }
export const G = {
  box: (w, h, d, r = 0.06, seg = 3) => gc(`b${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2))),
  /** Caja teselada a lo largo de Z (o X) para que la curvatura no la atraviese. */
  zbox: (w, h, d, sx = 1, sz = 12) => gc(`z${w},${h},${d},${sx},${sz}`, () => new THREE.BoxGeometry(w, h, d, sx, 1, sz)),
  sph: (r = 1, ws = 20, hs = 14) => gc(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)),
  cyl: (rt, rb, h, seg = 18, open = false) => gc(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)),
  cone: (r, h, seg = 14) => gc(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
  cap: (r, len, seg = 12) => gc(`p${r},${len},${seg}`, () => new THREE.CapsuleGeometry(r, len, 6, seg)),
  tor: (r, t, a = 10, b = 24, arc = Math.PI * 2) => gc(`t${r},${t},${a},${b},${arc}`, () => new THREE.TorusGeometry(r, t, a, b, arc)),
  plane: (w, h, sx = 1, sy = 1) => gc(`pl${w},${h},${sx},${sy}`, () => new THREE.PlaneGeometry(w, h, sx, sy)),
  ico: (r, d = 1) => gc(`i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d)),
  /** Perfil de revolución suavizado: puntos [radio, altura]. La costura queda detrás. */
  lathe: (pts, seg = 22, smooth = true) => {
    let v = pts.map(p => new THREE.Vector2(Math.max(0.0001, p[0]), p[1]));
    if (smooth) v = new THREE.SplineCurve(v).getPoints(pts.length * 5);
    return new THREE.LatheGeometry(v, seg, Math.PI, Math.PI * 2);
  },
};
/** Esfera deformada por una función (x,y,z unitarios) -> radio; colorFn opcional -> THREE.Color */
export function blob(radiusFn, o = {}) {
  const ws = o.ws || 36, hs = o.hs || 24;
  const g = new THREE.SphereGeometry(1, ws, hs);
  const p = g.attributes.position, v = new THREE.Vector3();
  const cols = o.color ? new Float32Array(p.count * 3) : null;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const out = radiusFn(v.x, v.y, v.z, v);
    if (typeof out === 'number') v.multiplyScalar(out); else v.copy(out);
    if (cols) { const c = o.color(v.x, v.y, v.z); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  if (cols) g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  // cose la costura de normales de la esfera
  const n = g.attributes.normal;
  for (let y = 0; y <= hs; y++) {
    const a = y * (ws + 1), b = a + ws;
    const nx = (n.getX(a) + n.getX(b)) / 2, ny = (n.getY(a) + n.getY(b)) / 2, nz = (n.getZ(a) + n.getZ(b)) / 2;
    const l = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(a, nx / l, ny / l, nz / l); n.setXYZ(b, nx / l, ny / l, nz / l);
  }
  return g;
}
export function noise3(x, y, z) {
  return (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
}
export function smoothNoise(x, y, z) {
  return (Math.sin(x * 2.1 + y * 1.3) + Math.sin(y * 2.7 + z * 1.9) + Math.sin(z * 2.3 + x * 1.7) + Math.sin((x + y + z) * 3.1) * 0.5) / 3.5;
}

// ---------- escena ----------
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(26, 16 / 9, 1, 200);
export let renderer, composer;
let tiltH, tiltV, grade, bloom;
const skyTex = canvasTex(4, 256, () => {});
skyTex.anisotropy = 1;
export const sun = new THREE.DirectionalLight(0xffffff, 2.4);
export const hemi = new THREE.HemisphereLight(0xcfe6ff, 0xb89a78, 1.0);
export const fill = new THREE.DirectionalLight(0xbcd0ff, 0.35);

const TiltShader = {
  uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1, 0) }, focus: { value: 0.45 }, amount: { value: 1 }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 dir; uniform float focus; uniform float amount; uniform vec2 res; varying vec2 vUv;
    void main(){
      float d = vUv.y - focus;
      float b = d > 0.0 ? smoothstep(0.3, 0.56, d) : smoothstep(0.3, 0.5, -d);
      float rad = b * amount * 1.7;
      vec4 c = vec4(0.0); float w = 0.0;
      for (int i = -5; i <= 5; i++) {
        float f = float(i); float g = exp(-f * f / 14.0);
        c += texture2D(tDiffuse, vUv + dir * f * rad / res) * g; w += g;
      }
      gl_FragColor = c / w;
    }`,
};
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, tint: { value: new THREE.Color(1, 1, 1) }, sat: { value: 1.1 }, vig: { value: 0.3 }, fade: { value: 0 }, warm: { value: 0 } },
  vertexShader: TiltShader.vertexShader,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec3 tint; uniform float sat; uniform float vig; uniform float fade; uniform float warm; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, sat);
      c *= tint;
      // sombras hacia el malva, luces hacia la crema
      c = mix(c, c * vec3(1.06, 1.0, 0.92) + vec3(0.012, 0.004, 0.02), 0.6);
      c += vec3(0.05, 0.02, -0.03) * warm * (1.0 - l);
      vec2 q = vUv - 0.5;
      c *= 1.0 - vig * dot(q, q) * 1.6;
      c = mix(c, vec3(0.16, 0.10, 0.08), fade);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function initGfx(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  scene.background = skyTex;

  sun.position.set(-9, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 20; sc.bottom = -22; sc.near = 1; sc.far = 60;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.035; sun.shadow.radius = 5;
  fill.position.set(8, 6, 12);
  scene.add(sun, sun.target, hemi, fill);

  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.22, 0.7, 0.86);
  composer.addPass(bloom);
  tiltH = new ShaderPass(TiltShader); tiltV = new ShaderPass(TiltShader);
  tiltV.uniforms.dir.value.set(0, 1);
  composer.addPass(tiltH); composer.addPass(tiltV);
  grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  composer.addPass(new OutputPass());
  resize();
  window.addEventListener('resize', resize);
}
let prCap = 2;
export function setQuality(q) { prCap = q === 'media' ? 1 : 2; if (renderer) resize(); }
export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, prCap));
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = w / h < 1.2 ? 38 : 26;
  camera.updateProjectionMatrix();
  const s = renderer.getDrawingBufferSize(new THREE.Vector2());
  tiltH.uniforms.res.value.copy(s); tiltV.uniforms.res.value.copy(s);
}
export const fx = { fade: 0, blur: 1, bloomAdd: 0 };
export function render() {
  grade.uniforms.fade.value = fx.fade;
  tiltH.uniforms.amount.value = tiltV.uniforms.amount.value = fx.blur;
  composer.render();
}

// ---------- luz por hora ----------
const KEYS = [
  // hora, sol, intSol, cielo hemi, suelo hemi, intHemi, cielo arriba, cielo abajo, tinte, bloom, cálido
  [6.0, 0xffb38a, 1.5, 0xc9c4ee, 0x9c7f8c, 0.95, 0x9fb8e8, 0xffd9c2, 0xfff0ea, 0.3, 0.5],
  [8.5, 0xfff0d2, 2.5, 0xcfe6ff, 0xb89a78, 1.0, 0x86c5f4, 0xdff3ff, 0xffffff, 0.2, 0.15],
  [13.0, 0xfffbee, 2.8, 0xd6ecff, 0xc2a680, 1.05, 0x6fbcf7, 0xd4efff, 0xffffff, 0.18, 0.0],
  [16.5, 0xffe2b0, 2.6, 0xd4e0ff, 0xc09a74, 1.0, 0x7cb8ee, 0xffeed2, 0xfffaf0, 0.24, 0.3],
  [18.6, 0xff9d5c, 2.1, 0xc4b4ea, 0xa67868, 0.9, 0x7d83cf, 0xffb98a, 0xffe9dc, 0.4, 0.8],
  [19.8, 0x8a8fe0, 0.9, 0x7f86cc, 0x5a4a6a, 0.85, 0x39407e, 0xb9799c, 0xdcd8ff, 0.55, 0.5],
  [21.5, 0x6f7fd8, 0.7, 0x6470bb, 0x40395c, 0.8, 0x1c2250, 0x4a4a86, 0xcfd2ff, 0.6, 0.3],
];
const ca = new THREE.Color(), cb = new THREE.Color();
function lerpHex(a, b, t, out) { ca.setHex(a); cb.setHex(b); return out.copy(ca).lerp(cb, t); }
export const light = { night: 0, skyTop: new THREE.Color(), skyBot: new THREE.Color(), dim: 0, sunAngle: 0 };
let skyKey = '';
export function setTimeOfDay(hour, weatherDim = 0) {
  let i = 0; while (i < KEYS.length - 2 && hour > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = THREE.MathUtils.clamp((hour - a[0]) / (b[0] - a[0]), 0, 1);
  const L = (k) => a[k] + (b[k] - a[k]) * t;
  lerpHex(a[1], b[1], t, sun.color); sun.intensity = L(2) * (1 - weatherDim * 0.55);
  lerpHex(a[3], b[3], t, hemi.color); lerpHex(a[4], b[4], t, hemi.groundColor); hemi.intensity = L(5) * (1 + weatherDim * 0.12);
  lerpHex(a[6], b[6], t, light.skyTop); lerpHex(a[7], b[7], t, light.skyBot);
  if (weatherDim) { const gcol = cb.setHex(0xa9b4c4); light.skyTop.lerp(gcol, weatherDim * 0.8); light.skyBot.lerp(cb.setHex(0xd3d9df), weatherDim * 0.8); }
  lerpHex(a[8], b[8], t, grade.uniforms.tint.value);
  if (weatherDim) grade.uniforms.tint.value.lerp(cb.setHex(0xe6ecf5), weatherDim * 0.7);
  bloom.strength = L(9) + fx.bloomAdd; grade.uniforms.warm.value = L(10);
  grade.uniforms.sat.value = 1.12 - weatherDim * 0.14;
  light.night = THREE.MathUtils.smoothstep(hour, 17.8, 20);
  // el sol recorre el cielo de este a oeste, siempre algo de frente para ver las caras
  const ang = THREE.MathUtils.mapLinear(hour, 6, 21, -1.0, 1.0);
  sun.position.set(camTarget.x + Math.sin(ang) * 14, 15 - Math.abs(ang) * 5, camTarget.z + 9 + Math.cos(ang) * 3);
  sun.target.position.set(camTarget.x, 0, camTarget.z - 1);
  fill.intensity = 0.3 + light.night * 0.25;
  const key = light.skyTop.getHexString() + light.skyBot.getHexString();
  if (key !== skyKey) {
    skyKey = key;
    const g = skyTex.userData.g, gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#' + light.skyTop.getHexString()); gr.addColorStop(0.55, '#' + light.skyBot.getHexString()); gr.addColorStop(1, '#' + light.skyBot.getHexString());
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256); skyTex.needsUpdate = true;
  }
}

// ---------- cámara ----------
export const camTarget = new THREE.Vector3(0, 0, -1);
export const cam = { dist: 1, height: 15.5, back: 17.5, look: 1.0, shake: 0, zoom: 1, zoomTo: 1, tx: 0, tz: 0, ty: 0, yaw: 0, yawTo: 0, pitchAdd: 0, pitchTo: 0 };
export function updateCamera(dt, focus, snap = false) {
  const k = snap ? 1 : 1 - Math.exp(-dt * 3.2);
  camTarget.x += (focus.x - camTarget.x) * k;
  camTarget.z += (focus.z - camTarget.z) * k;
  camTarget.y += ((focus.y || 0) - camTarget.y) * k;
  cam.zoom += (cam.zoomTo - cam.zoom) * (snap ? 1 : 1 - Math.exp(-dt * 2.6));
  cam.yaw += (cam.yawTo - cam.yaw) * (snap ? 1 : 1 - Math.exp(-dt * 2.2));
  cam.pitchAdd += (cam.pitchTo - cam.pitchAdd) * (snap ? 1 : 1 - Math.exp(-dt * 2.2));
  const z = cam.zoom;
  const h = (cam.height - cam.pitchAdd * 6) * z, b = (cam.back + cam.pitchAdd * 3) * z;
  cam.shake = Math.max(0, cam.shake - dt * 2.2);
  const sx = Math.sin(performance.now() * 0.071) * cam.shake * 0.12, sy = Math.cos(performance.now() * 0.093) * cam.shake * 0.12;
  camera.position.set(camTarget.x + Math.sin(cam.yaw) * b + sx, camTarget.y + h + sy, camTarget.z + Math.cos(cam.yaw) * b);
  camera.lookAt(camTarget.x, camTarget.y + cam.look, camTarget.z);
  bend.z.value = camTarget.z + 1.5;
}
const tv = new THREE.Vector3();
/** Proyecta un punto del mundo (aplicando la curvatura) a píxeles CSS. */
/** Punto del suelo (curvado) bajo un píxel de pantalla. */
const rc = new THREE.Vector3(), rd = new THREE.Vector3();
export function groundAt(px, py) {
  rc.set(px / window.innerWidth * 2 - 1, -(py / window.innerHeight) * 2 + 1, 0.5).unproject(camera); rd.copy(rc).sub(camera.position).normalize(); const o = camera.position, k = bend.k.value, bz = bend.z.value;
  const a = k * rd.z * rd.z, b = rd.y + 2 * k * rd.z * (o.z - bz), c = o.y + k * (o.z - bz) * (o.z - bz); let t;
  if (Math.abs(a) < 1e-7) t = -c / b; else { const dsc = b * b - 4 * a * c; if (dsc < 0) return null; t = (-b - Math.sqrt(dsc)) / (2 * a); if (t < 0) t = (-b + Math.sqrt(dsc)) / (2 * a); }
  return t > 0 ? { x: o.x + rd.x * t, z: o.z + rd.z * t } : null;
}
export function toScreen(x, y, z) {
  const d = z - bend.z.value;
  tv.set(x, y - d * d * bend.k.value, z).project(camera);
  return { x: (tv.x * 0.5 + 0.5) * window.innerWidth, y: (-tv.y * 0.5 + 0.5) * window.innerHeight, vis: tv.z < 1 };
}

// ---------- partículas ----------
const PMAX = 1100;
let pMesh, pSoft; const parts = []; const pm = new THREE.Matrix4(), pq = new THREE.Quaternion(), ps = new THREE.Vector3(), pp = new THREE.Vector3(), pc = new THREE.Color(), pe = new THREE.Euler();
export function initParticles() {
  const m = basic(0xffffff, { transparent: true, opacity: 0.95, depthWrite: false });
  pMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), m, PMAX);
  pMesh.frustumCulled = false; pMesh.count = 0; pMesh.renderOrder = 5;
  pMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PMAX * 3), 3);
  scene.add(pMesh);
  const st = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  pSoft = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.7, 2.7), basic(0xffffff, { map: st, transparent: true, opacity: 0.62, depthWrite: false }), 400);
  pSoft.frustumCulled = false; pSoft.count = 0; pSoft.renderOrder = 4; pSoft.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(400 * 3), 3); scene.add(pSoft);
}
/** kinds: 'flour','spark','steam','leaf','confetti','crumb','heartdust' */
export function burst(kind, x, y, z, n = 10, o = {}) {
  for (let i = 0; i < n && parts.length < PMAX; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random();
    const p = { x, y, z, vx: 0, vy: 0, vz: 0, life: 0, max: 1, s: 0.1, g: 0, drag: 1, c: 0xffffff, grow: 0, spin: Math.random() * 6, flat: 1, soft: kind === 'flour' || kind === 'steam' || kind === 'dust' };
    if (kind === 'flour') { p.vx = Math.cos(a) * (0.5 + r) * 1.2; p.vz = Math.sin(a) * (0.5 + r) * 0.9; p.vy = 0.5 + Math.random() * 1.1; p.max = 0.7 + Math.random() * 0.5; p.s = 0.05 + Math.random() * 0.06; p.g = -0.5; p.drag = 2.5; p.c = 0xfff4de; p.grow = 0.14; }
    else if (kind === 'steam') { p.x += (Math.random() - 0.5) * (o.spread ?? 0.4); p.z += (Math.random() - 0.5) * 0.2; p.vy = 0.5 + Math.random() * 0.4; p.vx = (Math.random() - 0.5) * 0.2; p.max = 1.3 + Math.random() * 0.8; p.s = 0.06 + Math.random() * 0.05; p.c = 0xffffff; p.grow = 0.16; p.drag = 0.4; }
    else if (kind === 'spark') { p.vx = Math.cos(a) * (1 + r * 2); p.vz = Math.sin(a) * (1 + r * 2) * 0.6; p.vy = 1.5 + Math.random() * 2.5; p.max = 0.5 + Math.random() * 0.5; p.s = 0.05 + Math.random() * 0.05; p.g = -6; p.c = o.color ?? [0xffe27a, 0xfff3c4, 0xffc94d][i % 3]; p.flat = 0.5; }
    else if (kind === 'confetti') { p.x += (Math.random() - 0.5) * (o.spread ?? 1); p.vx = Math.cos(a) * (1 + r * 2.5); p.vz = Math.sin(a) * (1 + r * 2); p.vy = 3 + Math.random() * 4; p.max = 1.6 + Math.random() * 1.2; p.s = 0.06 + Math.random() * 0.05; p.g = -5; p.drag = 1.4; p.c = [0xff7b8a, 0xffd166, 0x7bd3c4, 0x8fa8ff, 0xffa3d1, 0xfff1b8][i % 6]; p.flat = 0.25; }
    else if (kind === 'leaf') { p.x += (Math.random() - 0.5) * 1.6; p.z += (Math.random() - 0.5) * 1.6; p.vx = 0.6 + Math.random() * 0.8; p.vy = -0.4 - Math.random() * 0.4; p.vz = 0.3; p.max = 3 + Math.random() * 2; p.s = 0.07; p.c = o.color ?? 0xffb7c9; p.flat = 0.3; p.drag = 0.2; }
    else if (kind === 'crumb') { p.vx = Math.cos(a) * r * 1.2; p.vz = Math.sin(a) * r * 1.2; p.vy = 1 + Math.random() * 1.5; p.max = 0.5 + Math.random() * 0.3; p.s = 0.035 + Math.random() * 0.03; p.g = -7; p.c = [0xe7b872, 0xd49a52, 0xf6dcae][i % 3]; }
    else if (kind === 'rain') { p.vy = -16; p.vx = -2; p.max = 0.6; p.s = 0.0065; p.flat = 34; p.c = 0xa9c8e6; p.nr = 1; }
    else if (kind === 'dust') { p.vx = Math.cos(a) * 0.5; p.vz = Math.sin(a) * 0.4; p.vy = 0.25 + Math.random() * 0.3; p.max = 0.45 + Math.random() * 0.2; p.s = 0.06 + Math.random() * 0.04; p.c = o.color ?? 0xf3e7d2; p.grow = 0.2; p.drag = 3; }
    parts.push(p);
  }
}
export function updateParticles(dt) {
  let n = 0, m = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    const d = Math.exp(-p.drag * dt); p.vx *= d; p.vz *= d; if (p.g === 0 || p.drag > 2) p.vy *= d;
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.nr && p.y < 0.1) { p.life = p.max; continue; }
    if (p.y < 0.03 && p.g < -1) { p.y = 0.03; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
  }
  for (const p of parts) {
    const t = p.life / p.max, fade = t < 0.15 ? t / 0.15 : 1 - Math.pow(Math.max(0, (t - 0.5) / 0.5), 2);
    const s = (p.s + p.grow * t) * fade;
    if (p.nr) pe.set(0, 0, -0.13); else pe.set(p.spin + p.life * 3, p.spin * 2 + p.life * 2, 0); pq.setFromEuler(pe);
    pm.compose(pp.set(p.x, p.y, p.z), pq, ps.set(s, s * p.flat, s));
    if (p.soft && m < 400) { pm.compose(pp, camera.quaternion, ps.set(s, s, s)); pSoft.setMatrixAt(m, pm); pSoft.setColorAt(m, pc.setHex(p.c)); m++; } else { pMesh.setMatrixAt(n, pm); pMesh.setColorAt(n, pc.setHex(p.c)); n++; }
  }
  pSoft.count = m; pSoft.instanceMatrix.needsUpdate = true; pSoft.instanceColor.needsUpdate = true;
  pMesh.count = n; pMesh.instanceMatrix.needsUpdate = true; if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true;
}

// ---------- utilidades ----------
export class Spring {
  constructor(v = 0, k = 180, d = 14) { this.v = v; this.t = v; this.vel = 0; this.k = k; this.d = d; }
  step(dt) { const a = (this.t - this.v) * this.k - this.vel * this.d; this.vel += a * dt; this.v += this.vel * dt; return this.v; }
  kick(f) { this.vel += f; }
}
export const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
export const ease = { out: t => 1 - Math.pow(1 - t, 3), inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
export function angLerp(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
