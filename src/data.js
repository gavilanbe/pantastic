// Datos de Pantastic!: ingredientes, panes, vecinos, mejoras y textos.

export const ING = {
  harina: { n: 'Harina de trigo', p: 2, c: '#f6ecd6', pack: 6, d: 'La blanca de toda la vida. Sin ella no hay obrador que valga.' },
  integral: { n: 'Harina integral', p: 3, c: '#c9a36e', pack: 4, d: 'Con su salvado y todo. Sabe a campo.' },
  centeno: { n: 'Harina de centeno', p: 3, c: '#9c7b5a', pack: 4, d: 'Oscura y seria, como Tejo en lunes.' },
  levadura: { n: 'Levadura', p: 1, c: '#e8d9a8', pack: 6, d: 'Fresquísima. Mírala, si casi respira.' },
  mantequilla: { n: 'Mantequilla', p: 5, c: '#ffe07a', pack: 3, d: 'De vaca feliz. No preguntes cómo lo sé.' },
  azucar: { n: 'Azúcar', p: 3, c: '#ffffff', pack: 3, d: 'Para los días de lluvia y los cumpleaños.' },
  semillas: { n: 'Semillas', p: 4, c: '#7a6a45', pack: 3, d: 'Pipas, lino y sésamo. Brinco se las come a puñados.' },
  aceitunas: { n: 'Aceitunas', p: 5, c: '#5f6b3a', pack: 3, d: 'Del tarro de Charca. Con hueso no, tranquila.' },
  nueces: { n: 'Nueces', p: 6, c: '#a8774a', pack: 3, d: 'Recogidas del camino viejo. Crujen que da gusto.' },
  chocolate: { n: 'Chocolate', p: 7, c: '#5a3524', pack: 3, d: 'Negro del bueno. Escóndelo de Púa.' },
};

// precio: por pieza. lote: 4 piezas (6 con bandeja grande).
export const BREADS = {
  barra: { n: 'Barra', art: 'una', pl: 'barras', price: 4, ing: { harina: 2, levadura: 1 }, sweet: 0, d: 'La de toda la vida. Corteza que cruje y miga que perdona.' },
  hogaza: { n: 'Hogaza', art: 'una', pl: 'hogazas', price: 7, ing: { harina: 3, levadura: 1 }, sweet: 0, d: 'Redonda y paciente. Aguanta tres días y un disgusto.' },
  mollete: { n: 'Mollete', art: 'un', pl: 'molletes', price: 8, ing: { harina: 2, levadura: 1, mantequilla: 1 }, sweet: 0, d: 'Blandito y enharinado, como una nube que se deja abrir.' },
  centeno: { n: 'Pan de centeno', art: 'un', pl: 'panes de centeno', price: 10, ing: { centeno: 3, levadura: 1 }, sweet: 0, d: 'Oscuro, denso y honrado. Sabe a molino y a invierno.' },
  semillas: { n: 'Integral de semillas', art: 'un', pl: 'integrales', price: 11, ing: { integral: 3, levadura: 1, semillas: 1 }, sweet: 0, d: 'Para llegar lejos: pipas, lino y sésamo en cada bocado.' },
  chapata: { n: 'Chapata de aceitunas', art: 'una', pl: 'chapatas', price: 12, ing: { harina: 3, levadura: 1, aceitunas: 1 }, sweet: 0, d: 'Plana, alveolada y con tropezones verdes de la charca.' },
  nueces: { n: 'Pan de nueces', art: 'un', pl: 'panes de nueces', price: 15, ing: { integral: 2, harina: 1, levadura: 1, nueces: 2 }, sweet: 0, d: 'Un pan para llevar en el zurrón por caminos largos.' },
  brioche: { n: 'Brioche', art: 'un', pl: 'brioches', price: 14, ing: { harina: 2, levadura: 1, mantequilla: 2, azucar: 1 }, sweet: 1, d: 'Con su moñete arriba. Brilla como un libro recién forrado.' },
  caracola: { n: 'Caracola de chocolate', art: 'una', pl: 'caracolas', price: 17, ing: { harina: 2, levadura: 1, mantequilla: 2, azucar: 1, chocolate: 2 }, sweet: 1, d: 'Se desenrolla despacito. El centro es lo mejor y se guarda.' },
  rosca: { n: 'Rosca de la Hornada', art: 'una', pl: 'roscas', price: 22, ing: { harina: 3, levadura: 1, mantequilla: 2, azucar: 2, nueces: 1 }, sweet: 1, d: 'El pan de la fiesta. Se parte entre todos o no se parte.' },
};
export const BREAD_ORDER = ['barra', 'hogaza', 'mollete', 'centeno', 'semillas', 'chapata', 'nueces', 'brioche', 'caracola', 'rosca'];

