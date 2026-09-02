import type { ConfigContext, ExpoConfig } from 'expo/config';

import defineConfig from '../../app.config';

import { colors } from '@/design/theme';

/**
 * `app.config.ts` decide **con qué identidad se instala la app**, y eso es una
 * de las pocas cosas del proyecto que no se pueden deshacer: el
 * `applicationId` de producción es la identidad en las tiendas y CLAUDE.md dice
 * que no se cambia nunca.
 *
 * Aquí se convierte esa regla en un fallo de build en vez de en disciplina.
 */

/** Lo que `app.json` aporta como base, reducido a lo que este fichero toca. */
const base = {
  name: 'Dogstrology',
  slug: 'dogstrology',
  scheme: 'dogstrology',
  ios: { bundleIdentifier: 'com.nexus.zoodiac', supportsTablet: true },
  android: { package: 'com.nexus.zoodiac', adaptiveIcon: { backgroundColor: colors.background } },
  extra: {
    contentBaseUrl: 'https://ejemplo/daily/',
    // Una clave de Google válida por defecto: así cada bloque prueba su eje y
    // no se cae por el guardarraíl del otro.
    revenueCatApiKey: 'goog_una_clave',
    eas: { projectId: 'abc' },
  },
} as unknown as ExpoConfig;

const resolve = (variant?: string): ExpoConfig => {
  if (variant === undefined) delete process.env.APP_VARIANT;
  else process.env.APP_VARIANT = variant;
  return defineConfig({ config: base } as ConfigContext);
};

describe('las tres variantes de la app', () => {
  afterEach(() => {
    delete process.env.APP_VARIANT;
    delete process.env.CONTENT_BASE_URL;
  });

  it('producción conserva el identificador de las tiendas, sin sufijo', () => {
    // BRD/CLAUDE.md: `com.nexus.zoodiac` no se puede cambiar nunca. El nombre
    // comercial sí (Dogstrology → Zoodiac); el identificador, no.
    const config = resolve('production');

    expect(config.android?.package).toBe('com.nexus.zoodiac');
    expect(config.ios?.bundleIdentifier).toBe('com.nexus.zoodiac');
    expect(config.name).toBe('Dogstrology');
  });

  it('las otras dos se instalan al lado, con su propio identificador', () => {
    expect(resolve('development').android?.package).toBe('com.nexus.zoodiac.dev');
    expect(resolve('preview').android?.package).toBe('com.nexus.zoodiac.test');
  });

  it('cada una tiene su esquema, para que un enlace no abra la que no era', () => {
    const schemes = ['development', 'preview', 'production'].map((v) => resolve(v).scheme);
    expect(new Set(schemes).size).toBe(3);
  });

  /**
   * El defecto no es el cómodo, es el seguro: lo que no puede pasar por
   * descuido es construir producción porque alguien olvidó exportar la
   * variable.
   */
  it('sin la variable, desarrollo — nunca producción', () => {
    const config = resolve(undefined);

    expect(config.extra?.variant).toBe('development');
    expect(config.android?.package).toBe('com.nexus.zoodiac.dev');
  });

  it('una variante que no existe revienta, en vez de caer al defecto', () => {
    // `APP_VARAINT` mal escrito no puede acabar en una app que parece de
    // desarrollo y lleva el identificador de producción.
    expect(() => resolve('produccion')).toThrow('no es una variante');
  });

  /**
   * Artboard 30: el mismo asterismo con las estrellas en oro, agua o fuego.
   * Tres apps con el mismo icono obligan a leer el nombre para saber cuál se
   * está abriendo; con el color se distinguen de un vistazo.
   */
  it('cada variante lleva su icono, y las cinco piezas son de la misma', () => {
    for (const variant of ['development', 'preview', 'production'] as const) {
      const config = resolve(variant);
      const adaptive = config.android?.adaptiveIcon;

      expect(config.icon).toBe(`./assets/icons/${variant}/icon.png`);
      expect(adaptive?.foregroundImage).toBe(`./assets/icons/${variant}/android-icon-foreground.png`);
      expect(adaptive?.backgroundImage).toBe(`./assets/icons/${variant}/android-icon-background.png`);
      expect(adaptive?.monochromeImage).toBe(`./assets/icons/${variant}/android-icon-monochrome.png`);
      expect(config.web?.favicon).toBe(`./assets/icons/${variant}/favicon.png`);
    }
  });

  it('el color de fondo del adaptativo no se pierde al reescribir las capas', () => {
    // Se reescriben tres claves de `adaptiveIcon` y la cuarta viene de
    // `app.json`: si el objeto se sustituyera en vez de extenderse, Android se
    // quedaría sin color detrás del asterismo y saldría un icono con halo.
    expect(resolve('preview').android?.adaptiveIcon?.backgroundColor).toBe(colors.background);
  });

  it('el CDN se puede apuntar a otro sitio sin tocar el código', () => {
    process.env.CONTENT_BASE_URL = 'https://otro/daily/';
    expect(resolve('preview').extra?.contentBaseUrl).toBe('https://otro/daily/');
    delete process.env.CONTENT_BASE_URL;

    expect(resolve('preview').extra?.contentBaseUrl).toBe('https://ejemplo/daily/');
  });
});

