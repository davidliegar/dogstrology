import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Las tres variantes de la app, para que convivan **instaladas a la vez** en
 * el mismo móvil.
 *
 * Lo que las separa de verdad es el identificador de aplicación: el sistema
 * decide por él si dos APK son la misma app o dos distintas. Todo lo demás
 * —el nombre, el esquema— está para poder distinguirlas de un vistazo y para
 * que un enlace profundo no abra la que no era.
 *
 * **`production` conserva `com.nexus.zoodiac` intacto** (CLAUDE.md: no se
 * puede cambiar nunca, es la identidad en las tiendas). Las otras dos son ese
 * mismo id con sufijo, que es lo que hace que sean apps nuevas sin tocar la
 * que un día se publique.
 *
 * **Y cada una lleva su icono teñido** (artboard 30): el mismo asterismo con
 * las estrellas en oro, agua o fuego. Tres apps con el mismo icono se
 * distinguen leyendo el nombre; con el color se distinguen de un vistazo, que
 * es lo que hace falta cuando están las tres en la pantalla de inicio.
 */
const VARIANTS = {
  development: {
    suffix: '.dev',
    name: 'Dogstrology dev',
    scheme: 'dogstrology-dev',
  },
  preview: {
    suffix: '.test',
    name: 'Dogstrology test',
    scheme: 'dogstrology-test',
  },
  production: {
    suffix: '',
    name: 'Dogstrology',
    scheme: 'dogstrology',
  },
} as const;

type VariantName = keyof typeof VARIANTS;

/**
 * Las cinco piezas del icono de una variante. Las genera
 * `design/brand/icon.mjs`, una carpeta por variante, y **no se editan a
 * mano**. `app.json` apunta a las de producción, que es la base; aquí se
 * reescriben para las otras dos.
 */
const iconsOf = (variant: VariantName) => `./assets/icons/${variant}`;

/**
 * **Sin `APP_VARIANT`, `development`.** El defecto no es el cómodo, es el
 * seguro: lo que no puede pasar por descuido es construir producción —con el
 * identificador de verdad, el que va a las tiendas— porque a alguien se le
 * olvidó exportar una variable. Producción se pide siempre a propósito.
 *
 * Un valor que no existe **revienta** en vez de caer al defecto: `APP_VARAINT`
 * mal escrito no puede acabar en una app que parece de desarrollo y lleva el
 * id de producción.
 */
function readVariant(): VariantName {
  const value = process.env.APP_VARIANT;
  if (value === undefined || value === '') return 'development';
  if (value in VARIANTS) return value as VariantName;
  throw new Error(
    `APP_VARIANT="${value}" no es una variante. Las que hay: ${Object.keys(VARIANTS).join(', ')}.`,
  );
}

/**
 * Los orígenes que sirven el diario **mientras no hay dominio propio**. Están
 * aquí para una sola cosa: que producción no se pueda construir con uno dentro.
 *
 * No es celo. `contentBaseUrl` viaja en el binario y **cada instalación se
 * lleva la URL grabada**, así que mover el contenido después obliga a publicar
 * una versión nueva y deja sin diario a quien no actualice — y no hay
 * actualización por aire que lo salve, porque `expo-updates` está desactivado.
 * Es el requisito de salida del Bloque 4b (PLAN.md), aquí convertido en un
 * fallo de build en vez de en una nota que se olvida el día que corre prisa.
 *
 * `workers.dev` además lleva dentro el nombre de la cuenta de Cloudflare, y
 * Cloudflare la ofrece como URL de desarrollo, no de producción.
 *
 * **La lista son los orígenes que este proyecto ha usado o se ha planteado**, y
 * no un intento de nombrarlos todos: cualquier lista negra de proveedores nace
 * incompleta. Lo que la hace suficiente es que aquí solo puede entrar lo que
 * alguien escriba en `app.json`, y eso pasa por una revisión.
 */
const PROVISIONAL_ORIGINS = ['github.io', 'workers.dev', 'pages.dev', 'vercel.app'];

/**
 * La puerta para el build que **no va al público**: subir al canal interno de
 * Play es lo que desbloquea crear los productos, y ahí la URL grabada no es un
 * riesgo — al canal interno solo llegan testers, y los testers actualizan.
 *
 * Se pide **escribiendo para qué es**, no con un `1`: el valor es la intención,
 * igual que `APP_VARIANT`. Y no vive en el perfil `production` de `eas.json`
 * sino en uno aparte (`internal`), para que el perfil que un día publique de
 * verdad siga sin poder construirse con un origen prestado.
 */
const PROVISIONAL_OVERRIDE = 'ALLOW_PROVISIONAL_CONTENT_URL';

/**
 * Las claves del **Test Store** de RevenueCat, que empiezan por `test_`.
 *
 * Funcionan igual que las de verdad y por eso son peligrosas: encaminan las
 * compras a la tienda de pruebas de RevenueCat en vez de a Google Play, así
 * que un build de tienda con una de estas **enseña el paywall, deja "comprar"
 * y no cobra a nadie**. No hay error, no hay aviso y no hay ingresos.
 */
const TEST_STORE_PREFIX = 'test_';

/**
 * La misma puerta que `PROVISIONAL_OVERRIDE`, para lo mismo: el build del
 * canal interno, donde probar con el Test Store —o sin clave— es justo lo que
 * se quiere. El perfil `internal` de `eas.json` pone las dos.
 */
const TEST_PURCHASES_OVERRIDE = 'ALLOW_TEST_PURCHASES';

