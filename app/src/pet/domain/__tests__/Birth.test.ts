import { Birth } from '../Birth';

const valid = { date: '2025-12-14', time: '09:15', tzOffsetMinutes: 60, lat: 41.3874, lon: 2.1686, accuracy: 'exact' as const };

describe('Birth', () => {
  it('create() con datos válidos construye la instancia', () => {
    const b = Birth.create(valid);
    expect(b.date()).toBe('2025-12-14');
    expect(b.time()).toBe('09:15');
    expect(b.accuracy()).toBe('exact');
  });

  it('date es obligatoria — rama "requerido"', () => {
    expect(() => Birth.create({ ...valid, date: undefined as unknown as string })).toThrow('[Birth] date es obligatoria');
  });

  it('date con formato incorrecto — rama "tipo incorrecto"', () => {
    expect(() => Birth.create({ ...valid, date: '14-12-2025' })).toThrow('[Birth] date debe ser YYYY-MM-DD');
  });

  it('date con la forma correcta pero un día que no existe', () => {
    // El regex la deja pasar; `new Date()` la desplazaría a marzo en silencio y
    // la carta saldría de un día inexistente.
    expect(() => Birth.create({ ...valid, date: '2025-02-31' })).toThrow('[Birth] date no existe en el calendario');
    expect(() => Birth.create({ ...valid, date: '2025-13-01' })).toThrow('[Birth] date no existe en el calendario');
    expect(() => Birth.create({ ...valid, date: '2023-02-29' })).toThrow('[Birth] date no existe en el calendario');
  });

  it('el 29 de febrero de un año bisiesto sí es válido', () => {
    expect(Birth.create({ ...valid, date: '2024-02-29' }).date()).toBe('2024-02-29');
  });

  it('accuracy es obligatoria', () => {
    // @ts-expect-error accuracy ausente a propósito
    expect(() => Birth.create({ ...valid, accuracy: undefined })).toThrow('[Birth] accuracy es obligatoria');
  });

  it('accuracy con valor fuera del catálogo', () => {
    expect(() => Birth.create({ ...valid, accuracy: 'invented' as never })).toThrow('[Birth] accuracy inválida');
  });

  it('createOrNull() devuelve null en vez de lanzar', () => {
    expect(Birth.createOrNull({ ...valid, date: 'mal' })).toBeNull();
  });

  it('hasTime()/hasLocation() reflejan los datos disponibles', () => {
    expect(Birth.create(valid).hasTime()).toBe(true);
    expect(Birth.create(valid).hasLocation()).toBe(true);
    expect(Birth.create({ date: '2025-01-01', accuracy: 'approx' }).hasTime()).toBe(false);
  });

  it('hasLocation() exige las dos coordenadas, no una', () => {
    const soloLat = Birth.create({ date: '2025-12-14', time: '09:15', tzOffsetMinutes: 60, lat: 41.38, accuracy: 'exact' });
    expect(soloLat.hasLocation()).toBe(false);
  });

  it('fromJSON(toJSON()) es circular', () => {
    const original = Birth.create(valid);
    const rebuilt = Birth.fromJSON(original.toJSON());
    expect(rebuilt.toJSON()).toEqual(original.toJSON());
  });
});

