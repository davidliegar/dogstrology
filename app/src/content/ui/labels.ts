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
 * Cuando no hay tarjetas del día, el pie dice por qué. Son los dos únicos
 * motivos que puede haber, y no son lo mismo: uno se arregla con cobertura y
 * el otro no se arregla desde el móvil.
 *
 * **El texto del artboard 17 se corrige aquí.** Decía "su carta y su día se
 * calculan en el móvil": la carta sí, el día no — el diario se descarga
 * (BRD §7.4, capa 2). Prometer que el texto del día está calculado en el
 * dispositivo sería explicar mal justo el fallo que se está enseñando.
 */
export const OFFLINE_NOTE =
  'Sin conexión. Su carta y la Luna se calculan en el móvil y siguen siendo correctas — lo que espera es el texto del día.';

export const UNPUBLISHED_NOTE =
  'El texto de hoy todavía no está. La carta y la Luna son de este momento; el resto llega en cuanto haya conexión.';
