import { useDomain } from '@/_ui/DomainProvider';
import type { Analytics } from '../domain/Analytics';

/**
 * La analítica, para la pantalla que sabe qué ha pasado.
 *
 * **Medir no se hace en un caso de uso.** Por qué puerta se abrió el paywall,
 * o si el usuario cerró la hoja de la tienda en vez de fallar la compra, son
 * cosas que solo sabe la UI: bajarlas al dominio obligaría a inventar un caso
 * de uso por evento y a que el dominio hablara de pantallas.
 *
 * Lo que sí está prohibido es medir **en vez de** hacer: `track` no devuelve
 * nada y no se espera, así que no puede colarse en una condición.
 */
export const useAnalytics = (): Analytics => useDomain().analytics;
