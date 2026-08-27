/**
 * Zona horaria de un nacimiento en España (BRD §15.1 D16).
 *
 * Se **calcula**, no se consulta. España tiene dos husos —península y Baleares
 * en CET/CEST, Canarias en WET/WEST— y un único cambio de hora, el de la
 * directiva europea: último domingo de marzo a último domingo de octubre.
 *
 * No hace falta tabla histórica: la regla actual de la UE está vigente desde
 * 1996 y ningún perro vivo nació antes. El día que el MVP salga de España, esto
 * crece con el país y su regla — el modelo y el motor no se enteran.
 *
 * Vive en el dominio y no en la UI porque es una regla del negocio sobre un
 * dato del negocio, no una forma de enseñarlo: quien elige un municipio recibe
 * su huso ya resuelto, y `Birth` lo exige cuando hay hora y lugar.
 */

/** Los dos husos de España. `canary` son las islas Canarias; el resto, `mainland`. */
export const SPANISH_ZONES = ['mainland', 'canary'] as const;
export type SpanishZone = (typeof SPANISH_ZONES)[number];

const MINUTES_PER_HOUR = 60;

/** Domingo del último `weekday` del mes, en UTC. */
function lastSunday(year: number, monthIndex: number): Date {
  // Día 0 del mes siguiente es el último del mes pedido.
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  last.setUTCDate(last.getUTCDate() - last.getUTCDay());
  return last;
}

/**
 * Si esa fecha caía en horario de verano europeo.
 *
 * El cambio ocurre a la **01:00 UTC** en toda la Unión, no a una hora local
 * distinta en cada país: por eso se compara en UTC y no hay que saber el huso
 * de partida para saber si aplica.
 */
export function isEuropeanSummerTime(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const at = Date.UTC(year, month - 1, day);
  return at >= lastSunday(year, 2).getTime() && at < lastSunday(year, 9).getTime();
}

/**
 * Minutos respecto a UTC de un nacimiento en España, en la fecha dada.
 *
 * Es lo que el editor de hora guarda en `Birth.tzOffsetMinutes`. Sale del
 * **lugar y de la fecha**, nunca del reloj del dispositivo, que puede estar en
 * otro país: el 14 de diciembre Barcelona estaba en horario de invierno,
 * mande lo que mande el móvil que tenga hoy el dueño en la mano.
 */
export function spanishOffsetMinutes(date: string, zone: SpanishZone): number {
  const base = zone === 'canary' ? 0 : MINUTES_PER_HOUR;
  return base + (isEuropeanSummerTime(date) ? MINUTES_PER_HOUR : 0);
}

/** `CET · UTC+1`, tal y como lo enseña la fila de zona horaria del editor. */
export function spanishZoneLabel(date: string, zone: SpanishZone): string {
  const summer = isEuropeanSummerTime(date);
  const name = zone === 'canary' ? (summer ? 'WEST' : 'WET') : summer ? 'CEST' : 'CET';
  const hours = spanishOffsetMinutes(date, zone) / MINUTES_PER_HOUR;
  return `${name} · UTC${hours === 0 ? '±0' : `+${hours}`}`;
}

/**
 * A qué huso pertenece una longitud dentro de España.
 *
 * `Birth` guarda el offset ya resuelto y no la zona, así que al releer una
 * mascota hay que deducirla. La longitud basta y con holgura: lo más
 * occidental de la península es Galicia, sobre -9,3°, y Canarias empieza en
 * -13,3°. El corte en -11 deja cuatro grados de margen a cada lado.
 *
 * Solo vale mientras el MVP sea España (BRD §15.1 D16). El día que haya otro
 * país, esto deja de ser una función de la longitud y pasa a ser un dato que
 * el lugar tiene que traer consigo.
 */
export function spanishZoneFromLongitude(lon: number): SpanishZone {
  return lon < -11 ? 'canary' : 'mainland';
}
