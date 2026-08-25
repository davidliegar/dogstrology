import { Dogstrology } from '../index';
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
      species: 'perro',
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
      species: 'perro',
      birth: { date: '2021-06-14', time: '08:30', tzOffsetMinutes: 120, lat: 41.3874, lon: 2.1686, accuracy: 'exact' },
    });

    const chart = await app.CalculateNatalChartUseCase.execute({ pet });
    expect(chart.sunSign()).toBe('Géminis');
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
