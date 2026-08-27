import { Model } from '@/_kernel/architecture';
import { ChartAspect, type ChartAspectData } from './ChartAspect';
import {
  PlanetPosition,
  type Element,
  type PlanetId,
  type PlanetPositionData,
  type Sign,
} from './PlanetPosition';

/** BRD §12.3 (D7): signos enteros por defecto, Placidus en modo avanzado. */
export const HOUSE_SYSTEMS = ['whole_sign', 'placidus', 'equal'] as const;
export type HouseSystem = (typeof HOUSE_SYSTEMS)[number];

/** Grados de degradación por datos de nacimiento incompletos (BRD §12.3). */
export const CHART_CONFIDENCES = ['full', 'no_location', 'no_time'] as const;
export type ChartConfidence = (typeof CHART_CONFIDENCES)[number];

export const MOON_PHASE_NAMES = [
  'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent',
] as const;
export type MoonPhaseName = (typeof MOON_PHASE_NAMES)[number];

export interface MoonPhaseData {
  /** Ángulo Sol-Luna: 0 = nueva, 180 = llena. */
  angle: number;
  /** 0-1 dentro del ciclo lunar. */
  fraction: number;
  name: MoonPhaseName;
  /** Fracción iluminada del disco, 0-1. */
  illumination: number;
}

/** Ascendente y Medio Cielo (BRD §12.1: `{ lon, sign }`). */
export interface AnglePositionData {
  lon: number;
  sign: Sign;
  /** Grado dentro del signo, 0-30. */
  degree: number;
}

export interface NatalChartData {
  /** Instante UTC del nacimiento, ya resuelto desde hora local + offset. */
  utcInstant: string;
  /** Versión del algoritmo que la calculó (BRD §12.1): invalida cachés. */
  engineVersion: string;
  confidence: ChartConfidence;
  /** `null` cuando no hay casas: sin hora o sin lugar no hay dónde ponerlas. */
  houseSystem: HouseSystem | null;
  houseSystemDegraded: boolean;
  planets: PlanetPositionData[];
  ascendant: AnglePositionData | null;
  midheaven: AnglePositionData | null;
  cusps: number[] | null;
  aspects: ChartAspectData[];
  moonPhaseAtBirth: MoonPhaseData;
  /** Sin hora, la Luna avanza ~13°/día: su signo puede no ser fiable. */
  moonUncertain: boolean;
}

/**
 * Carta natal (BRD §12.1). Es un **derivado recalculable**, no un dato del
 * usuario: no se sincroniza (BRD §12.2.6) y se puede tirar y recalcular
 * siempre que `engineVersion` cambie.
 *
 * El modelo es dueño de su vocabulario: no expone nada de la librería que hizo
 * el cálculo. Quien lo produce es el puerto `ChartCalculator`, y quien lo
 * implementa hoy vive en `chart/infrastructure/`.
 */
export class NatalChart extends Model {
  private constructor(private readonly _data: NatalChartData) {
    super();
  }

  static fromData(data: NatalChartData): NatalChart {
    return new NatalChart(data);
  }

  static fromJSON(json: NatalChartData): NatalChart {
    return new NatalChart(json);
  }

  utcInstant(): string {
    return this._data.utcInstant;
  }

  engineVersion(): string {
    return this._data.engineVersion;
  }

  confidence(): ChartConfidence {
    return this._data.confidence;
  }

  /** BRD §12.3: solo hay carta completa con hora y lugar de nacimiento. */
  isComplete(): boolean {
    return this._data.confidence === 'full';
  }

  houseSystem(): HouseSystem | null {
    return this._data.houseSystem;
  }

  /** Se pidió Placidus y la latitud lo hacía indefinido (BRD §14 R10): se
   * calculó con casas iguales. La UI debería decirlo, no callarlo. */
  wasHouseSystemDegraded(): boolean {
    return this._data.houseSystemDegraded;
  }

  hasHouses(): boolean {
    return this._data.cusps !== null;
  }

  cusps(): number[] | null {
    return this._data.cusps;
  }

  planets(): PlanetPosition[] {
    return this._data.planets.map(PlanetPosition.fromData);
  }

  planet(id: PlanetId): PlanetPosition | undefined {
    const found = this._data.planets.find((p) => p.id === id);
    return found ? PlanetPosition.fromData(found) : undefined;
  }

  planetsInHouse(house: number): PlanetPosition[] {
    return this.planets().filter((p) => p.isIn(house));
  }

  retrogradePlanets(): PlanetPosition[] {
    return this.planets().filter((p) => p.isRetrograde());
  }

  /** El signo solar: lo único que se puede prometer con solo la fecha, y lo
   * que F1 tiene que enseñar en menos de 60 s (BRD §9.1). */
  sunSign(): Sign {
    return this.signOf('sun') as Sign;
  }

  moonSign(): Sign {
    return this.signOf('moon') as Sign;
  }

  signOf(planet: PlanetId): Sign | undefined {
    return this._data.planets.find((p) => p.id === planet)?.sign;
  }

  ascendant(): AnglePositionData | null {
    return this._data.ascendant;
  }

  ascendantSign(): Sign | null {
    return this._data.ascendant?.sign ?? null;
  }

  hasAscendant(): boolean {
    return this._data.ascendant !== null;
  }

  midheaven(): AnglePositionData | null {
    return this._data.midheaven;
  }

  aspects(): ChartAspect[] {
    return this._data.aspects.map(ChartAspect.fromData);
  }

  /** Los aspectos vienen ordenados por exactitud descendente. */
  mainAspect(): ChartAspect | undefined {
    const [first] = this._data.aspects;
    return first ? ChartAspect.fromData(first) : undefined;
  }

  aspectsOf(planet: PlanetId): ChartAspect[] {
    return this.aspects().filter((a) => a.involves(planet));
  }

  /**
   * Cuántos planetas caen en cada elemento. Es el único gráfico de la pantalla
   * de personalidad (artboard 6) y por eso vive aquí y no en la UI: es una
   * lectura de la carta, no una forma de pintarla.
   *
   * Los diez cuerpos y nada más — sin Ascendente. El Ascendente no es un
   * planeta y contarlo cambiaría el total según haya hora o no, que es
   * exactamente lo que un balance no puede hacer.
   */
  elementBalance(): Record<Element, number> {
    const balance: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    for (const planet of this.planets()) balance[planet.element()] += 1;
    return balance;
  }

  moonPhaseAtBirth(): MoonPhaseData {
    return { ...this._data.moonPhaseAtBirth };
  }

  /** Sin hora de nacimiento y con la Luna cerca de cambiar de signo: hay que
   * pedir la hora antes de afirmar nada sobre la Luna (BRD §12.3). */
  isMoonUncertain(): boolean {
    return this._data.moonUncertain;
  }

  toJSON(): NatalChartData {
    return {
      ...this._data,
      planets: this._data.planets.map((p) => ({ ...p })),
      aspects: this._data.aspects.map((a) => ({ ...a })),
      cusps: this._data.cusps ? [...this._data.cusps] : null,
      ascendant: this._data.ascendant ? { ...this._data.ascendant } : null,
      midheaven: this._data.midheaven ? { ...this._data.midheaven } : null,
      moonPhaseAtBirth: { ...this._data.moonPhaseAtBirth },
    };
  }
}
