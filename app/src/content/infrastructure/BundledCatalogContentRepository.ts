import type { ContentFamily, ContentKey } from '../domain/ContentKey';
import type {
  ContentRepository,
  getFragmentInput,
  getFragmentsInput,
} from '../domain/ContentRepository';
import { Fragment, type FragmentColor } from '../domain/Fragment';

/** Un fragmento tal y como lo empaqueta `scripts/generateCatalog.mjs`. */
type PackedFragment = [
  headline: string,
  body: string,
  advice: string,
  energyScore: number,
  color: FragmentColor,
];

type PackedCatalog = Record<string, PackedFragment | undefined>;

const HEADLINE = 0;
const BODY = 1;
const ADVICE = 2;
const ENERGY = 3;
const COLOR = 4;

/**
 * `require()` y no `import`, y dentro de una función y no arriba: es lo que
 * hace que abrir la app no pague por los 740 KB del catálogo entero. Metro
 * resuelve la ruta en build —por eso son literales y no una plantilla— pero
 * solo evalúa el módulo la primera vez que se llama.
 *
 * Ver la carta natal toca `planet-sign-house` (110 KB) y para de contar. Los
 * 371 KB de razas se cargan cuando alguien abre la ficha de su raza, y los
 * 236 KB de tránsitos cuando llegue el diario.
 */
const LOADERS: Record<ContentFamily, () => PackedCatalog> = {
  'aspects': () => require('./catalog/aspects.generated.json'),
  'planet-sign-house': () => require('./catalog/planet-sign-house.generated.json'),
  'breed-sign': () => require('./catalog/breed-sign.generated.json'),
  'personality': () => require('./catalog/personality.generated.json'),
};

/**
 * El catálogo inmutable, leído del propio binario (BRD §7.4, capa 1).
 *
 * Sin red y sin base de datos: 1.552 fragmentos que viajan dentro de la app y
 * funcionan en el primer arranque, en avión y sin cuenta. Por eso el adaptador
 * no tiene estado que guardar — su única memoria es qué ficheros ya se han
 * cargado.
 *
 * **Cuando la clave no está**, en desarrollo lanza y en producción devuelve
 * `null`. Es deliberadamente asimétrico. Una clave que no existe solo puede
 * venir de que la app y el pipeline hayan dejado de escribir la misma
 * gramática, y ese fallo no tiene síntoma: la tarjeta sale vacía y la sesión
 * sigue (BRD §7.3.1). En el emulador tiene que doler; en el móvil de un
 * usuario, tirarle la pantalla por un fragmento que falta es peor que enseñar
 * la carta sin ese párrafo.
 */
export class BundledCatalogContentRepository implements ContentRepository {
  private readonly loaded = new Map<ContentFamily, PackedCatalog>();

  static create(): BundledCatalogContentRepository {
    return new BundledCatalogContentRepository();
  }

  async get({ key }: getFragmentInput): Promise<Fragment | null> {
    return this.find(key);
  }

  async getMany({ keys }: getFragmentsInput): Promise<Fragment[]> {
    const found: Fragment[] = [];
    for (const key of keys) {
      const fragment = this.find(key);
      if (fragment) found.push(fragment);
    }
    return found;
  }

  private find(key: ContentKey): Fragment | null {
    const packed = this.catalog(key.family())[key.value()];
    if (!packed) {
      if (__DEV__) throw new Error(`[catálogo] no existe el fragmento "${key.value()}"`);
      return null;
    }
    return Fragment.create({
      key: key.value(),
      headline: packed[HEADLINE],
      body: packed[BODY],
      advice: packed[ADVICE],
      energyScore: packed[ENERGY],
      color: packed[COLOR],
    });
  }

  private catalog(family: ContentFamily): PackedCatalog {
    const already = this.loaded.get(family);
    if (already) return already;
    const catalog = LOADERS[family]();
    this.loaded.set(family, catalog);
    return catalog;
  }
}
