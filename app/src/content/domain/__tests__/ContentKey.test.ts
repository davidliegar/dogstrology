import { ContentKey } from '../ContentKey';

/**
 * La gramática de las claves es un contrato con el pipeline que **no se
 * comprueba en producción** (BRD §7.3.1). Estos tests la fijan carácter a
 * carácter contra las cadenas literales que escribe
 * `pipeline/src/catalogFragments.mjs`; la cobertura real —que cada clave
 * exista— está en `src/__tests__/catalogCoverage.test.ts`.
 */
describe('ContentKey', () => {
  it('escribe la clave de planeta en signo tal cual la genera el pipeline', () => {
    expect(ContentKey.planetInSign({ planet: 'sun', sign: 'aries' }).value()).toBe('planet=sun;sign=aries');
  });

  it('escribe la clave de planeta en casa', () => {
    expect(ContentKey.planetInHouse({ planet: 'moon', house: 4 }).value()).toBe('planet=moon;house=4');
  });

  it('escribe la clave de un aspecto de tránsito', () => {
    const key = ContentKey.transitAspect({ transit: 'sun', aspect: 'conjunction', natal: 'moon' });
    expect(key.value()).toBe('transit=sun;aspect=conjunction;natal=moon');
  });

  it('escribe la clave de raza en signo', () => {
    expect(ContentKey.breedInSign({ breed: 'german-shepherd', sign: 'aries' }).value()).toBe(
      'breed=german-shepherd;sign=aries',
    );
  });

  it('las claves de personalidad llevan la especie, incluso las de fase y casa', () => {
    expect(ContentKey.personalityOfSign({ sign: 'leo' }).value()).toBe('species=dog;sign=leo');
    expect(ContentKey.personalityOfMoonPhase({ moonPhase: 'full_moon' }).value()).toBe('species=dog;moon_phase=full_moon');
    expect(ContentKey.houseGlossary({ house: 12 }).value()).toBe('species=dog;house=12');
  });

  it('cada forma sabe en qué familia del catálogo buscarse', () => {
    expect(ContentKey.planetInSign({ planet: 'sun', sign: 'aries' }).family()).toBe('planet-sign-house');
    expect(ContentKey.planetInHouse({ planet: 'sun', house: 1 }).family()).toBe('planet-sign-house');
    expect(ContentKey.transitAspect({ transit: 'sun', aspect: 'trine', natal: 'mars' }).family()).toBe('aspects');
    expect(ContentKey.breedInSign({ breed: 'beagle', sign: 'virgo' }).family()).toBe('breed-sign');
    expect(ContentKey.personalityOfSign({ sign: 'virgo' }).family()).toBe('personality');
  });

  it('una casa fuera de 1-12 no llega a construirse', () => {
    // No es paranoia: la carta devuelve `house?: number` y un `undefined` mal
    // propagado da `planet=sun;house=NaN`, que es una clave que no existe y no
    // se parece a un bug.
    expect(() => ContentKey.planetInHouse({ planet: 'sun', house: 0 })).toThrow(/fuera de rango/);
    expect(() => ContentKey.planetInHouse({ planet: 'sun', house: 13 })).toThrow(/fuera de rango/);
    expect(() => ContentKey.houseGlossary({ house: NaN })).toThrow(/fuera de rango/);
    expect(() => ContentKey.planetInHouse({ planet: 'sun', house: 4.5 })).toThrow(/fuera de rango/);
  });

  it('un identificador que no es del vocabulario no llega a construirse', () => {
    // El test de cobertura enumera lo que el catálogo conoce; esto cubre lo
    // que ese test no puede ver, que es lo que sale de la base de datos y de
    // la carta calculada en el móvil de alguien.
    expect(() => ContentKey.planetInSign({ planet: 'Sun', sign: 'aries' })).toThrow(/planet no es un identificador/);
    expect(() => ContentKey.planetInSign({ planet: 'sun', sign: 'Aries' })).toThrow(/sign no es un identificador/);
    expect(() => ContentKey.planetInSign({ planet: 'sun', sign: '' })).toThrow(/sign no es un identificador/);
    expect(() => ContentKey.personalityOfMoonPhase({ moonPhase: 'luna llena' })).toThrow(/moonPhase/);
  });

  it('un undefined que se ha colado revienta en vez de fabricar la clave', () => {
    // `${undefined}` es la cadena "undefined", que pasaría cualquier regex de
    // minúsculas: por eso el guardia mira el tipo y no solo la forma.
    const noPlanet = undefined as unknown as string;
    expect(() => ContentKey.planetInSign({ planet: noPlanet, sign: 'aries' })).toThrow(/planet no es un identificador/);
    expect(() => ContentKey.breedInSign({ breed: noPlanet, sign: 'aries' })).toThrow(/breed no es un id de raza/);
  });

  it('las razas llevan guion y el resto del vocabulario no', () => {
    // `german-shepherd` es válido como raza; `full_moon` como fase. Cruzarlos
    // no lo es: son dos alfabetos distintos y el catálogo los escribe así.
    expect(() => ContentKey.breedInSign({ breed: 'german-shepherd', sign: 'aries' })).not.toThrow();
    expect(() => ContentKey.breedInSign({ breed: 'german shepherd', sign: 'aries' })).toThrow(/breed/);
    expect(() => ContentKey.personalityOfMoonPhase({ moonPhase: 'full-moon' })).toThrow(/moonPhase/);
  });

  it('dos claves iguales se reconocen', () => {
    const one = ContentKey.personalityOfSign({ sign: 'aries' });
    const other = ContentKey.personalityOfSign({ sign: 'aries' });
    expect(one.is(other)).toBe(true);
    expect(one.is(ContentKey.personalityOfSign({ sign: 'taurus' }))).toBe(false);
  });
});
