import type { TextStyle } from 'react-native';

import { typography, type TypographyToken } from '@/design/theme';

/**
 * Un estilo de `theme.typography` en la forma que espera React Native.
 *
 * `theme.ts` declara los tokens `as const`, así que `ephemeris.fontVariant` es
 * un tuple **readonly**. `StyleSheet.create` no lo acepta y, peor, al
 * encontrarlo deja de inferir cada clave por separado y ensancha todas a
 * `ViewStyle | TextStyle | ImageStyle` — de modo que el error salta en la
 * `<View>` de al lado y no donde está la causa.
 *
 * Se normaliza aquí, una vez, en lugar de copiar el mismo `[...fontVariant]`
 * por cada pantalla que enseñe grados. El tema no se toca: el `as const` está
 * puesto a propósito para que los tokens sean literales.
 */
export const text = (token: TypographyToken): TextStyle => {
  const style = typography[token];
  return 'fontVariant' in style ? { ...style, fontVariant: [...style.fontVariant] } : { ...style };
};
