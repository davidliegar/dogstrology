import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, opacity, radii, touchTarget, typography } from '@/design/theme';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Botón primario: pill de oro, alto `touchTarget`. Una acción por pantalla
 * (BRD §11.3), así que no hay variantes de tamaño ni de tono — el día que haga
 * falta un secundario, será otro componente, no una prop de este.
 */
export function PrimaryButton({ label, onPress, disabled = false, loading = false }: PrimaryButtonProps) {
  const inert = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        inert && styles.inert,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.accentPressed,
  },
  inert: {
    opacity: opacity.disabled,
  },
  label: {
    ...typography.bodyEmphasis,
    color: colors.onAccent,
  },
});
