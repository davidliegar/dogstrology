import type { Plan } from '../domain/Plan';

/**
 * Símbolo de la moneda. Solo el euro, que es el único mercado del lanzamiento
 * (BRD §15.3): lo demás cae al código ISO, que es feo pero cierto — antes eso
 * que inventarse un símbolo.
 *
 * El precio del plan **no pasa por aquí**: ese lo escribe la tienda
 * (`plan.priceLabel()`). Esto solo formatea la cuenta que hacemos nosotros, el
 * desglose mensual del anual.
 */
const SYMBOLS: Record<string, string> = { EUR: '€' };

/** `1.6658` → `1,67 €`. Coma decimal, que es como se escribe en español. */
export function formatAmount(amount: number, currency: string): string {
  const symbol = SYMBOLS[currency] ?? currency;
  return `${amount.toFixed(2).replace('.', ',')} ${symbol}`;
}

/**
 * `1,67 € al mes` para el anual, y nada para los demás: es el desglose que el
 * artboard 11 pinta **solo** bajo el ancla.
 */
export function formatMonthlyBreakdown(plan: Plan): string | undefined {
  const monthly = plan.monthlyBreakdown();
  if (monthly === undefined) return undefined;
  return `${formatAmount(monthly, plan.currency())} al mes`;
}

/** `Ahorras 58%`, o nada si no hay ahorro que prometer. */
export function formatSavings(percent: number | undefined): string | undefined {
  return percent === undefined ? undefined : `Ahorras ${percent}%`;
}
