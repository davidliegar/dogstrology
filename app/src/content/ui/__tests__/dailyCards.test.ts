import { NatalChartMother } from '@/chart/testing/NatalChartMother';
import { DailyEdition } from '../../domain/DailyEdition';
import { Fragment } from '../../domain/Fragment';
import { Subscription } from '@/subscription/domain/Subscription';
import { dailyAxisCards, lockedAxes } from '../dailyCards';

const DATE = '2026-08-25';

/** Una edición con exactamente las claves que se le pidan. */
const editionWith = (...keys: string[]) =>
  DailyEdition.create({
    date: DATE,
    fragments: keys.map((key) =>
      Fragment.create({
        key,
        headline: 'Un día que le queda pequeño',
        body: 'Baloo es de los que empujan la puerta antes de que la abras.',
        advice: 'Paseo largo.',
        energyScore: 4,
        color: 'fire',
      }),
    ),
  });

describe('las tarjetas de eje de Hoy', () => {
  it('con carta completa, los tres ejes con su elemento y su grado', () => {
    // La carta de prueba: Sol en Géminis, Luna en Leo, Ascendente en Leo.
    const edition = editionWith(
      `date=${DATE};axis=sun;sign=gemini`,
      `date=${DATE};axis=moon;sign=leo`,
      `date=${DATE};axis=ascendant;sign=leo`,
    );

    const cards = dailyAxisCards(edition, NatalChartMother.complete());

    expect(cards.map((card) => card.axis)).toEqual(['sun', 'moon', 'ascendant']);
    expect(cards[0].element).toBe('air');
    expect(cards[1].element).toBe('fire');
    expect(cards[0].degree).toBeCloseTo(23.5, 1);
    expect(cards.every((card) => !card.approximate)).toBe(true);
  });

  it('sin hora no hay tarjeta de Ascendente, y la Luna pierde el grado', () => {
    // Las dos cosas salen del dato y no de una rama: sin Ascendente no hay
    // eje que pedir, y con la Luna en duda el grado sería una precisión falsa.
    const edition = editionWith(
      `date=${DATE};axis=sun;sign=gemini`,
      `date=${DATE};axis=moon;sign=leo`,
      `date=${DATE};axis=ascendant;sign=leo`,
    );

    const cards = dailyAxisCards(edition, NatalChartMother.withoutTime());

    expect(cards.map((card) => card.axis)).toEqual(['sun', 'moon']);
    const moon = cards[1];
    expect(moon.approximate).toBe(true);
    expect(moon.degree).toBeUndefined();
  });

  it('un eje cuyo fragmento bloqueó el filtro es una tarjeta de menos', () => {
    // Pasa de verdad: de los 37 de la edición del 25 de agosto se publicaron
    // 35. La pantalla no tiene que enterarse de nada.
    const edition = editionWith(`date=${DATE};axis=moon;sign=leo`);

    const cards = dailyAxisCards(edition, NatalChartMother.complete());

    expect(cards.map((card) => card.axis)).toEqual(['moon']);
  });

  it('sin edición o sin carta, ninguna tarjeta', () => {
    expect(dailyAxisCards(null, NatalChartMother.complete())).toEqual([]);
    expect(dailyAxisCards(editionWith(`date=${DATE};axis=sun;sign=gemini`), undefined)).toEqual([]);
  });
});

describe('lo que se bloquea sin Cósmico (D19)', () => {
  const edition = editionWith(
    `date=${DATE};axis=sun;sign=gemini`,
    `date=${DATE};axis=moon;sign=leo`,
    `date=${DATE};axis=ascendant;sign=leo`,
  );
  const cards = dailyAxisCards(edition, NatalChartMother.complete());

  it('gratis, la Luna y el Ascendente — nunca el Sol: el hábito no se cobra', () => {
    expect(lockedAxes(cards, Subscription.free())).toEqual(['moon', 'ascendant']);
  });

  it('con Cósmico no se bloquea nada, y la fila de oro no se pinta', () => {
    expect(lockedAxes(cards, Subscription.premium({ planId: 'annual' }))).toEqual([]);
  });

  it('un eje que no está no se puede bloquear: sin hora no hay Ascendente', () => {
    const sinHora = dailyAxisCards(edition, NatalChartMother.withoutTime());
    expect(lockedAxes(sinHora, Subscription.free())).toEqual(['moon']);
  });
});
