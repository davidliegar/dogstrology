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
 */
const PROVISIONAL_ORIGINS = ['github.io', 'workers.dev'];

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
    },
  };
};
