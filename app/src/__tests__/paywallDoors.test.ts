import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * **Al paywall se llega por dos puertas y por ninguna más** (nota del artboard
 * 11): la oferta de Ajustes, que es la fría, y la fila de añadir mascota del
 * 26, que es la caliente. En Hoy no hay ninguna — el MVP no cobra por el día,
 * así que la pantalla que se abre cada mañana no pide nada.
 *
 * Es una regla que no se rompe con un error de compilación ni con un fallo en
 * la pantalla: se rompe cuando alguien añade una tercera puerta porque le
 * viene bien, y a partir de ahí la app pide dinero en sitios donde el usuario
 * no ha topado con ningún límite. Por eso la comprobación es del código
 * fuente, y no de una pantalla concreta.
 */

const ROOT = resolve(__dirname, '../..');
const NAVIGATION = /['"]\/paywall['"]/;

const DOORS = ['app/(tabs)/settings.tsx', 'app/(tabs)/pet.tsx'];

/**
 * Todo el código de pantallas y de UI. La ruta en sí vive en `app/paywall.tsx`,
 * y los tests quedan fuera: este mismo fichero nombra la ruta.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === '__tests__' || entry.startsWith('.')) return [];
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe('las puertas del paywall', () => {
  it('solo dos ficheros llevan al 11, y son los del artboard', () => {
    const navigating = [...sources(join(ROOT, 'app')), ...sources(join(ROOT, 'src'))]
      .filter((path) => relative(ROOT, path) !== 'app/paywall.tsx')
      .filter((path) => NAVIGATION.test(readFileSync(path, 'utf8')))
      .map((path) => relative(ROOT, path).split('\\').join('/'))
      .sort();

    expect(navigating).toEqual([...DOORS].sort());
  });
});
