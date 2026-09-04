import type { ChartConfidence, HouseSystem, MoonPhaseName } from '../domain/NatalChart';
import type { AspectType } from '../domain/ChartAspect';
import { countWord, joinList } from '@/_ui/text';
import type { House, HouseKind } from '../domain/House';
import type { Element, Modality, PlanetId, Sign } from '../domain/PlanetPosition';

/**
 * Los nombres que lee el usuario.
 *
 * El dominio habla en identificadores (`sun`, `aries`, `fire`) porque son
 * claves: viajan en las claves del catálogo, se comparan, se indexan. Lo que
 * se enseña en pantalla es **otra cosa**, y vive aquí, en la capa de UI.
 *
 * Antes eran lo mismo — `Sign` era a la vez el tipo y el texto de la pantalla —
 * y eso ataba el modelo de datos al idioma del mercado: sacar la app en inglés
 * habría obligado a regenerar todo el catálogo, porque el idioma estaba metido
 * dentro de las claves de caché.
 *
 * `Record<X, string>` a propósito: añadir un signo o un aspecto al dominio y
 * olvidarse de su etiqueta no compila.
 */
export const SIGN_LABELS: Record<Sign, string> = {
  aries: 'Aries',
  taurus: 'Tauro',
  gemini: 'Géminis',
  cancer: 'Cáncer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Escorpio',
  sagittarius: 'Sagitario',
  capricorn: 'Capricornio',
  aquarius: 'Acuario',
  pisces: 'Piscis',
};

export const ELEMENT_LABELS: Record<Element, string> = {
  fire: 'Fuego',
  earth: 'Tierra',
  air: 'Aire',
  water: 'Agua',
};

export const MODALITY_LABELS: Record<Modality, string> = {
  cardinal: 'Cardinal',
  fixed: 'Fijo',
  mutable: 'Mutable',
};

export const PLANET_LABELS: Record<PlanetId, string> = {
  sun: 'Sol',
  moon: 'Luna',
  mercury: 'Mercurio',
  venus: 'Venus',
  mars: 'Marte',
  jupiter: 'Júpiter',
  saturn: 'Saturno',
  uranus: 'Urano',
  neptune: 'Neptuno',
  pluto: 'Plutón',
};

export const ASPECT_LABELS: Record<AspectType, string> = {
  conjunction: 'Conjunción',
  sextile: 'Sextil',
  square: 'Cuadratura',
  trine: 'Trígono',
  opposition: 'Oposición',
};

export const MOON_PHASE_LABELS: Record<MoonPhaseName, string> = {
  new_moon: 'Luna nueva',
  waxing_crescent: 'Luna creciente',
  first_quarter: 'Cuarto creciente',
  waxing_gibbous: 'Gibosa creciente',
  full_moon: 'Luna llena',
  waning_gibbous: 'Gibosa menguante',
  last_quarter: 'Cuarto menguante',
  waning_crescent: 'Luna menguante',
};

/**
 * El pie de la carta degradada (artboard 14) — la medida **larga** de la
 * insignia C.2b, la que explica el mecanismo y aparece una sola vez por
 * pantalla.
 *
 * La segunda frase solo existe si la Luna está en duda: cuando falta el lugar
 * pero no la hora, no hay casas pero la Luna sí es firme, y prometer una duda
 * que no hay es tan malo como callar la que sí.
 */
export const missingHousesNote = ({
  confidence,
  moonSign,
}: {
  confidence: ChartConfidence;
  moonSign?: string;
}): string => {
  const missing = confidence === 'no_time' ? 'la hora' : 'el lugar';
  const first = `Sin ${missing} se calcula en qué signo está cada planeta, pero no en qué casa.`;
  if (!moonSign) return first;
  return `${first} La Luna se mueve medio grado por hora: la suya cae en ${moonSign} salvo que naciera de madrugada.`;
};

