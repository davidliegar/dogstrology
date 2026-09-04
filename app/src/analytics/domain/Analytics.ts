import type { AnalyticsEvent, AnalyticsProperties } from './AnalyticsEvent';

/**
 * Puerto de la analítica. Detrás va PostHog EU (BRD §15.3), pero el resto de
 * la app no lo sabe: manda un evento del vocabulario y sigue.
 *
 * **Ningún método devuelve nada ni espera a nadie.** Medir no puede cambiar lo
 * que ve el usuario ni retrasarlo: si PostHog está caído o el móvil sin red,
 * la app funciona igual y el evento se pierde. Una analítica que puede romper
 * una compra vale menos que no tener analítica.
 *
 * **Sin identificar a nadie** (D10): no hay `identify`, no hay propiedades de
 * usuario y no hay forma de mandar PII por este puerto — lo que viaja está
 * acotado en `AnalyticsProperties`.
 */
export interface Analytics {
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void;
}
