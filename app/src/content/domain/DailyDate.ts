/**
 * Las fechas del diario son **fechas de calendario** (`YYYY-MM-DD`), no
 * instantes: la edición del 25 de agosto es la misma a las 8:30 que a las
 * 23:00, y es la clave con la que el pipeline nombra su fichero.
 *
 * Se leen en **hora local**, no en UTC. `toISOString().slice(0, 10)` es la
 * forma corta y es la equivocada: a las 00:30 en España devuelve todavía la
 * fecha de ayer, así que quien abre la app después de medianoche vería el día
 * anterior con el móvil marcando el siguiente. Es el mismo cuidado que se toma
 * `formatLongDate` en `pet/ui/format.ts`, y por la misma razón.
 *
 * **Consecuencia para el pipeline**: si la app pide la fecha local, la edición
 * del día D tiene que estar publicada **antes de que D empiece en España** —
 * es decir, antes de las 22:00 UTC del día D−1. Generarla "por la mañana del
 * propio día" deja sin diario a quien abre la app de madrugada.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number): string => String(value).padStart(2, '0');

/** La fecha de calendario **local** de un instante. */
export function isoDateOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * La misma fecha corrida `days` días; negativo va hacia atrás.
 *
 * Se corre por campos de calendario (`new Date(y, m, d + days)`) y no sumando
 * milisegundos: el 25 de octubre en España dura 25 horas, y "ayer" seguiría
 * siendo ayer aunque la resta de 86.400.000 cayera dentro del mismo día.
 */
export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return isoDateOf(new Date(year, month - 1, day + days));
}

export function isIsoDate(value: string): boolean {
  return typeof value === 'string' && ISO_DATE.test(value);
}

/**
 * Cuántos días separan dos fechas de calendario. Positivo si `iso` es
 * anterior a `today`.
 */
export function daysBetween(iso: string, today: string): number {
  const at = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  };
  return Math.round((at(today) - at(iso)) / (24 * 60 * 60 * 1000));
}
