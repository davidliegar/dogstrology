/**
 * El guion del revelado de la rueda (F4): cuándo entra cada capa y en qué
 * orden caen los planetas.
 *
 * Números y nada más — aquí no entra React, ni Reanimated, ni Skia. De un
 * revelado se puede equivocar el **orden** y que a alguna capa se le acabe el
 * tiempo, y las dos cosas son aritmética: por eso viven aquí y no dentro del
 * componente.
 *
 * Todo se mide contra `motion.duration.trace`, que es el token del revelado
 * único de la carta (`design/theme.ts`; el bucle de 9000 ms que el canvas usa
 * para presentar la constelación es ambiental y no se replica). Las capas son
 * fracciones de ese token y el último planeta acaba justo cuando él acaba:
 * tocar el token cambia el revelado entero sin tocar este fichero.
 */

import { ASCENDANT_ANGLE, normalizeAngle } from './wheel';

import { motion } from '@/design/theme';

/**
 * Una entrada del guion, en milisegundos y con la forma que pide Reanimated:
 * `withDelay(delay, withTiming(1, { duration }))`.
 */
export interface Cue {
  readonly delay: number;
  readonly duration: number;
}

const TOTAL = motion.duration.trace;

/** De fracción del revelado a milisegundos. */
const cue = (from: number, to: number): Cue => ({ delay: TOTAL * from, duration: TOTAL * (to - from) });

/**
 * Las tres capas de estructura, de fuera adentro y **solapadas a propósito**:
 * cada una arranca antes de que la anterior termine. Encadenarlas sin solape
 * da tres animaciones seguidas que se leen como tres pasos; solapándolas se
 * lee como un solo gesto que se va llenando.
 */
export const WHEEL_CUES = {
  /** Los dos anillos, trazándose desde el Ascendente. */
  rings: cue(0, 0.45),
  /** Las 12 marcas de frontera de signo y sus glifos. */
  signs: cue(0.22, 0.55),
  /** Los radios de casa, sus numerales y los rótulos de ASC y MC. */
  houses: cue(0.35, 0.65),
} as const;

/**
 * La cascada de planetas. Empieza cuando la estructura aún se está cerrando y
 * termina con el revelado entero: el cielo es lo último que aterriza, que es
 * el orden en que se lee la rueda.
 *
 * `fade` es lo que tarda **un** planeta; el reparto entre el primero y el
 * último sale de cuántos haya, no de un número escrito a mano. Con los diez
 * del MVP la cascada va a ~51 ms, cerca de los 70 ms con los que el canvas
 * escalona las tarjetas del artboard 15.
 */
const CASCADE = { from: 0.4, to: 1, fade: 0.22 } as const;

/**
 * El turno de un planeta en la cascada. `rank` es su puesto (0 es el primero),
 * `count` cuántos hay.
 *
 * Con un solo planeta no hay reparto que hacer y entra al principio: la
 * división por `count - 1` sería un `NaN` que no daría error, solo un planeta
 * que no aparece nunca.
 */
export function planetCue(rank: number, count: number): Cue {
  const duration = TOTAL * CASCADE.fade;
  // El sitio que queda para escalonar es el tramo entero menos lo que dura el
  // último en aparecer: así el último acaba exactamente en `TOTAL`.
  const room = TOTAL * (CASCADE.to - CASCADE.from) - duration;
  const stagger = count > 1 ? room / (count - 1) : 0;
  return { delay: TOTAL * CASCADE.from + rank * stagger, duration };
}

/**
 * El orden en el que caen los planetas: **desde el Ascendente y en el sentido
 * en el que crece la longitud**, que es el orden en el que salen por el
 * horizonte. No es un orden de lista (Sol, Luna, Mercurio…) porque lo que se
 * está revelando es un cielo, no una tabla — y así la cascada se ve girar.
 *
 * Recibe ángulos de pantalla (`screenAngle`) y devuelve un array paralelo con
 * el puesto de cada uno, no una reordenación: quien llama sigue teniendo su
 * planeta en su índice.
 */
export function cascadeOrder(screenAngles: readonly number[]): number[] {
  const rank = new Array<number>(screenAngles.length);
  screenAngles
    .map((angle, index) => ({ index, fromAscendant: normalizeAngle(angle - ASCENDANT_ANGLE) }))
    .sort((a, b) => a.fromAscendant - b.fromAscendant)
    .forEach((entry, position) => {
      rank[entry.index] = position;
    });
  return rank;
}

/** Lo que dura el revelado entero. Es el token, expuesto para quien lo necesite medir. */
export const REVEAL_DURATION = TOTAL;
