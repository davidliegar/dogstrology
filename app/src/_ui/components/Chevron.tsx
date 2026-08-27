import { StyleSheet, View } from 'react-native';

import { colors, icon } from '@/design/theme';

export interface ChevronProps {
  direction: 'left' | 'right';
  /** Lado del cuadrado antes de girarlo. 8 en una fila, 11 en el atrás. */
  size?: number;
  color?: string;
}

/**
 * Punta de flecha dibujada con dos bordes de una `View` girada 45°, que es
 * como la resuelve el canvas y lo que `design/components.md` dejó anotado: el
 * trazo (`icon.stroke`) y la proporción salen del tema, no de una librería de
 * iconos que traería su propio grosor.
 *
 * Decorativa: siempre acompaña a un texto que ya dice a dónde lleva.
 */
export function Chevron({ direction, size = 8, color = colors.textFaint }: ChevronProps) {
  const sides =
    direction === 'right'
      ? { borderRightWidth: icon.stroke, borderTopWidth: icon.stroke }
      : { borderLeftWidth: icon.stroke, borderBottomWidth: icon.stroke };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.chevron, sides, { width: size, height: size, borderColor: color }]}
    />
  );
}

const styles = StyleSheet.create({
  chevron: {
    transform: [{ rotate: '45deg' }],
    flexShrink: 0,
  },
});
