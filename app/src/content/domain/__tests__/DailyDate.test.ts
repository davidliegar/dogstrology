import { bufferDates, OFFLINE_DAYS } from '../DailyCache';
import { daysBetween, isIsoDate, isoDateOf, shiftIsoDate } from '../DailyDate';

describe('las fechas del diario', () => {
  it('lee la fecha de calendario local, no la UTC', () => {
    // 00:30 del 26 en hora local. En UTC+2 eso es todavía el 25 en UTC, y
    // `toISOString().slice(0,10)` daría el 25: quien abre la app después de
    // medianoche vería el diario de ayer con el móvil marcando el 26.
    const pastMidnight = new Date(2026, 7, 26, 0, 30);
    expect(isoDateOf(pastMidnight)).toBe('2026-08-26');
  });

  it('rellena mes y día a dos cifras', () => {
    expect(isoDateOf(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('corre la fecha por campos de calendario, no por milisegundos', () => {
    expect(shiftIsoDate('2026-08-25', -1)).toBe('2026-08-24');
    expect(shiftIsoDate('2026-08-25', 1)).toBe('2026-08-26');
    // Cambio de mes y de año, que es donde la aritmética a mano se rompe.
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoDate('2026-01-01', -1)).toBe('2025-12-31');
    // 2028 es bisiesto.
    expect(shiftIsoDate('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('la ventana de siete días acaba seis días atrás', () => {
    expect(shiftIsoDate('2026-08-25', -6)).toBe('2026-08-19');
  });

  it('reconoce lo que es una fecha de calendario y lo que no', () => {
    expect(isIsoDate('2026-08-25')).toBe(true);
    expect(isIsoDate('2026-8-25')).toBe(false);
    expect(isIsoDate('25-08-2026')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });
});

describe('los días que la despensa tiene por delante', () => {
  it('son seis, desde mañana, y con el de hoy suman los siete de F12', () => {
    const dias = bufferDates('2026-08-28');

    expect(dias).toEqual([
      '2026-08-29',
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
    ]);
    expect(dias).toHaveLength(OFFLINE_DAYS - 1);
  });

  it('no incluye el día que se pide: ese lo trae la consulta de la pantalla', () => {
    expect(bufferDates('2026-08-28')).not.toContain('2026-08-28');
  });

  it('cruza el cambio de mes sin saltarse un día', () => {
    expect(bufferDates('2026-12-30')[0]).toBe('2026-12-31');
    expect(bufferDates('2026-12-30')[1]).toBe('2027-01-01');
  });
});

describe('la distancia entre dos días', () => {
  it('cuenta días de calendario, no de 24 horas', () => {
    expect(daysBetween('2026-08-25', '2026-08-26')).toBe(1);
    expect(daysBetween('2026-08-23', '2026-08-26')).toBe(3);
    expect(daysBetween('2026-08-26', '2026-08-26')).toBe(0);
  });

  it('sobrevive al cambio de horario, que hace días de 23 y de 25 horas', () => {
    // En España el último domingo de octubre dura 25 horas. Restando
    // milisegundos, "ayer" saldría 1,04 días y redondearía bien por suerte;
    // por campos de calendario sale 1 por construcción.
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});
