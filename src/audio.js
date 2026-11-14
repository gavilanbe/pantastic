// Sonido: efectos sintetizados y «Masa madre», el tema del obrador (6/8, fa mayor, dos voces).
let ac, master, musicBus, sfxBus, delay, started = false, muted = false, volM = 0.5, volS = 0.8;
export function setVolume(m, s) { volM = m; volS = s; if (musicBus) { musicBus.gain.value = m; sfxBus.gain.value = s; } }
const M = (m) => 440 * Math.pow(2, (m - 69) / 12);
const N = { C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const n = (s) => { const m = s.match(/^([A-G][b#]?)(\d)$/); return 12 * (Number(m[2]) + 1) + N[m[1]]; };

export function initAudio() {
  if (started) return; started = true;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = muted ? 0 : 0.9;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  master.connect(comp); comp.connect(ac.destination);
  musicBus = ac.createGain(); musicBus.gain.value = volM; sfxBus = ac.createGain(); sfxBus.gain.value = volS;
  delay = ac.createDelay(1); delay.delayTime.value = 0.34; const fb = ac.createGain(); fb.gain.value = 0.28; const lp = ac.createBiquadFilter(); lp.frequency.value = 2200;
  delay.connect(lp); lp.connect(fb); fb.connect(delay); const wet = ac.createGain(); wet.gain.value = 0.22; lp.connect(wet); wet.connect(master);
  musicBus.connect(master); musicBus.connect(delay); sfxBus.connect(master);
  setInterval(tick, 50);
}
export function toggleMute() { muted = !muted; if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.05); return muted; }
export function resumeAudio() { if (ac && ac.state === 'suspended') ac.resume(); }

function tone(o) {
  if (!ac) return; const t = o.t ?? ac.currentTime, os = ac.createOscillator(), g = ac.createGain();
  os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t); if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide ?? o.d));
  if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.2; lg.gain.value = o.f * 0.006; l.connect(lg); lg.connect(os.frequency); l.start(t + 0.12); l.stop(t + o.d + 0.1); }
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g ?? 0.2, t + (o.a ?? 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
  let out = g; if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if (o.lpTo) f.frequency.exponentialRampToValueAtTime(o.lpTo, t + o.d); g.connect(f); out = f; }
  os.connect(g); out.connect(o.bus || sfxBus); os.start(t); os.stop(t + o.d + 0.05);
}
let noiseBuf;
function noise(o) {
  if (!ac) return; const t = o.t ?? ac.currentTime;
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + o.d); f.Q.value = o.q ?? 1;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g ?? 0.2, t + (o.a ?? 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
  s.connect(f); f.connect(g); g.connect(o.bus || sfxBus); s.start(t, Math.random()); s.stop(t + o.d + 0.05);
}

