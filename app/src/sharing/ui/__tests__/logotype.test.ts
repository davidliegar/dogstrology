import { LOGOTYPE, logotypeTracking } from '../logotype';

describe('logotypeTracking', () => {
  it('a 28 px, el tracking que fija la lámina', () => {
    expect(logotypeTracking(28)).toBeCloseTo(6);
  });

  it('escala proporcional por encima de 18 px', () => {
    // El doble de cuerpo, el doble de aire: es lo que hace que el logotipo se
    // vea igual en el splash que en la esquina de una imagen compartida.
    expect(logotypeTracking(56)).toBeCloseTo(12);
    expect(logotypeTracking(18)).toBeCloseTo(18 * (6 / 28));
  });

  it('por debajo de 18 px se queda en +3 y deja de escalar', () => {
    expect(logotypeTracking(17.9)).toBe(3);
    expect(logotypeTracking(11)).toBe(3);
  });

  it('el logotipo va en caja alta desde el dato', () => {
    // Skia dibuja glifos: no hay `textTransform` que lo suba después, y medir
    // una cadena distinta de la que se pinta descuadra el tracking.
    expect(LOGOTYPE).toBe(LOGOTYPE.toUpperCase());
  });
});
