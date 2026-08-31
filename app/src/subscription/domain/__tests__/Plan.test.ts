import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { Plan, type PlanData } from '../Plan';

const monthly = (data: Partial<PlanData> = {}) =>
  Plan.create({ id: 'monthly', amount: 3.99, currency: 'EUR', priceLabel: '3,99 €', ...data });

const annual = (data: Partial<PlanData> = {}) =>
  Plan.create({ id: 'annual', amount: 19.99, currency: 'EUR', priceLabel: '19,99 €', ...data });

const lifetime = (data: Partial<PlanData> = {}) =>
  Plan.create({ id: 'lifetime', amount: 29.99, currency: 'EUR', priceLabel: '29,99 €', ...data });

describe('Plan', () => {
  it('el precio que enseña es el que escribe la tienda, no uno formateado aquí', () => {
    expect(annual({ priceLabel: '$21.99' }).priceLabel()).toBe('$21.99');
  });

  it('un producto sin precio no es un plan', () => {
    expect(() => annual({ amount: 0 })).toThrow(DomainError);
    try {
      annual({ priceLabel: '' });
    } catch (error) {
      expect((error as DomainError).hasCode(ErrorCode.INVALID_PLAN)).toBe(true);
    }
  });

  it('solo el anual es el ancla: si destacaran dos, no habría ancla', () => {
    expect(annual().isAnchor()).toBe(true);
    expect(monthly().isAnchor()).toBe(false);
    expect(lifetime().isAnchor()).toBe(false);
  });

  it('el anual se compara al mes, que es la cuenta que hace el usuario', () => {
    expect(annual().monthlyBreakdown()).toBeCloseTo(1.6658, 4);
  });

  it('el mensual y el vitalicio no desglosan: uno ya está al mes y el otro no tiene meses', () => {
    expect(monthly().monthlyBreakdown()).toBeUndefined();
    expect(lifetime().monthlyBreakdown()).toBeUndefined();
  });

  it('el vitalicio es un pago único, no una suscripción', () => {
    expect(lifetime().isRecurring()).toBe(false);
    expect(annual().isRecurring()).toBe(true);
  });

  it('el ahorro se calcula contra pagar el mensual doce veces', () => {
    expect(annual().savingsAgainst(monthly())).toBe(58);
  });

  it('sin mensual con el que comparar no hay ahorro que prometer', () => {
    expect(annual().savingsAgainst(undefined)).toBeUndefined();
    expect(monthly().savingsAgainst(monthly())).toBeUndefined();
  });

  it('un anual que no ahorra nada no dice que ahorra', () => {
    expect(annual({ amount: 47.88 }).savingsAgainst(monthly())).toBeUndefined();
  });
});
