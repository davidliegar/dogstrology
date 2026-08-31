import { houseDayDetail, isHouseDay } from '../dailyCards';
import { HOUSE_DAY_TITLE, othersLabel, petDayTitle } from '../labels';

describe('el día de la casa', () => {
  it('con una mascota Hoy sigue siendo el día de un perro', () => {
    expect(isHouseDay(1)).toBe(false);
    expect(petDayTitle('Baloo')).toBe('El día de Baloo');
  });

  it('con la segunda, el nombre de uno ya no puede rotular a todos', () => {
    expect(isHouseDay(2)).toBe(true);
    expect(HOUSE_DAY_TITLE).toBe('El día en la casa');
  });

  it('con dos se cuenta entera cada una', () => {
    expect(houseDayDetail(2)).toBe('full');
  });

  /**
   * El techo no es de mascotas —el plan no pone ninguno— sino de cuánto se
   * cuenta de cada una: a partir de tres, ninguna lleva cuerpo.
   */
  it('con tres o más ninguna lleva cuerpo: ahí se viene a comparar', () => {
    expect(houseDayDetail(3)).toBe('headline');
    expect(houseDayDetail(9)).toBe('headline');
  });

  it('el rótulo del grupo cuenta las que quedan, con la palabra', () => {
    expect(othersLabel(4)).toBe('Los otros cuatro');
    expect(othersLabel(2)).toBe('Los otros dos');
  });

  it('con una sola detrás, el rótulo va en singular', () => {
    expect(othersLabel(1)).toBe('La otra');
  });

  it('pasada la tabla de palabras, la cifra', () => {
    expect(othersLabel(12)).toBe('Los otros 12');
  });
});
