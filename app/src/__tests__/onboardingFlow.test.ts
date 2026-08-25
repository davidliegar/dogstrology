import { Dogstrology } from '../index';
import { AstronomyEngineChartCalculator } from '../chart/infrastructure/AstronomyEngineChartCalculator';
import { CONSTELLATIONS } from '../chart/ui/constellations.generated';
import { formatDegree } from '../chart/ui/format';
import { InMemoryPetRepository } from '../pet/testing/InMemoryPetRepository';
import { accuracyFor } from '../pet/ui/onboardingStore';

/**
 * El recorrido de F1 tal cual lo hace la app: nombre + fecha, **sin hora ni
 * lugar**, y a la revelación.
 *
 * Va contra el motor real y no contra un doble a propósito: lo que se prueba
 * aquí no es el cableado (para eso está `Dogstrology.test.ts`), sino la
 * promesa de producto — que con la fecha sola ya hay un signo que enseñar
 * (BRD §9.1, ≤60 s hasta el signo). Si eso dejara de cumplirse, F1 no tendría
 * pantalla final.
 */
describe('F1 — onboarding express, con la fecha y nada más', () => {
  const app = () =>
    Dogstrology.create({
      petRepository: new InMemoryPetRepository(),
      chartCalculator: AstronomyEngineChartCalculator.create(),
    });

  const onboard = async (name: string, date: string, dateIsApproximate = false) => {
    const domain = app();
    const pet = await domain.CreatePetUseCase.execute({
      name,
      species: 'dog',
      birth: { date, accuracy: accuracyFor(dateIsApproximate) },
    });
    return { pet, chart: await domain.CalculateNatalChartUseCase.execute({ pet }) };
  };

  it('la fecha sola basta para el signo solar', async () => {
    const { pet, chart } = await onboard('Baloo', '2025-12-14');

    expect(pet.name()).toBe('Baloo');
    expect(chart.sunSign()).toBe('sagittarius');
  });

  it('la revelación tiene todo lo que pinta: elemento, modalidad y grado', async () => {
    const { chart } = await onboard('Baloo', '2025-12-14');
    const sun = chart.planet('sun')!;

    expect(sun.element()).toBe('fire');
    expect(sun.modality()).toBe('mutable');
    expect(formatDegree(sun.degree())).toMatch(/^\d{1,2}°\d{2}′$/);
  });

  it('todo signo posible tiene su constelación: la revelación nunca se queda en blanco', async () => {
    // Un día de cada mes basta para tocar los doce signos.
    const dates = Array.from({ length: 12 }, (_, month) => `2025-${String(month + 1).padStart(2, '0')}-15`);
    const signs = new Set<string>();

    for (const date of dates) {
      const { chart } = await onboard('Baloo', date);
      const sign = chart.sunSign();
      signs.add(sign);
      expect(CONSTELLATIONS[sign]).toBeDefined();
    }

    expect(signs.size).toBe(12);
  });

  it('sin hora, la carta se declara degradada en vez de fingir precisión', async () => {
    const { chart } = await onboard('Baloo', '2025-12-14');

    // BRD §12.3: hora y lugar se piden después, y hasta entonces no hay
    // ascendente ni casas. Decirlo es lo que permite pedirlos luego con una
    // razón ("desbloquea su Ascendente") en vez de como un formulario más.
    expect(chart.confidence()).toBe('no_time');
    expect(chart.isComplete()).toBe(false);
    expect(chart.hasAscendant()).toBe(false);
    expect(chart.hasHouses()).toBe(false);
  });

  it('"no sé la fecha exacta" queda marcado en el dato, no solo en la UI', async () => {
    const { pet } = await onboard('Baloo', '2025-12-14', true);
    expect(pet.birth().accuracy()).toBe('approx');
  });
});
