import { StyleSheet, View } from 'react-native';

import { colors, icon } from '@/design/theme';

/** Lado del aspa, del artboard 11. El trazo sale del tema. */
const MARK = icon.size.l;

/**
 * El aspa de cerrar: dos barras cruzadas, dibujadas con `View`s como el resto
 * de la iconografía del canvas (`Chevron`, `SelectedMark`) y con el mismo
 * grosor del tema.
 *
 * Decorativa: quien la lleva es un `Pressable` que ya se anuncia como
 * "Cerrar".
 */
export function CloseMark({ color = colors.textFaint }: { color?: string }) {
  return (
    <View
      style={styles.mark}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.counter, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: MARK,
    height: MARK,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bar: {
    position: 'absolute',
    width: MARK,
    height: icon.stroke,
    transform: [{ rotate: '45deg' }],
  },
  counter: {
    transform: [{ rotate: '-45deg' }],
  },
});
