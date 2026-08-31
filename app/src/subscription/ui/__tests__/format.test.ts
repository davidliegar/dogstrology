import { Plan, type PlanData } from '../../domain/Plan';
import {
  formatAmount,
  formatMonthlyBreakdown,
  formatPricingOffer,
  formatPurchaseCta,
  formatRenewal,
  formatSavings,
} from '../format';

const plan = (data: PlanData) => Plan.create(data);

const ANNUAL: PlanData = { id: 'annual', amount: 19.99, currency: 'EUR', priceLabel: '19,99 €' };
const MONTHLY: PlanData = { id: 'monthly', amount: 3.99, currency: 'EUR', priceLabel: '3,99 €' };
const LIFETIME: PlanData = { id: 'lifetime', amount: 29.99, currency: 'EUR', priceLabel: '29,99 €' };

describe('el formato de los precios', () => {
  it('escribe el importe con coma decimal y el símbolo detrás', () => {
    expect(formatAmount(1.6658, 'EUR')).toBe('1,67 €');
  });

  it('una moneda sin símbolo conocido se queda en su código', () => {
    expect(formatAmount(21.99, 'USD')).toBe('21,99 USD');
  });

  it('el anual desglosa su precio al mes, que es lo que pinta el artboard', () => {
    const annual = plan({ id: 'annual', amount: 19.99, currency: 'EUR', priceLabel: '19,99 €' });
    expect(formatMonthlyBreakdown(annual)).toBe('1,67 € al mes');
  });

  it('el mensual y el vitalicio no desglosan nada', () => {
    const monthly = plan({ id: 'monthly', amount: 3.99, currency: 'EUR', priceLabel: '3,99 €' });
    const lifetime = plan({ id: 'lifetime', amount: 29.99, currency: 'EUR', priceLabel: '29,99 €' });
    expect(formatMonthlyBreakdown(monthly)).toBeUndefined();
    expect(formatMonthlyBreakdown(lifetime)).toBeUndefined();
  });

  it('sin ahorro no se promete ahorro', () => {
    expect(formatSavings(58)).toBe('Ahorras 58%');
    expect(formatSavings(undefined)).toBeUndefined();
  });
});

describe('el rótulo del botón del 11', () => {
  it('dice qué compra, no solo «Empezar»', () => {
    expect(formatPurchaseCta(plan(ANNUAL))).toBe('Empezar · 19,99 € al año');
    expect(formatPurchaseCta(plan(MONTHLY))).toBe('Empezar · 3,99 € al mes');
    expect(formatPurchaseCta(plan(LIFETIME))).toBe('Empezar · 29,99 € una sola vez');
  });

  it('sin planes todavía cargados se queda en «Empezar»', () => {
    expect(formatPurchaseCta(undefined)).toBe('Empezar');
  });
});

describe('el apartado «Qué se cobra» de las condiciones', () => {
  it('nombra los tres precios que dice la tienda, no los del código', () => {
    expect(formatPricingOffer([plan(ANNUAL), plan(MONTHLY), plan(LIFETIME)])).toBe(
      'Cósmico se ofrece en tres formas: 19,99 € al año, 3,99 € al mes y 29,99 € una sola vez.',
    );
  });

  it('sin los tres planes no se escribe: antes corto que mintiendo', () => {
    expect(formatPricingOffer(undefined)).toBeUndefined();
    expect(formatPricingOffer([plan(ANNUAL), plan(MONTHLY)])).toBeUndefined();
  });
});

describe('la renovación de la tarjeta de Ajustes', () => {
  it('dice la fecha en largo', () => {
    expect(formatRenewal('2027-08-24')).toBe('Se renueva el 24 de agosto de 2027');
  });

  it('sin fecha no se pinta la línea', () => {
    expect(formatRenewal(undefined)).toBeUndefined();
  });
});
