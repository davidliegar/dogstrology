import { Model } from '@/_kernel/architecture';
import type { PlanetId } from './PlanetPosition';

export const ASPECT_TYPES = ['conjunction', 'sextile', 'square', 'trine', 'opposition'] as const;
export type AspectType = (typeof ASPECT_TYPES)[number];

export const ASPECT_NATURES = ['fusion', 'ease', 'tension', 'harmony', 'polarity'] as const;
export type AspectNature = (typeof ASPECT_NATURES)[number];

export interface ChartAspectData {
  a: PlanetId;
  b: PlanetId;
  type: AspectType;
  nature: AspectNature;
  /** Desviación respecto al ángulo exacto, en grados. */
  orb: number;
  /** 1 = exacto, 0 = en el límite del orbe. */
  exactness: number;
}

/** Aspecto entre dos planetas de la misma carta (BRD §6.5). */
export class ChartAspect extends Model {
  constructor(private readonly _data: ChartAspectData) {
    super();
  }

  static fromData(data: ChartAspectData): ChartAspect {
    return new ChartAspect(data);
  }

  type(): AspectType {
    return this._data.type;
  }

  nature(): AspectNature {
    return this._data.nature;
  }

  planets(): [PlanetId, PlanetId] {
    return [this._data.a, this._data.b];
  }

  orb(): number {
    return this._data.orb;
  }

  exactness(): number {
    return this._data.exactness;
  }

  involves(planet: PlanetId): boolean {
    return this._data.a === planet || this._data.b === planet;
  }

  /**
   * **No hay clave de contenido para un aspecto natal.** Aquí vivía un
   * `contentKey()` que devolvía `sun-sextile-moon`, y esa clave no existe en
   * ningún sitio: el catálogo indexa aspectos como
   * `transit=sun;aspect=sextile;natal=moon` y su prosa está escrita en
   * tránsito ("el Sol pasa por encima de su Sol natal"), que es el contenido
   * del diario, no el de la carta. Reutilizarla habría dado un texto que habla
   * de hoy en una pantalla que habla de siempre.
   *
   * Los aspectos **dentro** de la carta natal no son ninguna de las cuatro
   * categorías MVP de BRD §7.3: cuando tengan contenido propio, se añade la
   * categoría al pipeline y el constructor a `content/domain/ContentKey`, que
   * es donde vive ya la gramática de todas las demás.
   */

  toJSON(): ChartAspectData {
    return { ...this._data };
  }
}
