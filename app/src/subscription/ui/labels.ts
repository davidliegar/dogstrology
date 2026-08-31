import type { PlanId } from '../domain/Plan';

/**
 * Lo que el usuario lee de la suscripción, y **solo aquí** (`app/AGENTS.md`).
 * Los identificadores de plan viajan en inglés (`annual`, `monthly`); lo que
 * se enseña vive en esta tabla.
 */

/**
 * El nombre del plan. Aparece **antes que el precio en las dos puertas** —la
 * oferta de Ajustes y la fila de añadir del 26— para que el artboard 11 no sea
 * la primera vez que se lee.
 */
export const PREMIUM_NAME = 'Dogstrology Cósmico';

export const PLAN_LABELS: Record<PlanId, string> = {
  annual: 'Anual',
  monthly: 'Mensual',
  lifetime: 'Para siempre',
};

/** Artboard 11. Nombra exactamente lo que el usuario acaba de no ver. */
export const PAYWALL_TITLE = 'Su Sol es el principio. Falta su Luna.';

/**
 * Los cuatro del artboard 11, en su orden. El primero es el que sostiene el
 * titular; los otros tres son fase 2 y en el 11 se prometen, no se enseñan.
 */
export const PAYWALL_BENEFITS = [
  'Luna, Ascendente, casas y aspectos',
  'Mascotas ilimitadas y dinámica de manada',
  'Compatibilidades y calendario cósmico',
  'Su carta en alta resolución, para imprimir',
];

export const PAYWALL_CTA = 'Empezar';
export const RESTORE_LABEL = 'Restaurar compra';

/** La oferta de Ajustes (artboard 10): la puerta fría, arriba y una sola vez. */
export const OFFER_TITLE = 'Su carta completa, y toda la casa';
export const OFFER_CTA = 'Ver los planes';

/** La hoja del artboard 26. */
export const PET_SHEET_TITLE = 'Tus mascotas';
export const ADD_PET_LABEL = 'Añadir otra mascota';
/** Subtítulo de la fila de añadir: el nombre del plan, antes que ningún precio. */
export const ADD_PET_NOTE = `Con ${PREMIUM_NAME}`;

/**
 * Cuando la tienda rechaza la compra. Cancelar **no** trae mensaje: cerrar la
 * hoja de compra es una decisión, no un fallo, y contestarle con un aviso
 * sería regañar a quien solo ha mirado el precio.
 */
export const PURCHASE_FAILED_NOTE = 'La compra no se pudo completar. No se te ha cobrado nada.';