/**
 * El planeta que rige cada signo (artboard 18, tercer chip).
 *
 * **Regencias modernas**: Escorpio con Plutón, Acuario con Urano y Piscis con
 * Neptuno, no con Marte, Saturno y Júpiter. Se elige así porque el motor
 * calcula los diez cuerpos —los tres transaneptunianos incluidos— y usar las
 * tradicionales dejaría a Plutón, Urano y Neptuno dibujados en la rueda sin
 * regir nada. Es convención heredada, no invención: se representa como es
 * (BRD §11.2.0).
 */
export const SIGN_RULERS: Record<Sign, PlanetId> = {
  aries: 'mars',
  taurus: 'venus',
  gemini: 'mercury',
  cancer: 'moon',
  leo: 'sun',
  virgo: 'mercury',
  libra: 'venus',
  scorpio: 'pluto',
  sagittarius: 'jupiter',
  capricorn: 'saturn',
  aquarius: 'uranus',
  pisces: 'neptune',
};

/** El rótulo del Ascendente en su hoja (D21). En la carta la fila dice «ASC». */
export const ASCENDANT_LABEL = 'Su Ascendente';

/**
 * Qué es un Ascendente, en una línea, dentro de su hoja.
 *
 * Lo lleva esta hoja y no la de un planeta porque el Sol y la Luna se explican
 * solos por el nombre y este no: mucha gente llega sabiendo que "tiene uno" y
 * poco más, y el texto del catálogo describe al perro sin definir el término.
 *
 * **No dice "la máscara"**, que es como lo cuenta media astrología: aplicado a
 * un perro insinúa que finge, y un perro no finge. Dice lo que sí es
 * observable — lo primero que se ve.
 */
export const ASCENDANT_NOTE =
  'El signo que asomaba por el horizonte al nacer: cómo se presenta, no cómo es por dentro.';

/**
 * Cómo se nombra "su X" en el pie del detalle de signo. Solo estos tres: son
 * los que el usuario reconoce, y con los demás la frase sale rara ("El Marte
 * de Baloo está en este signo" no lo dice nadie).
 */
export const POSSESSIVE_LABELS: Partial<Record<PlanetId | 'ascendant', string>> = {
  sun: 'El Sol',
  moon: 'La Luna',
  ascendant: 'El Ascendente',
};

/**
 * El mismo "su X" en el pie del detalle de **casa** (artboard 21), donde sí
 * puede caer cualquiera de los diez cuerpos y no solo los tres reconocibles.
 *
 * Funciona porque en español el Sol y la Luna llevan artículo y los demás son
 * nombres propios que no lo llevan: "El Sol de Baloo cae en esta casa" y
 * "Marte de Baloo cae en esta casa" son las dos correctas. Por eso la tabla
 * de arriba se reutiliza en vez de duplicarse — solo aporta las excepciones.
 */
export const possessiveOfPlanet = (planet: PlanetId): string =>
  POSSESSIVE_LABELS[planet] ?? PLANET_LABELS[planet];

/**
 * El pie de una ficha cuando **ninguna** mascota cumple, y solo con varias
 * (artboard 35): con una, la ausencia es obvia y el pie no se pinta; entre
 * cinco perros, el silencio se confunde con que no se ha calculado.
 *
 * `what` es lo mismo que dirían las filas —«está en este signo»—, para que la
 * frase que las sustituye no invente otra manera de decirlo.
 */
export const noneHere = (petCount: number, what: string): string =>
  `Ninguna de tus ${countWord(petCount)} mascotas ${what}.`;

/**
 * «La Luna y el Sol de Baloo» — los planetas que una mascota tiene en una casa
 * (artboard 35). **Un perro, una fila, y dentro de la fila sus planetas**: la
 * frase de una sola mascota —«Su Luna de Baloo cae en la casa V, con su Sol»—
 * no escala a dos cartas, así que se parte por perro, que es la unidad que
 * tiene destino, y los planetas se enumeran dentro.
 *
 * Solo el primero lleva mayúscula, y **solo si es un artículo**: dentro de la
 * frase «el Sol» va en minúscula pero *Marte* no, que es un nombre propio. La
 * diferencia la marca `POSSESSIVE_LABELS`, que es justo la tabla de los tres
 * que llevan artículo.
 */
