import type { SkTextStyle } from '@shopify/react-native-skia';

export interface TypographyScale {
  fontFamily: string;
  fontSize: number;
  /** Absoluta, como en `theme.typography`. Skia la quiere como múltiplo. */
  lineHeight?: number;
  letterSpacing?: number;
  /** Cuánto crece el token del tema para el lienzo de la imagen. */
  scale: number;
}

/**
 * Un token de `theme.typography` en la forma que espera Skia, **sin color**:
 * ese lo pone quien dibuja, porque necesita `Skia.Color` y esto es aritmética.
 *
 * **Las claves que no aplican no se escriben, ni siquiera a `undefined`.** El
 * puente nativo pregunta si la propiedad existe y, si existe, la lee como
 * número: una clave presente con valor `undefined` pasa la primera pregunta y
 * revienta en la segunda con «Value is undefined, expected a number». Costó un
 * viaje a un móvil — `typography.body` no tiene `letterSpacing`.
 */
export function paragraphStyleOf({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  scale,
}: TypographyScale): Omit<SkTextStyle, 'color'> {
  const style: Omit<SkTextStyle, 'color'> = {
    fontFamilies: [fontFamily],
    fontSize: fontSize * scale,
  };
  // La altura de línea del tema es absoluta —React Native no acepta
  // múltiplos— y Skia sí los quiere: es la misma proporción dicha de otra forma.
  if (lineHeight !== undefined) style.heightMultiplier = lineHeight / fontSize;
  if (letterSpacing !== undefined) style.letterSpacing = letterSpacing * scale;
  return style;
}
