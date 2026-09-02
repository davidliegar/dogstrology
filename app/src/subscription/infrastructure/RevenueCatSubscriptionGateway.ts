import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesEntitlementInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { Plan, type PlanId } from '../domain/Plan';
import { Subscription } from '../domain/Subscription';
import type { SubscriptionGateway, purchaseInput } from '../domain/SubscriptionGateway';

/**
 * El derecho activo, si lo hay. **Vale cualquiera, y no se busca por nombre.**
 *
 * Esta app vende **una sola cosa**: «Dogstrology Cósmico». Los tres planes son
 * la misma suscripción cobrada cada cuánto, así que la pregunta del dominio no
 * es «¿tiene el derecho que se llama X?» sino «¿ha pagado?».
 *
 * Buscarlo por identificador es además la peor forma de fallar que tiene este
 * fichero, y se comprobó en un móvil (2026-09-02): el panel creó el derecho
 * como `dogstrology_cósmico`, el código buscaba `cosmico`, la compra se
 * completó de verdad **y la app siguió diciendo que nadie había pagado**. Sin
 * error, sin aviso, y con el dinero cobrado.
 *
 * ⚠️ El día que haya un segundo derecho que vender —la manada de fase 2— esta
 * función es la que hay que cambiar, y entonces sí habrá que mirar cuál es.
 */
const activeEntitlement = (customer: CustomerInfo): PurchasesEntitlementInfo | undefined =>
  Object.values(customer.entitlements.active)[0];


/**
 * De qué tipo de paquete sale cada plan nuestro.
 *
 * **La correspondencia va por tipo de paquete y no por identificador de
 * producto**, y eso es lo que deja crear los productos en Play Console con el
 * nombre que sea sin volver a publicar la app: lo que la app conoce es
 * «anual», y qué producto hay detrás lo dice el panel de RevenueCat.
 *
 * Los tipos que no salen aquí —trimestral, semanal, personalizado— no son
 * planes de este MVP: si alguien crea uno en el panel, esta tabla no lo
 * reconoce y el paquete se ignora, que es mejor que pintar un plan que la app
 * no sabe nombrar (BRD §10.4 fija tres, y `PLAN_IDS` los ata).
 */
const PLAN_BY_PACKAGE: Partial<Record<PACKAGE_TYPE, PlanId>> = {
  [PACKAGE_TYPE.ANNUAL]: 'annual',
  [PACKAGE_TYPE.MONTHLY]: 'monthly',
  [PACKAGE_TYPE.LIFETIME]: 'lifetime',
};

/**
 * La segunda oportunidad, por identificador de paquete.
 *
 * **Un paquete solo tiene tipo si se creó con uno de los identificadores
 * reservados**; con cualquier otro llega como `CUSTOM`, y entonces la tabla de
 * arriba no lo reconoce. El fallo sería mudo y del peor tipo: un paywall con
 * los tres precios en blanco y un botón apagado, sin error en ninguna parte —
 * la misma forma de romperse que una clave de contenido mal escrita (BRD
 * §7.3.1).
 *
 * Así que se mira también cómo se llama. `yearly` está porque es lo que
 * propone el asistente de RevenueCat al dar de alta la app, y es el nombre que
 * más fácil se queda puesto.
 */
const PLAN_BY_IDENTIFIER: Record<string, PlanId> = {
  $rc_annual: 'annual',
  $rc_monthly: 'monthly',
  $rc_lifetime: 'lifetime',
  annual: 'annual',
  yearly: 'annual',
  monthly: 'monthly',
  lifetime: 'lifetime',
};

/** De qué plan es este paquete: por su tipo, y si no, por su nombre. */
const planOfPackage = (each: PurchasesPackage): PlanId | undefined =>
  PLAN_BY_PACKAGE[each.packageType] ?? PLAN_BY_IDENTIFIER[each.identifier.toLowerCase()];

/** `2027-08-24` a partir del ISO largo que devuelve la tienda. */
const isoDate = (value: string): string | undefined => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

export interface RevenueCatSubscriptionGatewayOptions {
  /**
   * La clave pública del SDK, la de esta plataforma. **Es pública a
   * propósito** —viaja dentro de cada instalación— y no da acceso a nada: las
   * operaciones que cuestan dinero las valida la tienda.
   */
  apiKey: string;
  /** El día de hoy. Inyectable para poder fijar el calendario en los tests. */
  now?: () => Date;
}