/**
 * La otra cosa que no se puede deshacer: **la URL del contenido viaja en el
 * binario**. Cada instalación se la lleva grabada, así que un origen
 * provisional publicado deja sin diario a quien no actualice — y `expo-updates`
 * está desactivado, así que no hay actualización por aire que lo salve.
 *
 * El requisito de salida del Bloque 4b, convertido en un fallo de build.
 */
describe('el origen del contenido', () => {
  const withOrigin = (url: string): ExpoConfig =>
    ({ ...base, extra: { ...base.extra, contentBaseUrl: url } }) as ExpoConfig;

  const resolveWith = (variant: string, url: string): ExpoConfig => {
    process.env.APP_VARIANT = variant;
    return defineConfig({ config: withOrigin(url) } as ConfigContext);
  };

  afterEach(() => {
    delete process.env.APP_VARIANT;
    delete process.env.CONTENT_BASE_URL;
    delete process.env.ALLOW_PROVISIONAL_CONTENT_URL;
  });

  it.each([
    ['GitHub Pages', 'https://davidliegar.github.io/dogstrology/daily/'],
    ['el subdominio de Cloudflare', 'https://dogstrology.davidliegar.workers.dev/daily/'],
  ])('desarrollo y pruebas sí pueden leer de %s', (_origen, url) => {
    expect(resolveWith('development', url).extra?.contentBaseUrl).toBe(url);
    expect(resolveWith('preview', url).extra?.contentBaseUrl).toBe(url);
  });

  it.each([
    ['GitHub Pages', 'https://davidliegar.github.io/dogstrology/daily/'],
    ['el subdominio de Cloudflare', 'https://dogstrology.davidliegar.workers.dev/daily/'],
  ])('producción no se puede construir contra %s', (_origen, url) => {
    expect(() => resolveWith('production', url)).toThrow(/no puede salir de/);
  });

  it('con un dominio propio, producción pasa sin decir nada', () => {
    const url = 'https://contenido.dogstrology.app/daily/';
    expect(resolveWith('production', url).extra?.contentBaseUrl).toBe(url);
  });

  it('la variable de entorno manda, y el guardarraíl también la mira', () => {
    // Sirve para apuntar una build a otro origen sin tocar `app.json`, pero no
    // para colar uno provisional en producción por la puerta de atrás.
    process.env.CONTENT_BASE_URL = 'https://otro.ejemplo/daily/';
    expect(resolveWith('production', 'https://contenido.dogstrology.app/daily/').extra?.contentBaseUrl).toBe(
      'https://otro.ejemplo/daily/',
    );

    process.env.CONTENT_BASE_URL = 'https://dogstrology.davidliegar.workers.dev/daily/';
    expect(() => resolveWith('production', 'https://contenido.dogstrology.app/daily/')).toThrow(
      /no puede salir de/,
    );
  });
});

