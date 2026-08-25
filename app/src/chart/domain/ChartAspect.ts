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

  /** Clave con la que el pipeline de contenido indexa los fragmentos (BRD §7). */
  contentKey(): string {
    return `${this._data.a}-${this._data.type}-${this._data.b}`;
  }

  toJSON(): ChartAspectData {
    return { ...this._data };
  }
}