/**
 * RevenueCat detrás del puerto (BRD §15.4).
 *
 * **Traduce dos vocabularios y no deja pasar ninguno**: fuera de este fichero
 * la app no sabe qué es una *offering*, un *package* ni un `CustomerInfo`, y
 * aquí dentro no se sabe qué es una tarjeta del día ni un candado. Es lo que
 * ha permitido construir el paywall entero —y probarlo— antes de que existieran
 * la cuenta, los productos y el build nativo.
 *
 * **Los precios los dicta la tienda, siempre.** No hay ni un número de dinero
 * escrito en el código de la app: `priceString` es lo que Google va a cobrar de
 * verdad, en la moneda del usuario y con sus impuestos, y es lo que el paywall
 * enseña. Cualquier diferencia entre lo que promete la pantalla y lo que cobra
 * la hoja de compra es motivo de rechazo de ficha, y de desconfianza.
 */
export class RevenueCatSubscriptionGateway implements SubscriptionGateway {
  /**
   * Qué plan es cada producto, aprendido de la oferta.
   *
   * Hace falta porque **el cliente dice qué producto tiene comprado, no qué
   * plan es**: `CustomerInfo` habla de identificadores de producto y la tabla
   * de arriba habla de paquetes. Se llena al pedir la oferta —que es lo que
   * hace el paywall— y sobrevive a las llamadas siguientes.
   */
  private readonly planByProduct = new Map<string, PlanId>();

  /**
   * Los identificadores de suscripción que no bastan para decidir el plan,
   * porque cuelgan de ellos dos planes base distintos. Se apuntan para no
   * volver a registrarlos: **una respuesta a medias sería peor que ninguna**,
   * porque la degradación de `planOf` sí sabe que no sabe.
   */
  private readonly ambiguous = new Set<string>();

  static create({
    apiKey,
    now = () => new Date(),
  }: RevenueCatSubscriptionGatewayOptions): RevenueCatSubscriptionGateway {
    // `configure` es lo primero que hay que llamar y solo una vez: es lo que
    // abre la sesión con la tienda. Va aquí, en el único sitio que sabe que
    // detrás hay RevenueCat, y no en el arranque de la app.
    Purchases.configure({ apiKey });
    return new RevenueCatSubscriptionGateway(now);
  }

  constructor(private readonly now: () => Date) {}

  async current(): Promise<Subscription> {
    const customer = await Purchases.getCustomerInfo();
    return this.subscriptionOf(customer);
  }

  async plans(): Promise<Plan[]> {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];

