import type { ConfigContext, ExpoConfig } from 'expo/config';

import defineConfig from '../../app.config';

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
  android: { package: 'com.nexus.zoodiac' },
  extra: { contentBaseUrl: 'https://ejemplo/daily/', eas: { projectId: 'abc' } },
} as unknown as ExpoConfig;

const resolve = (variant?: string): ExpoConfig => {
  if (variant === undefined) delete process.env.APP_VARIANT;
  else process.env.APP_VARIANT = variant;
  return defineConfig({ config: base } as ConfigContext);
};

describe('las tres variantes de la app', () => {
  afterEach(() => {
    delete process.env.APP_VARIANT;
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

  it('el CDN se puede apuntar a otro sitio sin tocar el código', () => {
    process.env.CONTENT_BASE_URL = 'https://otro/daily/';
    expect(resolve('preview').extra?.contentBaseUrl).toBe('https://otro/daily/');
    delete process.env.CONTENT_BASE_URL;

    expect(resolve('preview').extra?.contentBaseUrl).toBe('https://ejemplo/daily/');
  });
});
