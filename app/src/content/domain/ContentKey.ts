import { Model } from '@/_kernel/architecture';

/**
 * Las cuatro categorías del catálogo inmutable (BRD §7.3). Los ids son los
 * mismos que `pipeline/src/catalogFragments.mjs` y dan nombre al fichero que
 * las contiene: la app carga `<familia>.generated.json`.
 */
export const CONTENT_FAMILIES = ['aspects', 'planet-sign-house', 'breed-sign', 'personality'] as const;
export type ContentFamily = (typeof CONTENT_FAMILIES)[number];

/**
 * La única especie del MVP. Viaja dentro de la clave y no fuera porque las
 * claves de personalidad prometen ser de perro incluso cuando hablan de fases
 * y de casas: "un perro nacido en luna llena" no es prosa neutra
 * (ver el porqué largo en `pipeline/src/catalogFragments.mjs`).
 */
const SPECIES = 'dog';

/** El primer campo de la clave dice en qué fichero está el fragmento. */
const FAMILY_BY_FIELD: Record<string, ContentFamily> = {
  transit: 'aspects',
  planet: 'planet-sign-house',
  breed: 'breed-sign',
  species: 'personality',
};

/**
 * El vocabulario del catálogo: minúsculas, dígitos y `_` (`sun`, `aries`,
 * `full_moon`). Las razas son lo único que lleva guion (`german-shepherd`).
 */
const TOKEN = /^[a-z][a-z0-9_]*$/;
const BREED = /^[a-z][a-z0-9-]*$/;

/**
 * **Lanza siempre, también en producción**, y es deliberadamente lo contrario
 * de lo que hace el adaptador cuando no encuentra un fragmento.
 *
 * No son el mismo fallo. Que falte una clave bien formada es un hueco de
 * contenido: la pantalla se pinta sin ese párrafo y se sigue. Que llegue aquí
 * un `undefined` o un `NaN` es un bug de quien llama —una casa sin hora, un
 * planeta que no estaba en la carta— y la clave que saldría (`planet=undefined;sign=aries`)
 * está garantizado que no existe. Tragárselo convierte un bug en una tarjeta
 * vacía permanente que nadie reporta nunca; lanzarlo lo deja con el valor malo
 * delante y llega a Sentry.
 *
 * El `typeof` no sobra: en TypeScript el parámetro es `string`, pero el valor
 * viene de la base de datos y de la carta calculada, y `${undefined}` es la
 * cadena `"undefined"` — que pasaría el regex tan campante.
 */
const token = (field: string, value: string): string => {
  if (typeof value !== 'string' || !TOKEN.test(value)) {
    throw new Error(`[ContentKey] ${field} no es un identificador del catálogo: ${JSON.stringify(value)}`);
  }
  return value;
};

const breed = (value: string): string => {
  if (typeof value !== 'string' || !BREED.test(value)) {
    throw new Error(`[ContentKey] breed no es un id de raza: ${JSON.stringify(value)}`);
  }
  return value;
};

const house = (value: number): string => {
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    throw new Error(`[ContentKey] casa fuera de rango: ${JSON.stringify(value)}`);
  }
  return String(value);
};

/**
 * La clave con la que se busca un fragmento del catálogo (`planet=sun;sign=aries`).
 *
 * Existe para que la gramática se escriba **una sola vez**. La app y el
 * pipeline construyen estas claves por separado y no se comparan nunca en
 * producción: si divergen, no hay error, hay una tarjeta vacía (BRD §7.3.1).
 * Mientras la app las fabricara interpolando en el sitio donde hacen falta,
 * cada pantalla era una oportunidad de escribir `planet=sun;signo=aries` y no
 * enterarse. Aquí hay un constructor por forma de clave y un test que los
 * recorre todos contra el catálogo de verdad.
 *
 * **Los argumentos son `string` y no `PlanetId` / `Sign` a propósito**: el
 * vocabulario es del contexto que lo produce (`chart/domain` los planetas y
 * signos, `pet/ui/breeds.ts` las razas), y el contenido no tiene por qué
 * depender de los dos para poder indexar. Quien llama sí conserva sus tipos —
 * pasar un `PlanetId` a un parámetro `string` no pierde nada en el sitio de la
 * llamada.
 *
 * Y el tipo tampoco es lo que protege aquí, ni siquiera si fuera `Sign`.
 * Renombrar un signo propagaría el cambio por los tipos sin una sola queja del
 * compilador, y el desajuste con el catálogo publicado seguiría apareciendo
 * solo en ejecución: **cada clave se construye desde un valor de runtime**
 * (`chart.sunSign()`, `pet.breedId()`), así que nunca hay un literal que
 * comparar contra nada. Lo que protege son las dos cosas de abajo:
 *
 * - `src/__tests__/catalogCoverage.test.ts`, que genera las 1.552 claves y las
 *   busca en el catálogo publicado, en las dos direcciones
 * - los guardias de arriba, que son lo único que cubre los valores que ese test
 *   **no puede ver**: los que salen de la base de datos del usuario
 */
