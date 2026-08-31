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
 * **Con dos páginas no se pintan.** La mirilla —el borde de la siguiente
 * tarjeta asomando— ya dice que hay otra, y unos puntos dirían lo mismo dos
 * veces. Con tres o más sí, porque ahí la mirilla dice «hay más» pero no
 * cuántas.
 */
export function PageDots({ count, active }: PageDotsProps) {
  if (count < 3) return null;

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
