import { DailyKey } from '../DailyKey';

describe('DailyKey', () => {
  it('escribe las dos formas que publica el pipeline', () => {
    expect(DailyKey.sky({ date: '2026-08-25' }).value()).toBe('date=2026-08-25');
    expect(
      DailyKey.ofAxis({ date: '2026-08-25', axis: 'sun', sign: 'sagittarius' }).value(),
    ).toBe('date=2026-08-25;axis=sun;sign=sagittarius');
  });

  it('lanza con una fecha que no es de calendario', () => {
    expect(() => DailyKey.sky({ date: 'hoy' })).toThrow('[DailyKey]');
    expect(() => DailyKey.sky({ date: '25/08/2026' })).toThrow('[DailyKey]');
  });

  it('lanza con un signo que no es del vocabulario', () => {
    // El caso real: un valor que llega `undefined` desde la carta. La clave
    // que saldría (`sign=undefined`) está garantizado que no existe, y sin
    // este guardia sería una tarjeta vacía para siempre en vez de un error.
    expect(() =>
      DailyKey.ofAxis({ date: '2026-08-25', axis: 'moon', sign: undefined as unknown as string }),
    ).toThrow('[DailyKey]');
    expect(() => DailyKey.ofAxis({ date: '2026-08-25', axis: 'moon', sign: 'Cáncer' })).toThrow('[DailyKey]');
  });
});
