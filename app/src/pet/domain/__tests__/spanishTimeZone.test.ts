import { isEuropeanSummerTime, spanishOffsetMinutes, spanishZoneLabel } from '../spanishTimeZone';

describe('isEuropeanSummerTime', () => {
  it('el cambio de 2025 fue el 30 de marzo y el 26 de octubre', () => {
    expect(isEuropeanSummerTime('2025-03-29')).toBe(false);
    expect(isEuropeanSummerTime('2025-03-30')).toBe(true);
    expect(isEuropeanSummerTime('2025-10-25')).toBe(true);
    expect(isEuropeanSummerTime('2025-10-26')).toBe(false);
  });

  it('el de 2026 cae en fechas distintas, porque es "el último domingo", no un día fijo', () => {
    // Si esto se hubiera codificado como "31 de marzo" funcionaría en 2024 y
    // fallaría en la mitad de los años siguientes.
    expect(isEuropeanSummerTime('2026-03-28')).toBe(false);
    expect(isEuropeanSummerTime('2026-03-29')).toBe(true);
    expect(isEuropeanSummerTime('2026-10-24')).toBe(true);
    expect(isEuropeanSummerTime('2026-10-25')).toBe(false);
  });

  it('el invierno es invierno a los dos lados del año', () => {
    expect(isEuropeanSummerTime('2025-01-15')).toBe(false);
    expect(isEuropeanSummerTime('2025-12-14')).toBe(false);
  });
});

describe('spanishOffsetMinutes', () => {
  it('península: +1 en invierno, +2 en verano', () => {
    // El caso del canvas: el 14 de diciembre Barcelona estaba en horario de
    // invierno, mande lo que mande el reloj del móvil.
    expect(spanishOffsetMinutes('2025-12-14', 'mainland')).toBe(60);
    expect(spanishOffsetMinutes('2025-07-14', 'mainland')).toBe(120);
  });

  it('Canarias: una hora menos que la península todo el año', () => {
    expect(spanishOffsetMinutes('2025-12-14', 'canary')).toBe(0);
    expect(spanishOffsetMinutes('2025-07-14', 'canary')).toBe(60);
  });
});

describe('spanishZoneLabel', () => {
  it('nombra el huso como lo enseña el editor de hora', () => {
    expect(spanishZoneLabel('2025-12-14', 'mainland')).toBe('CET · UTC+1');
    expect(spanishZoneLabel('2025-07-14', 'mainland')).toBe('CEST · UTC+2');
    expect(spanishZoneLabel('2025-12-14', 'canary')).toBe('WET · UTC±0');
    expect(spanishZoneLabel('2025-07-14', 'canary')).toBe('WEST · UTC+1');
  });
});
