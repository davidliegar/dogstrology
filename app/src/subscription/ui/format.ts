import { formatLongDate } from '@/pet/ui/format';
import type { Plan } from '../domain/Plan';
import { PAYWALL_CTA, PLAN_PERIODS, PREMIUM_NAME } from './labels';

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

/** `19,99 € al año`. El precio lo escribe la tienda; el periodo, `labels.ts`. */
export function formatPlanPrice(plan: Plan): string {
  return `${plan.priceLabel()} ${PLAN_PERIODS[plan.id()]}`;
}

/**
 * El rótulo del botón del 11: **dice qué compra**. Con tres planes en la
 * pantalla y un solo botón, «Empezar» a secas obligaría a mirar arriba para
 * saber qué se está a punto de pagar — y con «Para siempre» a 29,99 € el roce
 * cuesta caro.
 */
export function formatPurchaseCta(plan: Plan | undefined): string {
  return plan === undefined ? PAYWALL_CTA : `${PAYWALL_CTA} · ${formatPlanPrice(plan)}`;
}

/** `a, b y c` — la coma de la lista y la «y» del final, como se escribe en español. */
function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/**
 * La primera frase de «Qué se cobra» (artboard 29), compuesta con **los
 * precios que dice la tienda**. La nota del artboard avisa de que si Play
 * Console cambia un precio esta pantalla miente; componerla desde el mismo
 * sitio del que sale el 11 es lo que hace que no pueda.
 *
 * Devuelve `undefined` cuando no están los tres planes —la tienda no ha
 * contestado, o el catálogo no es el esperado—: sin las tres cifras la frase
 * no es la que se escribió, así que no se pinta y queda la segunda, que sigue
 * siendo cierta. Antes un apartado más corto que un apartado que miente.
 */
export function formatPricingOffer(plans: Plan[] | undefined): string | undefined {
  if (plans === undefined || plans.length !== 3) return undefined;
  return `${PREMIUM_NAME} se ofrece en tres formas: ${joinList(plans.map(formatPlanPrice))}.`;
}

/** `Se renueva el 24 de agosto de 2027`, o nada si el plan no renueva. */
export function formatRenewal(renewsAt: string | undefined): string | undefined {
  return renewsAt === undefined ? undefined : `Se renueva el ${formatLongDate(renewsAt)}`;
}
