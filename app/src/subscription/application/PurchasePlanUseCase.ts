import { UseCase } from '@/_kernel/architecture';
import type { Subscription } from '../domain/Subscription';
import type { SubscriptionGateway, purchaseInput } from '../domain/SubscriptionGateway';

/**
 * Comprar un plan. No decide nada —la hoja de compra es de la tienda— y
 * devuelve la suscripción ya actualizada para que la pantalla no tenga que
 * volver a preguntar.
 *
 * Los dos fallos suben tal cual: `PURCHASE_CANCELLED` no es un error que
 * enseñar y `PURCHASE_FAILED` sí, y esa distinción es de la UI.
 */
export default class PurchasePlanUseCase extends UseCase<purchaseInput, Subscription> {
  static create({ gateway }: { gateway: SubscriptionGateway }): PurchasePlanUseCase {
    return new PurchasePlanUseCase(gateway);
  }

  constructor(private readonly gateway: SubscriptionGateway) {
    super();
  }

  async execute({ planId }: purchaseInput): Promise<Subscription> {
    return this.gateway.purchase({ planId });
  }
}