export class ContentKey extends Model {
  private constructor(
    private readonly _value: string,
    private readonly _family: ContentFamily,
  ) {
    super();
  }

  private static of(value: string): ContentKey {
    const field = value.slice(0, value.indexOf('='));
    const family = FAMILY_BY_FIELD[field];
    if (!family) throw new Error(`[ContentKey] clave sin familia conocida: "${value}"`);
    return new ContentKey(value, family);
  }

  /** Un planeta en un signo: la lectura técnica de una posición de la carta. */
  static planetInSign({ planet, sign }: { planet: string; sign: string }): ContentKey {
    return ContentKey.of(`planet=${token('planet', planet)};sign=${token('sign', sign)}`);
  }

  /** Un planeta en una casa. Solo hay casas con hora y lugar (BRD §12.3). */
  static planetInHouse({ planet, house: value }: { planet: string; house: number }): ContentKey {
    return ContentKey.of(`planet=${token('planet', planet)};house=${house(value)}`);
  }

  /**
   * Un planeta en tránsito aspectando a uno natal: el contenido del diario
   * (F4), no el de la carta. Los aspectos **dentro** de la carta natal no
   * tienen categoría en el catálogo — ver `ChartAspect`.
   */
  static transitAspect({ transit, aspect, natal }: { transit: string; aspect: string; natal: string }): ContentKey {
    return ContentKey.of(
      `transit=${token('transit', transit)};aspect=${token('aspect', aspect)};natal=${token('natal', natal)}`,
    );
  }

  /** La ficha de raza (BRD §8.1): raza × signo solar. */
  static breedInSign({ breed: id, sign }: { breed: string; sign: string }): ContentKey {
    return ContentKey.of(`breed=${breed(id)};sign=${token('sign', sign)}`);
  }

  /** El retrato de carácter. Es otra cosa que `planetInSign({ planet: 'sun' })`. */
  static personalityOfSign({ sign }: { sign: string }): ContentKey {
    return ContentKey.of(`species=${SPECIES};sign=${token('sign', sign)}`);
  }

  /** El retrato de quien nació en esa fase lunar. */
  static personalityOfMoonPhase({ moonPhase }: { moonPhase: string }): ContentKey {
    return ContentKey.of(`species=${SPECIES};moon_phase=${token('moonPhase', moonPhase)}`);
  }

  /**
   * La misma fase leída como **cielo** y no como nacimiento: qué se nota en
   * todos los perros mientras dura.
   *
   * Es la clave de arriba más un calificador, y no una clave paralela, porque
   * la dimensión es la misma —la fase— y lo que cambia es la lectura. La
   * natal es la que va sin calificar por una razón boba pero irreversible:
   * llegó antes y está publicada.
   */
  static moonPhaseToday({ moonPhase }: { moonPhase: string }): ContentKey {
    return ContentKey.of(`species=${SPECIES};moon_phase=${token('moonPhase', moonPhase)};when=today`);
  }

  /** Entrada de glosario: qué área de la vida del perro es esa casa. */
  static houseGlossary({ house: value }: { house: number }): ContentKey {
    return ContentKey.of(`species=${SPECIES};house=${house(value)}`);
  }

  value(): string {
    return this._value;
  }

  /** En qué fichero del catálogo hay que buscarla. */
  family(): ContentFamily {
    return this._family;
  }

  is(other: ContentKey): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
