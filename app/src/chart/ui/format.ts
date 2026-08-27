import type { ChartConfidence } from '../domain/NatalChart';

/**
 * Grado dentro del signo como `22°14′`, la convención de efemérides.
 *
 * El motor devuelve un decimal (22,233…); enseñarlo así sería preciso y
 * ilegible. Los minutos se truncan, no se redondean: `29°59,7′` debe seguir
 * leyéndose como 29°59′ del mismo signo y no saltar a 30° del siguiente.
 */
export function formatDegree(degree: number): string {
  const whole = Math.floor(degree);
  const minutes = Math.floor((degree - whole) * 60);
  return `${whole}°${String(minutes).padStart(2, '0')}′`;
}

/**
 * Cuántos de los tres segmentos de la barra de confianza van encendidos.
 *
 * La barra cuenta **datos de nacimiento presentes**, empaquetados a la
 * izquierda: la fecha siempre está (sin ella no hay mascota), y la hora y el
 * lugar suman uno cada uno. Por eso "Sin hora" enciende dos de tres, que es
 * exactamente lo que pinta el artboard 9.
 *
 * Se cuenta desde `confidence` y no desde `Birth` a propósito: quien decide
 * qué falta es el motor (`NatalChart.confidence()`), y tener aquí una segunda
 * lectura de `hasTime()`/`hasLocation()` sería la misma regla escrita dos
 * veces, condenada a divergir el día que el motor afine la degradación.
 */
export function confidenceSegments(confidence: ChartConfidence): number {
  return confidence === 'full' ? 3 : 2;
}
