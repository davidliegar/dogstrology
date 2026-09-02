import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
} from 'react-native-purchases';

import { ErrorCode } from '@/_kernel/ErrorCodes';
import { DomainError } from '@/_kernel/DomainError';
import { RevenueCatSubscriptionGateway } from '../RevenueCatSubscriptionGateway';

const mocked = jest.mocked(Purchases);

/** Un paquete de la oferta, con lo justo que el adaptador mira. */
const pack = (packageType: PACKAGE_TYPE, identifier: string, price: number, priceString: string) =>
  ({
    packageType,
    identifier,
    product: { identifier, price, priceString, currencyCode: 'EUR' },
  }) as unknown as PurchasesOfferings['current'] extends null ? never : never;

const offerings = (...packages: unknown[]) =>
  ({ current: { availablePackages: packages }, all: {} }) as unknown as PurchasesOfferings;

/**
 * Un cliente con el derecho activo, o sin él. **El nombre del derecho es a
 * propósito el que el panel puso de verdad** —`dogstrology_cósmico`, con
 * acento— y no el que el código esperaba: mirar por nombre fue justo el fallo
 * que se coló hasta el móvil.
 */
const customer = (entitlement?: { productIdentifier: string; expirationDate: string | null; willRenew?: boolean }) =>
  ({
    entitlements: {
      active: entitlement ? { 'dogstrology_cósmico': { willRenew: true, ...entitlement } } : {},
    },
  }) as unknown as CustomerInfo;

const ANNUAL = pack(PACKAGE_TYPE.ANNUAL, 'cosmico-anual', 19.99, '19,99 €');
const MONTHLY = pack(PACKAGE_TYPE.MONTHLY, 'cosmico-mensual', 3.99, '3,99 €');
const LIFETIME = pack(PACKAGE_TYPE.LIFETIME, 'cosmico-siempre', 29.99, '29,99 €');
const WEEKLY = pack('WEEKLY' as PACKAGE_TYPE, 'cosmico-semanal', 1.99, '1,99 €');

/* Como los entrega Google de verdad: `<suscripción>:<plan base>`. */
const ANNUAL_GOOGLE = pack(PACKAGE_TYPE.ANNUAL, 'cosmico-anual:anual', 19.99, '19,99 €');
const MONTHLY_GOOGLE = pack(PACKAGE_TYPE.MONTHLY, 'cosmico-mensual:mensual', 3.99, '3,99 €');
/* Y el caso torcido: dos planes base bajo una sola suscripción. */
const ANNUAL_SHARED = pack(PACKAGE_TYPE.ANNUAL, 'cosmico:anual', 19.99, '19,99 €');
const MONTHLY_SHARED = pack(PACKAGE_TYPE.MONTHLY, 'cosmico:mensual', 3.99, '3,99 €');

/** Un hoy fijo, para que las fechas de los tests no dependan del calendario. */
const HOY = new Date('2026-09-02T12:00:00Z');

const gateway = () => RevenueCatSubscriptionGateway.create({ apiKey: 'test-key', now: () => HOY });

/** El `DomainError` con el que falló una promesa, o el test se cae aquí. */
async function failureOf(promise: Promise<unknown>): Promise<DomainError> {
  const thrown = await promise.then(() => undefined).catch((error: unknown) => error);
  if (!(thrown instanceof DomainError)) throw new Error(`Se esperaba un DomainError y llegó: ${String(thrown)}`);
  return thrown;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RevenueCatSubscriptionGateway · los planes', () => {
  it('los tres del BRD, con el precio que dicta la tienda', async () => {
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL, MONTHLY, LIFETIME));

    const plans = await gateway().plans();

    expect(plans.map((plan) => plan.id())).toEqual(['annual', 'monthly', 'lifetime']);
    // El rótulo sale tal cual de la tienda y no se compone aquí: es el que el
    // usuario va a ver en la hoja de compra de Google.
    expect(plans[0].priceLabel()).toBe('19,99 €');
    expect(plans[0].amount()).toBe(19.99);
  });

  it('un paquete que no es ninguno de los tres se ignora, no se inventa un plan', async () => {
    // Alguien crea un semanal en el panel de RevenueCat. La app no sabe
    // nombrarlo —`PLAN_IDS` fija tres— así que no lo pinta, en vez de sacar
    // una fila sin rótulo en la pantalla que cobra.
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL, WEEKLY));

    expect((await gateway().plans()).map((plan) => plan.id())).toEqual(['annual']);
  });

  it('sin oferta configurada, ninguno — y sin reventar', async () => {
    mocked.getOfferings.mockResolvedValueOnce({ current: null, all: {} } as unknown as PurchasesOfferings);

    expect(await gateway().plans()).toEqual([]);
  });
});

