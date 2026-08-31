import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { Plan, type PlanData, type PlanId } from '../domain/Plan';
import { Subscription } from '../domain/Subscription';
import type { SubscriptionGateway, purchaseInput } from '../domain/SubscriptionGateway';

/**
 * Los precios de partida del BRD (§10.4, §15.3), **solo para el doble**. El
 * precio de verdad lo dicta Play Console y llega por el puerto: si algún día
 * estos números y los de la tienda no coinciden, los buenos son los de la
 * tienda y esta tabla es la que está vieja.
 */
const DEFAULT_PLANS: PlanData[] = [
  { id: 'monthly', amount: 3.99, currency: 'EUR', priceLabel: '3,99 €' },
  { id: 'annual', amount: 19.99, currency: 'EUR', priceLabel: '19,99 €' },
  { id: 'lifetime', amount: 29.99, currency: 'EUR', priceLabel: '29,99 €' },
];

export interface InMemorySubscriptionGatewayOptions {
  plans?: PlanData[];
  /** Con qué estado empieza. Por defecto, el tier gratuito. */
  subscription?: Subscription;
  /** El día de hoy, para poder fijar la fecha de renovación en los tests. */
  now?: () => Date;
}

/** `2027-08-24`. La fecha del próximo cobro, en el formato del dominio. */
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * A cuándo renueva cada plan contando desde hoy. El vitalicio no aparece: no
 * renueva, y el modelo ya lo sabe.
 */
function renewalOf(planId: PlanId, now: Date): string | undefined {
  const next = new Date(now.getTime());
  if (planId === 'annual') next.setUTCFullYear(next.getUTCFullYear() + 1);
  else if (planId === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1);
  else return undefined;
  return isoDate(next);
}

/**
 * Doble en memoria de `SubscriptionGateway`, y **el adaptador que usa la app
 * hoy**: RevenueCat necesita cuenta, productos dados de alta y un build
 * nativo, y ninguna de las tres cosas se hace desde el editor. Con esto el
 * paywall, sus dos puertas y el selector de mascota se construyen y se prueban
 * enteros, y el día que entre el módulo lo único que cambia es la línea del
 * composition root.
 *
 * No persiste: al reiniciar la app se vuelve al tier gratuito. Es lo correcto
 * para un doble —cada arranque empieza limpio— y es justo lo que hace obvio
 * que esto todavía no es una suscripción de verdad.
 */
export class InMemorySubscriptionGateway implements SubscriptionGateway {
  private subscription: Subscription;
  private readonly catalog: Plan[];
  private outcome: 'ok' | 'cancelled' | 'failed' = 'ok';
  private previous?: Subscription;
  private readonly now: () => Date;

  static create(options: InMemorySubscriptionGatewayOptions = {}): InMemorySubscriptionGateway {
    return new InMemorySubscriptionGateway(options);
  }

  constructor({
    plans = DEFAULT_PLANS,
    subscription,
    now = () => new Date(),
  }: InMemorySubscriptionGatewayOptions = {}) {
    this.catalog = plans.map((data) => Plan.create(data));
    this.subscription = subscription ?? Subscription.free();
    this.now = now;
  }

  async current(): Promise<Subscription> {
    return this.subscription;
  }

  async plans(): Promise<Plan[]> {
    return this.catalog;
  }

  async purchase({ planId }: purchaseInput): Promise<Subscription> {
    if (this.outcome === 'cancelled') throw DomainError.withCodes(ErrorCode.PURCHASE_CANCELLED);
    if (this.outcome === 'failed') throw DomainError.withCodes(ErrorCode.PURCHASE_FAILED);
    if (!this.catalog.some((plan) => plan.id() === planId)) {
      throw DomainError.withCodes(ErrorCode.PURCHASE_FAILED);
    }
    this.subscription = Subscription.premium({ planId, renewsAt: renewalOf(planId, this.now()) });
    return this.subscription;
  }

  async restore(): Promise<Subscription> {
    // Restaurar sin nada que restaurar no es un fallo: la tienda contesta que
    // no hay compras y el usuario se queda como estaba.
    this.subscription = this.previous ?? this.subscription;
    return this.subscription;
  }

  /* Para preparar escenarios en tests y durante el desarrollo de la pantalla. */

  /** Que la siguiente compra salga como si el usuario cerrara la hoja. */
  willBeCancelled(): this {
    this.outcome = 'cancelled';
    return this;
  }

  /** Que la siguiente compra la rechace la tienda. */
  willFail(): this {
    this.outcome = 'failed';
    return this;
  }

  /** Una compra hecha en otro móvil, para que `restore()` encuentre algo. */
  withPreviousPurchase(planId: PlanId): this {
    this.previous = Subscription.premium({ planId, renewsAt: renewalOf(planId, this.now()) });
    return this;
  }
}