export const PRICE_LV = [
  { n: 'Popular', k: 0.8, d: 'Más barato: el pueblo te coge cariño antes.' },
  { n: 'Justo', k: 1, d: 'El precio de siempre.' },
  { n: 'De capricho', k: 1.35, d: 'Más caro: solo cuela si el pan sale de tres estrellas.' },
];

export const REP = [
  { at: 0, n: 'Horno recién encendido' },
  { at: 30, n: 'Huele a pan en la calle' },
  { at: 90, n: 'La panadería del barrio' },
  { at: 190, n: 'Cola en la puerta' },
  { at: 340, n: 'El orgullo de Migas' },
  { at: 540, n: 'Maestra panadera' },
  { at: 800, n: 'Como la abuela Hogaza' },
];

// Vecinos. look: ver chars.js
export const NEIGH = {
  lana: {
    n: 'Doña Lana', lvl: 0, gives: 'mollete', favs: ['mollete', 'hogaza', 'brioche'], pitch: 1.25,
    look: { lash: true, sp: 'oveja', fur: '#fbf3e4', skin: '#f0d5c0', shirt: '#c96f7c', pat: 'punto', acc: 'gafas' },
    hola: ['¡Ay, hija, que el horno echa humo otra vez!', 'Soy Lana, la de las bufandas. Llevo años comprando pan de gasolinera. No se lo cuentes a nadie.'],
    gracias: ['Esto sí que es pan, criatura.', 'Me llevo el calorcito en el bolso.', 'Te tejo unas manoplas para el horno, ya verás.', 'Qué manos tienes, Pan.'],
    charla: ['Estoy tejiendo una bufanda para el espantapájaros. No me mires así, pasa frío.', 'De joven bailé en la Hornada con un pastor de Villaseca. Bailaba fatal. Me casé con él.', 'Si te duelen las manos de amasar, agua tibia y sal. Receta de tu abuela, no mía.'],
    receta: ['¿Sabes qué echo de menos? Los molletes de tu abuela.', 'Blancos, blanditos, con su harina por encima. Yo decía que eran como mi lana recién lavada.', 'Me dejó apuntado cómo los hacía por si alguien volvía a encender el horno. Toma. Creo que ese alguien eres tú.'],
  },
  tejo: {
    n: 'Tejo', lvl: 0, gives: 'centeno', favs: ['centeno', 'hogaza', 'nueces'], pitch: 0.7,
    look: { brow: 'serio', sp: 'tejon', fur: '#8d8f96', skin: '#f4f1ea', shirt: '#5d7a55', pat: 'cuadros', acc: 'gorra' },
    hola: ['Hmf. Así que tú eres la nieta.', 'Tejo. Llevo el molino. Bueno, lo llevaba cuando había a quién molerle.'],
    gracias: ['Hmf. No está mal.', 'Corteza seria. Bien.', 'El molino vuelve a tener trabajo, chiquilla.', 'Tu abuela lo habría dejado un minuto más. Pero vale.'],
    charla: ['El molino cruje. Buena señal. Lo que no cruje está muerto o es nuevo.', 'Tu abuela me debía una partida de dominó. Te la apunto a ti.', 'Hmf. El pueblo huele distinto desde que encendiste el horno. Mejor. No se lo digas a nadie.'],
    receta: ['Tu abuela y yo discutíamos cada otoño por el centeno.', 'Ella decía que era un grano triste. Yo le decía que triste es el pan que no pesa.', 'Al final hacía un pan negro que callaba a cualquiera. Lo tengo apuntado detrás de una factura. Cuídalo.'],
  },
  brinco: {
    n: 'Brinco', lvl: 0, gives: 'semillas', favs: ['semillas', 'barra', 'chapata'], pitch: 1.6,
    look: { sp: 'liebre', fur: '#d9b58c', skin: '#fff3df', shirt: '#4fb3a8', pat: 'raya', acc: 'cinta' },
    hola: ['¡Buenas! ¡Paso corriendo! ¡Literal!', 'Soy Brinco. Doy tres vueltas al pueblo cada mañana y ahora la meta huele a pan. ¡Peligro!'],
    gracias: ['¡Gasolina de la buena!', '¡Me lo como en la segunda vuelta!', '¡Hoy bato mi marca, te lo dedico!', '¡Crujiente! ¡Como mis rodillas!'],
    charla: ['¡Voy por la vuelta dos! ¡No, la tres! ¡He perdido la cuenta!', '¿Sabes que los patos del estanque me ganan en los cien metros? Humillante.', '¡Estiramientos, Pan! ¡Amasar también es deporte!'],
    receta: ['Te cuento un secreto de corredor.', 'Tu abuela me hacía un integral con tantas semillas que sonaba al morderlo. Con ese pan gané la carrera de la Hornada tres años seguidos.', 'Aquí está la mezcla. Me la sé de memoria pero la llevo siempre en la riñonera.'],
  },
  charca: {
    n: 'Charca', lvl: 1, gives: 'chapata', favs: ['chapata', 'barra', 'centeno'], pitch: 0.9,
    look: { sp: 'rana', fur: '#8fca6b', skin: '#e9f5c9', shirt: '#f2efe6', pat: 'liso', acc: 'gorro' },
    hola: ['Croac. Perdón. Buenos días.', 'Soy Charca, la cocinera de la fonda. Un guiso sin pan para mojar es media receta.'],
    gracias: ['Esto pide salsa.', 'Hoy en la fonda se rebaña el plato.', 'Croac de aprobación.', 'Mis clientes van a dejar los platos limpios.'],
    charla: ['Hoy en la fonda hay potaje. Guárdame dos barras o habrá motín.', 'Croac. Perdón. Es que me emociono cuando huele a pan.', 'Un día te enseño a hacer alioli. Tú pones el pan, yo el mortero.'],
    receta: ['En la fonda guardo una cosa de tu abuela.', 'Un verano cambió una hornada por un tarro de mis aceitunas. Al día siguiente apareció con una chapata llena de tropezones verdes.', 'Me dejó la receta escrita en una servilleta. Está un poco manchada de aceite, como debe ser.'],
  },
  pua: {
    n: 'Púa', lvl: 2, gives: 'caracola', favs: ['caracola', 'brioche', 'mollete'], pitch: 1.9,
    look: { lash: true, sp: 'erizo', fur: '#8a6a55', skin: '#f6dcc0', shirt: '#ffd166', pat: 'punto', acc: 'lazo' },
    hola: ['Hola. Tengo seis años y medio y dos monedas.', 'Me llamo Púa. No pincho si no me asustan.'],
    gracias: ['¡Hala!', 'Me lo voy a comer por el borde primero.', 'Hoy no comparto. Bueno, un poquito.', 'Eres la mayor que mejor me cae.'],
    charla: ['He contado las baldosas de tu porche. Son muchas. Me he perdido en la treinta.', 'Mi abuelo dice que tu abuela regañaba con cariño. ¿Tú también sabes?', 'Si te doy un dibujo, ¿me das el centro de una caracola?'],
    receta: ['Mi abuelo dice que antes había caracolas de chocolate.', 'Que tu abuela las hacía los sábados y que él se guardaba el centro para el final, igual que yo.', 'Me ha dado este papel para ti. Dice que es la receta. Yo he dibujado una caracola al lado para que se entienda mejor.'],
  },
  zarza: {
    n: 'Zarza', lvl: 2, gives: 'nueces', favs: ['nueces', 'semillas', 'barra'], pitch: 1.1,
    look: { lash: true, iris: '#7a5a2a', sp: 'zorro', fur: '#e58b4a', skin: '#fff6ea', shirt: '#5873b8', pat: 'liso', acc: 'cartera' },
    hola: ['Carta para… ah, no, hoy vengo a comprar.', 'Zarza, cartera de Migas y de cuatro pueblos más. Conozco todos los caminos y casi todos los perros.'],
    gracias: ['Esto viaja conmigo hasta el último buzón.', 'Certificado y con acuse de recibo.', 'Hoy reparto de buen humor.', 'Te traigo saludos de tres pueblos. Y pedidos.'],
    charla: ['Traigo cartas de cuatro pueblos y en las cuatro preguntan por tu pan.', 'El buzón de tu puerta tiene nido de gorriones. Lo abro con cuidado.', 'Ruta larga hoy. Menos mal que sé dónde desayunar.'],
    receta: ['En el fondo de la saca llevo una carta sin entregar desde hace años.', 'Es de tu abuela para «quien encienda el horno». Dentro iba la receta del pan de nueces que me daba para la ruta larga.', 'Hoy por fin tiene destinataria. Firma aquí. Es broma. Pero toma.'],
  },
  ulular: {
    n: 'Don Ulular', lvl: 3, gives: 'brioche', favs: ['brioche', 'centeno', 'caracola'], pitch: 0.8,
    look: { brow: 'sabio', iris: '#c98a2a', sp: 'buho', fur: '#a98467', skin: '#f3e3c8', shirt: '#7b5ea7', pat: 'rombos', acc: 'pajarita' },
    hola: ['Buenas tardes. O días. A mi edad uno ya ulula a cualquier hora.', 'Fui el maestro de este pueblo. A tu abuela le puse un diez en fracciones: partía el pan en partes exactamente iguales.'],
    gracias: ['Sobresaliente.', 'Un pan con muy buena caligrafía.', 'Notable alto. El alto es por la corteza.', 'Esto merece matrícula.'],
    charla: ['De noche oigo el horno enfriarse. Hace tic, tic. Es un sonido muy bien educado.', 'Pon atención a la corteza, Pan. La corteza es la letra; la miga, lo que quiere decir.', 'He corregido el cartel de la plaza. Tenía una falta. La puse yo hace cuarenta años.'],
    receta: ['El último día de curso tu abuela traía brioche para toda la clase.', 'Decía que la mantequilla se enseña igual que las letras: con paciencia y sin prisa por pasar página.', 'Copié la receta en la pizarra y luego en este cuaderno. Considéralo tu boletín de notas, Pan.'],
  },
};
export const NEIGH_ORDER = ['lana', 'tejo', 'brinco', 'charca', 'pua', 'zarza', 'ulular'];
export const HEART_AT = [0, 3, 9, 18, 30, 45];   // puntos para cada corazón; la receta llega con el segundo

