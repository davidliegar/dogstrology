import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/design/theme';

/** El punto de una página que no se ve, y la píldora de la que sí (artboard 34). */
const DOT = 6;
const ACTIVE_WIDTH = 18;

export interface PageDotsProps {
  count: number;
  active: number;
}

/**
 * El censo de páginas de un carrusel (artboard 34).
 *
 * **Es censo y no navegación**: dice cuántas hay y por cuál se va, y nadie
 * apunta con el dedo a un punto de 6 px. Por eso no se pueden tocar.
 *
 * **También con dos.** La mirilla —el borde de la siguiente tarjeta asomando—
 * dice que hay algo más, pero no dice «esto se desliza»: con la tarjeta
 * convertida en identidad, lo que asoma es medio retrato, y medio retrato se
 * puede leer como recorte antes que como gesto. Los puntos lo cierran. Con
 * cinco dicen además cuántas hay, que la mirilla nunca dijo.
 */
export function PageDots({ count, active }: PageDotsProps) {
  if (count < 2) return null;

  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.dot, index === active && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    backgroundColor: colors.inactive,
  },
  active: {
    width: ACTIVE_WIDTH,
    backgroundColor: colors.accent,
  },
});
