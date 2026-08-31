import { z } from 'zod';

import { Model } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';

/**
 * Los tres planes de «Dogstrology Cósmico» (BRD §10.4), **en el orden en que
 * los pinta el artboard 11**: el anual primero porque es el ancla, y el
 * vitalicio el último porque es el que menos gente elige y el que más cuesta
 * de decidir.
 *
 * El orden vive aquí y no en la pantalla para que no dependa de en qué orden
 * devuelva la tienda sus productos, que no es cosa nuestra.
 *
 * Son **identificadores**, no lo que se enseña: el nombre de cada plan vive en
 * `ui/labels.ts`.
 */
export const PLAN_IDS = ['annual', 'monthly', 'lifetime'] as const;

export type PlanId = (typeof PLAN_IDS)[number];

const MONTHS_IN_YEAR = 12;

const schema = z.object({
  id: z.enum(PLAN_IDS),
  amount: z.number().positive('[Plan] el importe tiene que ser positivo'),
  currency: z.string().length(3, '[Plan] la moneda es un código ISO de tres letras'),
  priceLabel: z.string().min(1, '[Plan] falta el precio ya formateado por la tienda'),
});

export interface PlanData {
  id: PlanId;
  /** Importe en unidades de la moneda (19.99), no en céntimos. */
  amount: number;
  /** ISO 4217: `EUR`. */
  currency: string;
  /**
   * El precio **tal y como lo escribe la tienda** (`19,99 €`). Se guarda en
   * vez de formatearlo aquí porque es el que el usuario va a ver en la hoja de
   * compra de Google: cualquier diferencia entre lo que promete el paywall y
   * lo que cobra la tienda es un motivo de rechazo de ficha, y también de
   * desconfianza.
   */
  priceLabel: string;
}

/**
 * Un plan de suscripción, con el precio que **dicta la tienda**. Ni el importe
 * ni la moneda se escriben en el código: BRD §15.3 los fija al crear los
 * productos en Play Console, y dice explícitamente que la UI del paywall es
 * idéntica con cualquier cifra. Un precio quemado aquí obligaría a publicar
 * una versión para cambiarlo.
 */
export class Plan extends Model {
  static create(data: PlanData): Plan {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw DomainError.withCodes(ErrorCode.INVALID_PLAN);
    const { id, amount, currency, priceLabel } = parsed.data;
    return new Plan(id, amount, currency, priceLabel);
  }

  constructor(
    private readonly _id: PlanId,
    private readonly _amount: number,
    private readonly _currency: string,
    private readonly _priceLabel: string,
  ) {
    super();
  }

  id(): PlanId {
    return this._id;
  }

  amount(): number {
    return this._amount;
  }

  currency(): string {
    return this._currency;
  }

  priceLabel(): string {
    return this._priceLabel;
  }

  /**
   * El ancla de conversión (BRD §10.4). El artboard 11 le da el filo de oro y
   * el precio mensual desglosado **solo a este**: si destacaran dos, no habría
   * ancla.
   */
  isAnchor(): boolean {
    return this._id === 'annual';
  }

  /** El vitalicio es un pago único, no una suscripción: no renueva ni caduca. */
  isRecurring(): boolean {
    return this._id !== 'lifetime';
  }

  /**
   * Lo que sale al mes. Solo el anual lo tiene, y es la razón: es la cuenta
   * que el usuario haría de cabeza para comparar, y hacerla por él convierte
   * «19,99 al año» en «1,67 al mes». El mensual ya está en esa unidad y el
   * vitalicio no tiene meses entre los que repartirse.
   */
  monthlyBreakdown(): number | undefined {
    return this._id === 'annual' ? this._amount / MONTHS_IN_YEAR : undefined;
  }

  /**
   * Cuánto se ahorra frente a pagar el mensual doce veces, en tanto por ciento
   * redondeado. `undefined` cuando no hay con qué comparar — el propio mensual,
   * o un catálogo al que le falte el otro plan.
   */
  savingsAgainst(monthly: Plan | undefined): number | undefined {
    if (this._id !== 'annual' || monthly === undefined) return undefined;
    const full = monthly.amount() * MONTHS_IN_YEAR;
    if (full <= this._amount) return undefined;
    return Math.round((1 - this._amount / full) * 100);
  }

  toData(): PlanData {
    return { id: this._id, amount: this._amount, currency: this._currency, priceLabel: this._priceLabel };
  }
}