/**
 * La clave de RevenueCat que se hornea en el build.
 *
 * **Sin clave, la app monta el doble en memoria**: el paywall se recorre
 * entero y nadie paga nunca. Es lo correcto mientras se construye y es
 * exactamente lo que no puede salir a una tienda, así que producción lo exige
 * — y exige además que no sea del Test Store.
 *
 * Es un fallo de build y no una nota que alguien recuerde, por lo mismo que
 * el origen del contenido: lo que se rompe en silencio hay que romperlo aquí.
 */
function readRevenueCatApiKey(
  variant: VariantName,
  key: string | undefined,
  testKey: string | undefined,
): string {
  // **Fuera de producción manda la clave del Test Store**, y no es comodidad:
  // la de Play es específica de `com.nexus.zoodiac`, y las otras dos variantes
  // se instalan con sufijo. Con la de Play puesta, Google no les sirve ni un
  // producto y el paywall se cae con un `ConfigurationError` en cada recarga —
  // que es exactamente lo que pasó el 2026-09-02.
  //
  // Así cada variante usa la suya sin acordarse de nada, y `REVENUECAT_API_KEY`
  // sigue mandando por encima de las dos para el caso raro.
  const override = process.env.REVENUECAT_API_KEY;
  if (variant !== 'production') return override ?? testKey ?? key ?? '';

  const value = override ?? key ?? '';

  // La puerta del canal interno solo habla cuando hay algo que decir: con una
  // clave buena, un build interno cobra igual que uno de tienda y avisar de lo
  // contrario sería el aviso mintiendo, que es peor que no tenerlo.
  if (process.env[TEST_PURCHASES_OVERRIDE] === 'internal' && (value === '' || value.startsWith(TEST_STORE_PREFIX))) {
    console.warn(
      value === ''
        ? '⚠️  Sin clave de RevenueCat: el paywall no cobra. Este build **no se puede publicar**.'
        : '⚠️  Compras contra el Test Store de RevenueCat: este build **no se puede publicar**.',
    );
    return value;
  }

  if (value === '') {
    throw new Error(
      'Falta expo.extra.revenueCatApiKey: sin ella la app monta el doble en memoria y ' +
        'el paywall no cobra a nadie. Pon la clave pública de Android (`goog_…`), o ' +
        `exporta ${TEST_PURCHASES_OVERRIDE}=internal si esta build es para el canal interno.`,
    );
  }

  if (value.startsWith(TEST_STORE_PREFIX)) {
    throw new Error(
      'La clave de RevenueCat es del Test Store: las compras irían a la tienda de pruebas ' +
        'y nadie pagaría de verdad. Pon la clave pública de Android (`goog_…`), o ' +
        `exporta ${TEST_PURCHASES_OVERRIDE}=internal si esta build es para el canal interno.`,
    );
  }

  return value;
}

/**
 * El CDN se puede apuntar a otro sitio sin tocar el código: es lo que permitirá
 * que una build de test lea contenido de prueba el día que haya dos orígenes.
 * Hoy los tres leen el mismo, y eso está bien — el diario es contenido público
 * y no hay nada que aislar todavía.
 */
function readContentBaseUrl(variant: VariantName, base: string): string {
  const url = process.env.CONTENT_BASE_URL ?? base;
  if (variant !== 'production') return url;

  const provisional = PROVISIONAL_ORIGINS.find((origin) => url.includes(origin));
  if (provisional === undefined) return url;

  if (process.env[PROVISIONAL_OVERRIDE] === 'internal') {
    console.warn(
      `⚠️  Contenido servido desde ${provisional}: "${url}".\n` +
        'Este build vale para el canal interno de Play y **no se puede publicar**: ' +
        'la URL queda grabada en cada instalación (PLAN.md, Bloque 4b).',
    );
    return url;
  }

  throw new Error(
    `El contenido de producción no puede salir de ${provisional}: "${url}".\n` +
      'La URL se graba en cada instalación y después no se puede mover sin publicar ' +
      'otra versión (PLAN.md, Bloque 4b). Pon el dominio propio en app.json, o ' +
      'expórtalo en CONTENT_BASE_URL para esta build.',
  );
}

/**
 * `app.json` sigue siendo la base —lo que no cambia entre variantes— y aquí
 * solo se reescribe lo que sí. Así el fichero estático se sigue leyendo de un
 * vistazo y este solo tiene lo que depende del entorno.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = readVariant();
  const { suffix, name, scheme } = VARIANTS[variant];

  const bundleIdentifier = `${config.ios?.bundleIdentifier ?? ''}${suffix}`;
  const androidPackage = `${config.android?.package ?? ''}${suffix}`;
  const icons = iconsOf(variant);

  return {
    ...config,
    name,
    slug: config.slug ?? 'dogstrology',
    scheme,
    icon: `${icons}/icon.png`,
    ios: { ...config.ios, bundleIdentifier },
    android: {
      ...config.android,
      package: androidPackage,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: `${icons}/android-icon-foreground.png`,
        backgroundImage: `${icons}/android-icon-background.png`,
        monochromeImage: `${icons}/android-icon-monochrome.png`,
      },
    },
    web: { ...config.web, favicon: `${icons}/favicon.png` },
    extra: {
      ...config.extra,
      variant,
      contentBaseUrl: readContentBaseUrl(variant, config.extra?.contentBaseUrl as string),
      revenueCatApiKey: readRevenueCatApiKey(
        variant,
        config.extra?.revenueCatApiKey as string,
        config.extra?.revenueCatTestApiKey as string,
      ),
    },
  };
};
