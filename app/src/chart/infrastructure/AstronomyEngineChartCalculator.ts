import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import {
  calculateNatalChart,
  toSign,
  type Aspect as EngineAspect,
  type MoonPhase as EngineMoonPhase,
  type NatalChartResult,
  type Planet as EnginePlanet,
} from '@/_engine/astro';
import type { calculateInput, ChartCalculator } from '../domain/ChartCalculator';
import type { ChartAspectData } from '../domain/ChartAspect';
import {
  NatalChart,
  type AnglePositionData,
  type MoonPhaseData,
  type NatalChartData,
} from '../domain/NatalChart';
import type { PlanetPositionData } from '../domain/PlanetPosition';

/**
 * Adaptador del puerto `ChartCalculator` sobre `_engine/astro.ts`
 * (astronomy-engine, MIT). **Es el único sitio de la app donde el motor se
 * importa**: aquí se traduce su resultado al vocabulario del dominio.
 *
 * La traducción es campo a campo y no lleva ninguna aserción de tipos: cada
 * función devuelve el tipo del **dominio**, así que si el motor cambiara un
 * nombre de signo, de aspecto o de fase lunar, la asignación deja de compilar
 * aquí y en ningún otro sitio. Ese es justamente el trabajo de esta capa.
 */
const toPlanet = (p: EnginePlanet): PlanetPositionData => ({
  id: p.id,
  lon: p.lon,
  sign: p.sign,
  signIndex: p.signIndex,
  degree: p.degree,
  element: p.element,
  modality: p.modality,
  retrograde: p.retrograde,
  dailySpeed: p.dailySpeed,
  signBorder: p.signBorder,
  house: p.house,
});

const toAspect = (a: EngineAspect): ChartAspectData => ({
  a: a.a,
  b: a.b,
  type: a.aspect,
  nature: a.nature,
  orb: a.orb,
  exactness: a.exactness,
});

const toMoonPhase = (m: EngineMoonPhase): MoonPhaseData => ({
  angle: m.angle,
  fraction: m.fraction,
  name: m.name,
  illumination: m.illumination,
});

/** El motor devuelve los ángulos como longitud pelada; el dominio los quiere
 * ya situados en su signo (BRD §12.1: `{ lon, sign }`). */
const toAngle = (lon: number | null): AnglePositionData | null => {
  if (lon === null) return null;
  const { sign, degree } = toSign(lon);
  return { lon, sign, degree };
};

const toChartData = (result: NatalChartResult): NatalChartData => ({
  utcInstant: result.utcInstant,
  engineVersion: result.engineVersion,
  confidence: result.confidence,
  houseSystem: result.houseSystem,
  houseSystemDegraded: result.houseSystemDegraded,
  planets: result.planets.map(toPlanet),
  ascendant: toAngle(result.ascendant),
  midheaven: toAngle(result.midheaven),
  cusps: result.cusps,
  aspects: result.aspects.map(toAspect),
  moonPhaseAtBirth: toMoonPhase(result.birthMoonPhase),
  moonUncertain: result.moonUncertain,
});

export class AstronomyEngineChartCalculator implements ChartCalculator {
  static create(): AstronomyEngineChartCalculator {
    return new AstronomyEngineChartCalculator();
  }

  async calculate({ moment, houseSystem }: calculateInput): Promise<NatalChart> {
    try {
      const result = calculateNatalChart(
        {
          date: moment.date,
          time: moment.time,
          tzOffsetMin: moment.tzOffsetMinutes,
          lat: moment.lat,
          lon: moment.lon,
        },
        houseSystem,
      );
      return NatalChart.fromData(toChartData(result));
    } catch (error) {
      // Que un fallo de efemérides no llegue a la UI como un error de librería.
      throw DomainError.withCodes(ErrorCode.CHART_CALCULATION_FAILED).withCauses(error as Error);
    }
  }
}
