import { StyleSheet, View } from 'react-native';

import { colors, icon, radii } from '@/design/theme';

/** Disco de la marca, del artboard B. */
const MARK = 20;

/**
 * Palo corto y palo largo de la marca de verificación, antes de girarla. El
 * desplazamiento vertical la centra ópticamente dentro del disco: girada 45°,
 * su centro geométrico queda por debajo del que se ve.
 */
const TICK = { width: 9, height: 5, offset: -2 };

/**
 * La marca de "esta es la elegida" en una lista de una sola opción: disco de
 * acento con el palito en el color que va sobre él.
 *
 * Se dibuja con bordes y no con un SVG de librería, siguiendo el trazo de
 * `theme.icon` — es lo que dejó anotado `design/components.md` para los iconos
 * pequeños del canvas.
 *
 * Decorativa: quien la lleva ya anuncia `accessibilityState.selected`, así que
 * un lector de pantalla no tiene que volver a decirlo.
 */
export function SelectedMark() {
  return (
    <View style={styles.mark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.tick} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tick: {
    width: TICK.width,
    height: TICK.height,
    borderLeftWidth: icon.stroke,
    borderBottomWidth: icon.stroke,
    borderColor: colors.onAccent,
    transform: [{ rotate: '-45deg' }],
    marginTop: TICK.offset,
  },
});
