import { StyleSheet, View } from 'react-native';

import { colors, controlGap, radii, screenPadding } from '@/design/theme';

/** Grosor de la tira. Sale del canvas: es una regla, no un componente táctil. */
const TRACK_HEIGHT = 3;

export interface ProgressStepsProps {
  total: number;
  /** Tramos ya cubiertos, contando desde 1. */
  current: number;
}

/**
 * Tira de progreso del onboarding. La promesa visual de F1 (BRD §9.1: valor en
 * menos de 60 s) es que el usuario vea que esto se acaba pronto — por eso son
 * tramos contados y no una barra continua.
 *
 * Decorativa para el lector de pantalla: el paso se anuncia en el titular de
 * cada pantalla, y repetirlo aquí sería ruido.
 */
export function ProgressSteps({ total, current }: ProgressStepsProps) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.track, index < current && styles.trackDone]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: controlGap,
    paddingHorizontal: screenPadding,
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
  },
  trackDone: {
    backgroundColor: colors.accent,
  },
});