export const UPG = {
  bandeja: { n: 'Bandeja grande', p: 120, cap: 0, d: 'Cada hornada da 6 piezas en vez de 4.', at: [1.6, 1.4, -2.6] },
  jardin: { n: 'Jardineras en la puerta', p: 90, cap: 0, d: 'Flores en la entrada. Entra más gente, espera más a gusto y deja más propina.', at: [0, 0.6, 3.2] },
  fermenta: { n: 'Fermentadora templada', p: 180, cap: 0, d: 'La masa sube el doble de rápido.', at: [3, 1.6, -4.9] },
  huerto: { n: 'El huerto de la abuela', p: 160, cap: 0, lvl: 1, d: 'Lo desbrozan y lo plantan. Cada mañana te deja algo: aceitunas, nueces o semillas.', at: [-15, 0.8, 1.2] },
  horno2: { n: 'Segunda boca de horno', p: 320, cap: 1, lvl: 1, d: 'Abren la leñera y hornean dos hornadas a la vez.', at: [5.1, 1, -4.2] },
  reforma: { n: 'Reforma del obrador', p: 420, cap: 1, lvl: 2, d: 'Baldosa nueva, azulejo azul y banderines. Viene más gente y las propinas suben.', at: [0, 1.5, -3] },
  molino: { n: 'Arreglar el molino de Tejo', p: 380, cap: 1, lvl: 2, d: 'Aspas nuevas y muela afilada. Las tres harinas te salen un tercio más baratas.', at: [-9.8, 1.5, -3] },
  miga: { n: 'Miga, la aprendiz', p: 450, cap: 1, lvl: 2, d: 'La sobrina de Pipa. Una ratona muy seria que despacha en el mostrador mientras tú amasas.', at: [-1, 1, -3.85] },
  terraza: { n: 'Terraza en la plaza', p: 260, cap: 2, lvl: 2, d: 'Mesas y sombrillas. La gente se queda a merendar y vuelve.', at: [11, 1, 1] },
  puesto: { n: 'Puesto en la plaza', p: 480, cap: 2, lvl: 3, d: 'Un tenderete con toldo. Lo que te sobre al cerrar se vende allí a mitad de precio.', at: [-4.2, 1, 7.4] },
  farolillos: { n: 'Farolillos de verbena', p: 380, cap: 2, lvl: 3, d: 'Luces de lado a lado de la plaza. Las tardes se llenan.', at: [0, 3, 4.5] },
  fuente: { n: 'Arreglar la fuente', p: 520, cap: 2, lvl: 4, d: 'Vuelve a manar. Dicen que da suerte echarle una miga.', at: [-10.2, 1.4, 7] },
};
export const UPG_ORDER = ['bandeja', 'jardin', 'fermenta', 'huerto', 'horno2', 'reforma', 'molino', 'miga', 'terraza', 'puesto', 'farolillos', 'fuente'];
export const CAPS = ['Primeros arreglos', 'El obrador crece', 'La plaza revive'];
export const PIPA_LOOK = { lash: true, sp: 'raton', fur: '#d9b08a', skin: '#fff3e2', shirt: '#6fbfae', pat: 'punto', acc: 'lazo' };
export const PIPA = {
  hola: ['¡La nieta de Hogaza! Soy Pipa, la del colmado. Dime qué te subo.'],
  abre: ['¿Qué te pongo hoy, Pan?', '¡Buenas! Recién repuesto todo.', 'Pide por esa boquita.', 'Hoy el género ha venido precioso.'],
  mas: ['¡Marchando!', 'Apuntado.', '¿Algo más, reina?', 'Eso es tener ojo.', 'Te lo voy envolviendo.'],
  menos: ['Lo quito, sin problema.', 'Tachado.', 'Mejor, que luego se pone malo.'],
  caro: ['Uy, eso se te va del monedero, cielo.', 'Con lo que llevas no te llega. Quita algo.'],
  paga: ['¡Gracias, Pan! Te lo subo ahora mismo.', '¡Listo! Hornea algo rico con esto.', 'Un placer. Guárdame una barra.'],
  vacio: ['El tique está en blanco, mujer.'],
};

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const TIEMPO = {
  sol: { n: 'Soleado', ic: '☀️', k: 1 },
  nubes: { n: 'Nubes', ic: '⛅', k: 0.95 },
  lluvia: { n: 'Lluvia', ic: '🌧️', k: 0.8 },
  viento: { n: 'Viento', ic: '🍃', k: 1 },
};

