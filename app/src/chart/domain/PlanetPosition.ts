import { Model } from '@/_kernel/architecture';

/**
 * Vocabulario de la carta, **propiedad del dominio**. Deliberadamente
 * declarado aquí y no importado del motor: el dominio no puede depender de la
 * forma que devuelva una librería de cálculo, o cambiar de motor obligaría a
 * cambiar el dominio. El adaptador
 * (`chart/infrastructure/AstronomyEngineChartCalculator`) traduce, y un check
 * de tipos en tiempo de compilación revienta el build si el motor y el dominio
 * dejan de hablar el mismo idioma.
 *
 * Los **valores** son identificadores en inglés y en minúscula, no lo que lee
 * el usuario: viajan dentro de las claves del catálogo (`planet=sun;sign=aries`).
 * Lo que se enseña vive en `chart/ui/labels.ts`.
 */
export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

export const ELEMENTS = ['fire', 'earth', 'air', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];

export const MODALITIES = ['cardinal', 'fixed', 'mutable'] as const;
export type Modality = (typeof MODALITIES)[number];

/**
 * Elemento y modalidad de un signo, por su posición en el zodiaco: los
 * elementos se repiten cada cuatro y las modalidades cada tres. Es la misma
 * regla que aplica el motor al clasificar una posición (`_engine/astro.ts`),
 * escrita aquí para poder preguntarlo de un signo suelto — la ficha de un
 * signo (artboard 18) no tiene ninguna carta de la que sacarlo.
 */
export const elementOfSign = (sign: Sign): Element => ELEMENTS[SIGNS.indexOf(sign) % 4];
export const modalityOfSign = (sign: Sign): Modality => MODALITIES[SIGNS.indexOf(sign) % 3];

export const PLANET_IDS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
] as const;
export type PlanetId = (typeof PLANET_IDS)[number];

export interface PlanetPositionData {
  id: PlanetId;
  /** Longitud eclíptica, 0-360°. */
  lon: number;
  sign: Sign;
  signIndex: number;
  /** Grado dentro del signo, 0-30. */
  degree: number;
  element: Element;
  modality: Modality;
  retrograde: boolean;
  /** Grados/día: negativo = retrógrado. */
  dailySpeed: number;
  /** A menos de 3' de cambiar de signo: la precisión del motor no garantiza el signo. */
  signBorder: boolean;
  house?: number;
}

/** Posición de un planeta en la carta. */
export class PlanetPosition extends Model {
  constructor(private readonly _data: PlanetPositionData) {
    super();
  }

  static fromData(data: PlanetPositionData): PlanetPosition {
    return new PlanetPosition(data);
  }

  id(): PlanetId {
    return this._data.id;
  }

  sign(): Sign {
    return this._data.sign;
  }

  degree(): number {
    return this._data.degree;
  }

  longitude(): number {
    return this._data.lon;
  }

  element(): Element {
    return this._data.element;
  }

  modality(): Modality {
    return this._data.modality;
  }

  house(): number | undefined {
    return this._data.house;
  }

  isRetrograde(): boolean {
    return this._data.retrograde;
  }

  dailySpeed(): number {
    return this._data.dailySpeed;
  }

  /** Casi cambiando de signo: la UI debe enseñar el grado, no solo el signo (BRD §17). */
  isOnSignBorder(): boolean {
    return this._data.signBorder;
  }

  isIn(house: number): boolean {
    return this._data.house === house;
  }

  toJSON(): PlanetPositionData {
    return { ...this._data };
  }
}
