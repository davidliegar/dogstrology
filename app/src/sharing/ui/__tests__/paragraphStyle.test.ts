import { typography } from '@/design/theme';
import { paragraphStyleOf } from '../paragraphStyle';

const SCALE = 2;

describe('paragraphStyleOf', () => {
  it('el cuerpo crece con el lienzo, y el espaciado con él', () => {
    const style = paragraphStyleOf({ ...typography.overline, scale: SCALE });

    expect(style.fontSize).toBe(typography.overline.fontSize * SCALE);
    expect(style.letterSpacing).toBe(typography.overline.letterSpacing * SCALE);
  });

  it('la altura de línea absoluta del tema pasa a múltiplo', () => {
    // 34 sobre 28 en `title`: la misma proporción dicha como la quiere Skia. Y
    // **no se escala**, porque un múltiplo ya es relativo al cuerpo.
    const style = paragraphStyleOf({ ...typography.title, scale: SCALE });

    expect(style.heightMultiplier).toBeCloseTo(typography.title.lineHeight / typography.title.fontSize);
  });

  it('un token sin espaciado no escribe la clave, ni siquiera a undefined', () => {
    // Es el fallo que tumbó la imagen en el móvil: el puente nativo pregunta si
    // la propiedad existe y luego la lee como número, así que una clave puesta
    // a `undefined` pasa la primera pregunta y revienta en la segunda.
    const style = paragraphStyleOf({ ...typography.body, scale: SCALE });

    expect('letterSpacing' in style).toBe(false);
    expect(Object.values(style).every((value) => value !== undefined)).toBe(true);
  });
});
