import { Dogstrology } from '../index';
import { ContentKey } from '../content/domain/ContentKey';
import { DailyEdition } from '../content/domain/DailyEdition';
import { Fragment } from '../content/domain/Fragment';
import { InMemoryDailyRepository } from '../content/testing/InMemoryDailyRepository';
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

  it('el diario entra por su puerto, y su adaptador se construye tarde', async () => {
    // Sin `dailyRepository` inyectado, pedir este caso de uso leería
    // `contentBaseUrl()`. Que se pueda sustituir es lo que deja probar la
    // pantalla de Hoy sin red y sin CDN; que se construya en el getter y no en
    // el constructor es lo que evita que un build sin CDN tumbe la app entera.
    const edition = DailyEdition.create({
      date: '2026-08-25',
      fragments: [
        Fragment.create({
          key: 'date=2026-08-25',
          headline: 'La Luna entra en Escorpio a media tarde',
          body: 'Baja el volumen de todo: el cielo pide guarida, no parque.',
          advice: 'Paseo corto y manta.',
          energyScore: 3,
          color: 'water',
        }),
      ],
    });
    const app = Dogstrology.create({
      petRepository: new InMemoryPetRepository(),
      dailyRepository: InMemoryDailyRepository.with(edition),
    });

    const today = await app.GetDailyEditionUseCase.execute({ date: '2026-08-25' });

    expect(today?.sky()?.headline()).toBe('La Luna entra en Escorpio a media tarde');
    expect(await app.GetDailyEditionUseCase.execute({ date: '2026-08-24' })).toBeNull();
    expect(app.GetDailyEditionUseCase).toBe(app.GetDailyEditionUseCase);
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

  it('el cielo lunar de un instante no necesita mascota: es el cielo, no un perro', async () => {
    // Sin `chartCalculator` inyectado entra el motor de verdad. La luna llena
    // del 3 de enero de 2026 a las 10:03 UTC es un hecho comprobable fuera de
    // esta app, y es lo que hace que este test valga: no compara la app
    // consigo misma.
    const app = Dogstrology.create({ petRepository: new InMemoryPetRepository() });

    const sky = await app.GetMoonSkyUseCase.execute({ at: '2026-01-03T10:03:00.000Z' });

    expect(sky.phase.name).toBe('full_moon');
    expect(sky.phase.illumination).toBeCloseTo(1, 3);
    expect(sky.phase.angle).toBeCloseTo(180, 1);

    // Y la luna nueva que cierra ese ciclo: 18 de enero de 2026. La Luna tarda
    // ~14,8 días en ir de llena a nueva, así que cae donde tiene que caer.
    expect(sky.nextNewMoon.slice(0, 10)).toBe('2026-01-18');

    // Con luna llena en Cáncer, el siguiente signo es Leo.
    expect(sky.ingress?.to).toBe('leo');
  });

  it('un instante que no es un instante no llega al motor', async () => {
    const app = Dogstrology.create({ petRepository: new InMemoryPetRepository() });
    // Sin este corte, el motor devuelve `NaN` en los cuatro campos y la ficha
    // sale con "NaN% iluminada" sin un solo error por el camino.
    await expect(app.GetMoonSkyUseCase.execute({ at: 'mañana' })).rejects.toThrow();
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

  it('la suscripción entra por su puerto, y los cuatro casos comparten pasarela', async () => {
    // Sin inyectar nada, el puerto lo sirve el doble en memoria: RevenueCat
    // necesita cuenta, productos y build nativo (BRD §15.4). Que comprar
    // cambie lo que lee el otro caso de uso es lo que prueba que hay una sola
    // pasarela detrás, y es justo lo que no puede romperse el día que el doble
    // se sustituya por el adaptador.
    const app = domain();
    expect((await app.GetSubscriptionUseCase.execute()).isPremium()).toBe(false);

    const bought = await app.PurchasePlanUseCase.execute({ planId: 'annual' });

    expect(bought.planId()).toBe('annual');
    expect((await app.GetSubscriptionUseCase.execute()).isPremium()).toBe(true);
    expect((await app.ListPlansUseCase.execute()).map((plan) => plan.id())).toEqual([
      'annual',
      'monthly',
      'lifetime',
    ]);
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
