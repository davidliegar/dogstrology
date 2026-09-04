/**
 * Qué se lee gratis y qué queda detrás del candado (D19, BRD §10.3 y §10.4).
 *
 * Vive en `subscription/` y no repartido por las pantallas porque es una regla
 * **del plan**, no de la pantalla que la sufre: el día que la fase 2 la mueva,
 * se mueve en este fichero y no en las cinco tarjetas que la preguntan.
 */

/**
 * Los tres ejes del diario, **nombrados otra vez a propósito**. El dominio de
 * un contexto no importa el de otro (`app/AGENTS.md`), así que esta lista es
 * un espejo de `content/domain/DailyKey`, y los ata
 * `src/__tests__/contentAccess.test.ts` — el mismo trato que tienen las
 * etiquetas de la app y las del pipeline.
 */
export const DAILY_AXES = ['sun', 'moon', 'ascendant'] as const;

export type DailyAxis = (typeof DAILY_AXES)[number];

/**
 * **El Sol se lee entero sin pagar**, y es la decisión que sostiene el negocio
 * (D19): quien no paga sigue teniendo motivo para abrir la app cada mañana,
 * que es la retención sobre la que se mide todo lo demás (BRD §10.6). Lo que
 * se bloquea es la profundidad —la Luna y el Ascendente—, nunca el hábito.
 *
 * La tarjeta del cielo y la fase lunar no salen aquí porque no son de nadie:
 * son del cielo, iguales para todos los perros, y no se cobran.
 */
export const FREE_DAILY_AXES: readonly DailyAxis[] = ['sun'];
