import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, touchTarget, typography } from '@/design/theme';
import { text } from '../typography';

/** Aire entre el riel y la pastilla de dentro. Sale del artboard A. */
const TRACK_PADDING = spacing[1];

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

export interface SegmentedFieldProps<T> {
  label: string;
  options: SegmentedOption<T>[];
  /** `undefined` deja las dos opciones apagadas: el dato aún no se ha dicho. */
  value: T | undefined;
  onChange: (value: T) => void;
}

/**
 * Riel de dos opciones (artboard A): sexo y esterilizado.
 *
 * Sin opción por defecto a propósito. Un control segmentado que arranca con
 * una mitad encendida está afirmando un dato que el usuario no ha dado —y en
 * "esterilizado" eso es afirmar algo falso sobre su perro la mitad de las
 * veces. Vacío significa vacío, y así es como lo pinta el canvas.
 */
export function SegmentedField<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: SegmentedFieldProps<T>) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}: ${option.label}`}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing[2],
  },
  label: {
    ...typography.overline,
    color: colors.textFaint,
  },
  track: {
    height: touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    padding: TRACK_PADDING,
    flexDirection: 'row',
    gap: TRACK_PADDING,
  },
  segment: {
    flex: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
  segmentLabel: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
  segmentLabelSelected: {
    color: colors.onAccent,
  },
});