export const CARTA = [
  'Querida Pan:',
  'Si lees esto es que el horno lleva frío demasiado tiempo y que tú, cabezota como yo, has decidido encenderlo.',
  'En Migas el pan nunca fue solo pan. Cada vecino tenía el suyo, y cada año, cuando todos habían comido del suyo, celebrábamos la Hornada en la plaza.',
  'Mis recetas no están en ningún libro. Las fui dejando en sus manos. Gánate su cariño y te las irán devolviendo.',
  'Empieza por lo sencillo: una barra, una hogaza y la puerta abierta.',
  'Con harina en las manos, tu abuela Hogaza.',
];
export const CARTA_ROSCA = [
  'Pan, mi niña:',
  'Si esta carta ha salido de su escondite detrás del horno es que ya te han devuelto todas mis recetas. Eso quiere decir que Migas te quiere.',
  'Queda una. La Rosca de la Hornada no se vende en un día cualquiera: se hornea para todos y se parte en la plaza.',
  'Ten ocho roscas en el mostrador al caer la tarde y el pueblo sabrá qué hacer.',
  'Yo ya estaré oliéndola desde donde esté.',
];

export const VISIT_LINES = ['¡Gracias!', 'Qué bien huele aquí.', 'Me habían hablado de este sitio.', 'Mañana vuelvo.', 'Calentito, calentito.', 'Esto no llega entero a casa.', '¡Hasta luego, Pan!', 'Así da gusto madrugar.'];
export const NO_STOCK = ['Vaya, hoy no queda…', 'Otro día será.', 'Volveré mañana, no te apures.'];
export const CARO = ['Uy, se me va de precio hoy.', 'Hmm, mejor otro día.'];

