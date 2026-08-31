import { UseCase } from '@/_kernel/architecture';
import { PLAN_IDS, type Plan } from '../domain/Plan';
import type { SubscriptionGateway } from '../domain/SubscriptionGateway';

/**
 * Los planes que puede comprar, **en el orden del artboard 11** — anual,
 * mensual y vitalicio—, que es el que declara `PLAN_IDS`.
 *
 * Ordenar aquí y no en la pantalla es lo que evita que la jerarquía visual
 * dependa del orden en que la tienda devuelva sus productos, que no es cosa
 * nuestra. Un plan que la tienda no ofrezca simplemente no sale: la pantalla
 * pinta lo que hay, no tres huecos.
 */
export default class ListPlansUseCase extends UseCase<void, Plan[]> {
  static create({ gateway }: { gateway: SubscriptionGateway }): ListPlansUseCase {
    return new ListPlansUseCase(gateway);
  }

  constructor(private readonly gateway: SubscriptionGateway) {
    super();
  }

  async execute(): Promise<Plan[]> {
    const plans = await this.gateway.plans();
    return [...plans].sort((a, b) => PLAN_IDS.indexOf(a.id()) - PLAN_IDS.indexOf(b.id()));
  }
}
