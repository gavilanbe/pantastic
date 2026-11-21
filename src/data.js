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
  coca: { n: 'Coca de verano', art: 'una', pl: 'cocas', price: 13, ing: { harina: 2, levadura: 1, azucar: 2, nueces: 1 }, sweet: 1, d: 'Fina, con su azúcar tostado y piñones. Se come de pie y a la sombra.' },
  calabaza: { n: 'Pan de calabaza', art: 'un', pl: 'panes de calabaza', price: 14, ing: { integral: 2, harina: 1, levadura: 1, semillas: 1, azucar: 1 }, sweet: 0, d: 'Naranja por dentro, de gajos por fuera. Sabe a primer frío.' },
  rosca: { n: 'Rosca de la Hornada', art: 'una', pl: 'roscas', price: 22, ing: { harina: 3, levadura: 1, mantequilla: 2, azucar: 2, nueces: 1 }, sweet: 1, d: 'El pan de la fiesta. Se parte entre todos o no se parte.' },
};
export const BREAD_ORDER = ['barra', 'hogaza', 'mollete', 'centeno', 'semillas', 'chapata', 'nueces', 'brioche', 'caracola', 'coca', 'calabaza', 'rosca'];

export const PRICE_LV = [
  { n: 'Popular', k: 0.8, d: 'Más barato: el pueblo te coge cariño antes.' },
  { n: 'Justo', k: 1, d: 'El precio de siempre.' },
  { n: 'De capricho', k: 1.35, d: 'Más caro: solo cuela si el pan sale de tres estrellas.' },
];