    return packages.flatMap((each) => {
      const planId = planOfPackage(each);
      if (planId === undefined) return [];
      this.remember(each.product.identifier, planId);
      return [
        Plan.create({
          id: planId,
          amount: each.product.price,
          currency: each.product.currencyCode,
          priceLabel: each.product.priceString,
        }),
      ];
    });
  }

  async purchase({ planId }: purchaseInput): Promise<Subscription> {
    const target = await this.packageOf(planId);

    try {
      const { customerInfo } = await Purchases.purchasePackage(target);
      return this.subscriptionOf(customerInfo);
    } catch (error) {
      // **Cancelar no es fallar**, y la diferencia la trata la pantalla: cerrar
      // la hoja de la tienda es una decisión del usuario y no se le contesta
      // con un aviso. Se mira el código y no la bandera `userCancelled`, que
      // el SDK marca como obsoleta.
      throw isCancellation(error)
        ? DomainError.withCodes(ErrorCode.PURCHASE_CANCELLED)
        : DomainError.withCodes(ErrorCode.PURCHASE_FAILED);
    }
  }

  async restore(): Promise<Subscription> {
    // Restaurar sin nada que restaurar **no es un fallo**: la tienda contesta
    // que no hay compras y el usuario se queda en el tier gratuito, que es
    // exactamente lo que `subscriptionOf` devuelve sin derecho activo.
    const customer = await Purchases.restorePurchases();
    return this.subscriptionOf(customer);
  }

  /** El paquete que hay que comprar para este plan, o un fallo si ya no está. */
  private async packageOf(planId: PlanId): Promise<PurchasesPackage> {
    const offerings = await Purchases.getOfferings();
    const target = offerings.current?.availablePackages.find((each) => planOfPackage(each) === planId);

    // Se pide un plan que la oferta ya no trae: pasa si alguien lo retira del
    // panel mientras la pantalla está abierta. Es un fallo de compra y no una
    // cancelación — el usuario sí quería comprar.
    if (!target) throw DomainError.withCodes(ErrorCode.PURCHASE_FAILED);
    return target;
  }

  /**
   * Apunta de qué plan es este producto, **y también su suscripción a secas**.
   *
   * Hace falta porque los dos lados de RevenueCat no dicen lo mismo en Google
   * Play: la oferta entrega `<suscripción>:<plan base>` —el cliente compra un
   * plan base, no una suscripción— y `CustomerInfo` devuelve solo
   * `<suscripción>`. Sin esto no acertaría **ni un suscriptor**, y todos
   * caerían en la degradación de `planOf`.
   *
   * El alias solo se guarda si no hay ambigüedad: dos planes base de la misma
   * suscripción —un mensual y un anual bajo un solo producto— dejan el nombre
   * corto sin dueño, y entonces es mejor no saber que adivinar.
   */
  private remember(identifier: string, planId: PlanId): void {
    this.planByProduct.set(identifier, planId);

    const subscriptionId = identifier.split(':')[0];
    if (subscriptionId === identifier || this.ambiguous.has(subscriptionId)) return;

    const known = this.planByProduct.get(subscriptionId);
    if (known === undefined) {
      this.planByProduct.set(subscriptionId, planId);
    } else if (known !== planId) {
      this.planByProduct.delete(subscriptionId);
      this.ambiguous.add(subscriptionId);
    }
  }

  private subscriptionOf(customer: CustomerInfo): Subscription {
    const active = activeEntitlement(customer);
    if (!active) return Subscription.free();

    return Subscription.premium({ planId: this.planOf(active), renewsAt: this.nextChargeOf(active) });
  }

  /**
   * Cuándo vuelve a cobrar, **y solo si de verdad está por delante**.
   *
   * Con el **periodo de gracia** que se le pone en Play Console (7 días), un
   * cobro que falla no cierra la suscripción: el derecho sigue activo mientras
   * Google reintenta, y ahí la fecha de caducidad puede haber quedado atrás.
   * Enseñarla sería escribir «se renueva el 2 de septiembre» un 9 de
   * septiembre, en la única pantalla de la app que habla de dinero.
   *
   * Callar es lo correcto y no una degradación: la tarjeta de Ajustes ya sabe
   * pintarse sin la línea de renovación, y lo que no cambia —que ha pagado y
   * que tiene acceso— sigue siendo cierto. El propio dominio lo dice:
   * **no hay estado intermedio a propósito**, porque el periodo de gracia lo
   * resuelve la tienda y llega aquí ya decidido.
   *
   * ⚠️ Lo que esta app **no** tiene es una forma de decir «hay un problema con
   * tu pago». Es fase 2 y hace falta diseño; sin ella, el usuario ve su
   * suscripción activa hasta que deja de estarlo.
   */
  private nextChargeOf(entitlement: PurchasesEntitlementInfo): string | undefined {
    if (entitlement.expirationDate === null) return undefined;

    const expiration = new Date(entitlement.expirationDate);
    if (Number.isNaN(expiration.getTime()) || expiration <= this.now()) return undefined;
    return isoDate(entitlement.expirationDate);
  }

  /**
   * Qué plan tiene comprado, para poder nombrarlo en Ajustes.
   *
   * Lo normal es que el producto esté en la oferta y la respuesta sea exacta.
   * **Cuando no lo está** —un producto retirado del panel después de haberlo
   * vendido— se cae a lo que sí se sabe sin preguntar a nadie: sin fecha de
   * caducidad es un vitalicio, y con ella una suscripción. El error posible es
   * llamar «anual» a un mensual en una tarjeta de Ajustes; lo que **no** se
   * equivoca nunca es si ha pagado o no, ni si caduca, que es lo que decide lo
   * que se ve.
   */
  private planOf(entitlement: PurchasesEntitlementInfo): PlanId {
    return (
      this.planByProduct.get(entitlement.productIdentifier) ??
      (entitlement.expirationDate === null ? 'lifetime' : 'annual')
    );
  }
}

/** Si el error de la tienda es «el usuario cerró la hoja». */
function isCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}
