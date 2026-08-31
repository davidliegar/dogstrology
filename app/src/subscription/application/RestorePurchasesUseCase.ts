import { UseCase } from '@/_kernel/architecture';
import type { Subscription } from '../domain/Subscription';
import type { SubscriptionGateway } from '../domain/SubscriptionGateway';

/**
 * Recuperar una compra anterior. Está en el MVP porque **es requisito de
 * ficha**: una app con suscripción que no ofrece restaurar se rechaza, y
 * además es lo único que tiene quien reinstala o cambia de móvil.
 */
export default class RestorePurchasesUseCase extends UseCase<void, Subscription> {
  static create({ gateway }: { gateway: SubscriptionGateway }): RestorePurchasesUseCase {
    return new RestorePurchasesUseCase(gateway);
  }

  constructor(private readonly gateway: SubscriptionGateway) {
    super();
  }

  async execute(): Promise<Subscription> {
    return this.gateway.restore();
  }
}