export const REP = [
  { at: 0, n: 'Horno recién encendido' },
  { at: 30, n: 'Huele a pan en la calle' },
  { at: 110, n: 'La panadería del barrio' },
  { at: 260, n: 'Cola en la puerta' },
  { at: 480, n: 'El orgullo de Migas' },
  { at: 780, n: 'Maestra panadera' },
  { at: 1150, n: 'Como la abuela Hogaza' },
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
  huerto: { n: 'El huerto de la abuela', p: 120, cap: 0, lvl: 1, d: 'Lo desbrozan y te dejan ocho bancales. Siembra lo de cada estación, riega y cosecha: va al zurrón, a la masa o de regalo.', at: [-15, 0.8, 1.2] },
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
MUEBLES.tetera = { n: 'Mesita del té', p: 70, d: 'Una tetera azul y una taza. Para las cartas de la abuela.' };
MUEBLES.baul = { n: 'Baúl de la abuela', p: 110, d: 'Huele a lavanda y a harina. No se sabe qué orden es.' };
MUEBLES.libros = { n: 'Librería', p: 180, d: 'Novelas, atlas y un recetario que no es tuyo. Aún.' };
export const MUE_ORDER = ['planta', 'alfombra', 'tetera', 'lampara', 'baul', 'cuadro', 'sillon', 'libros', 'gramola'];

// Mejoras por niveles (coste = base · g^nivel) y equipo que automatiza (precio de alta + jornal diario).
export const TRACKS = {
  horno: { n: 'Horno', base: 50, g: 1.6, max: 10, d: 'Cada nivel: el pan llega al dorado un 8 % antes.' },
  bandejas: { n: 'Las bandejas', base: 80, g: 1.8, max: 8, d: 'Cada dos niveles: una pieza más por hornada.' },
  ferment: { n: 'La fermentadora', base: 40, g: 1.6, max: 10, d: 'Cada nivel: la masa sube un 7 % más rápido.' },
  mostrador: { n: 'El mostrador', base: 60, g: 1.65, max: 10, d: 'Cada nivel: la clientela espera un 8 % más y suelta algo más de propina. En los niveles 4 y 8, un hueco más para atender.' },
  fama: { n: 'Carteles por el pueblo', base: 45, g: 1.6, max: 12, d: 'Cada nivel: un cliente más al día.' },
  lena: { n: 'La leñera', base: 35, g: 1.55, max: 8, d: 'Cada nivel: el fuego aguanta un 12 % más.' },
};
export const TRACK_ORDER = ['horno', 'bandejas', 'ferment', 'mostrador', 'fama', 'lena'];
export const STAFF = {
  lenador: { n: 'Roble, el leñador', p: 140, wage: 12, lvl: 1, d: 'Cada mañana deja cinco troncos en la leñera.', look: { sp: 'tejon', fur: '#a98467', skin: '#f3e3c8', shirt: '#b8483a', pat: 'cuadros', acc: 'gorra', brow: 'serio' } },
  amasadora: { n: 'La amasadora', p: 300, wage: 0, lvl: 1, d: 'Los panes que ya dominas (una estrella de maestría) se pueden amasar a máquina: sin minijuego y con masa correcta, no de campeonato.' },
  brasa: { n: 'Brasa, la hornera', p: 380, wage: 28, lvl: 2, d: 'Saca el pan en dorado, lo deja en el carro y echa leña cuando el fuego baja. El punto exacto sigue siendo cosa tuya.', look: { sp: 'zorro', fur: '#c96a3a', skin: '#fff6ea', shirt: '#4a4654', pat: 'liso', acc: 'gorro', lash: true, scale: 0.88 } },
  chispa: { n: 'Chispa, el repartidor', p: 520, wage: 36, lvl: 3, d: 'A mediodía y a media tarde lleva a la fonda hasta seis panes de lo que más haya en el mostrador, al 80 %.', look: { sp: 'liebre', fur: '#c9bfb4', skin: '#fff3df', shirt: '#f2b84b', pat: 'raya', acc: 'cinta' } },
};
STAFF.leva = { n: 'Leva, la oficiala', p: 900, wage: 55, lvl: 4, d: 'Cuando el mostrador se queda corto, amasa y hornea por su cuenta lo que más se pide, con lo que haya en la despensa. Pan de dos estrellas: el de tres sigue siendo cosa tuya. Tú llena la despensa y sal a vivir.', look: { sp: 'buho', fur: '#d9c2a0', skin: '#fff3e2', shirt: '#e2664f', pat: 'liso', acc: 'gorro', lash: true, iris: '#7a5a2a', scale: 0.9 } };
export const STAFF_ORDER = ['lenador', 'amasadora', 'brasa', 'chispa', 'leva'];

export const SEASONS = [
  { n: 'primavera', ground: [1, 1, 1], leaf: null, wheat: '#b9d36a', up: ['semillas', 'brioche'], cheap: 'semillas', fx: 'petal' },
  { n: 'verano', ground: [1.06, 1.0, 0.86], leaf: [1.0, 1.02, 0.86], wheat: null, up: ['coca', 'mollete', 'chapata'], cheap: 'aceitunas', fx: null },
  { n: 'otoño', ground: [1.26, 0.93, 0.56], leaf: [1.6, 0.84, 0.38], wheat: '#c9a05a', up: ['calabaza', 'nueces', 'centeno'], cheap: 'nueces', fx: 'leaf' },
  { n: 'invierno', ground: [0.74, 0.8, 0.9], leaf: [1.2, 1.38, 1.5], wheat: '#e9eef2', up: ['caracola', 'brioche', 'hogaza'], cheap: 'chocolate', fx: 'snow' },
];
// Lazos: lo que cambia al llegar a tres y a cinco corazones con cada vecino.
export const BONDS = {
  lana: { 3: 'Te ha cosido un peto color frambuesa. Está en tu armario.', 5: 'Corre la voz de que aquí se espera a gusto: la clientela aguanta un 15 % más.' },
  tejo: { 3: 'Te deja las tres harinas un 10 % más baratas. «No lo vayas contando.»', 5: 'Te ha afilado el hacha: cada tronco partido da uno más.' },
  brinco: { 3: 'Te regala su camiseta de rayas de la suerte. Está en tu armario.', 5: 'Te ha enseñado a respirar al correr: andas un 6 % más rápido.' },
  charca: { 3: 'La fonda te hace un encargo propio cada día.', 5: 'La fonda paga un 20 % más por lo que le lleve el reparto y los encargos.' },
  pua: { 3: 'Te ha pintado una camiseta rosa. Está en tu armario.', 5: 'Va dejando tesoros por el pueblo: un hallazgo más cada día.' },
  zarza: { 3: 'Ahora hay carta en el buzón todos los días.', 5: 'Habla de tu pan en cuatro pueblos: dos clientes más al día.' },
  ulular: { 3: 'Sus trucos de maestro: la maestría de cada pan llega con un 25 % menos de hornadas.', 5: 'Su lección de paciencia: tus masas salen siempre un punto mejor amasadas.' },
};
// Emisoras de la radio del obrador. f: punto del dial. need: logro con el que empieza a llegar a Migas.
export const RADIO = [
  { id: 'migas', f: 89.3, n: 'Radio Migas', tag: 'La de toda la vida. Vals de horno por la mañana, nana al caer la tarde.', tracks: { day: ['mus_day'], eve: ['mus_eve'] }, song: { day: 'Vals de la primera hornada', eve: 'Nana del rescoldo' } },
  { id: 'abuela', f: 91.6, n: 'Los discos de la abuela', tag: 'Su gramola, sus discos y el tema que tarareaba mientras amasaba.', song: { day: 'Masa madre' } },
  { id: 'molino', f: 94.2, n: 'Onda Molino', tag: 'Guitarra y armónica desde el molino de Tejo. Emite cuando le da la gana.', tracks: { day: ['mus_molino'] }, song: { day: 'Harina de otro costal' }, need: 'v50' },
  { id: 'swing', f: 97.0, n: 'Swing del Colmado', tag: 'Pipa pincha swing entre sacos de harina y botes de levadura.', tracks: { day: ['mus_day2', 'mus_swing'] }, song: { day: 'Levadura swing' }, need: 'rec5' },
  { id: 'fonda', f: 99.8, n: 'Fonda FM', tag: 'Bossa de sobremesa desde la fonda de Charca. Croac.', tracks: { day: ['mus_fonda'] }, song: { day: 'Sobremesa larga' }, need: 's10' },
  { id: 'nocturno', f: 103.1, n: 'Nocturno', tag: 'Piano con sueño para las últimas hornadas del día.', tracks: { day: ['mus_nocturno'] }, song: { day: 'Miga de madrugada' }, need: 'e3000' },
  { id: 'charanga', f: 106.4, n: 'La Charanga', tag: 'La banda del pueblo, grabada en la plaza la noche de la Hornada.', tracks: { day: ['mus_charanga'] }, song: { day: 'Pasodoble de la Hornada' }, need: 'hornada' },
];
export const LOGROS = [
  ['venta1', 'La primera venta', 'Vende tu primer pan', 10], ['v50', 'Medio centenar', 'Vende 50 panes', 25], ['v200', 'El pan nuestro', 'Vende 200 panes', 60], ['v1000', 'Mil hogazas después', 'Vende 1000 panes', 200],
  ['e500', 'La hucha suena', 'Gana 500 monedas', 25], ['e3000', 'Negocio redondo', 'Gana 3000 monedas', 80], ['e15000', 'Imperio de miga', 'Gana 15 000 monedas', 250],
  ['s10', 'Mano de oro', 'Vende 10 panes de tres estrellas', 30], ['s100', 'Tres estrellas Migas', 'Vende 100 panes de tres estrellas', 120],
  ['rec5', 'Media libreta', 'Reúne 5 recetas', 30], ['rec10', 'La libreta entera', 'Reúne las 10 recetas', 120], ['h2', 'Querida por todos', 'Dos corazones con los siete vecinos', 80], ['h5', 'Uña y carne', 'Cinco corazones con un vecino', 100],
  ['ob6', 'Manos a la obra', 'Termina 6 obras', 60], ['ob12', 'Migas reluce', 'Termina las 12 obras', 250], ['casa', 'Hogar, dulce horno', 'Ten todos los muebles', 100], ['lata', 'Hormiguita', 'Guarda 200 monedas en la lata', 40],
  ['racha', 'Da gusto venir', 'Diez clientes seguidos bien atendidos', 50], ['hacha', 'Leñadora fina', 'Cinco troncos limpios seguidos', 40], ['gato', 'Amiga del gato', 'Acaricia al gato 5 días', 30], ['brillo', 'Ojo de urraca', 'Recoge 20 hallazgos', 40],
  ['patos', 'La de los patos', 'Da 12 panes a los patos', 60], ['patitos', 'Familia numerosa', 'Que nazcan los seis patitos', 120],
  ['dial', 'El dial entero', 'Sintoniza todas las emisoras de la radio', 80],
  ['anio', 'Las cuatro estaciones', 'Hornea un año entero en Migas', 150], ['hornada', 'La Hornada', 'Celebra la Hornada', 150], ['hornada3', 'Tradición', 'Celebra tres Hornadas', 300], ['m3', 'Maestra de un pan', 'Tres estrellas de maestría en un pan', 80], ['equipo', 'Buena jefa', 'Ten a todo el equipo', 150],
];

// Historias que cuentan con cuatro corazones.
export const STORY = {
  lana: ['¿Sabes por qué llevo siempre estas gafas rojas? Me las regaló tu abuela el día que dejé de ver los puntos del revés.', 'Me dijo: «Lana, ahora ya no tienes excusa para tejerme una bufanda». Se la tejí. Nunca se la quitó.'],
  tejo: ['El molino lo paré el día que se apagó tu horno. No lo he dicho nunca.', 'Un molino sin panadera a la que molerle es un ventilador muy caro. Hmf. Me alegra que vuelva a tener oficio.'],
  brinco: ['¡Te cuento una cosa! La primera carrera de la Hornada la perdí. ¡Llegué el último!', 'Tu abuela me esperó en la meta con un integral caliente y me dijo: «El último es el que más ha corrido». Desde entonces no paro.'],
  charca: ['La fonda era de mi madre. Las aceitunas, de la suya. El croar, eso ya es mío.', 'Tu abuela decía que un pueblo se mide por lo que rebaña. Mira los platos: estamos midiendo bien.'],
  pua: ['¿Quieres saber un secreto? Me dan miedo las tormentas. Mucho.', 'Cuando truena vengo hasta tu puerta porque el horno suena más fuerte que los rayos. No se lo digas a mi abuelo.'],
  zarza: ['He repartido cartas de amor, de pleitos y de herencias. La que más me pesó fue la de tu abuela para ti.', 'La llevé seis años en la saca. Cada mañana la miraba y pensaba: hoy tampoco. Hasta que un día, sí.'],
  ulular: ['En cuarenta años de escuela solo suspendí a una alumna en paciencia. Era tu abuela.', 'Luego abrió un horno, que es el oficio más paciente del mundo. La vida corrige mejor que yo.'],
};

export const ESPINO = {
  look: { sp: 'erizo', fur: '#b9b3b0', skin: '#f6e4d0', shirt: '#6d7d8f', pat: 'cuadros', acc: 'gorra', scale: 0.96 },
  hola: ['Buenas tardes, hija. Soy Espino, el abuelo de Púa. Vengo cada tarde a ver a los patos.', 'El pan que no vendas no lo tires: me lo traes en una bolsa y lo repartimos entre estos glotones. Los patos tienen buena memoria.'],
  charla: ['El macho se llama Almirante. La parda es Bizcocha. La blanca no tiene nombre porque no se deja.', 'Mi nieta dice que los patos traen suerte. Yo digo que traen patitos, que viene a ser lo mismo.', 'Tu abuela venía aquí con los mendrugos de la semana. Los patos de entonces eran los abuelos de estos.', 'El pan muy tostado les gusta más que el bueno. Son como yo.'],
  gracias: ['¡Mira cómo vienen! Gracias, hija.', 'Almirante te hace una reverencia. Bueno, casi.', 'Así da gusto pasar la tarde.'],
};

// ================= La vida en Migas: huerta, monte, río, regalos, calendario y almanaque =================
// Productos del zurrón. k: de dónde sale. sell: lo que paga la fonda. toque: lo que le hace a una hornada.
export const ITEMS = {
  fresa: { n: 'Fresas', k: 'huerta', sell: 8, d: 'Pequeñas y coloradas. La mitad no llega al cesto.', toque: { n: 'de fresa', k: 1.15, sweet: 1, c: '#e2475a' } },
  romero: { n: 'Romero', k: 'huerta', sell: 5, d: 'Huele a monte y a domingo.', toque: { n: 'al romero', k: 1.12, sweet: 0, c: '#5f9a5a' } },
  tomate: { n: 'Tomates', k: 'huerta', sell: 9, d: 'De los que saben a tomate.', toque: { n: 'con tomate', k: 1.13, sweet: 0, c: '#e2553a' } },
  girasol: { n: 'Girasol', k: 'huerta', sell: 7, d: 'Mira siempre hacia el horno. Da pipas para la despensa.' },
  calabaza: { n: 'Calabaza', k: 'huerta', sell: 34, d: 'Gorda y naranja. Tejo dice que pesa lo que un saco.' },
  uva: { n: 'Uvas', k: 'huerta', sell: 11, d: 'Un racimo prieto. Secas, son pasas.', toque: { n: 'con pasas', k: 1.12, sweet: null, c: '#6a4a8a' } },
  col: { n: 'Col de invierno', k: 'huerta', sell: 17, d: 'Aguanta la helada mejor que tú.' },
  ajo: { n: 'Ajos', k: 'huerta', sell: 8, d: 'Una ristra. Espanta resfriados y visitas.', toque: { n: 'de ajo', k: 1.1, sweet: 0, c: '#f3ead2' } },
  esparrago: { n: 'Espárragos trigueros', k: 'monte', sell: 10, d: 'Salen donde quieren, nunca donde miras.' },
  menta: { n: 'Menta de río', k: 'monte', sell: 6, d: 'Crece con los pies en el agua.' },
  mora: { n: 'Moras', k: 'monte', sell: 9, d: 'Manchan los dedos y merece la pena.', toque: { n: 'de moras', k: 1.15, sweet: 1, c: '#4a2a5a' } },
  seta: { n: 'Níscalos', k: 'monte', sell: 14, d: 'Naranjas, bajo los pinos, después de llover.', toque: { n: 'de setas', k: 1.18, sweet: 0, c: '#d98a4a' } },
  castana: { n: 'Castañas', k: 'monte', sell: 9, d: 'Cuidado con el erizo. El de fuera, no Púa.', toque: { n: 'de castañas', k: 1.14, sweet: null, c: '#8a5a34' } },
  pinon: { n: 'Piñones', k: 'monte', sell: 13, d: 'Cada uno cuesta una piña y media paciencia.', toque: { n: 'con piñones', k: 1.14, sweet: null, c: '#f0e2b8' } },
  trucha: { n: 'Trucha', k: 'rio', sell: 12, d: 'La de siempre. Plateada y con prisa.' },
  barbo: { n: 'Barbo', k: 'rio', sell: 16, d: 'Bigotudo y de fondo. Pelea más de lo que parece.' },
  cangrejo: { n: 'Cangrejo de río', k: 'rio', sell: 15, d: 'Anda de lado y pellizca de frente.' },
  anguila: { n: 'Anguila', k: 'rio', sell: 26, d: 'Solo sale al caer la tarde o cuando llueve.' },
  dorada: { n: 'Carpa dorada', k: 'rio', sell: 60, d: 'Dicen que es la misma desde hace cien años.' },
  miel: { n: 'Miel', k: 'otro', sell: 18, d: 'De las abejas del huerto. Espesa y sin prisa.', toque: { n: 'con miel', k: 1.18, sweet: null, c: '#f2b84b' } },
};
export const ITEM_ORDER = ['fresa', 'romero', 'ajo', 'tomate', 'girasol', 'uva', 'calabaza', 'col', 'esparrago', 'menta', 'mora', 'seta', 'castana', 'pinon', 'trucha', 'barbo', 'cangrejo', 'anguila', 'dorada', 'miel'];
// Cultivos. se: estaciones (0 primavera … 3 invierno). days: noches regadas hasta cosechar. re: noches para volver a dar (0 = se arranca).
export const CROPS = {
  fresa: { se: [0], days: 2, re: 2, y: 2, seed: 10 },
  romero: { se: [0, 1], days: 2, re: 0, y: 2, seed: 6 },
  ajo: { se: [3, 0], days: 2, re: 0, y: 2, seed: 8 },
  tomate: { se: [1], days: 3, re: 2, y: 2, seed: 12 },
  girasol: { se: [1, 2], days: 4, re: 0, y: 1, seed: 8, ing: ['semillas', 4] },
  uva: { se: [2], days: 4, re: 2, y: 2, seed: 16 },
  calabaza: { se: [2], days: 5, re: 0, y: 1, seed: 18 },
  col: { se: [3], days: 3, re: 0, y: 1, seed: 10 },
};
export const CROP_ORDER = ['fresa', 'romero', 'ajo', 'tomate', 'girasol', 'uva', 'calabaza', 'col'];
export const FORAGE = {
  esparrago: { se: [0], at: ['pueblo', 'molino'] }, menta: { se: [0, 1], at: ['rio'] }, mora: { se: [1], at: ['pueblo', 'rio', 'molino'] },
  seta: { se: [2], at: ['rio', 'molino'] }, castana: { se: [2], at: ['pueblo', 'molino'] }, pinon: { se: [3], at: ['pueblo', 'rio', 'molino'] },
};
// Peces. w: lo fácil que es que piquen. dif: lo que tiran. late: solo de tarde o con lluvia.
export const FISH = {
  trucha: { se: [0, 1, 2, 3], w: 10, dif: 1, cm: [22, 46] },
  barbo: { se: [0, 1], w: 6, dif: 1.3, cm: [30, 62] },
  cangrejo: { se: [1, 2], w: 5, dif: 1.15, cm: [8, 15] },
  anguila: { se: [2, 3], w: 5, dif: 1.7, cm: [40, 95], late: true },
  dorada: { se: [0, 1, 2, 3], w: 0.7, dif: 2.2, cm: [50, 84] },
};
// Gustos de cada vecino: lo que le encanta, lo que le gusta y lo que no.
export const TASTE = {
  lana: { love: ['fresa', 'miel', 'castana'], like: ['uva', 'mora', 'col'], no: ['cangrejo', 'ajo'] },
  tejo: { love: ['seta', 'anguila', 'calabaza'], like: ['ajo', 'castana', 'trucha'], no: ['fresa', 'menta'] },
  brinco: { love: ['girasol', 'mora', 'tomate'], like: ['fresa', 'esparrago', 'menta'], no: ['anguila', 'seta'] },
  charca: { love: ['trucha', 'cangrejo', 'tomate'], like: ['barbo', 'ajo', 'romero', 'seta'], no: ['miel'] },
  pua: { love: ['fresa', 'mora', 'miel'], like: ['uva', 'castana', 'girasol'], no: ['col', 'ajo'] },
  zarza: { love: ['pinon', 'esparrago', 'barbo'], like: ['romero', 'menta', 'uva'], no: ['calabaza'] },
  ulular: { love: ['uva', 'seta', 'dorada'], like: ['col', 'pinon', 'miel'], no: ['cangrejo'] },
};
export const GIFT_SAY = {
  love: { lana: '¡Ay, criatura! Esto era justo lo que me pedía el cuerpo.', tejo: 'Hmf. … Hmf. Esto está muy bien. No lo repitas mucho o me acostumbro.', brinco: '¡¡Para mí!! ¡Hoy doy cuatro vueltas, te lo dedico entero!', charca: 'Croac. Croac. Perdón, es que me emociono. Esto va al guiso de hoy.', pua: '¡¡Hala!! ¡Es lo que más me gusta del mundo mundial!', zarza: 'Esto lo llevo en la saca hasta el último pueblo. Bueno, no llega al segundo.', ulular: 'Matrícula de honor. Con mención. Y con mi agradecimiento.' },
  like: { lana: 'Qué detalle, hija. Esto me viene muy bien.', tejo: 'Hmf. Vale. Gracias.', brinco: '¡Anda, gracias! ¡Energía para la ruta!', charca: 'Esto en la fonda tiene sitio. Gracias, Pan.', pua: '¡Gracias! Me lo guardo en el bolsillo bueno.', zarza: 'Certificado y entregado. Gracias, compañera.', ulular: 'Notable. Muy amable por tu parte.' },
  meh: { lana: 'Ah. Pues… gracias, mujer.', tejo: 'Hmf.', brinco: '¡Ah! Bueno. ¡Gracias igualmente!', charca: 'Croac. Ya le buscaré sitio.', pua: 'Ah. Vale. Gracias.', zarza: 'Lo archivo. Gracias.', ulular: 'Suficiente. Se agradece la intención.' },
  no: { lana: 'Uy, hija… esto a mí me sienta regular.', tejo: 'Hmf. Esto no. Pero no.', brinco: '¡Puaj! Perdón. ¡Puaj con cariño!', charca: 'Croac… esto no entra en mi cocina.', pua: 'Esto es de mayores. ¿Me lo cambias por un centro de caracola?', zarza: 'Devuelto al remitente. Sin acritud.', ulular: 'Insuficiente. Repetirás en septiembre.' },
};
// Cumpleaños: día del año (1 a 28, siete por estación).
export const BDAY = { lana: 4, brinco: 10, charca: 13, pua: 17, tejo: 20, zarza: 24, ulular: 27 };
export const WEEK_EV = { 2: { n: 'Mercadillo', d: 'Don Trasto, el buhonero, pone la manta en la plaza hasta las cinco: género fuera de temporada, abono, y compra lo que lleves en el zurrón.' }, 4: { n: 'Lonja', d: 'Viernes de pescado: la fonda paga el pescado vez y media.' }, 6: { n: 'Feria', d: 'Medio pueblo en la plaza y concurso de cestas: enseña lo mejor de tu zurrón y de tu mostrador.' } };
export const TRASTO_LOOK = { sp: 'zorro', fur: '#8f8f9a', skin: '#f6efe2', shirt: '#7b5ea7', pat: 'rombos', acc: 'gorra', brow: 'sabio', scale: 1.04 };
// El almanaque de la abuela: lotes que se entregan y lo que devuelve cada página.
export const ALM = {
  primavera: { n: 'Primavera', need: ['fresa', 'esparrago', 'ajo', 'barbo'], rw: 'bancales', rn: 'Cuatro bancales más', rd: 'La cuadrilla abre la tercera fila del huerto.' },
  verano: { n: 'Verano', need: ['tomate', 'mora', 'girasol', 'cangrejo'], rw: 'aspersor', rn: 'El aspersor', rd: 'Riega el huerto entero cada mañana. Tú solo siembras y cosechas.' },
  otono: { n: 'Otoño', need: ['calabaza', 'seta', 'castana', 'uva'], rw: 'colmena', rn: 'La colmena', rd: 'Un tarro de miel cada día, y sigue llenándose mientras no estás.' },
  invierno: { n: 'Invierno', need: ['col', 'pinon', 'anguila'], rw: 'invernadero', rn: 'El invernadero', rd: 'En la primera fila del huerto crece cualquier cosa en cualquier estación.' },
  rio: { n: 'Río', need: ['trucha', 'barbo', 'cangrejo', 'anguila', 'dorada'], rw: 'cana', rn: 'La caña de la abuela', rd: 'Pican antes, la zona de recoger es más ancha y la carpa dorada se deja ver más.' },
  horno: { n: 'Horno', need: ['pan3', 'pan3', 'pan3'], rw: 'sello', rn: 'El sello de la abuela', rd: 'Todo tu pan vale una moneda más por pieza.' },
  despensa: { n: 'Alacena', need: ['miel', 'romero', 'menta', 'oro'], rw: 'toques', rn: 'El cuaderno de toques', rd: 'Los panes con toque valen un 15 % más y dan un punto más de cariño.' },
};
export const ALM_ORDER = ['primavera', 'verano', 'otono', 'invierno', 'rio', 'horno', 'despensa'];
export const ALM_ORO = 250;
export const CARTA_ALM = [
  'Pan:',
  'Este almanaque lo empecé el año que abrí el horno. Apuntaba lo que daba Migas cada estación para no olvidarme de mirar fuera del obrador.',
  'Si has llenado todas las páginas es que tú tampoco te has olvidado. El pan sale mejor cuando la panadera sabe a qué huele el río en otoño.',
  'El espantapájaros lleva mi bufanda desde entonces. Ahora es tuya. Que te abrigue las ferias.',
  'Tu abuela, que también pescaba fatal.',
];
// Oficios: experiencia fuera del horno. Cada nivel, una ventaja.
export const OFICIOS = {
  huerta: { n: 'Hortelana', perks: ['', 'La regadera moja también los bancales de al lado', 'Una de cada tres cosechas da una pieza más', 'Las semillas cuestan un cuarto menos', 'El abono dura dos cosechas'] },
  monte: { n: 'Recolectora', perks: ['', 'Una mata más en cada sitio', 'Una de cada tres matas da el doble', 'Otra mata más en cada sitio', 'Todo lo del zurrón se vende un 20 % más caro'] },
  rio: { n: 'Pescadora', perks: ['', 'La zona de recoger es más ancha', 'Pican antes', 'Los peces raros se dejan ver más', 'Uno de cada cuatro lances trae dos peces'] },
};
export const OFI_AT = [0, 15, 40, 80, 140];
export const RIBBON = [null, { n: 'Cinta de bronce', c: '#c98a5a', coins: 40, rep: 5, at: 5 }, { n: 'Cinta de plata', c: '#c9d1d9', coins: 90, rep: 10, at: 9 }, { n: 'Cinta de oro', c: '#f2c14e', coins: 180, rep: 20, at: 13 }];
LOGROS.push(['huerta1', 'La primera cosecha', 'Cosecha algo en el huerto', 20], ['zurron', 'De todo un poco', 'Ten diez productos distintos en el zurrón', 60], ['pesca5', 'Los cinco del río', 'Pesca las cinco especies', 100], ['regalo', 'Con mucho gusto', 'Acierta el regalo favorito de alguien', 30], ['gustos', 'Les conoces bien', 'Descubre 20 gustos de los vecinos', 100], ['cinta', 'Cinta en la solapa', 'Gana una cinta en la feria', 50], ['oro', 'La mejor cesta', 'Gana la cinta de oro', 150], ['alm3', 'Media memoria', 'Completa tres páginas del almanaque', 80], ['alm', 'El almanaque de la abuela', 'Completa el almanaque', 400], ['cumple', '¡Felicidades!', 'Haz un regalo de cumpleaños', 40], ['toque', 'Con un toque', 'Vende 20 panes con toque', 50]);
