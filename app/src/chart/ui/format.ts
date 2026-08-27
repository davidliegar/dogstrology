import type { ChartConfidence } from '../domain/NatalChart';
import { HOUSE_NUMERALS } from './glyphs';

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

/**
 * Velocidad diaria como la pinta la hoja de planeta: `directo · 0,52°/día`.
 *
 * El signo del número ya dice si es retrógrado, así que en el texto va el
 * valor absoluto: `-0,31` sería decir dos veces lo mismo y la segunda peor.
 * Coma decimal porque el texto es español; el separador no es del dato.
 */
export function formatDailySpeed(dailySpeed: number): string {
  const motion = dailySpeed < 0 ? 'retrógrado' : 'directo';
  return `${motion} · ${Math.abs(dailySpeed).toFixed(2).replace('.', ',')}°/día`;
}

/**
 * El grado con su signo, y la casa detrás cuando la hay: `22°14′ Sagitario · XII`.
 *
 * Sin hora no hay casas y la coletilla desaparece entera — no se enseña un
 * hueco ni un guion donde no hay dato (BRD §17: el campo vacío no se disfraza).
 */
export function formatPosition({
  degree,
  sign,
  house,
}: {
  degree: number;
  sign: string;
  house?: number;
}): string {
  const position = `${formatDegree(degree)} ${sign}`;
  return house ? `${position} · ${HOUSE_NUMERALS[house - 1]}` : position;
}
