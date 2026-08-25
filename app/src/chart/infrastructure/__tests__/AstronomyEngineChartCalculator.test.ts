import { calculateNatalChart, ENGINE_VERSION } from '@/_engine/astro';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { AstronomyEngineChartCalculator } from '../AstronomyEngineChartCalculator';

// Caso contrastado con astro.com (proto/README.md): Barcelona, 2021-06-14 08:30 CEST.
const BARCELONA = { date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686 };

const calculator = AstronomyEngineChartCalculator.create();

describe('AstronomyEngineChartCalculator — traducción motor → dominio', () => {
  it('no pierde ni deforma nada del motor: cada planeta y aspecto llega igual', async () => {
    const chart = await calculator.calculate({ moment: BARCELONA, houseSystem: 'placidus' });
    const engine = calculateNatalChart(
      { date: BARCELONA.date, time: BARCELONA.time, tzOffsetMin: BARCELONA.tzOffsetMinutes, lat: BARCELONA.lat, lon: BARCELONA.lon },
      'placidus',
    );

    expect(chart.planets().map((p) => p.toJSON())).toEqual(
      engine.planets.map(({ id, lon, sign, signIndex, degree, element, modality, retrograde, dailySpeed, signBorder, house }) => ({
        id, lon, sign, signIndex, degree, element, modality, retrograde, dailySpeed, signBorder, house,
      })),
    );
    expect(chart.aspects().map((a) => a.toJSON())).toEqual(
      engine.aspects.map(({ a, b, aspect, nature, orb, exactness }) => ({ a, b, type: aspect, nature, orb, exactness })),
    );
    expect(chart.cusps()).toEqual(engine.cusps);
    expect(chart.utcInstant()).toBe(engine.utcInstant);
    expect(chart.moonPhaseAtBirth()).toEqual(engine.birthMoonPhase);
  });

  it('sitúa los ángulos en su signo, que es como los pide el dominio (BRD §12.1)', async () => {
    const chart = await calculator.calculate({ moment: BARCELONA, houseSystem: 'placidus' });
    const engine = calculateNatalChart(
      { date: BARCELONA.date, time: BARCELONA.time, tzOffsetMin: BARCELONA.tzOffsetMinutes, lat: BARCELONA.lat, lon: BARCELONA.lon },
      'placidus',
    );

    expect(chart.ascendant()?.lon).toBe(engine.ascendant);
    expect(chart.midheaven()?.lon).toBe(engine.midheaven);
    // Valores contrastados con astro.com (proto/README.md):
    // Sol 23°26' Géminis · Luna 06°18' Leo · ASC 21°18' Cáncer · MC 02°40' Aries.
    expect(chart.sunSign()).toBe('gemini');
    expect(chart.moonSign()).toBe('leo');
    expect(chart.ascendantSign()).toBe('cancer');
    expect(chart.ascendant()?.degree).toBeCloseTo(21.3, 1);
    expect(chart.midheaven()?.sign).toBe('aries');
  });

  it('sella la versión del motor en cada carta (BRD §12.1: invalida cachés)', async () => {
    const chart = await calculator.calculate({ moment: BARCELONA, houseSystem: 'whole_sign' });
    expect(chart.engineVersion()).toBe(ENGINE_VERSION);
  });

  it('degrada sin hora: sin ascendente, sin casas y sin sistema de casas', async () => {
    const chart = await calculator.calculate({ moment: { date: '2021-06-14' }, houseSystem: 'whole_sign' });
    expect(chart.confidence()).toBe('no_time');
    expect(chart.hasAscendant()).toBe(false);
    expect(chart.houseSystem()).toBeNull();
  });

  it('con hora pero sin lugar: planetas exactos, pero tampoco hay casas', async () => {
    const chart = await calculator.calculate({
      moment: { date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120 },
      houseSystem: 'placidus',
    });
    expect(chart.confidence()).toBe('no_location');
    expect(chart.hasHouses()).toBe(false);
  });

  it('en latitud extrema marca la degradación en vez de esconderla en un texto (BRD §14 R10)', async () => {
    // Tromsø, 69,65°N: Placidus es matemáticamente indefinido.
    const chart = await calculator.calculate({
      moment: { date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 69.6492, lon: 18.9553 },
      houseSystem: 'placidus',
    });
    expect(chart.houseSystem()).toBe('equal');
    expect(chart.wasHouseSystemDegraded()).toBe(true);
    expect(chart.hasHouses()).toBe(true);
  });

  it('un fallo del motor sale como DomainError, no como error de librería', async () => {
    const error = await calculator
      .calculate({ moment: { date: 'no-es-una-fecha' }, houseSystem: 'whole_sign' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).hasCode(ErrorCode.CHART_CALCULATION_FAILED)).toBe(true);
  });
});
