// Genera el sonido del juego con ElevenLabs (efectos, ambientes en bucle y pistas de la radio) y lo deja listo en snd/.
//   node tools/sonido.mjs            genera lo que falte
//   node tools/sonido.mjs bell coin  rehace solo esos (todas sus tomas)
// La clave se lee de ~/.config/elevenlabs/key. Los originales quedan en snd/_crudo (fuera del repositorio).
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), out = path.join(root, 'snd'), raw = path.join(out, '_crudo');
fs.mkdirSync(raw, { recursive: true });
const KEY = fs.readFileSync(process.env.HOME + '/.config/elevenlabs/key', 'utf8').trim();
const dry = 'Isolated single sound effect, close microphone, dry studio recording, no music, no voices, no background noise.';

// id: [descripción, segundos, tomas]
export const SFX = {
  step_wood: ['One single soft footstep of a light sneaker on a wooden floor. ' + dry, 0.5, 3],
  step_stone: ['One single soft footstep on a cobblestone path with fine gravel. ' + dry, 0.5, 3],
  step_grass: ['One single soft footstep on short grass. ' + dry, 0.5, 3],
  place: ['A wooden baking tray set down gently on a wooden counter, soft low thunk. ' + dry, 0.6, 2],
  pick: ['Picking up a wicker bread basket, short soft rustle and creak. ' + dry, 0.6, 2],
  squish: ['Hands kneading soft bread dough, one squishy press. ' + dry, 0.6, 3],
  coin: ['Two metal coins dropped into a wooden cash drawer, bright clink. ' + dry, 0.8, 2],
  buy: ['Old mechanical cash register: key press, cha-ching and a small bell. ' + dry, 1.3, 2],
  ding: ['Kitchen timer bell, one single bright ding that rings out. ' + dry, 1.6, 2],
  tick: ['Tiny soft wooden click, like a pencil tapping a wooden table once. ' + dry, 0.5, 2],
  bell: ['Small brass shop doorbell jingles as a bakery door opens, warm and bright. ' + dry, 1.6, 2],
  page: ['One paper page turning in a notebook. ' + dry, 0.6, 2],
  stamp: ['Rubber stamp pressed firmly on paper on a wooden desk, satisfying thump. ' + dry, 0.6, 2],
  poof: ['A handful of flour thrown on a table, soft dusty puff. ' + dry, 0.6, 2],
  whoosh: ['Soft quick cloth swish through the air, gentle whoosh. ' + dry, 0.5, 2],
  fire: ['A wood log thrown onto a fire: soft whoosh of flames and a few crackles. ' + dry, 1.6, 2],
  quack: ['A friendly duck quacks twice. Close microphone, no music, no voices.', 1.0, 2],
  no: ['Soft muted low wooden double knock, gentle "not possible" user interface sound for a cozy video game. No music.', 0.5, 2],
  pop: ['Soft round cute bubble pop, user interface sound for a cozy video game, warm. No music.', 0.5, 2],
  perfect: ['Bright sparkling glockenspiel rising arpeggio, cheerful reward chime for a cozy video game.', 1.2, 2],
  good: ['Two-note cheerful marimba chime going up, soft positive user interface sound for a cozy video game.', 0.7, 2],
  meh: ['Two-note soft kalimba going down, gentle slightly disappointed user interface sound for a cozy video game.', 0.7, 2],
  heart: ['Warm soft celesta three-note rising chime with a tiny sparkle, affectionate, cozy video game.', 1.2, 2],
  fanfare: ['Short joyful victory jingle played by accordion, acoustic guitar strum and clarinet flourish, cozy village video game, ends cleanly.', 2.6, 2],
  day: ['Gentle good-morning jingle: one warm acoustic guitar strum and a soft bell chime, cozy village video game, ends cleanly.', 2.4, 2],
  sweep: ['A straw broom sweeping a wooden floor, two short strokes. ' + dry, 1.2, 2],
  cut: ['A sharp blade slicing quickly through soft bread dough, one short slash. ' + dry, 0.5, 2],
  knock: ['Knuckles knocking three times on a wooden house door. ' + dry, 1.0, 2],
  splash: ['A small fishing float plops into a calm river, light splash. ' + dry, 1.0, 2],
};
export const AMB = {
  amb_day: ['Peaceful small village morning ambience: gentle birdsong, a light breeze, very distant life. Calm and steady, no music, no voices, no cars.', 22],
  amb_eve: ['Calm countryside evening ambience: crickets, a soft breeze, a distant owl now and then. Steady, no music, no voices.', 22],
  amb_rain: ['Gentle steady rain falling on roof tiles and a stone street, soft and cozy, no thunder, no music, no voices.', 22],
  amb_wind: ['Soft steady wind blowing through trees and wheat fields, leaves rustling, no music, no voices.', 22],
  amb_fire: ['Wood fire crackling steadily inside a brick bread oven, close and warm, constant, no music, no voices.', 20],
  amb_fountain: ['A small stone village fountain, water trickling steadily into a basin, close, no music, no voices.', 18],
  amb_river: ['A gentle stream flowing over stones, steady babbling brook, no birds, no music, no voices.', 20],
};
const band = 'nylon guitar fingerpicking, soft accordion, clarinet, upright bass and light brushes';
export const MUS = {
  mus_title: [`Instrumental opening theme for a cozy village bakery video game. Warm and inviting, ${band}, gentle 6/8 waltz feel in F major, a simple hummable melody. No vocals.`, 60000],
  mus_day: [`Instrumental daytime music for a cozy village bakery video game, like an old kitchen radio. Cheerful and relaxed, ${band}, gentle 6/8 waltz in F major, steady and unobtrusive so it can play in the background for a long time. No vocals.`, 80000],
  mus_day2: [`Instrumental daytime music for a cozy village bakery video game, like an old kitchen radio. Light swing manouche feel, ${band} with a muted trumpet melody, playful and warm, medium tempo, steady and unobtrusive. No vocals.`, 80000],
  mus_eve: [`Instrumental evening music for a cozy village bakery video game. Slow and tender, solo nylon guitar with soft accordion pads and upright bass, lullaby-like in D minor resolving to F major, very calm. No vocals.`, 60000],
  mus_fiesta: [`Instrumental village festival music for a cozy bakery video game. Joyful folk dance, lively accordion and clarinet melody, acoustic guitar, hand claps and tambourine, fast 6/8 jig in G major. No vocals.`, 60000],
};

