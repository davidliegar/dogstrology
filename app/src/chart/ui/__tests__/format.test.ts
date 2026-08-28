import {
  confidenceSegments,
  formatDailySpeed,
  formatDegree,
  formatIngress,
  formatPosition,
  formatSkyMoment,
  formatWeekdayDate,
} from '../format';

describe('formatDegree', () => {
  it('parte el decimal en grados y minutos de arco', () => {
    expect(formatDegree(22.2333)).toBe('22°13′');
    expect(formatDegree(0)).toBe('0°00′');
  });

  it('rellena los minutos a dos cifras', () => {
    // Sin el padding saldría `5°7′`, que en una columna de efemérides baila.
    expect(formatDegree(5.125)).toBe('5°07′');
  });

  it('trunca los minutos en vez de redondear', () => {
    // Redondeando, esto sería 30°00′ — un grado que no existe dentro de un
    // signo, y que leído deprisa parece el signo siguiente.
    expect(formatDegree(29.999)).toBe('29°59′');
  });
});

describe('confidenceSegments', () => {
  it('enciende los tres solo con la carta completa', () => {
    expect(confidenceSegments('full')).toBe(3);
  });

  it('enciende dos cuando falta la hora — el estado del artboard 9', () => {
    // Fecha y lugar presentes, hora no: dos de tres.
    expect(confidenceSegments('no_time')).toBe(2);
  });

  it('enciende dos cuando falta el lugar', () => {
    expect(confidenceSegments('no_location')).toBe(2);
  });
});

describe('formatDailySpeed', () => {
  it('nombra el movimiento y da la velocidad con coma decimal', () => {
    expect(formatDailySpeed(0.5234)).toBe('directo · 0,52°/día');
  });

  it('un valor negativo es retrógrado, y el signo no se repite en el número', () => {
    expect(formatDailySpeed(-0.3128)).toBe('retrógrado · 0,31°/día');
  });

  it('un planeta parado no es retrógrado', () => {
    expect(formatDailySpeed(0)).toBe('directo · 0,00°/día');
  });
});

describe('formatPosition', () => {
  it('escribe grado, signo y casa como la lámina', () => {
    expect(formatPosition({ degree: 22.24, sign: 'Sagitario', house: 12 })).toBe('22°14′ Sagitario · XII');
  });

  it('sin casa no deja ni la coletilla ni el separador', () => {
    expect(formatPosition({ degree: 2, sign: 'Capricornio' })).toBe('2°00′ Capricornio');
  });
});

describe('formatWeekdayDate', () => {
  it('escribe la fecha del pie del artboard 23', () => {
    expect(formatWeekdayDate('2025-08-25')).toBe('Lunes 25 de agosto');
  });

  it('no lleva año: donde se usa, la fecha es la de hoy', () => {
    expect(formatWeekdayDate('2026-01-01')).toBe('Jueves 1 de enero');
  });

  it('el día de la semana sale en UTC, así que no se adelanta ni se atrasa', () => {
    // Con los métodos locales, medianoche UTC es el día anterior en cuanto el
    // huso va por detrás de Greenwich — y el domingo saldría sábado.
    expect(formatWeekdayDate('2026-08-23')).toBe('Domingo 23 de agosto');
  });
});

describe('formatSkyMoment', () => {
  // Las fechas se construyen en hora **local** y se mandan en ISO: así el test
  // vale en cualquier huso, que es lo que hace la app de verdad.
  const local = (y: number, m: number, d: number, h: number, min: number) =>
    new Date(y, m - 1, d, h, min).toISOString();

  const NOW = new Date(2026, 7, 27, 8, 30);

  it('lo de hoy se dice "hoy", con la hora local', () => {
    expect(formatSkyMoment(local(2026, 8, 27, 17, 12), NOW)).toBe('hoy · 17:12');
  });

  it('lo de mañana se dice "mañana"', () => {
    expect(formatSkyMoment(local(2026, 8, 28, 3, 44), NOW)).toBe('mañana · 03:44');
  });

  it('más allá lleva fecha corta, con el mes en tres letras', () => {
    expect(formatSkyMoment(local(2026, 9, 2, 3, 44), NOW)).toBe('2 sep · 03:44');
  });

  it('"hoy" se decide por el día del calendario, no por las horas que faltan', () => {
    // A las 23:50 faltan diez minutos para mañana: es mañana, no hoy.
    const lateNow = new Date(2026, 7, 27, 23, 50);
    expect(formatSkyMoment(local(2026, 8, 28, 0, 5), lateNow)).toBe('mañana · 00:05');
  });
});

describe('formatIngress', () => {
  const local = (y: number, m: number, d: number, h: number, min: number) =>
    new Date(y, m - 1, d, h, min).toISOString();

  const NOW = new Date(2026, 7, 27, 8, 30);

  it('hoy se calla, porque en Hoy todo es hoy', () => {
    expect(formatIngress({ sign: 'Escorpio', at: local(2026, 8, 27, 17, 12), now: NOW })).toBe(
      'en Escorpio a las 17:12',
    );
  });

  it('mañana sí se dice: es lo que distingue el aviso de la constatación', () => {
    expect(formatIngress({ sign: 'Sagitario', at: local(2026, 8, 28, 3, 44), now: NOW })).toBe(
      'en Sagitario mañana a las 03:44',
    );
  });

  it('más allá, la fecha corta', () => {
    expect(formatIngress({ sign: 'Capricornio', at: local(2026, 9, 2, 3, 44), now: NOW })).toBe(
      'en Capricornio 2 sep a las 03:44',
    );
  });
});
