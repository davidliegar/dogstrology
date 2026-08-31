import { Plan, type PlanData } from '../../domain/Plan';
import { formatAmount, formatMonthlyBreakdown, formatSavings } from '../format';

const plan = (data: PlanData) => Plan.create(data);

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
