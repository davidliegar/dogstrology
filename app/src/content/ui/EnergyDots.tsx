import { StyleSheet, View } from 'react-native';

import { colors, controlGap, radii } from '@/design/theme';

/** El máximo de `energyScore` en el schema del pipeline. */
const MAX = 5;
const DOT = 8;

export interface EnergyDotsProps {
  /** 1 = perro de manta, 5 = perro de correr. */
  score: number;
  /** El color de los encendidos. Los apagados son siempre el separador. */
  color: string;
  /** Para el lector de pantalla: "energía 3 de 5" no se ve en cinco puntos. */
  label: string;
}

/**
 * Los cinco puntos de energía del día (artboard 04).
 *
 * **Puntos y no una barra**: el dato es un entero de 1 a 5, y una barra
 * invitaría a leer un continuo que no existe. Los apagados se quedan, en el
 * color del separador: sin ellos no habría escala y un 3 se leería como un 3
 * de 3.
 */
export function EnergyDots({ score, color, label }: EnergyDotsProps) {
  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={label}>
      {Array.from({ length: MAX }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, { backgroundColor: index < score ? color : colors.divider }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: controlGap,
    flexShrink: 0,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
  },
});
