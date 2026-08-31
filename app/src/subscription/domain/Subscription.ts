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
});

export interface SubscriptionData {
  /** El plan activo, o `undefined` en el tier gratuito. */
  planId?: PlanId;
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
    return new Subscription(parsed.data.planId);
  }

  /** Lo que tiene todo el mundo hasta que compra, y a lo que se vuelve al caducar. */
  static free(): Subscription {
    return new Subscription(undefined);
  }

  static premium(planId: PlanId): Subscription {
    return Subscription.create({ planId });
  }

  constructor(private readonly _planId: PlanId | undefined) {
    super();
  }

  isPremium(): boolean {
    return this._planId !== undefined;
  }

  planId(): PlanId | undefined {
    return this._planId;
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
    return this._planId === undefined ? {} : { planId: this._planId };
  }
}
