import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, controlGap, opacity, radii, spacing, touchTarget } from '@/design/theme';
import { text } from '../typography';

/**
 * Alto compacto: 36 en vez de `touchTarget`. El chip nació **informativo, no
 * pulsable** (`design/components.md`) y por eso podía bajar de 44.
 *
 * Los filtros de Explorar (artboards 8, 20 y 22) son el mismo control pero sí
 * se tocan, y el canvas los dibuja igual de altos. El mínimo táctil se
 * recupera con `hitSlop`: el área que se toca vuelve a ser de 44, y lo que se
 * ve sigue midiendo 36.
 */
const CHIP_HEIGHT = 36;
const DOT = 8;

const TOUCH_SLOP = (touchTarget - CHIP_HEIGHT) / 2;

export interface ChipProps {
  label: string;
  /** Punto de color a la izquierda: el acento del elemento del signo. */
  dotColor?: string;
  /**
   * `accent` es el chip relleno de oro del pie de la carta natal (artboard 5):
   * el mismo control, pero diciendo un ajuste activo en vez de un dato.
   */
  tone?: 'neutral' | 'accent';
  /** Con esto el chip pasa a ser un filtro: se toca y anuncia si está elegido. */
  onPress?: () => void;
  /** Solo tiene sentido con `onPress`. Enciende el oro y el estado accesible. */
  selected?: boolean;
}

/** Chip informativo: elemento, modalidad, grado. Con `onPress`, filtro. */
export function Chip({ label, dotColor, tone = 'neutral', onPress, selected }: ChipProps) {
  const accented = tone === 'accent' || selected === true;
  const content = (
    <>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.label, accented && styles.labelAccent]}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.chip, accented && styles.chipAccent]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={TOUCH_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [styles.chip, accented && styles.chipAccent, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
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
  chipAccent: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
  },
  pressed: {
    opacity: opacity.pressed,
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
  labelAccent: {
    color: colors.accent,
  },
});
