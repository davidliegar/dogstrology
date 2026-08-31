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
      // El CDN se puede apuntar a otro sitio sin tocar el código: es lo que
      // permitirá que una build de test lea contenido de prueba el día que
      // haya dos orígenes. Hoy los tres leen el mismo, y eso está bien —
      // el diario es contenido público, no hay nada que aislar todavía.
      contentBaseUrl: process.env.CONTENT_BASE_URL ?? (config.extra?.contentBaseUrl as string),
    },
  };
};
