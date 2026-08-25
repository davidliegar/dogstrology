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
    const soloLat = Birth.create({ date: '2025-12-14', time: '09:15', lat: 41.38, accuracy: 'exact' });
    expect(soloLat.hasLocation()).toBe(false);
  });

  it('fromJSON(toJSON()) es circular', () => {
    const original = Birth.create(valid);
    const rebuilt = Birth.fromJSON(original.toJSON());
    expect(rebuilt.toJSON()).toEqual(original.toJSON());
  });
});