describe('RevenueCatSubscriptionGateway · quién ha pagado', () => {
  it('sin el derecho activo es el tier gratuito, no un dato que falte', async () => {
    mocked.getCustomerInfo.mockResolvedValueOnce(customer());

    const subscription = await gateway().current();

    expect(subscription.isPremium()).toBe(false);
  });

  it('con el derecho activo, el plan sale del producto que la oferta enseñó', async () => {
    const it = gateway();
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL, MONTHLY, LIFETIME));
    await it.plans();

    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-mensual', expirationDate: '2026-10-02T08:30:00Z' }),
    );

    const subscription = await it.current();
    expect(subscription.planId()).toBe('monthly');
    // La fecha llega larga y el dominio la quiere en día: `2026-10-02`.
    expect(subscription.renewsAt()).toBe('2026-10-02');
  });

  it('un producto que ya no está en la oferta: sin caducidad es un vitalicio', async () => {
    // La degradación documentada. Lo que **no** se equivoca es si ha pagado y
    // si caduca, que es lo que decide lo que se ve.
    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'un_producto_retirado', expirationDate: null }),
    );

    const subscription = await gateway().current();
    expect(subscription.isPremium()).toBe(true);
    expect(subscription.renews()).toBe(false);
  });
});

describe('RevenueCatSubscriptionGateway · comprar', () => {
  it('compra el paquete del plan elegido y devuelve lo que la tienda confirma', async () => {
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL, MONTHLY, LIFETIME));
    mocked.purchasePackage.mockResolvedValueOnce({
      customerInfo: customer({ productIdentifier: 'cosmico-anual', expirationDate: '2027-09-02T08:30:00Z' }),
    } as never);

    const subscription = await gateway().purchase({ planId: 'annual' });

    expect(mocked.purchasePackage).toHaveBeenCalledWith(ANNUAL);
    expect(subscription.isPremium()).toBe(true);
    expect(subscription.renewsAt()).toBe('2027-09-02');
  });

  it('cerrar la hoja de la tienda es una decisión, no un fallo', async () => {
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL));
    mocked.purchasePackage.mockRejectedValueOnce({
      code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
    });

    const error = await failureOf(gateway().purchase({ planId: 'annual' }));
    expect(error.hasCode(ErrorCode.PURCHASE_CANCELLED)).toBe(true);
  });

  it('cualquier otro error de la tienda sí es un fallo de compra', async () => {
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL));
    mocked.purchasePackage.mockRejectedValueOnce({ code: '2', message: 'store is down' });

    const error = await failureOf(gateway().purchase({ planId: 'annual' }));
    expect(error.hasCode(ErrorCode.PURCHASE_FAILED)).toBe(true);
  });

  it('un plan que la oferta ya no trae falla, y no se queda esperando', async () => {
    // Se retira el vitalicio del panel con la pantalla abierta.
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL, MONTHLY));

    const error = await failureOf(gateway().purchase({ planId: 'lifetime' }));

    expect(error.hasCode(ErrorCode.PURCHASE_FAILED)).toBe(true);
    // Y no se intenta comprar nada: el fallo es antes de abrir la hoja.
    expect(mocked.purchasePackage).not.toHaveBeenCalled();
  });
});

describe('RevenueCatSubscriptionGateway · restaurar', () => {
  it('sin nada que restaurar el usuario se queda como estaba', async () => {
    mocked.restorePurchases.mockResolvedValueOnce(customer());

    expect((await gateway().restore()).isPremium()).toBe(false);
  });

  it('con una compra de otro móvil, la recupera', async () => {
    mocked.restorePurchases.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-siempre', expirationDate: null }),
    );

    const subscription = await gateway().restore();
    expect(subscription.isPremium()).toBe(true);
    expect(subscription.renewsAt()).toBeUndefined();
  });
});