/**
 * La puerta para el build que **no va al público**. Subir al canal interno de
 * Play es lo que desbloquea crear los productos, y ahí la URL grabada no es un
 * riesgo: al canal interno solo llegan testers, y los testers actualizan.
 */
describe('la puerta del build interno', () => {
  const PROVISIONAL = 'https://dogstrology.davidliegar.workers.dev/daily/';

  const resolveInternal = (override?: string) => {
    process.env.APP_VARIANT = 'production';
    if (override !== undefined) process.env.ALLOW_PROVISIONAL_CONTENT_URL = override;
    const config = { ...base, extra: { ...base.extra, contentBaseUrl: PROVISIONAL } } as ExpoConfig;
    return defineConfig({ config } as ConfigContext);
  };

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.APP_VARIANT;
    delete process.env.ALLOW_PROVISIONAL_CONTENT_URL;
  });

  it('escrita a propósito, deja pasar el origen provisional', () => {
    expect(resolveInternal('internal').extra?.contentBaseUrl).toBe(PROVISIONAL);
  });

  it('y lo dice en voz alta, porque ese build no se puede publicar', () => {
    resolveInternal('internal');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('no se puede publicar'));
  });

  it.each([['1'], ['true'], ['sí'], ['']])(
    'cualquier otro valor no abre nada: "%s"',
    (value) => {
      // El valor **es** la intención, como en `APP_VARIANT`. Un `1` puesto por
      // costumbre no puede colar un build publicable con la URL prestada.
      expect(() => resolveInternal(value)).toThrow(/no puede salir de/);
    },
  );

  it('sin la variable, sigue parando', () => {
    expect(() => resolveInternal()).toThrow(/no puede salir de/);
  });
});

/**
 * **Y la tercera cosa que no se puede deshacer publicando**: con qué se cobra.
 *
 * Sin clave, la app monta el doble en memoria y el paywall no cobra a nadie;
 * con una clave del Test Store, las compras van a la tienda de pruebas de
 * RevenueCat. Las dos enseñan la pantalla, dejan pulsar «Empezar» y no
 * ingresan un euro — sin error, sin aviso y sin que nadie se entere hasta
 * mirar la cuenta.
 */
describe('con qué se cobra', () => {
  const withKey = (variant: string, key?: string): ExpoConfig => {
    process.env.APP_VARIANT = variant;
    const extra = { ...base.extra, revenueCatApiKey: key };
    return defineConfig({ config: { ...base, extra } as ExpoConfig } as ConfigContext);
  };

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.APP_VARIANT;
    delete process.env.ALLOW_TEST_PURCHASES;
    delete process.env.REVENUECAT_API_KEY;
  });

  it('desarrollo y pruebas corren sin clave: es como se ha construido el paywall', () => {
    expect(withKey('development', undefined).extra?.revenueCatApiKey).toBe('');
    expect(withKey('preview', 'test_una_clave').extra?.revenueCatApiKey).toBe('test_una_clave');
  });

  it('producción sin clave no se puede construir', () => {
    expect(() => withKey('production', undefined)).toThrow(/no cobra a nadie/);
  });

  it('ni con una clave del Test Store, que cobraría de mentira', () => {
    expect(() => withKey('production', 'test_DvxmFRwqcGSOiwYxbtRJuoNraES')).toThrow(/Test Store/);
  });

  it('con la clave de Google pasa sin decir nada', () => {
    expect(withKey('production', 'goog_una_clave').extra?.revenueCatApiKey).toBe('goog_una_clave');
  });

  it('la puerta del canal interno deja pasar el Test Store, y lo dice en voz alta', () => {
    process.env.ALLOW_TEST_PURCHASES = 'internal';
    expect(withKey('production', 'test_una_clave').extra?.revenueCatApiKey).toBe('test_una_clave');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('no se puede publicar'));
  });
});