export const planetsOfPet = (planets: PlanetId[], name: string): string => {
  const [first, ...rest] = planets;
  const inline = rest.map((planet) => {
    const label = possessiveOfPlanet(planet);
    return planet in POSSESSIVE_LABELS ? label.charAt(0).toLowerCase() + label.slice(1) : label;
  });
  return `${joinList([possessiveOfPlanet(first), ...inline])} de ${name}`;
};

/**
 * El nombre de cada casa (artboard 20): el área de la vida que gobierna,
 * dicha en perro y en tres palabras. Una casa no tiene símbolo heredado —su
 * glifo es el numeral romano de `HOUSE_NUMERALS`—, así que el nombre es lo
 * único que la identifica en la rejilla.
 */
export const HOUSE_LABELS: Record<House, string> = {
  1: 'La identidad',
  2: 'Lo que posee',
  3: 'El vecindario',
  4: 'La casa',
  5: 'El juego',
  6: 'La rutina',
  7: 'El vínculo',
  8: 'Lo que teme',
  9: 'Lo desconocido',
  10: 'Su fama',
  11: 'La manada',
  12: 'El descanso',
};

export const HOUSE_KIND_LABELS: Record<HouseKind, string> = {
  angular: 'Angular',
  succedent: 'Sucedente',
  cadent: 'Cadente',
};

/**
 * Los tres planetas que retratan el carácter, con el papel que juegan
 * (artboard 6). El papel es lo que hace legible el planeta: "Marte en
 * Escorpio" no le dice nada a nadie, "Energía · Marte en Escorpio" sí.
 *
 * Son tres y en este orden porque es lo que pinta la lámina, no una selección
 * astrológica nuestra: energía, voz y cariño es lo que un dueño reconoce.
 */
export const PERSONALITY_FACETS: { planet: PlanetId; role: string }[] = [
  { planet: 'mars', role: 'Energía' },
  { planet: 'mercury', role: 'Voz' },
  { planet: 'venus', role: 'Cariño' },
];

/**
 * Los tres sistemas de casas (BRD §12.3, D7). El nombre propio se deja como
 * es —Placidus es un apellido, no una palabra traducible—; los otros dos sí
 * se dicen en español porque describen lo que hacen.
 */
export const HOUSE_SYSTEM_LABELS: Record<HouseSystem, string> = {
  whole_sign: 'Signos enteros',
  placidus: 'Placidus',
  equal: 'Casas iguales',
};

/**
 * Los tres grados de degradación del motor (BRD §12.3). Se enseñan tal cual
 * en la barra de confianza del perfil: la etiqueta nombra **lo que falta**,
 * no lo que hay, porque es lo accionable.
 */
export const CONFIDENCE_LABELS: Record<ChartConfidence, string> = {
  full: 'Completa',
  no_location: 'Sin lugar',
  no_time: 'Sin hora',
};

/**
 * El aviso de C.2b en la fila de datos del hub (artboard 25) — la medida
 * **corta** de la insignia.
 *
 * Nombra el dato que falta y no lo que se gana, al revés que
 * `CONFIDENCE_NOTICES`: la fila a la que acompaña *es* el sitio donde se da
 * ese dato, así que la promesa la hace el destino y aquí solo hace falta el
 * motivo para entrar.
 */
export const MISSING_DATUM_NOTES: Record<ChartConfidence, string | undefined> = {
  no_time: 'Falta su hora de nacimiento',
  no_location: 'Falta su lugar de nacimiento',
  full: undefined,
};

/**
 * El texto de cada grado de confianza, en el perfil (canvas: "los tres estados
 * de ChartConfidence"). Nombra **lo que se gana** completando el dato, no lo
 * que falta: es lo que hace que el usuario quiera darlo.
 *
 * El de carta completa no pide nada y por eso no lleva acción — el tono
 * `settled` de `NoticeCard` le quita el oro.
 */
