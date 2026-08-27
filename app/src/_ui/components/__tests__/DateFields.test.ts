import { EMPTY_DATE, isDayComplete, toIsoDate } from '../DateFields';

describe('toIsoDate', () => {
  it('compone la fecha ISO con las tres partes', () => {
    expect(toIsoDate({ day: '14', monthIndex: 11, year: '2025' })).toBe('2025-12-14');
  });

  it('rellena el día a dos cifras', () => {
    expect(toIsoDate({ day: '3', monthIndex: 0, year: '2024' })).toBe('2024-01-03');
  });

  it('devuelve null mientras falte una parte', () => {
    expect(toIsoDate(EMPTY_DATE)).toBeNull();
    expect(toIsoDate({ day: '14', monthIndex: null, year: '2025' })).toBeNull();
    expect(toIsoDate({ day: '', monthIndex: 11, year: '2025' })).toBeNull();
  });

  it('espera a que el año tenga cuatro cifras', () => {
    // Sin esto, teclear "2025" habilitaría el botón al llegar al "2".
    expect(toIsoDate({ day: '14', monthIndex: 11, year: '202' })).toBeNull();
    expect(toIsoDate({ day: '14', monthIndex: 11, year: '2025' })).toBe('2025-12-14');
  });

  it('rechaza días que no existen en ese mes', () => {
    expect(toIsoDate({ day: '31', monthIndex: 1, year: '2025' })).toBeNull(); // 31 de febrero
    expect(toIsoDate({ day: '31', monthIndex: 3, year: '2025' })).toBeNull(); // 31 de abril
    expect(toIsoDate({ day: '29', monthIndex: 1, year: '2023' })).toBeNull(); // no bisiesto
    expect(toIsoDate({ day: '29', monthIndex: 1, year: '2024' })).toBe('2024-02-29');
  });

  it('rechaza valores fuera de rango', () => {
    expect(toIsoDate({ day: '0', monthIndex: 0, year: '2025' })).toBeNull();
    expect(toIsoDate({ day: '32', monthIndex: 0, year: '2025' })).toBeNull();
    expect(toIsoDate({ day: '14', monthIndex: 0, year: '1800' })).toBeNull();
  });
});

describe('isDayComplete', () => {
  it('cierra el día con dos cifras', () => {
    expect(isDayComplete('14')).toBe(true);
    expect(isDayComplete('31')).toBe(true);
  });

  it('cierra el día con una sola cifra que no puede empezar ninguna de dos', () => {
    // No hay días 40: un 4 solo puede ser el día 4.
    expect(isDayComplete('4')).toBe(true);
    expect(isDayComplete('9')).toBe(true);
  });

  it('espera con las cifras que todavía pueden crecer', () => {
    expect(isDayComplete('')).toBe(false);
    expect(isDayComplete('1')).toBe(false); // puede ser 1, 15 o 19
    expect(isDayComplete('3')).toBe(false); // puede ser 3 o 31
    expect(isDayComplete('0')).toBe(false); // "05" se escribe con el cero delante
  });
});
