import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Lock } from '@/_ui/components/Lock';
import type { DailyAxis } from '../domain/DailyKey';
import { unlockDailyLabel } from './labels';

import { colors, radii, spacing, touchTarget, typography } from '@/design/theme';

export interface UnlockRowProps {
  /** Los ejes que están bajo candado. Con ninguno, esta fila no se pinta. */
  axes: DailyAxis[];
  /** De quién es la lectura, para que el paywall enseñe su ejemplo y no otro. */
  petId: string;
}

/**
 * La fila que abre lo bloqueado del día — artboard 36 (D19).
 *
 * **Va al final de lo bloqueado, no encima.** Es una fila de 44 que se toca o
 * se ignora, y el desplazamiento sigue: un aviso interpuesto entre las
 * tarjetas convertiría la pantalla que se abre cada mañana en una pantalla que
 * pide dinero, y D19 dice justo lo contrario — el hábito no se cobra.
 *
 * Es **una de las tres puertas** del paywall, y la que nace de la falta más
 * concreta: el usuario acaba de ver que hay algo escrito sobre su perro que no
 * puede leer. Lleva su identificador para que el 11 enseñe **esa** tarjeta y no
 * la de otro perro de la casa.
 *
 * Vive aparte porque la pintan dos sitios —el día de un perro y el de la casa,
 * que tienen dos maquetaciones de tarjeta distintas— y la puerta tiene que ser
 * la misma en los dos.
 */
export function UnlockRow({ axes, petId }: UnlockRowProps) {
  const label = unlockDailyLabel(axes);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/paywall', params: { pet: petId } })}
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
