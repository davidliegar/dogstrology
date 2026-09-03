import { ANALYTICS_EVENTS, PAYWALL_DOORS } from '@/analytics/domain/AnalyticsEvent';
import { InMemoryAnalytics } from '@/analytics/testing/InMemoryAnalytics';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === '__tests__' || entry.startsWith('.')) return [];
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

/**
 * **El vocabulario de eventos es cerrado, y esto es lo que lo mantiene así.**
 *
 * Una analítica se estropea sola: alguien mide `paywall_view` donde ya había
 * `paywall_viewed`, y a los tres meses hay dos gráficas que dicen cosas
 * distintas y ninguna sirve. Aquí un evento que no esté en la lista no
 * compila, y uno que sobre se ve en este test.
 */
describe('lo que la app mide', () => {
  it('cada puerta del paywall tiene nombre, y son las que hay', () => {
    // Si aparece una puerta nueva sin nombrarla aquí, la conversión de esa
    // pantalla se mide como «sin puerta» y no se sabe de dónde vino.
    expect([...PAYWALL_DOORS]).toEqual(['settings', 'daily', 'chart', 'houses', 'facets', 'add_pet']);
  });

  it('todas las puertas del código llevan su etiqueta puesta', () => {
    const navigations = [...sources(join(ROOT, 'app')), ...sources(join(ROOT, 'src'))]
      .filter((path) => relative(ROOT, path) !== 'app/paywall.tsx')
      .flatMap((path) => readFileSync(path, 'utf8').match(/pathname: '\/paywall'[^}]*}/g) ?? []);

    expect(navigations.length).toBeGreaterThan(0);
    // Ninguna navegación al paywall sin decir por dónde se entró.
    expect(navigations.filter((each) => !each.includes('door:'))).toEqual([]);
  });

  it('el doble guarda lo medido, con sus propiedades', () => {
    const analytics = InMemoryAnalytics.create();
    analytics.track('paywall_viewed', { door: 'daily' });
    analytics.track('purchase_completed', { plan: 'annual' });

    expect(analytics.events()).toEqual([
      { event: 'paywall_viewed', properties: { door: 'daily' } },
      { event: 'purchase_completed', properties: { plan: 'annual' } },
    ]);
  });

  it('no hay eventos repetidos ni con mayúsculas: son identificadores', () => {
    expect(new Set(ANALYTICS_EVENTS).size).toBe(ANALYTICS_EVENTS.length);
    expect(ANALYTICS_EVENTS.every((event) => /^[a-z][a-z0-9_]*$/.test(event))).toBe(true);
  });
});
