import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { InMemorySubscriptionGateway } from '../../testing/InMemorySubscriptionGateway';
import GetSubscriptionUseCase from '../GetSubscriptionUseCase';
import ListPlansUseCase from '../ListPlansUseCase';
import PurchasePlanUseCase from '../PurchasePlanUseCase';
import RestorePurchasesUseCase from '../RestorePurchasesUseCase';

function useCases(gateway = InMemorySubscriptionGateway.create()) {
  return {
    gateway,
    get: GetSubscriptionUseCase.create({ gateway }),
    plans: ListPlansUseCase.create({ gateway }),
    purchase: PurchasePlanUseCase.create({ gateway }),
    restore: RestorePurchasesUseCase.create({ gateway }),
  };
}

describe('los casos de uso de la suscripción', () => {
  it('sin comprar nada, la app arranca en el tier gratuito', async () => {
    const { get } = useCases();
    expect((await get.execute()).isPremium()).toBe(false);
  });

  it('los planes salen en el orden del artboard 11, no en el de la tienda', async () => {
    const { plans } = useCases(
      InMemorySubscriptionGateway.create({
        plans: [
          { id: 'lifetime', amount: 29.99, currency: 'EUR', priceLabel: '29,99 €' },
          { id: 'monthly', amount: 3.99, currency: 'EUR', priceLabel: '3,99 €' },
          { id: 'annual', amount: 19.99, currency: 'EUR', priceLabel: '19,99 €' },
        ],
      }),
    );

    expect((await plans.execute()).map((plan) => plan.id())).toEqual(['annual', 'monthly', 'lifetime']);
  });

  it('un plan que la tienda no ofrece no deja hueco', async () => {
    const { plans } = useCases(
      InMemorySubscriptionGateway.create({
        plans: [{ id: 'monthly', amount: 3.99, currency: 'EUR', priceLabel: '3,99 €' }],
      }),
    );

    expect((await plans.execute()).map((plan) => plan.id())).toEqual(['monthly']);
  });

  it('comprar devuelve la suscripción ya activa, sin tener que volver a preguntar', async () => {
    const { purchase, get } = useCases();

    const bought = await purchase.execute({ planId: 'annual' });

    expect(bought.planId()).toBe('annual');
    expect((await get.execute()).isPremium()).toBe(true);
  });

  it('cerrar la hoja de la tienda no cambia nada y se distingue del fallo', async () => {
    const { purchase, get } = useCases(InMemorySubscriptionGateway.create().willBeCancelled());

    await expect(purchase.execute({ planId: 'annual' })).rejects.toThrow(DomainError);
    expect((await get.execute()).isPremium()).toBe(false);

    try {
      await purchase.execute({ planId: 'annual' });
    } catch (error) {
      expect((error as DomainError).hasCode(ErrorCode.PURCHASE_CANCELLED)).toBe(true);
      expect((error as DomainError).hasCode(ErrorCode.PURCHASE_FAILED)).toBe(false);
    }
  });

  it('una compra rechazada por la tienda sí es un fallo', async () => {
    const { purchase } = useCases(InMemorySubscriptionGateway.create().willFail());

    try {
      await purchase.execute({ planId: 'monthly' });
      throw new Error('tendría que haber lanzado');
    } catch (error) {
      expect((error as DomainError).hasCode(ErrorCode.PURCHASE_FAILED)).toBe(true);
    }
  });

  it('cada plan trae su renovación, y el vitalicio no trae ninguna', async () => {
    const now = () => new Date('2026-08-24T09:00:00.000Z');
    const { purchase } = useCases(InMemorySubscriptionGateway.create({ now }));

    expect((await purchase.execute({ planId: 'annual' })).renewsAt()).toBe('2027-08-24');
    expect((await purchase.execute({ planId: 'monthly' })).renewsAt()).toBe('2026-09-24');

    const lifetime = await purchase.execute({ planId: 'lifetime' });
    expect(lifetime.isPremium()).toBe(true);
    expect(lifetime.renews()).toBe(false);
    expect(lifetime.renewsAt()).toBeUndefined();
  });

  it('restaurar recupera la compra hecha en otro móvil', async () => {
    const { restore } = useCases(InMemorySubscriptionGateway.create().withPreviousPurchase('monthly'));

    expect((await restore.execute()).planId()).toBe('monthly');
  });

  it('restaurar sin nada que restaurar deja al usuario como estaba', async () => {
    const { restore } = useCases();
    expect((await restore.execute()).isPremium()).toBe(false);
  });
});
