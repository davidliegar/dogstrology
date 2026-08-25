import { NatalChart, type NatalChartData } from '../domain/NatalChart';
import type { PlanetPositionData } from '../domain/PlanetPosition';

/**
 * Fábrica de cartas de prueba escritas a mano. Que el dominio se pueda probar
 * sin ejecutar efemérides es justo la señal de que ya no depende del motor: el
 * cálculo de verdad se prueba en `chart/infrastructure`.
 */
const planet = (data: Partial<PlanetPositionData> & Pick<PlanetPositionData, 'id'>): PlanetPositionData => ({
  lon: 83.5,
  sign: 'gemini',
  signIndex: 2,
  degree: 23.5,
  element: 'air',
  modality: 'mutable',
  retrograde: false,
  dailySpeed: 0.95,
  signBorder: false,
  ...data,
});

const COMPLETE: NatalChartData = {
  utcInstant: '2021-06-14T06:30:00.000Z',
  engineVersion: '1.0.0',
  confidence: 'full',
  houseSystem: 'placidus',
  houseSystemDegraded: false,
  planets: [
    planet({ id: 'sun', house: 11 }),
    planet({ id: 'moon', sign: 'leo', signIndex: 4, element: 'fire', modality: 'fixed', lon: 128.2, degree: 8.2, house: 1 }),
    planet({ id: 'mercury', retrograde: true, house: 11 }),
    planet({ id: 'pluto', sign: 'capricorn', signIndex: 9, element: 'earth', modality: 'cardinal', lon: 296.4, degree: 26.4, retrograde: true, house: 6, signBorder: true }),
  ],
  ascendant: { lon: 120.1, sign: 'leo', degree: 0.1 },
  midheaven: { lon: 30.4, sign: 'taurus', degree: 0.4 },
  cusps: [120.1, 150.1, 180.1, 210.1, 240.1, 270.1, 300.1, 330.1, 0.1, 30.4, 60.1, 90.1],
  aspects: [
    { a: 'sun', b: 'moon', type: 'sextile', nature: 'ease', orb: 0.7, exactness: 0.83 },
    { a: 'moon', b: 'pluto', type: 'square', nature: 'tension', orb: 3.1, exactness: 0.48 },
  ],
  moonPhaseAtBirth: { angle: 45.2, fraction: 0.126, name: 'waxing_crescent', illumination: 0.148 },
  moonUncertain: false,
};

export const NatalChartMother = {
  data: (overrides: Partial<NatalChartData> = {}): NatalChartData => ({ ...COMPLETE, ...overrides }),

  /** Hora y lugar conocidos: la carta con todo. */
  complete: (overrides: Partial<NatalChartData> = {}): NatalChart =>
    NatalChart.fromData(NatalChartMother.data(overrides)),

  /** Solo fecha: sin Ascendente, sin casas y con la Luna en duda (BRD §12.3). */
  withoutTime: (): NatalChart =>
    NatalChart.fromData(
      NatalChartMother.data({
        confidence: 'no_time',
        houseSystem: null,
        ascendant: null,
        midheaven: null,
        cusps: null,
        moonUncertain: true,
        planets: COMPLETE.planets.map(({ house, ...rest }) => rest),
      }),
    ),
};