// ---------- efectos ----------
const FX = {
  step: () => noise({ f: 500 + Math.random() * 300, q: 1.2, d: 0.07, g: 0.05 }),
  pop: () => tone({ f: 420, to: 880, d: 0.12, g: 0.22, type: 'triangle' }),
  place: () => { tone({ f: 220, to: 150, d: 0.1, g: 0.25, type: 'triangle' }); noise({ f: 900, d: 0.06, g: 0.08 }); },
  pick: () => tone({ f: 330, to: 620, d: 0.1, g: 0.18, type: 'triangle' }),
  squish: () => { tone({ f: 170 + Math.random() * 40, to: 90, d: 0.16, g: 0.3 }); noise({ f: 400, fTo: 180, d: 0.14, g: 0.12, type: 'lowpass' }); },
  perfect: () => [0, 4, 7, 12].forEach((s, i) => tone({ f: M(81 + s), t: ac.currentTime + i * 0.045, d: 0.3, g: 0.13, type: 'triangle' })),
  good: () => [0, 4].forEach((s, i) => tone({ f: M(76 + s), t: ac.currentTime + i * 0.05, d: 0.2, g: 0.12, type: 'triangle' })),
  meh: () => tone({ f: 300, to: 230, d: 0.18, g: 0.12, type: 'triangle' }),
  coin: () => { tone({ f: M(88), d: 0.09, g: 0.13, type: 'square', lp: 5000 }); tone({ f: M(93), t: ac.currentTime + 0.07, d: 0.4, g: 0.14, type: 'square', lp: 5000 }); },
  ding: () => { for (const [f, g] of [[M(84), 0.25], [M(84) * 2.76, 0.1], [M(84) * 5.4, 0.05]]) tone({ f, d: 1.6, g }); },
  tick: () => tone({ f: M(96), d: 0.05, g: 0.1, type: 'square', lp: 4000 }),
  bell: () => { tone({ f: M(86), d: 0.9, g: 0.12 }); tone({ f: M(91), t: ac.currentTime + 0.14, d: 1.1, g: 0.12 }); },
  page: () => noise({ f: 2500, fTo: 900, d: 0.16, g: 0.1, q: 0.7 }),
  buy: () => { tone({ f: M(72), d: 0.08, g: 0.14, type: 'triangle' }); tone({ f: M(79), t: ac.currentTime + 0.07, d: 0.16, g: 0.14, type: 'triangle' }); },
  no: () => { tone({ f: 210, d: 0.1, g: 0.14, type: 'triangle' }); tone({ f: 170, t: ac.currentTime + 0.11, d: 0.16, g: 0.14, type: 'triangle' }); },
  stamp: () => { tone({ f: 130, to: 60, d: 0.14, g: 0.4 }); noise({ f: 700, fTo: 200, d: 0.09, g: 0.2, type: 'lowpass' }); },
  poof: () => noise({ f: 1400, fTo: 400, d: 0.22, g: 0.12, q: 0.5 }),
  whoosh: () => noise({ f: 300, fTo: 1600, d: 0.25, g: 0.1, q: 0.8 }),
  heart: () => [0, 7, 12].forEach((s, i) => tone({ f: M(79 + s), t: ac.currentTime + i * 0.08, d: 0.35, g: 0.12 })),
  fire: () => noise({ f: 300, fTo: 900, d: 0.4, g: 0.12, type: 'lowpass' }),
  quack: () => { tone({ f: 520, to: 380, d: 0.12, g: 0.12, type: 'sawtooth', lp: 1800 }); tone({ f: 480, to: 340, t: ac.currentTime + 0.16, d: 0.14, g: 0.12, type: 'sawtooth', lp: 1800 }); },
  fanfare: () => [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [81, 0.56], [84, 0.68], [88, 0.8]].forEach(([m, d]) => { tone({ f: M(m), t: ac.currentTime + d, d: 0.5, g: 0.14, type: 'triangle' }); tone({ f: M(m - 12), t: ac.currentTime + d, d: 0.5, g: 0.08 }); }),
  day: () => [[69, 0], [72, 0.16], [77, 0.32], [81, 0.56]].forEach(([m, d]) => tone({ f: M(m), t: ac.currentTime + d, d: 0.9, g: 0.12 })),
};
export function sfx(name) { if (!ac || muted) return; try { FX[name]?.(); } catch (e) { /* sin sonido */ } }
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export function note(i, g = 0.16) { if (!ac || muted) return; const f = M(72 + PENTA[Math.min(PENTA.length - 1, i)]); tone({ f, d: 0.35, g, type: 'triangle' }); tone({ f: f * 2, d: 0.18, g: g * 0.35 }); }
export function duck(on) { if (musicBus) musicBus.gain.setTargetAtTime(on ? volM * 0.35 : volM, ac.currentTime, 0.15); }
export function ambient(kind) { if (!ac || muted) return; if (kind === 'chirp') { const f = 2600 + Math.random() * 1400, n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) tone({ f, to: f * (1.15 + Math.random() * 0.2), t: ac.currentTime + i * 0.11, d: 0.07, g: 0.035 }); } else if (kind === 'crackle') noise({ f: 1800 + Math.random() * 2500, q: 3, d: 0.03 + Math.random() * 0.04, g: 0.05 }); else if (kind === 'water') noise({ f: 900 + Math.random() * 600, q: 0.8, d: 0.5, g: 0.012, a: 0.2 }); }
export function blip(pitch = 1) { if (!ac || muted) return; tone({ f: (380 + Math.random() * 90) * pitch, to: (430 + Math.random() * 60) * pitch, d: 0.055, g: 0.09, type: 'triangle', lp: 2600 }); }