export const CORREO = [
  'Te dejo esto en el buzón porque a la cara me da apuro. Gracias por el pan de ayer.',
  'En casa ya no se desayuna otra cosa. Toma, para la próxima hornada.',
  'Me sobraba de la compra y pensé en ti. No lo cuentes, que luego todos quieren.',
  'Mi madre dice que el obrador huele como cuando era niña. Esto es de su parte.',
  'Para que no te falte. Y para que no falte pan, que nos conocemos.',
];
export const HALLAZGO = ['Una moneda entre los adoquines.', 'Alguien perdió esto. Ahora es tuyo.', 'Mira qué había aquí.', 'El pueblo da cosas a quien pasea.'];

export const SUP = {
  tejo: { n: 'El molino de Tejo', face: 'tejo', ings: ['harina', 'integral', 'centeno'], d: 'Harinas' },
  pipa: { n: 'El colmado de Pipa', face: 'pipa', ings: ['levadura', 'mantequilla', 'azucar', 'chocolate'], d: 'Despensa' },
  charca: { n: 'La huerta de Charca', face: 'charca', ings: ['semillas', 'aceitunas', 'nueces'], d: 'Del campo' },
};
export const SUP_ORDER = ['tejo', 'pipa', 'charca'];
export const MUEBLES = {
  alfombra: { n: 'Alfombra de trapillo', p: 60, d: 'Redonda y de colores. Los pies lo agradecen.' },
  planta: { n: 'Costilla de Adán', p: 45, d: 'Una planta grande que no pide nada y lo da todo.' },
  lampara: { n: 'Lámpara de pie', p: 90, d: 'Luz cálida para leer recetas viejas.' },
  cuadro: { n: 'Retrato de la abuela', p: 120, d: 'Hogaza con las manos en jarras. Te vigila con cariño.' },
  sillon: { n: 'Sillón orejero', p: 150, d: 'Para la cabezada de después de cerrar.' },
  gramola: { n: 'Gramola', p: 260, d: 'Suena bajito toda la noche. Te levantas tarareando.' },
};
export const MUE_ORDER = ['planta', 'alfombra', 'lampara', 'cuadro', 'sillon', 'gramola'];
