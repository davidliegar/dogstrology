import { Birth } from '@/pet/domain/Birth';
import { Pet } from '@/pet/domain/Pet';
import { AstronomyEngineChartCalculator } from '../../infrastructure/AstronomyEngineChartCalculator';
import { NatalChartMother } from '../../testing/NatalChartMother';
import { StubChartCalculator } from '../../testing/StubChartCalculator';
import CalculateNatalChartUseCase from '../CalculateNatalChartUseCase';

const petWith = (birth: Birth) =>
  Pet.createNew({ id: '01996a3e-7e2a-7000-8000-000000000000', name: 'Baloo', species: 'perro', birth });

describe('CalculateNatalChartUseCase', () => {
  it('traduce el nacimiento de la mascota al vocabulario del contexto chart', async () => {
    const calculator = StubChartCalculator.withChart(NatalChartMother.data());
    const birth = Birth.create({
      date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686, accuracy: 'exact',
    });

    await CalculateNatalChartUseCase.create({ calculator }).execute({ pet: petWith(birth) });

    expect(calculator.calls[0].moment).toEqual({
      date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686,
    });
  });

  it('el sistema de casas por defecto es signos enteros (BRD §12.3, D7)', async () => {
    const calculator = StubChartCalculator.withChart(NatalChartMother.data());
    const birth = Birth.create({ date: '2021-06-14', accuracy: 'gotcha_day' });

    await CalculateNatalChartUseCase.create({ calculator }).execute({ pet: petWith(birth) });

    expect(calculator.calls[0].houseSystem).toBe('whole_sign');
  });

  it('respeta el sistema de casas pedido (modo avanzado)', async () => {
    const calculator = StubChartCalculator.withChart(NatalChartMother.data());
    const birth = Birth.create({ date: '2021-06-14', accuracy: 'gotcha_day' });

    await CalculateNatalChartUseCase.create({ calculator }).execute({ pet: petWith(birth), houseSystem: 'placidus' });

    expect(calculator.calls[0].houseSystem).toBe('placidus');
  });

  it('no inventa datos que la mascota no tiene: sin hora, el momento va sin hora', async () => {
    const calculator = StubChartCalculator.withChart(NatalChartMother.data());
    const birth = Birth.create({ date: '2024-01-01', accuracy: 'gotcha_day' });

    await CalculateNatalChartUseCase.create({ calculator }).execute({ pet: petWith(birth) });

    expect(calculator.calls[0].moment).toEqual({
      date: '2024-01-01', time: undefined, tzOffsetMinutes: undefined, lat: undefined, lon: undefined,
    });
  });

  it('integración con el motor real: el caso contrastado con astro.com sigue dando lo mismo', async () => {
    const useCase = CalculateNatalChartUseCase.create({ calculator: AstronomyEngineChartCalculator.create() });
    const birth = Birth.create({
      date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686, accuracy: 'exact',
    });

    const chart = await useCase.execute({ pet: petWith(birth), houseSystem: 'placidus' });

    // Sol 23°26' Géminis · ASC 21°18' Cáncer (proto/README.md, contrastado con astro.com).
    expect(chart.sunSign()).toBe('Géminis');
    expect(chart.ascendantSign()).toBe('Cáncer');
    expect(chart.isComplete()).toBe(true);
  });
});
