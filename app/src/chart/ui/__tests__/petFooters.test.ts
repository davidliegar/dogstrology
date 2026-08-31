import { countWord, joinList } from '@/_ui/text';
import { noneHere, planetsOfPet } from '../labels';

/**
 * El pie de las fichas con varias mascotas (artboard 35): **un perro, una
 * fila, y dentro de la fila sus planetas**.
 */
describe('el pie de la ficha de casa', () => {
  it('con un planeta, la frase de siempre', () => {
    expect(planetsOfPet(['sun'], 'Ciro')).toBe('El Sol de Ciro');
  });

  it('con dos, los enumera dentro de la fila y solo el primero va en mayúscula', () => {
    expect(planetsOfPet(['moon', 'sun'], 'Baloo')).toBe('La Luna y el Sol de Baloo');
  });

  it('con tres, la coma y la «y» del final', () => {
    expect(planetsOfPet(['moon', 'sun', 'venus'], 'Baloo')).toBe('La Luna, el Sol y Venus de Baloo');
  });

  /**
   * Dentro de la frase «el Sol» va en minúscula, pero *Marte* no: uno lleva
   * artículo y el otro es un nombre propio.
   */
  it('los nombres propios no se pasan a minúscula al enumerarlos', () => {
    expect(planetsOfPet(['sun', 'mars'], 'Ona')).toBe('El Sol y Marte de Ona');
    expect(planetsOfPet(['mars', 'sun'], 'Ona')).toBe('Marte y el Sol de Ona');
  });
});

describe('cuando ninguna mascota cumple', () => {
  /**
   * Con una mascota el pie no se pinta —la ausencia es obvia—; con cinco, el
   * silencio se confunde con que no se ha calculado.
   */
  it('lo dice con el mismo verbo que habrían dicho las filas', () => {
    expect(noneHere(5, 'está en este signo')).toBe('Ninguna de tus cinco mascotas está en este signo.');
    expect(noneHere(3, 'tiene planetas en esta casa')).toBe(
      'Ninguna de tus tres mascotas tiene planetas en esta casa.',
    );
  });
});

describe('contar y enumerar', () => {
  it('hasta nueve con letra, y en femenino: lo que se cuenta son mascotas', () => {
    expect(countWord(2)).toBe('dos');
    expect(countWord(1)).toBe('una');
    expect(countWord(9)).toBe('nueve');
  });

  it('a partir de diez, la cifra', () => {
    expect(countWord(12)).toBe('12');
  });

  it('la lista lleva su coma y su «y»', () => {
    expect(joinList(['Baloo'])).toBe('Baloo');
    expect(joinList(['Baloo', 'Ona'])).toBe('Baloo y Ona');
    expect(joinList(['Baloo', 'Ona', 'Duna'])).toBe('Baloo, Ona y Duna');
  });
});
