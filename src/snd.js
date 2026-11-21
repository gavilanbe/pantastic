// Catálogo del sonido grabado (snd/*.mp3, generado con tools/sonido.mjs): nombre para la página de escucha y número de tomas.
// Las tomas de pasos y de amasado se alternan solas; en el resto se usa una, la de PICK (o la que elijas en escucha.html).
export const SFX_LIST = {
  step_wood: ['Paso en madera', 3, 1], step_stone: ['Paso en adoquín', 3, 1], step_grass: ['Paso en hierba', 3, 1], squish: ['Amasar', 3, 1],
  place: ['Dejar la bandeja', 2], pick: ['Coger la bandeja', 2], coin: ['Monedas en la caja', 2], buy: ['Caja registradora', 2], ding: ['Aviso del horno', 2], tick: ['Toque de madera', 2],
  bell: ['Campanilla de la puerta', 2], page: ['Página de la libreta', 2], stamp: ['Sello', 2], poof: ['Puñado de harina', 2], whoosh: ['Movimiento rápido', 2], fire: ['Leña al fuego', 2], quack: ['Pato', 2],
  no: ['«No se puede»', 2], pop: ['Aparece algo', 2], perfect: ['Perfecto', 2], good: ['Bien', 2], meh: ['Regular', 2], heart: ['Cariño', 2], fanfare: ['Logro', 2], day: ['Buenos días', 2],
  sweep: ['Barrer', 2], cut: ['Greñar', 2], knock: ['Llamar a la puerta', 2], splash: ['Caña al agua', 2],
};
export const AMB_LIST = { amb_day: 'Pueblo de mañana', amb_eve: 'Atardecer con grillos', amb_rain: 'Lluvia', amb_wind: 'Viento', amb_fire: 'Fuego del horno', amb_fountain: 'Fuente', amb_river: 'Río' };
export const MUS_LIST = { mus_title: 'Título', mus_day: 'Radio Migas · mañana', mus_day2: 'Swing del Colmado · 1', mus_eve: 'Radio Migas · atardecer', mus_fiesta: 'La Hornada', mus_swing: 'Swing del Colmado · 2', mus_molino: 'Onda Molino', mus_fonda: 'Fonda FM', mus_nocturno: 'Nocturno', mus_charanga: 'La Charanga' };
/** Toma elegida de cada efecto (a o b). */
export const PICK = { place: 'b', coin: 'b', bell: 'b', quack: 'b', no: 'b' };
/** Volumen relativo de cada efecto, para que los pasos no tapen la campanilla. */
export const GAIN = { step_wood: 0.3, step_stone: 0.26, step_grass: 0.24, squish: 0.75, place: 0.7, pick: 0.5, coin: 0.6, buy: 0.6, ding: 0.55, tick: 0.35, bell: 0.6, page: 0.55, stamp: 0.75, poof: 0.5, whoosh: 0.35, fire: 0.7, quack: 0.6, no: 0.45, pop: 0.45, perfect: 0.6, good: 0.5, meh: 0.45, heart: 0.55, fanfare: 0.7, day: 0.7, sweep: 0.6, cut: 0.6, knock: 0.7, splash: 0.6 };
