import { Birth } from '@/pet/domain/Birth';
import { withBirthDate, withBirthPlace, withBirthTime } from '../birthEdits';

const BARCELONA = { name: 'Barcelona', community: 'Cataluña', lat: 41.39, lon: 2.16, zone: 'mainland' as const };
const LAS_PALMAS = { name: 'Las Palmas de Gran Canaria', community: 'Canarias', lat: 28.1, lon: -15.42, zone: 'canary' as const };

const invierno = Birth.create({ date: '2025-12-14', accuracy: 'exact' });

describe('withBirthPlace', () => {
  it('guarda nombre, coordenadas y huso de una vez', () => {
    const birth = withBirthPlace(invierno, BARCELONA);
    expect(birth.placeName()).toBe('Barcelona, Cataluña');
    expect(birth.lat()).toBe(41.39);
    expect(birth.tzOffsetMinutes()).toBe(60);
  });

  it('Canarias va una hora por detrás el mismo día', () => {
    expect(withBirthPlace(invierno, LAS_PALMAS).tzOffsetMinutes()).toBe(0);
  });

  it('quitar el lugar se lleva el huso: sin lugar no hay zona horaria que valga', () => {
    const conLugar = withBirthPlace(invierno, BARCELONA);
    const sinLugar = withBirthPlace(conLugar, undefined);
    expect(sinLugar.lat()).toBeUndefined();
    expect(sinLugar.placeName()).toBeUndefined();
    expect(sinLugar.tzOffsetMinutes()).toBeUndefined();
  });
});

describe('withBirthDate', () => {
  it('recalcula el huso al cambiar de estación, sin tocar el lugar', () => {
    // Es el fallo silencioso que esto evita: mover la fecha de diciembre a
    // julio y dejar UTC+1 puesto deja hora y huso describiendo instantes
    // distintos, y el Ascendente sale una hora corrido.
    const enBarcelona = withBirthPlace(invierno, BARCELONA);
    expect(enBarcelona.tzOffsetMinutes()).toBe(60);

    const enVerano = withBirthDate(enBarcelona, '2025-07-14', 'exact');
    expect(enVerano.tzOffsetMinutes()).toBe(120);
    expect(enVerano.placeName()).toBe('Barcelona, Cataluña');
  });

  it('sin lugar no inventa huso', () => {
    expect(withBirthDate(invierno, '2025-07-14', 'exact').tzOffsetMinutes()).toBeUndefined();
  });

  it('cambia la exactitud con la fecha', () => {
    expect(withBirthDate(invierno, '2026-03-02', 'gotcha_day').accuracy()).toBe('gotcha_day');
  });
});

describe('withBirthTime', () => {
  it('pone y quita la hora', () => {
    const conLugar = withBirthPlace(invierno, BARCELONA);
    expect(withBirthTime(conLugar, '07:40').time()).toBe('07:40');
    expect(withBirthTime(conLugar, undefined).time()).toBeUndefined();
  });

  it('una hora con lugar sale ya con su huso puesto, que es lo que Birth exige', () => {
    const conLugar = withBirthPlace(invierno, BARCELONA);
    expect(() => withBirthTime(conLugar, '07:40')).not.toThrow();
    expect(withBirthTime(conLugar, '07:40').tzOffsetMinutes()).toBe(60);
  });
});
