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
