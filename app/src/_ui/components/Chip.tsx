import { StyleSheet, Text, View } from 'react-native';

import { colors, controlGap, radii, spacing } from '@/design/theme';
import { text } from '../typography';

/**
 * Alto compacto: 36 en vez de `touchTarget`. Es el único sitio del MVP donde
 * se baja de 44, y se puede porque el chip es **informativo, no pulsable**
 * (`design/components.md`).
 */
const CHIP_HEIGHT = 36;
const DOT = 8;

export interface ChipProps {
  label: string;
  /** Punto de color a la izquierda: el acento del elemento del signo. */
  dotColor?: string;
}

/** Chip informativo: elemento, modalidad, grado. */
export function Chip({ label, dotColor }: ChipProps) {
  return (
    <View style={styles.chip}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: spacing[4],
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: controlGap,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
  },
  label: {
    // `ephemeris` ya lleva cifras tabulares: `22°14′` no baila entre signos.
    ...text('ephemeris'),
    color: colors.textMuted,
  },
});