const only = process.argv.slice(2);
const jobs = [];
for (const [id, [text, dur, n]] of Object.entries(SFX)) for (let v = 0; v < n; v++) jobs.push({ id, f: `${id}_${'abc'[v]}`, kind: 'sfx', text, dur });
for (const [id, [text, dur]] of Object.entries(AMB)) jobs.push({ id, f: id, kind: 'amb', text, dur });
for (const [id, [prompt, ms]] of Object.entries(MUS)) jobs.push({ id, f: id, kind: 'mus', prompt, ms });

async function gen(j) {
  const dst = path.join(raw, j.f + '.mp3'); if (fs.existsSync(dst) && !only.includes(j.id)) return false;
  const url = j.kind === 'mus' ? 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128' : 'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128';
  const body = j.kind === 'mus' ? { prompt: j.prompt, music_length_ms: j.ms } : { text: j.text, duration_seconds: j.dur, prompt_influence: j.kind === 'amb' ? 0.5 : 0.6, ...(j.kind === 'amb' ? { loop: true } : {}) };
  for (let tries = 0; tries < 3; tries++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { fs.writeFileSync(dst, Buffer.from(await r.arrayBuffer())); console.log('generado', j.f); return true; }
    const t = await r.text(); console.log('fallo', j.f, r.status, t.slice(0, 160)); if (r.status === 400 && body.loop) delete body.loop; await new Promise(s => setTimeout(s, 2500));
  }
  return false;
}
/** Deja cada sonido limpio: sin silencio delante, con el pico a su sitio y en el formato más ligero que le vale. */
function finish(j) {
  const src = path.join(raw, j.f + '.mp3'), dst = path.join(out, j.f + '.mp3'); if (!fs.existsSync(src)) return;
  if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs > fs.statSync(src).mtimeMs) return;
  const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  let log = ''; try { log = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${src}" -af volumedetect -f null - 2>&1`]).toString(); } catch { /* sin medida */ }
  const peak = Number((log.match(/max_volume: (-?[\d.]+) dB/) || [])[1] ?? -3);
  if (j.kind === 'sfx' && peak < -44) { console.log('MUDO', j.f, `pico ${peak} dB: hay que rehacerlo`); fs.rmSync(src); return 'mudo'; }
  const target = j.kind === 'mus' ? -1.5 : -2, gain = Math.max(-12, Math.min(42, target - peak));
  // primero se lleva el pico a su sitio y después se recorta el silencio de delante, para que el umbral valga igual en todos
  const af = j.kind === 'amb' ? 'loudnorm=I=-24:TP=-3:LRA=9' : j.kind === 'mus' ? `volume=${gain.toFixed(1)}dB` : `volume=${gain.toFixed(1)}dB,silenceremove=start_periods=1:start_threshold=-36dB:start_silence=0.01,areverse,afade=t=in:d=0.05,areverse`;
  ff(['-y', '-i', src, '-af', af, ...(j.kind === 'sfx' ? ['-ac', '1', '-b:a', '80k'] : j.kind === 'amb' ? ['-ac', '2', '-ar', '44100', '-b:a', '96k'] : ['-ac', '2', '-b:a', '128k']), dst]);
  console.log('listo', j.f, `pico ${peak} dB`);
}
let i = 0; await Promise.all([0, 1, 2].map(async () => { while (i < jobs.length) { const j = jobs[i++]; try { await gen(j); } catch (e) { console.log('error', j.f, e.message); } } }));
for (let pass = 0; pass < 3; pass++) { const redo = []; for (const j of jobs) try { if (finish(j) === 'mudo') redo.push(j); } catch (e) { console.log('error al acabar', j.f, String(e.message).slice(0, 200)); } if (!redo.length) break; for (const j of redo) try { await gen(j); } catch (e) { console.log('error', j.f, e.message); } }
const have = fs.readdirSync(out).filter(f => f.endsWith('.mp3')); console.log(`${have.length} sonidos en snd/ · ${(have.reduce((a, f) => a + fs.statSync(path.join(out, f)).size, 0) / 1048576).toFixed(1)} MB`);
