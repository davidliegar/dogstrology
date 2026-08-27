import { Dogstrology } from '../index';
import { ContentKey } from '../content/domain/ContentKey';
import { NatalChartMother } from '../chart/testing/NatalChartMother';
import { StubChartCalculator } from '../chart/testing/StubChartCalculator';
import { InMemoryPetRepository } from '../pet/testing/InMemoryPetRepository';

const domain = () =>
  Dogstrology.create({
    petRepository: new InMemoryPetRepository(),
    chartCalculator: StubChartCalculator.withChart(NatalChartMother.data()),
  });

describe('Dogstrology — composition root', () => {
  it('entrega casos de uso ya cableados: crear y listar comparten repositorio', async () => {
    const app = domain();

    await app.CreatePetUseCase.execute({
      name: 'Baloo',
      species: 'dog',
      birth: { date: '2021-06-14', accuracy: 'exact' },
    });

    const pets = await app.ListPetsUseCase.execute();
    expect(pets.map((p) => p.name())).toEqual(['Baloo']);
  });

  it('memoriza cada caso de uso: pedirlo dos veces no construye dos', () => {
    const app = domain();
    expect(app.ListPetsUseCase).toBe(app.ListPetsUseCase);
    expect(app.CalculateNatalChartUseCase).toBe(app.CalculateNatalChartUseCase);
  });

  it('el ciclo completo pasa por los puertos: crear mascota → calcular su carta', async () => {
    const app = domain();
    const pet = await app.CreatePetUseCase.execute({
      name: 'Baloo',
      species: 'dog',
      birth: { date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686, accuracy: 'exact' },
    });

    const chart = await app.CalculateNatalChartUseCase.execute({ pet });
    expect(chart.sunSign()).toBe('gemini');
  });

  it('el ciclo se cierra en el contenido: carta calculada → fragmento del catálogo', async () => {
    // Sin `contentRepository` inyectado, la fachada monta el adaptador real y
    // lee del catálogo que va en el binario. Es el recorrido entero de F3:
    // mascota → carta → el texto que se enseña.
    const app = domain();
    const pet = await app.CreatePetUseCase.execute({
      name: 'Baloo',
      species: 'dog',
      birth: { date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686, accuracy: 'exact' },
    });

    const chart = await app.CalculateNatalChartUseCase.execute({ pet });
    const fragment = await app.GetFragmentUseCase.execute({
      key: ContentKey.planetInSign({ planet: 'sun', sign: chart.sunSign() }),
    });

    expect(fragment?.key()).toBe('planet=sun;sign=gemini');
    expect(fragment?.body().length).toBeGreaterThan(0);
  });

  it('crear la fachada no toca la base de datos: nadie llama al proveedor hasta la primera consulta', () => {
    let opened = 0;
    Dogstrology.create({
      db: async () => {
        opened += 1;
        throw new Error('no debería abrirse');
      },
    });
    expect(opened).toBe(0);
  });
});
