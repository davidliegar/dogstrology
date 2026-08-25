import { NatalChartMother } from '../../testing/NatalChartMother';

describe('NatalChart (BRD §12.1, §12.3)', () => {
  it('isComplete()/hasAscendant() son true con hora y lugar', () => {
    const chart = NatalChartMother.complete();
    expect(chart.isComplete()).toBe(true);
    expect(chart.hasAscendant()).toBe(true);
    expect(chart.hasHouses()).toBe(true);
  });

  it('degradación sin hora: ni completa, ni con ascendente, ni con casas', () => {
    const chart = NatalChartMother.withoutTime();
    expect(chart.isComplete()).toBe(false);
    expect(chart.hasAscendant()).toBe(false);
    expect(chart.hasHouses()).toBe(false);
    expect(chart.houseSystem()).toBeNull();
    expect(chart.isMoonUncertain()).toBe(true);
  });

  it('los signos que la UI promete en F1 salen sin tocar la lista de planetas', () => {
    const chart = NatalChartMother.complete();
    expect(chart.sunSign()).toBe('gemini');
    expect(chart.moonSign()).toBe('leo');
    expect(chart.ascendantSign()).toBe('leo');
  });

  it('ascendantSign() es null cuando no hay ascendente, no revienta', () => {
    expect(NatalChartMother.withoutTime().ascendantSign()).toBeNull();
  });

  it('planet() devuelve un modelo con métodos, no un objeto pelado', () => {
    const moon = NatalChartMother.complete().planet('moon');
    expect(moon?.sign()).toBe('leo');
    expect(moon?.isRetrograde()).toBe(false);
    expect(moon?.isIn(1)).toBe(true);
  });

  it('planetsInHouse() filtra por casa', () => {
    const chart = NatalChartMother.complete();
    expect(chart.planetsInHouse(11).map((p) => p.id())).toEqual(['sun', 'mercury']);
  });

  it('retrogradePlanets() devuelve solo los retrógrados', () => {
    expect(NatalChartMother.complete().retrogradePlanets().map((p) => p.id())).toEqual(['mercury', 'pluto']);
  });

  it('mainAspect() es el primero de la lista, ya ordenada por exactitud', () => {
    const main = NatalChartMother.complete().mainAspect();
    expect(main?.type()).toBe('sextile');
    expect(main?.planets()).toEqual(['sun', 'moon']);
    expect(main?.contentKey()).toBe('sun-sextile-moon');
  });

  it('aspectsOf() encuentra los aspectos de un planeta esté a la izquierda o a la derecha', () => {
    const aspects = NatalChartMother.complete().aspectsOf('moon');
    expect(aspects.map((a) => a.type())).toEqual(['sextile', 'square']);
  });

  it('wasHouseSystemDegraded() delata el fallback de latitud extrema (BRD §14 R10)', () => {
    const chart = NatalChartMother.complete({ houseSystem: 'equal', houseSystemDegraded: true });
    expect(chart.houseSystem()).toBe('equal');
    expect(chart.wasHouseSystemDegraded()).toBe(true);
  });

  it('toJSON() es circular y no comparte referencias con el modelo', () => {
    const chart = NatalChartMother.complete();
    const json = chart.toJSON();
    json.planets[0].sign = 'aries';
    json.cusps![0] = 0;
    expect(chart.planet('sun')?.sign()).toBe('gemini');
    expect(chart.toJSON()).toEqual(NatalChartMother.complete().toJSON());
  });
});
