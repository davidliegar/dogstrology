import {
  EMPTY_TIME,
  focusField,
  isDigitAllowed,
  isTimeComplete,
  pressBackspace,
  pressDigit,
  timeEntryFrom,
  timeOf,
} from '../timeEntry';

const type = (digits: string) => digits.split('').reduce(pressDigit, EMPTY_TIME);

describe('pressDigit', () => {
  it('rellena la hora y salta solo al minuto', () => {
    const entry = type('12');
    expect(entry).toMatchObject({ hour: '12', minute: '', field: 'minute' });
    expect(timeOf(type('1230'))).toBe('12:30');
  });

  it('cierra la hora en cuanto la primera cifra no puede empezar ninguna otra', () => {
    // "3" solo puede ser las 03: no existen las 30, 31…
    const entry = pressDigit(EMPTY_TIME, '3');
    expect(entry).toMatchObject({ hour: '03', field: 'minute' });
    expect(timeOf(type('345'))).toBe('03:45');
  });

  it('deja escribir el cero inicial sin saltar', () => {
    expect(pressDigit(EMPTY_TIME, '0')).toMatchObject({ hour: '0', field: 'hour' });
    expect(timeOf(type('0915'))).toBe('09:15');
  });

  it('ignora las cifras que no llevan a ninguna hora existente', () => {
    const twenty = pressDigit(EMPTY_TIME, '2');
    expect(pressDigit(twenty, '4')).toBe(twenty);
    expect(isDigitAllowed(twenty, '4')).toBe(false);
    expect(isDigitAllowed(twenty, '3')).toBe(true);
  });

  it('ignora un minuto que empezaría por encima de 59', () => {
    const entry = type('12');
    expect(pressDigit(entry, '6')).toBe(entry);
    expect(isDigitAllowed(entry, '5')).toBe(true);
  });

  it('con el minuto completo, seguir tecleando lo rehace', () => {
    const entry = type('1230');
    expect(timeOf(pressDigit(entry, '4'))).toBeUndefined();
    expect(pressDigit(entry, '4')).toMatchObject({ hour: '12', minute: '4', field: 'minute' });
  });
});

describe('pressBackspace', () => {
  it('borra en la mitad activa', () => {
    expect(pressBackspace(type('1230'))).toMatchObject({ hour: '12', minute: '3' });
  });

  it('retrocede a la hora borrando, no en dos pulsaciones', () => {
    expect(pressBackspace(type('12'))).toMatchObject({ hour: '1', minute: '', field: 'hour' });
  });

  it('no hace nada con todo vacío', () => {
    expect(pressBackspace(EMPTY_TIME)).toMatchObject(EMPTY_TIME);
  });
});

describe('focusField', () => {
  it('tocar una mitad ya escrita la rehace con el próximo dígito', () => {
    const entry = focusField(type('1230'), 'hour');
    expect(pressDigit(entry, '9')).toMatchObject({ hour: '09', minute: '30', field: 'minute' });
  });
});

describe('timeEntryFrom', () => {
  it('parte de la hora ya guardada sin arrastrar cifras al escribir encima', () => {
    const entry = timeEntryFrom('07:45');
    expect(isTimeComplete(entry)).toBe(true);
    expect(pressDigit(entry, '1')).toMatchObject({ hour: '1', minute: '45' });
  });

  it('sin hora guardada empieza vacío', () => {
    expect(timeEntryFrom(undefined)).toMatchObject(EMPTY_TIME);
  });
});
