import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * **Al paywall se llega por dos puertas y por ninguna más** (nota del artboard
 * 11): la oferta de Ajustes, que es la fría, y **la fila de añadir mascota**,
 * que es la caliente. En Hoy no hay ninguna — el MVP no cobra por el día, así
 * que la pantalla que se abre cada mañana no pide nada.
 *
 * Son dos puertas, no dos ficheros: la fila de añadir se dibuja en dos sitios
 * —la hoja del artboard 26 y la lista del 32— y es **la misma puerta**, con el
 * mismo trato en los dos: sin candado, con el nombre del plan de subtítulo, y
 * llevando al alta en vez de al 11 cuando el plan ya está activo.
 *
 * Es una regla que no se rompe con un error de compilación ni con un fallo en
 * la pantalla: se rompe cuando alguien añade una puerta nueva porque le viene
 * bien, y a partir de ahí la app pide dinero en sitios donde el usuario no ha
 * topado con ningún límite. Por eso la comprobación es del código fuente, y no
 * de una pantalla concreta.
 */

const ROOT = resolve(__dirname, '../..');
const NAVIGATION = /['"]\/paywall['"]/;

const DOORS = {
  /** La fría: la oferta de Ajustes, arriba y una sola vez (artboard 10). */
  'app/(tabs)/settings.tsx': 'la oferta de Ajustes',
  /** La caliente, en la hoja del hub (artboard 26). */
  'src/pet/ui/PetHub.tsx': 'la fila de añadir de la hoja',
  /** La caliente otra vez, en la lista de mascotas (artboard 32). */
  'app/(tabs)/pet.tsx': 'la fila de añadir de la lista',
};

/**
 * Las pantallas que **no** pueden pedir dinero, pase lo que pase. Hoy es la
 * que se abre cada mañana y el MVP no cobra por el día; el día de un perro es
 * la misma lectura vista de cerca.
 */
const NEVER = ['app/(tabs)/today.tsx', 'app/pet/[id]/day.tsx'];

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

const navigatingFiles = () =>
  [...sources(join(ROOT, 'app')), ...sources(join(ROOT, 'src'))]
    .filter((path) => relative(ROOT, path) !== 'app/paywall.tsx')
    .filter((path) => NAVIGATION.test(readFileSync(path, 'utf8')))
    .map((path) => relative(ROOT, path).split('\\').join('/'))
    .sort();

describe('las puertas del paywall', () => {
  it('solo llevan al 11 la oferta de Ajustes y la fila de añadir', () => {
    expect(navigatingFiles()).toEqual(Object.keys(DOORS).sort());
  });

  it('la pantalla del día no pide dinero, ni la de un perro', () => {
    expect(navigatingFiles().filter((path) => NEVER.includes(path))).toEqual([]);
  });
});