describe('el huso, cuando hay hora y lugar', () => {
  const conLugar = { date: '2025-12-14', time: '09:15', lat: 41.3874, lon: 2.1686 } as const;

  it('rechaza hora con lugar y sin tzOffsetMinutes', () => {
    // Es la combinación que produce Ascendente y casas. Sin huso, el motor
    // tendría que adivinarlo y la carta saldría entera, plausible y
    // equivocada: 15° de Ascendente por cada hora de error.
    expect(() => Birth.create({ ...conLugar, accuracy: 'exact' })).toThrow();
    expect(Birth.createOrNull({ ...conLugar, accuracy: 'exact' })).toBeNull();
  });

  it('admite hora sin lugar y sin huso — es un estado diseñado (artboard E)', () => {
    // "El dato entra, pero tzOffsetMinutes se queda vacío y la confianza no
    // sube a completa." No hay Ascendente que estropear: solo mejora la Luna.
    const soloHora = Birth.create({ date: '2025-12-14', time: '09:15', accuracy: 'exact' });
    expect(soloHora.hasTime()).toBe(true);
    expect(soloHora.hasLocation()).toBe(false);
    expect(soloHora.tzOffsetMinutes()).toBeUndefined();
  });

  it('acepta el huso cero, que es un huso como otro', () => {
    // `?? ` habría tragado el 0 de Londres en invierno. La regla mira si el
    // campo está, no si vale algo.
    expect(Birth.create({ ...conLugar, tzOffsetMinutes: 0, accuracy: 'exact' }).tzOffsetMinutes()).toBe(0);
  });

  it('deja pasar una fecha sin hora, que es el caso de F1', () => {
    expect(Birth.create({ date: '2025-12-14', accuracy: 'exact' }).hasTime()).toBe(false);
  });
});

describe('placeName', () => {
  it('viaja con el resto y sobrevive a la ida y vuelta', () => {
    const birth = Birth.create({ ...valid, placeName: 'Barcelona, España' });
    expect(Birth.fromJSON(birth.toJSON()).placeName()).toBe('Barcelona, España');
  });

  it('es opcional: la mascota de F1 no tiene lugar ninguno', () => {
    expect(Birth.create({ date: '2025-12-14', accuracy: 'exact' }).placeName()).toBeUndefined();
  });

  it('no admite cadena vacía, que sería un nombre que no dice nada', () => {
    expect(Birth.createOrNull({ ...valid, placeName: '' })).toBeNull();
  });
});

describe('moment()', () => {
  const base = { date: '2021-06-14', accuracy: 'exact' as const };

  it('es el cuándo y el dónde: los cinco campos que ve el motor', () => {
    const birth = Birth.create({
      ...base,
      time: '08:30',
      tzOffsetMinutes: 120,
      lat: 41.3874,
      lon: 2.1686,
    });

    expect(birth.moment()).toBe('2021-06-14|08:30|120|41.3874|2.1686');
  });

  it('deja hueco por lo que falta, para que siga siendo comparable', () => {
    expect(Birth.create(base).moment()).toBe('2021-06-14||||');
  });

  /**
   * El test que de verdad importa: es lo que impide que marcar "esterilizado"
   * recalcule la carta. Ni el nombre del lugar ni la exactitud de la fecha
   * llegan al motor, así que no pueden cambiar el momento.
   */
  it('no cambia por lo que el motor no mira', () => {
    const conLugar = Birth.create({ ...base, lat: 41.3874, lon: 2.1686, placeName: 'Barcelona' });
    const sinNombre = Birth.create({ ...base, lat: 41.3874, lon: 2.1686 });
    const otraExactitud = Birth.create({ ...base, lat: 41.3874, lon: 2.1686, accuracy: 'gotcha_day' });

    expect(sinNombre.moment()).toBe(conLugar.moment());
    expect(otraExactitud.moment()).toBe(conLugar.moment());
  });

  it('sí cambia con cualquiera de los cinco', () => {
    const original = Birth.create({ ...base, time: '08:30', tzOffsetMinutes: 120, lat: 41.3, lon: 2.1 });

    expect(Birth.create({ ...base, time: '08:31', tzOffsetMinutes: 120, lat: 41.3, lon: 2.1 }).moment())
      .not.toBe(original.moment());
    expect(Birth.create({ ...base, time: '08:30', tzOffsetMinutes: 60, lat: 41.3, lon: 2.1 }).moment())
      .not.toBe(original.moment());
    expect(Birth.create({ ...base, time: '08:30', tzOffsetMinutes: 120, lat: 41.4, lon: 2.1 }).moment())
      .not.toBe(original.moment());
  });
});