describe('RevenueCatSubscriptionGateway · los dos nombres de un producto de Google', () => {
  it('la oferta trae el plan base y el cliente no, y aun así se acierta', async () => {
    // **Sin esto no acertaría ni un suscriptor.** Google Play vende planes
    // base, así que la oferta entrega `cosmico-mensual:mensual`, pero lo que
    // `CustomerInfo` devuelve es la suscripción a secas.
    const it = gateway();
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL_GOOGLE, MONTHLY_GOOGLE));
    await it.plans();

    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-mensual', expirationDate: '2026-10-02T08:30:00Z' }),
    );

    expect((await it.current()).planId()).toBe('monthly');
  });

  it('dos planes base bajo una sola suscripción: no se adivina', async () => {
    // El nombre corto se queda sin dueño —vale para los dos— y entonces manda
    // la degradación, que al menos sabe que no sabe. Es la razón por la que
    // conviene un producto por plan en Play Console.
    const it = gateway();
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL_SHARED, MONTHLY_SHARED));
    await it.plans();

    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico', expirationDate: '2026-10-02T08:30:00Z' }),
    );

    const subscription = await it.current();
    // Lo que no se equivoca: ha pagado, y caduca.
    expect(subscription.isPremium()).toBe(true);
    expect(subscription.renews()).toBe(true);
  });

  it('con el plan base entero también acierta, venga como venga', async () => {
    const it = gateway();
    mocked.getOfferings.mockResolvedValueOnce(offerings(ANNUAL_GOOGLE, MONTHLY_GOOGLE));
    await it.plans();

    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-anual:anual', expirationDate: '2027-09-02T08:30:00Z' }),
    );

    expect((await it.current()).planId()).toBe('annual');
  });
});

describe('RevenueCatSubscriptionGateway · el periodo de gracia', () => {
  it('un cobro que falló no quita el acceso: el derecho sigue activo', async () => {
    // Los 7 días de gracia de Play Console. Google reintenta y RevenueCat
    // mantiene el derecho: **la app no tiene que hacer nada** para eso, que es
    // por lo que el dominio no modela ningún estado intermedio.
    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-anual', expirationDate: '2026-08-30T08:30:00Z' }),
    );

    expect((await gateway().current()).isPremium()).toBe(true);
  });

  it('y su fecha de renovación, que ya pasó, no se enseña', async () => {
    // «Se renueva el 30 de agosto» un 2 de septiembre, en la única pantalla
    // que habla de dinero. Antes callar que mentir.
    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-anual', expirationDate: '2026-08-30T08:30:00Z' }),
    );

    expect((await gateway().current()).renewsAt()).toBeUndefined();
  });
});

describe('RevenueCatSubscriptionGateway · paquetes sin tipo', () => {
  it('un paquete CUSTOM se reconoce por su nombre, y el paywall no sale en blanco', async () => {
    // Un paquete solo tiene tipo si se creó con un identificador reservado.
    // Con `yearly` —lo que propone el asistente de RevenueCat— llega como
    // CUSTOM, y sin esto los tres precios saldrían en blanco sin un solo error.
    mocked.getOfferings.mockResolvedValueOnce(
      offerings(
        pack(PACKAGE_TYPE.CUSTOM, 'yearly', 19.99, '19,99 €'),
        pack(PACKAGE_TYPE.CUSTOM, 'monthly', 3.99, '3,99 €'),
      ),
    );

    expect((await gateway().plans()).map((plan) => plan.id())).toEqual(['annual', 'monthly']);
  });

  it('y uno que no es ni por tipo ni por nombre se sigue ignorando', async () => {
    mocked.getOfferings.mockResolvedValueOnce(
      offerings(pack(PACKAGE_TYPE.CUSTOM, 'promo_verano', 9.99, '9,99 €')),
    );

    expect(await gateway().plans()).toEqual([]);
  });
});

describe('RevenueCatSubscriptionGateway · el nombre del derecho', () => {
  it('da igual cómo se llame: lo que cuenta es que haya uno activo', async () => {
    // El fallo de la sesión 54d, pinchado. El panel lo creó como
    // `dogstrology_cósmico`, el código buscaba `cosmico`, la compra se hizo
    // **y la app siguió diciendo que nadie había pagado**.
    mocked.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: { cualquier_nombre: { productIdentifier: 'x', expirationDate: null } } },
    } as unknown as CustomerInfo);

    expect((await gateway().current()).isPremium()).toBe(true);
  });
});

describe('RevenueCatSubscriptionGateway · cancelada en la tienda', () => {
  it('sigue dando acceso hasta el final del periodo pagado', async () => {
    // Cancelar para la renovación, no el acceso. Lo que se ha pagado, pagado.
    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-anual', expirationDate: '2027-09-02T08:30:00Z', willRenew: false }),
    );

    expect((await gateway().current()).isPremium()).toBe(true);
  });

  it('pero su fecha ya no es cuándo se cobra, así que no se enseña', async () => {
    // Ese día **termina**, no se renueva. Decirlo al revés sería mentir en la
    // única pantalla que habla de dinero.
    mocked.getCustomerInfo.mockResolvedValueOnce(
      customer({ productIdentifier: 'cosmico-anual', expirationDate: '2027-09-02T08:30:00Z', willRenew: false }),
    );

    expect((await gateway().current()).renewsAt()).toBeUndefined();
  });
});
