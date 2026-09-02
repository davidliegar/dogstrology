import { Pressable, StyleSheet, Text } from 'react-native';

import { Lock } from './Lock';

import { colors, radii, spacing, touchTarget, typography } from '@/design/theme';

export interface UnlockRowProps {
  /** Lo que se abre, dicho en una frase. */
  label: string;
  onPress: () => void;
}

/**
 * La fila de oro que abre lo bloqueado — artboard 36 (D19).
 *
 * **Va al final de lo bloqueado, no encima.** Es una fila de 44 que se toca o
 * se ignora, y el desplazamiento sigue: un aviso interpuesto convertiría la
 * pantalla en una pantalla que pide dinero, y D19 dice justo lo contrario.
 *
 * Vive en `_ui` porque la piden contextos distintos —la lectura del día y las
 * casas de Explorar— y la puerta al paywall tiene que ser reconocible como la
 * misma en todos. El texto y el destino los pone quien la usa: son suyos.
 */
export function UnlockRow({ label, onPress }: UnlockRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.unlock, pressed && styles.pressed]}
    >
      <Lock color={colors.accent} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  unlock: {
    height: touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
  label: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
});
