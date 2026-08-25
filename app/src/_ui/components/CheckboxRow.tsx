import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, icon, radii, spacing, touchTarget, typography } from '@/design/theme';

const BOX = 20;

export interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Fila con casilla a la derecha. La casilla se dibuja con `borderWidth` en vez
 * de con un SVG de librería, siguiendo el trazo y la esquina de `theme.icon`
 * (1,75 / radio 5) — es la referencia que dejó `design/componentes.md`.
 *
 * Toda la fila es el objetivo táctil, no solo los 20 px de la casilla.
 */
export function CheckboxRow({ label, checked, onChange }: CheckboxRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.row}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <View style={styles.mark} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: touchTarget,
    paddingHorizontal: spacing[4],
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.body,
    color: colors.textMuted,
  },
  box: {
    width: BOX,
    height: BOX,
    borderWidth: icon.stroke,
    borderColor: colors.textFaint,
    borderRadius: icon.radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  mark: {
    width: BOX / 2,
    height: BOX / 2,
    borderRadius: icon.radius.s / 2,
    backgroundColor: colors.accent,
  },
});