export const CONFIDENCE_NOTICES: Record<
  ChartConfidence,
  { text: (context: { name: string; time?: string }) => string; action?: string }
> = {
  no_time: {
    text: () => 'Su carta está a medias: con la hora se calculan el Ascendente y las doce casas.',
    action: 'Añadir la hora',
  },
  no_location: {
    text: ({ time }) =>
      `Tienes su hora, pero las ${time ?? 'suyas'} son una hora distinta en cada país. ` +
      'Sin el lugar, su Ascendente puede caer medio signo más allá.',
    action: 'Elegir el lugar',
  },
  full: {
    text: ({ name }) =>
      `Su carta está completa. Fecha, hora y lugar: nada de lo que la app cuenta sobre ${name} se está estimando.`,
  },
};

/* La carta sin Cósmico — artboard 37 (D19). */

/** El rótulo de lo que hay bajo el velo. El mismo que usa el paywall. */
export const LOCKED_CHART_OVERLINE = 'Su carta entera';

/**
 * El titular de la carta bloqueada, **y se queda en claro**: los tres signos
 * del eje ya se dieron en la revelación del onboarding, así que taparlos sería
 * mentir sobre lo que la app le regaló. Lo que se cobra no es qué signos son,
 * es dónde caen.
 *
 * Sin hora no hay Ascendente y la frase se queda en dos: prometer el tercero a
 * quien no puede tenerlo sería vender un dato que no existe ni pagando.
 */
export const lockedChartTitle = ({
  sun,
  moon,
  ascendant,
}: {
  sun: string;
  moon: string;
  ascendant?: string;
}): string =>
  [`Sol en ${sun}`, `Luna en ${moon}`, ascendant ? `Ascendente en ${ascendant}` : undefined]
    .filter(Boolean)
    .join(', ');

/** Sobre la rueda difuminada, en el centro. */
export const LOCKED_WHEEL_LABEL = 'Rueda, casas y aspectos';

/**
 * Las tres filas que dicen **con palabras** lo que hay bajo el velo. Un
 * borroso solo enseña que hay algo; no explica qué se compra.
 *
 * La del Ascendente enseña además su valor difuminado al lado, para que se vea
 * que el dato existe y está calculado — no es una promesa, es una cortina.
 */
export const LOCKED_CHART_ROWS = {
  houses: 'Las doce casas',
  aspects: 'Los aspectos entre planetas',
  ascendant: 'Su Ascendente al grado',
} as const;

export const LOCKED_CHART_CTA = 'Ver su carta completa';

/**
 * La fila de oro de Explorar → Casas, sin plan (D19).
 *
 * **En qué casa cae cada planeta es carta natal**, y es justo lo que la carta
 * bloqueada tapa: «Las doce casas» es una de sus tres filas con candado. Sin
 * esto, un usuario sin plan recorría las doce y reconstruía media carta a mano.
 *
 * Los signos **no** se tocan: los tres del eje se dieron en la revelación del
 * onboarding y la carta bloqueada los deja en claro por eso mismo. Y las fases
 * son del cielo de hoy, iguales para todos los perros.
 */
export const UNLOCK_HOUSES = 'Ver en qué casas cae su carta';

/**
 * La fila de oro de «Quién es», sin plan (D19).
 *
 * **Las facetas son la carta desglosada**: «Mercurio en Géminis», «Venus en
 * Escorpio», una por planeta y con su texto. Es más de lo que enseña la carta
 * bloqueada, que solo deja los tres signos del eje — y es justo lo que
 * CLAUDE.md llama la profundidad: *premium no es mejor prosa, es más
 * profundidad*.
 *
 * Lo que se queda: el retrato de raza × signo, que es el contenido diferencial
 * y el gancho de la ficha, y la barra de elementos, que es un agregado y no
 * dice dónde cae ningún planeta.
 */
export const UNLOCK_FACETS = 'Ver su carácter planeta a planeta';
