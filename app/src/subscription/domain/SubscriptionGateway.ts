import type { Plan, PlanId } from './Plan';
import type { Subscription } from './Subscription';

export interface purchaseInput {
  planId: PlanId;
}

/**
 * Puerto de la suscripción. Detrás va RevenueCat (BRD §15.4: decidido, y sin
 * alternativa que mereciera evaluarse), pero el resto de la app no lo sabe:
 * habla de planes y de si hay suscripción, no de *offerings*, *entitlements*
 * ni `CustomerInfo`.
 *
 * Es lo que permite construir el paywall entero —la pantalla, sus dos puertas
 * y el selector de mascota— antes de que existan la cuenta de RevenueCat, los
 * productos en Play Console y el build nativo que hace falta para probarlos.
 * Hasta entonces el adaptador es `testing/InMemorySubscriptionGateway`.
 *
 * **`current()` nunca devuelve `null`**, igual que `PreferencesRepository.get()`:
 * quien no ha comprado nunca no es un dato que falte, es `Subscription.free()`.
 *
 * Los fallos salen como `DomainError`, y son dos porque la UI los trata de
 * forma distinta: `PURCHASE_CANCELLED` cuando el usuario cierra la hoja de la
 * tienda —no ha pasado nada, no se le enseña un error— y `PURCHASE_FAILED`
 * cuando la compra se intentó y no salió.
 */
export interface SubscriptionGateway {
  current(): Promise<Subscription>;
  plans(): Promise<Plan[]>;
  purchase(input: purchaseInput): Promise<Subscription>;
  /** Recuperar una compra hecha en otro móvil o antes de reinstalar. */
  restore(): Promise<Subscription>;
}
