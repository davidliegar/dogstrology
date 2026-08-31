import { isHouseDay } from '../dailyCards';
import { HOUSE_DAY_TITLE, petDayTitle } from '../labels';

describe('el día de la casa', () => {
  it('con una mascota Hoy sigue siendo el día de un perro', () => {
    expect(isHouseDay(1)).toBe(false);
    expect(petDayTitle('Baloo')).toBe('El día de Baloo');
  });

  it('con la segunda, el nombre de uno ya no puede rotular a todos', () => {
    expect(isHouseDay(2)).toBe(true);
    expect(HOUSE_DAY_TITLE).toBe('El día en la casa');
  });

  /**
   * El carrusel quitó el techo del artboard 31: con una tarjeta por pantalla
   * no hay altura que repartir, así que no hay nada que recortar por muchas
   * mascotas que haya.
   */
  it('con muchas mascotas sigue siendo el día en la casa, sin techo', () => {
    expect(isHouseDay(5)).toBe(true);
    expect(isHouseDay(9)).toBe(true);
  });
});