// ---------- música ----------
// compás de 6 corcheas. Melodía y contracanto: [compás, corchea, nota, duración en corcheas]
const mel = `0 0 A4 2|0 2 C5 1|0 3 E5 3|1 0 D5 2|1 2 C5 1|1 3 A4 2|1 5 F4 1|2 0 G4 1|2 1 A4 1|2 2 Bb4 1|2 3 D5 3|3 0 C5 3|3 3 Bb4 1|3 4 G4 1|3 5 E4 1|
4 0 A4 2|4 2 C5 1|4 3 E5 2|4 5 G5 1|5 0 F#5 2|5 2 Eb5 1|5 3 D5 2|5 5 C5 1|6 0 Bb4 2|6 2 A4 1|6 3 Bb4 1|6 4 D5 1|6 5 F5 1|7 0 E5 2|7 2 D5 1|7 3 A4 3|
8 0 F5 2|8 2 D5 1|8 3 Bb4 2|8 5 A4 1|9 0 G4 1|9 1 Bb4 1|9 2 Db5 1|9 3 F5 3|10 0 E5 2|10 2 C5 1|10 3 A4 2|10 5 G4 1|11 0 F4 1|11 1 Ab4 1|11 2 B4 1|11 3 D5 3|
12 0 D5 1|12 1 C5 1|12 2 Bb4 1|12 3 A4 1|12 4 G4 1|12 5 Bb4 1|13 0 C5 2|13 2 E5 1|13 3 G5 2|13 5 Bb5 1|14 0 A5 3|14 3 G5 1|14 4 F5 1|14 5 Db5 1|15 0 C5 2|15 2 A4 1|15 3 F4 3`;
const ctr = `0 1 C4 2|0 4 E4 2|1 1 F4 2|1 4 E4 2|2 0 D4 3|2 3 F4 3|3 1 F4 2|3 4 E4 2|4 1 E4 2|4 4 G4 2|5 1 A4 2|5 4 F#4 2|6 1 G4 2|6 4 F4 2|7 1 Bb4 2|7 4 G4 2|
8 1 D4 2|8 4 F4 2|9 1 Db4 2|9 4 G4 2|10 1 C4 2|10 4 E4 2|11 1 B3 2|11 4 D4 2|12 1 Bb3 2|12 4 D4 2|13 1 Bb3 2|13 4 E4 2|14 1 C4 2|14 4 Db4 2|15 1 C4 2|15 4 A3 2`;
const parse = (s) => s.replace(/\n/g, '').split('|').map(x => { const p = x.trim().split(' '); return [Number(p[0]) * 6 + Number(p[1]), n(p[2]), Number(p[3])]; });
const MEL = parse(mel), CTR = parse(ctr);
// armonía: [corchea de inicio, bajo, voces]
const HARM = [
  [0, 'F2', 'A3 C4 E4'], [6, 'D2', 'F3 C4 E4'], [12, 'Bb1', 'A3 D4 F4'], [18, 'C2', 'Bb3 D4 F4'], [21, 'C2', 'Bb3 E4'], [24, 'A1', 'G3 C4 E4'], [30, 'D2', 'F#3 C4 Eb4'], [36, 'G1', 'F3 Bb3 D4 A4'], [42, 'C2', 'Bb3 E4 A4'], [45, 'Db2', 'Bb3 Db4 E4 G4'],
  [48, 'Bb1', 'A3 D4 F4'], [54, 'Bb1', 'G3 Bb3 Db4 F4'], [60, 'A1', 'G3 C4 E4'], [66, 'Ab1', 'Ab3 B3 D4 F4'], [72, 'G1', 'F3 Bb3 D4'], [78, 'C2', 'E3 Bb3 D4'], [84, 'F2', 'A3 C4 E4'], [87, 'Eb2', 'G3 Db4 F4 A4'], [90, 'F2', 'A3 C4 E4 G4'],
].map(h => [h[0], n(h[1]), h[2].split(' ').map(n)]);
const LEN = 96;
const MOODS = {
  day: { bpm: 208, tr: 0, lead: 'epiano', shaker: 1, ctr: 1, comp: 1 },
  eve: { bpm: 150, tr: -3, lead: 'box', shaker: 0, ctr: 1, comp: 1 },
  fiesta: { bpm: 262, tr: 2, lead: 'flute', shaker: 2, ctr: 1, comp: 2 },
  title: { bpm: 184, tr: 0, lead: 'box', shaker: 0, ctr: 0, comp: 1 },
};
let mood = null, pos = 0, nextT = 0, playing = false;
export function music(name) { if (mood === name) return; mood = name; if (!ac) return; if (!name) { playing = false; return; } if (!playing) { playing = true; pos = 0; nextT = ac.currentTime + 0.15; } }
function lead(kind, m, t, d) {
  const f = M(m);
  if (kind === 'epiano') { tone({ f, t, d: Math.max(0.5, d * 1.5), g: 0.2, bus: musicBus, a: 0.004 }); tone({ f: f * 2, t, d: 0.25, g: 0.05, bus: musicBus }); tone({ f: f * 1.003, t, d: d * 1.2, g: 0.07, type: 'triangle', bus: musicBus, lp: 1800 }); }
  else if (kind === 'box') { tone({ f: f * 2, t, d: 1.2, g: 0.13, bus: musicBus }); tone({ f: f * 6.01, t, d: 0.2, g: 0.025, bus: musicBus }); tone({ f, t, d: 0.7, g: 0.06, bus: musicBus }); }
  else { tone({ f: f * 2, t, d: d + 0.08, g: 0.13, a: 0.03, type: 'triangle', vib: true, bus: musicBus, lp: 3200 }); tone({ f, t, d: 0.3, g: 0.1, bus: musicBus, type: 'triangle', lp: 1500 }); }
}
function tick() {
  if (!ac || !playing || !mood) return;
  const md = MOODS[mood], e = 60 / md.bpm;             // duración de la corchea
  while (nextT < ac.currentTime + 0.25) {
    const p = pos % LEN, t = nextT, sw = (p % 6 === 2 || p % 6 === 5) ? e * 0.06 : 0;
    for (const m of MEL) if (m[0] === p) lead(md.lead, m[1] + md.tr, t + sw, m[2] * e);
    if (md.ctr) for (const m of CTR) if (m[0] === p) { tone({ f: M(m[1] + md.tr), t: t + sw, d: m[2] * e * 1.1, g: 0.075, a: 0.03, type: 'triangle', bus: musicBus, lp: 1100 }); }
    let h = HARM[0]; for (const x of HARM) if (x[0] <= p) h = x;
    const beat = p % 6;
    if (h[0] === p || beat === 0) { tone({ f: M(h[1] + md.tr), t, d: e * 2.6, g: 0.2, bus: musicBus, type: 'triangle', lp: 420 }); tone({ f: M(h[1] + md.tr), t, d: e * 2.6, g: 0.13, bus: musicBus }); }
    else if (beat === 3) tone({ f: M(h[1] + md.tr + 7), t, d: e * 1.6, g: 0.12, bus: musicBus, type: 'triangle', lp: 420 });
    else if (beat === 5 && md.comp === 2) tone({ f: M(h[1] + md.tr + 12), t, d: e * 0.8, g: 0.1, bus: musicBus, type: 'triangle', lp: 500 });
    if (md.comp && (beat === 0 || beat === 3 || (md.comp === 2 && beat === 4))) h[2].forEach((m, i) => tone({ f: M(m + md.tr), t: t + i * 0.012 + (beat ? 0.01 : 0), d: beat === 0 ? e * 2.4 : e * 1.2, g: beat === 0 ? 0.05 : 0.035, a: 0.01, type: 'triangle', bus: musicBus, lp: 1400 }));
    if (md.shaker && (beat === 0 || beat === 2 || beat === 3 || beat === 5)) noise({ t: t + sw, f: 6500, q: 1.5, d: 0.05, g: beat % 3 === 0 ? 0.035 : 0.02, bus: musicBus });
    if (md.shaker === 2 && beat === 3) { noise({ t, f: 1700, q: 2, d: 0.07, g: 0.09, bus: musicBus }); noise({ t: t + 0.012, f: 1500, q: 2, d: 0.08, g: 0.07, bus: musicBus }); }
    nextT += e; pos++;
  }
}
