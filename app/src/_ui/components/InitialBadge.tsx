import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '@/design/theme';

/** Lado del disco, del artboard 35. */
const SIDE = 18;

/**
 * La inicial de una mascota en un disco (artboard 35), para decir **de quién**
 * es una casilla resaltada de Explorar.
 *
 * De quién es no lo puede decir el color: el color de una tarjeta ya es su
 * elemento, y dos significados en la misma señal no se distinguen.
 *
 * **Es un puntero, no la respuesta.** Con una inicial no se sabe qué perro es
 * cuando dos empiezan igual, y no hace falta: la respuesta entera está en la
 * línea de debajo de la rejilla y en la ficha, que los nombra.
 */
export function InitialBadge({ name }: { name: string }) {
  return (
    <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.letter}>{[...name][0]?.toUpperCase() ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: SIDE,
    height: SIDE,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...typography.initial,
    color: colors.accent,
  },
});
