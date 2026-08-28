import { MONTHS } from '@/_ui/components/DateFields';
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

/**
 * Los días de la semana. Viven aquí y no en `labels.ts` por la misma razón
 * que `MONTHS` vive en el selector de fecha: es una tabla de calendario, no
 * vocabulario de la carta, y la usa una sola pantalla.
 */
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;

/**
 * `2026-08-25` → `Lunes 25 de agosto`.
 *
 * Sin año a propósito: donde se usa —el pie de la ficha de una fase— la fecha
 * es la de hoy, y decir el año de hoy es ruido.
 *
 * La fecha se parte a mano y el día de la semana se saca en UTC, igual que
 * `formatLongDate`: `new Date('2026-08-25')` es medianoche **UTC**, y
 * preguntarle el día con los métodos locales devuelve el anterior en cuanto el
 * huso va por detrás de Greenwich.
 */
export function formatWeekdayDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${day} de ${MONTHS[month - 1]}`;
}

/** `2026-09-02T03:44:00Z` → `2 sep`. Tres letras bastan y son inequívocas en español. */
const shortDate = (date: Date): string => `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;

/**
 * Cuándo pasa algo del cielo: `hoy · 17:12`, `mañana · 03:44`, `2 sep · 03:44`.
 *
 * **Todo en hora local**, que es la que el usuario mira en su reloj: el
 * instante viaja en UTC porque el cielo no tiene huso, y aquí se aterriza. Por
 * eso "hoy" se decide comparando el **día del calendario local** y no restando
 * horas — a las 23:50 faltan diez minutos para mañana, no un día.
 */
function skyMoment(iso: string, now: Date): { day: string; time: string } {
  const at = new Date(iso);
  const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(at) - startOfDay(now)) / (24 * 60 * 60 * 1000));

  if (days === 0) return { day: 'hoy', time };
  if (days === 1) return { day: 'mañana', time };
  return { day: shortDate(at), time };
}

export function formatSkyMoment(iso: string, now: Date = new Date()): string {
  const { day, time } = skyMoment(iso, now);
  return `${day} · ${time}`;
}

/**
 * El cambio de signo de la Luna, dicho en prosa: `en Escorpio a las 17:12`,
 * `en Escorpio mañana a las 03:44` (artboard 04).
 *
 * Es la misma información que `formatSkyMoment` con otra puntuación, y no la
 * misma función con un parámetro: aquí va dentro de una frase —la tira de la
 * Luna en Hoy— y `hoy · 17:12` con un punto medio en mitad de una oración se
 * lee como un dato pegado, no como algo que va a pasar. Hoy se calla porque en
 * esa pantalla todo es hoy.
 */
export function formatIngress({
  sign,
  at,
  now = new Date(),
}: {
  sign: string;
  at: string;
  now?: Date;
}): string {
  const { day, time } = skyMoment(at, now);
  return day === 'hoy' ? `en ${sign} a las ${time}` : `en ${sign} ${day} a las ${time}`;
}
