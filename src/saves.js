// Las libretas: tres partidas guardadas en el navegador, cada una con su foto, sus mañanas para rebobinar
// y la posibilidad de llevársela en un archivo a otro ordenador.
export const SLOTS = 3;
const KEY = (i) => 'pantastic-s' + i, SHOT = (i) => 'pantastic-shot' + i, CUR = 'pantastic-cur', OLD = 'pantastic-v1', BIN = 'pantastic-bin';
const NAMES = ['La libreta roja', 'La libreta verde', 'La libreta azul'];
const get = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const valid = (r) => !!(r && r.S && r.S.v === 1);
/** Escribe sin romper la partida si el navegador se queda sin sitio: antes de rendirse suelta las fotos y las mañanas viejas. */
function put(k, v) {
  const str = JSON.stringify(v);
  try { localStorage.setItem(k, str); return true; } catch { /* sin sitio */ }
  try { localStorage.removeItem(BIN); for (let i = 0; i < SLOTS; i++) localStorage.removeItem(SHOT(i)); localStorage.setItem(k, str); return true; } catch { /* sigue sin sitio */ }
  try { if (v && v.hist) { v.hist = v.hist.slice(-1); localStorage.setItem(k, JSON.stringify(v)); return true; } } catch { /* nada que hacer */ }
  return false;
}
const clean = (S) => { const c = JSON.parse(JSON.stringify(S)); delete c.mid; return c; };

export const saves = {
  defName: (i) => NAMES[i] || 'Libreta',
  nameOf: (S, i) => (S && S.name) || NAMES[i] || 'Libreta',
  cur() { const c = Number(localStorage.getItem(CUR)); return c >= 0 && c < SLOTS ? c : 0; },
  setCur(i) { try { localStorage.setItem(CUR, String(i)); } catch { /* da igual */ } },
  /** La partida única de antes pasa a ser la primera libreta. */
  migrate() {
    const old = get(OLD); if (!old || old.v !== 1) return;
    let i = 0; while (i < SLOTS && this.read(i)) i++; if (i >= SLOTS) return;
    old.name ||= NAMES[i]; if (put(KEY(i), { v: 1, S: old, hist: [] })) { localStorage.removeItem(OLD); this.setCur(i); }
  },
  read(i) { const r = get(KEY(i)); return valid(r) ? r : null; },
  write(i, S) { const r = this.read(i) || { v: 1, hist: [] }; r.S = S; return put(KEY(i), r); },
  /** Guarda cómo estaba todo al empezar el día (una vez por día; se conservan las tres últimas mañanas). */
  morning(i, S) {
    const r = this.read(i) || { v: 1, S, hist: [] }; r.hist ||= [];
    if (r.hist.length && r.hist[r.hist.length - 1].day === S.day) return;
    r.hist = r.hist.filter(h => h.day < S.day); r.hist.push({ day: S.day, at: Date.now(), S: clean(S) }); r.hist = r.hist.slice(-3); r.S = S; put(KEY(i), r);
  },
  mornings(i) { const r = this.read(i); return r ? (r.hist || []).map(h => ({ day: h.day, at: h.at, money: h.S.money })) : []; },
  /** Devuelve la libreta a la mañana de ese día. Lo posterior se pierde. */
  rewind(i, day) {
    const r = this.read(i); if (!r) return false; const h = (r.hist || []).find(x => x.day === day); if (!h) return false;
    const name = r.S.name, played = r.S.played; r.S = clean(h.S); r.S.name = name; r.S.played = played; r.S.last = Date.now(); r.hist = r.hist.filter(x => x.day <= day); return put(KEY(i), r);
  },
  shot(i, url) { try { localStorage.setItem(SHOT(i), url); } catch { /* sin sitio: la foto es prescindible */ } },
  getShot(i) { return localStorage.getItem(SHOT(i)) || ''; },
  rename(i, name) { const r = this.read(i); if (!r) return; r.S.name = String(name).trim().slice(0, 26) || NAMES[i]; put(KEY(i), r); },
  free() { for (let i = 0; i < SLOTS; i++) if (!this.read(i)) return i; return -1; },
  copy(i) { const j = this.free(), r = this.read(i); if (j < 0 || !r) return -1; const c = JSON.parse(JSON.stringify(r)); c.S.name = (c.S.name || NAMES[i]).slice(0, 18) + ' (copia)'; if (!put(KEY(j), c)) return -1; const s = this.getShot(i); if (s) this.shot(j, s); return j; },
  /** Tirar una libreta la deja un rato en la papelera, por si era sin querer. */
  remove(i) { const r = this.read(i); if (!r) return; put(BIN, { i, r, shot: this.getShot(i) }); localStorage.removeItem(KEY(i)); localStorage.removeItem(SHOT(i)); },
  undo() { const b = get(BIN); if (!b || !valid(b.r)) return -1; const i = this.read(b.i) ? this.free() : b.i; if (i < 0) return -1; put(KEY(i), b.r); if (b.shot) this.shot(i, b.shot); localStorage.removeItem(BIN); return i; },
  clearBin() { localStorage.removeItem(BIN); },
  /** Descarga la libreta como archivo para llevarla a otro navegador u ordenador. */
  export(i) {
    const r = this.read(i); if (!r) return; const slug = (r.S.name || 'libreta').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'libreta';
    const blob = new Blob([JSON.stringify({ pantastic: 1, S: r.S, hist: r.hist || [], shot: this.getShot(i) })], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `pantastic-${slug}-dia${r.S.day}.pan`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  /** Trae una libreta desde un archivo al primer hueco libre. Devuelve el hueco, -1 si no cabe o -2 si el archivo no vale. */
  import(text) {
    let o; try { o = JSON.parse(text); } catch { return -2; }
    if (!o || o.pantastic !== 1 || !o.S || o.S.v !== 1 || typeof o.S.day !== 'number') return -2;
    const j = this.free(); if (j < 0) return -1; o.S.name ||= NAMES[j];
    if (!put(KEY(j), { v: 1, S: o.S, hist: Array.isArray(o.hist) ? o.hist.filter(h => h && h.S && typeof h.day === 'number').slice(-3) : [] })) return -1;
    if (typeof o.shot === 'string' && o.shot.startsWith('data:image/')) this.shot(j, o.shot); return j;
  },
};
