import { unlockDailyLabel } from '../labels';

/**
 * La fila de oro nombra **los ejes que están bajo candado y solo esos**
 * (artboard 36). Prometerle el Ascendente a un perro sin hora de nacimiento
 * sería vender algo que no existe ni pagando.
 */
describe('la frase de la fila de oro', () => {
  it('con los dos ejes, los une con «y»', () => {
    expect(unlockDailyLabel(['moon', 'ascendant'])).toBe('Leer su Luna y su Ascendente');
  });

  it('con uno solo, la frase se queda corta y sigue siendo la misma fila', () => {
    expect(unlockDailyLabel(['moon'])).toBe('Leer su Luna');
  });
});
