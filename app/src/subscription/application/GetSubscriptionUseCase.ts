import { UseCase } from '@/_kernel/architecture';
import type { Subscription } from '../domain/Subscription';
import type { SubscriptionGateway } from '../domain/SubscriptionGateway';

/**
 * Si hay suscripción y con qué plan. La pregunta que decide si la fila de
 * añadir mascota del 26 lleva al alta o al paywall.
 */
export default class GetSubscriptionUseCase extends UseCase<void, Subscription> {
  static create({ gateway }: { gateway: SubscriptionGateway }): GetSubscriptionUseCase {
    return new GetSubscriptionUseCase(gateway);
  }

  constructor(private readonly gateway: SubscriptionGateway) {
    super();
  }

  async execute(): Promise<Subscription> {
    return this.gateway.current();
  }
}
