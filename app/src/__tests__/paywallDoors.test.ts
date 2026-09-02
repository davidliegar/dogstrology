import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * **Al paywall se llega por tres puertas y la oferta fría, y por nada más**
 * (nota del artboard 11, D19). Cada una nace de una falta distinta:
 *
 * - **Un fragmento del día bajo candado** — la Luna o el Ascendente, en la
 *   fila de oro que cierra lo bloqueado (artboard 36);
 * - **la carta natal**, que sin Cósmico sale velada entera (artboard 37);
 * - **la segunda mascota**, que es la caliente: el usuario quiere hacer algo
 *   concreto que el plan incluye;
 * - y **la oferta de Ajustes**, la fría: quien la toca ha ido a buscarla.
 *
 * La regla que las junta: **la puerta se pinta donde el usuario topa con el
 * límite, y si no topa, no se pinta.** Ninguna es un aviso interpuesto.
 *
 * Son cuatro puertas, no cuatro ficheros: la fila de añadir se dibuja en dos
 * sitios —la hoja del artboard 26 y la lista del 32— y es **la misma puerta**,
 * con el mismo trato en los dos: sin candado, con el nombre del plan de
 * subtítulo, y llevando al alta en vez de al 11 cuando el plan ya está activo.
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
  /** El fragmento bloqueado del día, en el día de un perro y en el de la casa. */
  'src/content/ui/UnlockRow.tsx': 'la fila de oro de lo bloqueado',
  /** La carta natal velada (artboard 37). */
  'app/pet/[id]/chart.tsx': 'el botón de la carta bloqueada',
};

/**
 * **Hoy no tiene puerta, y sigue sin tenerla** (nota del artboard 04, D19).
 *
 * Lo que pide dinero es el candado de un fragmento concreto, y ese vive en su
 * propio fichero: la pantalla que se abre cada mañana no sabe nada del
 * paywall. Es la diferencia entre una pantalla que cobra y una pantalla donde
 * hay algo que está cobrado.
 */
const NEVER = ['app/(tabs)/today.tsx'];

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
  it('solo llevan al 11 las tres puertas y la oferta fría', () => {
    expect(navigatingFiles()).toEqual(Object.keys(DOORS).sort());
  });

  it('la pantalla que se abre cada mañana no pide dinero: lo pide el candado', () => {
    expect(navigatingFiles().filter((path) => NEVER.includes(path))).toEqual([]);
  });
});
