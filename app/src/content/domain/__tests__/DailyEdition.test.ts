import { DailyEdition } from '../DailyEdition';
import { Fragment, type FragmentData } from '../Fragment';

const fragment = (key: string, overrides: Partial<FragmentData> = {}): Fragment =>
  Fragment.create({
    key,
    headline: 'La Luna entra en Escorpio a media tarde',
    body: 'Baja el volumen de todo: el cielo pide guarida, no parque.',
    advice: 'Paseo corto y manta.',
    energyScore: 3,
    color: 'water',
    ...overrides,
  });

const edition = (...keys: string[]) =>
  DailyEdition.create({ date: '2026-08-25', fragments: keys.map((key) => fragment(key)) });

describe('DailyEdition', () => {
  it('encuentra el cielo del día y cada eje por su clave', () => {
    const day = edition(
      'date=2026-08-25',
      'date=2026-08-25;axis=sun;sign=sagittarius',
      'date=2026-08-25;axis=moon;sign=cancer',
    );

    expect(day.sky()?.key()).toBe('date=2026-08-25');
    expect(day.forAxis('sun', 'sagittarius')?.key()).toBe('date=2026-08-25;axis=sun;sign=sagittarius');
    expect(day.forAxis('moon', 'cancer')?.key()).toBe('date=2026-08-25;axis=moon;sign=cancer');
  });

  it('devuelve null para lo que el filtro bloqueó, sin lanzar', () => {
    // Pasa de verdad: de los 37 de la edición del 25 de agosto se publicaron
    // 35. Una edición incompleta es lo normal, no lo excepcional.
    const day = edition('date=2026-08-25');

    expect(day.forAxis('ascendant', 'gemini')).toBeNull();
    expect(day.isEmpty()).toBe(false);
  });

  it('no encuentra un fragmento de otro día aunque se lo den', () => {
    const day = DailyEdition.create({
      date: '2026-08-25',
      fragments: [fragment('date=2026-08-24;axis=sun;sign=aries')],
    });

    expect(day.forAxis('sun', 'aries')).toBeNull();
  });

  it('lanza con una fecha que no es de calendario', () => {
    expect(() => DailyEdition.create({ date: 'hoy', fragments: [] })).toThrow('[DailyEdition]');
  });

  it('hace round-trip por JSON, que es como vive en la caché', () => {
    const day = edition('date=2026-08-25', 'date=2026-08-25;axis=sun;sign=leo');

    const restored = DailyEdition.fromJSON(day.toJSON());

    expect(restored.date()).toBe('2026-08-25');
    expect(restored.forAxis('sun', 'leo')?.headline()).toBe(day.forAxis('sun', 'leo')?.headline());
  });

  it('vacía es "descargada y sin nada que enseñar"', () => {
    expect(DailyEdition.create({ date: '2026-08-25', fragments: [] }).isEmpty()).toBe(true);
  });
});
