import { z } from 'zod';

import { Model } from '@/_kernel/architecture';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { PLAN_IDS, type PlanId } from './Plan';

/**
 * Una mascota en el tier gratuito (BRD §10.3). Es **el** límite del MVP: no
 * hay anuncios, así que la segunda mascota es lo único por lo que se cobra
 * hasta que llegue la fase 2.
 */
export const FREE_PET_LIMIT = 1;

const schema = z.object({
  planId: z.enum(PLAN_IDS).optional(),
  renewsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '[Subscription] renewsAt es una fecha ISO `YYYY-MM-DD`')
    .optional(),
});

export interface SubscriptionData {
  /** El plan activo, o `undefined` en el tier gratuito. */
  planId?: PlanId;
  /**
   * Cuándo vuelve a cobrar, `YYYY-MM-DD`. Solo lo tienen los planes que
   * renuevan: «Para siempre» no caduca, así que no hay fecha que enseñar.
   */
  renewsAt?: string;
}

/**
 * Si el usuario tiene «Dogstrology Cósmico» o no, y con qué plan.
 *
 * **No hay estado intermedio a propósito**: la suscripción está activa o no lo
 * está. Un periodo de gracia o una renovación fallida los resuelve RevenueCat
 * por su cuenta y llegan aquí ya decididos; modelarlos sería duplicar una
 * máquina de estados que vive en el proveedor y que la app no puede corregir.
 *
 * El límite de mascotas vive aquí y no en `pet/` porque es una regla de
 * negocio del plan, no de la mascota: cuando la fase 2 lo cambie, se cambia en
 * este fichero y no en el modelo que representa a un perro.
 */
export class Subscription extends Model {
  static create(data: SubscriptionData): Subscription {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw DomainError.withCodes(ErrorCode.INVALID_SUBSCRIPTION);
    return new Subscription(parsed.data.planId, parsed.data.renewsAt);
  }

  /** Lo que tiene todo el mundo hasta que compra, y a lo que se vuelve al caducar. */
  static free(): Subscription {
    return new Subscription(undefined, undefined);
  }

  static premium({ planId, renewsAt }: { planId: PlanId; renewsAt?: string }): Subscription {
    return Subscription.create({ planId, renewsAt });
  }

  constructor(
    private readonly _planId: PlanId | undefined,
    private readonly _renewsAt: string | undefined,
  ) {
    super();
  }

  isPremium(): boolean {
    return this._planId !== undefined;
  }

  planId(): PlanId | undefined {
    return this._planId;
  }

  /**
   * Si el plan vuelve a cobrar. «Para siempre» es un pago único, y de ahí sale
   * la diferencia que pinta el artboard 30: donde uno dice cuándo se renueva,
   * el otro dice que no caduca — y se queda sin la fila de gestionar, porque
   * no hay nada que gestionar.
   */
  renews(): boolean {
    return this.isPremium() && this._planId !== 'lifetime';
  }

  /**
   * La fecha del próximo cobro, `YYYY-MM-DD`. `undefined` si el plan no
   * renueva —o si la tienda no la ha dicho—, y entonces la línea no se pinta:
   * antes callar que inventar una fecha en una pantalla que habla de dinero.
   */
  renewsAt(): string | undefined {
    return this.renews() ? this._renewsAt : undefined;
  }

  /** Cuántas mascotas caben con este plan. Premium es ilimitado (BRD §10.4). */
  petLimit(): number {
    return this.isPremium() ? Number.POSITIVE_INFINITY : FREE_PET_LIMIT;
  }

  /**
   * Si con las mascotas que ya hay se puede añadir otra.
   *
   * Es la pregunta que hace la fila de añadir del artboard 26, y la respuesta
   * **no la desactiva**: `false` no significa «candado», significa «esta fila
   * lleva al 11». La regla de diseño es explícita — bloquearla enseñaría una
   * puerta cerrada, y esto enseña una puerta.
   */
  canAddPet(currentPets: number): boolean {
    return currentPets < this.petLimit();
  }

  toData(): SubscriptionData {
    if (this._planId === undefined) return {};
    return this._renewsAt === undefined
      ? { planId: this._planId }
      : { planId: this._planId, renewsAt: this._renewsAt };
  }
}
