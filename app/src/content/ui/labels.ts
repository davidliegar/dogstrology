import type { DailyAxis } from '../domain/DailyKey';

/**
 * Cómo se rotula cada tarjeta del día (artboard 04).
 *
 * Los tres ejes van en posesivo —"Su Sol"— y el cielo no: es la única tarjeta
 * que es igual para todo el mundo, y el rótulo lo dice antes que el texto.
 */
export const DAILY_AXIS_LABELS: Record<DailyAxis, string> = {
  sun: 'Su Sol',
  moon: 'Su Luna',
  ascendant: 'Su Ascendente',
};

export const SKY_LABEL = 'El cielo de hoy';

/**
 * Los mismos tres ejes, **dentro de una frase**: «Leer su Luna y su
 * Ascendente». No se derivan de `DAILY_AXIS_LABELS` bajando la primera letra
 * porque eso no es una propiedad de la etiqueta, es una regla del español —y
 * el día que la app salga en otro idioma, la tabla es lo que se traduce.
 */
const AXIS_IN_SENTENCE: Record<DailyAxis, string> = {
  sun: 'su Sol',
  moon: 'su Luna',
  ascendant: 'su Ascendente',
};

/**
 * La fila de oro que cierra lo bloqueado (artboard 36).
 *
 * **Nombra los ejes que están bajo candado y solo esos**: un perro sin hora de
 * nacimiento no tiene Ascendente, así que prometérselo sería vender algo que
 * no existe ni pagando. Con dos, «y» las une; con uno, la frase se queda corta
 * y sigue siendo la misma fila.
 */
export const unlockDailyLabel = (axes: DailyAxis[]): string =>
  `Leer ${axes.map((axis) => AXIS_IN_SENTENCE[axis]).join(' y ')}`;

/**
 * Lo que anuncia una tarjeta desbloqueada al lector de pantalla: que se puede
 * abrir, y dónde cae.
 *
 * La punta lo dice a la vista y esto lo dice a quien no la ve. Nombra el
 * destino —la carta— porque el toque cambia de pantalla: «ver más» no
 * distinguiría esto de desplegar la propia tarjeta.
 */
export const openAxisLabel = (axis: DailyAxis): string =>
  `Ver ${AXIS_IN_SENTENCE[axis]} en su carta`;

/**
 * El título de Hoy cambia de sujeto con la segunda mascota (artboard 30).
 *
 * Con una, la pantalla es el día **de alguien** y se llama por su nombre. Con
 * dos o más, el nombre de uno no puede rotular a todos y baja a la cabecera de
 * su bloque: es la misma regla que reparte el contenido —lo compartido se
 * nombra una vez, arriba— aplicada al rótulo.
 *
 * **«en la casa» y no «de la casa»**: la casa no tiene día, lo tienen los
 * perros que viven en ella. Y deja sitio para la dinámica de manada, que sí
 * será algo *de* la casa, sin que las dos cosas se llamen igual.
 */
export const HOUSE_DAY_TITLE = 'El día en la casa';

export const petDayTitle = (name: string): string => `El día de ${name}`;

/**
 * El rótulo que separa el carrusel de la lectura del perro que está delante
 * (artboard 33). El carrusel es **quién** y esto es **qué le pasa hoy**.
 */
export const readingOf = (name: string): string => `La lectura de ${name}`;

/** El pie de la tarjeta del Sol, delante de los cinco puntos (artboard 33). */
export const ENERGY_LABEL = 'Energía';

/**
 * Lo que ocupa el sitio del Ascendente cuando no hay hora de nacimiento
 * (artboard 33). **Se dice, no se quita**: con varias mascotas conviven las
 * que la tienen y las que no, y borrar la fila dejaría tarjetas de distinta
 * altura en un carrusel — y escondería que a ese perro le falta un dato.
 */
export const NO_TIME = 'Sin hora';

/**
 * El rótulo de una lectura caducada (artboard 17): las tarjetas descargadas
 * viven bajo **un solo** rótulo de fecha, porque son una lectura y no dos.
 * Fecharlas por separado insinuaría que pueden caducar a distinto ritmo.
 */
export const staleReadingLabel = (weekdayAndDay: string): string => `La lectura del ${weekdayAndDay}`;

/** `ayer`, `hace 3 días`. Va al otro extremo del rótulo, no dentro. */
export const relativeDay = (days: number): string => (days === 1 ? 'ayer' : `hace ${days} días`);

/**
 * El pie de sin conexión (artboard 17). **Reparte las dos naturalezas en la
 * misma frase**, que es de lo que va la pantalla: la fase lunar sale del motor
 * y es la de hoy; la lectura se descarga y se quedó donde se quedó.
 *
 * Sin botón de reintentar, y el punto en `textFaint` y no en oro: no falta
 * ningún dato del usuario, y no hay nada que reintentar a mano.
 */
export const offlineNote = (reading?: string): string =>
  'Sin conexión. La fase lunar de arriba se calcula en el móvil y es la de hoy; ' +
  (reading
    ? `la lectura se descarga, y la última que llegó es la del ${reading}. `
    : 'la lectura se descarga y todavía no ha llegado ninguna. ') +
  'Al volver la cobertura se actualiza sola.';

/**
 * El día no está publicado (artboard 27). **No es el 17 con otro texto**, y la
 * diferencia es de quién es el fallo: sin red el usuario puede hacer algo
 * —moverse, esperar cobertura— y aquí no. Por eso no se le pide nada, no se le
 * ofrece reintentar (solo repetiría el mismo vacío) y no se llama error: es
 * una lectura que se publica por la mañana y aún no ha salido.
 */
export const UNPUBLISHED = {
  overline: SKY_LABEL,
  headline: 'Su lectura de hoy todavía no está',
  body: 'Se publica cada mañana. Vuelve en un rato y estará aquí.',
} as const;

/** Lo que sí se puede leer mientras no hay lectura del día: no depende de él. */
export const MEANWHILE_LABEL = 'Mientras tanto';
