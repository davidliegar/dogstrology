import { StyleSheet, Text, View } from 'react-native';

import { CanisMajor } from '@/_ui/components/CanisMajor';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';

import { colors, spacing, typography } from '@/design/theme';

/** La marca a 180 px: el único sitio del MVP donde Canis Major sale grande. */
const MARK = 180;

export interface NoPetPromptProps {
  onAdd: () => void;
}

/**
 * Vacío sin mascota (artboard 16): lo que enseña Hoy cuando no hay ningún
 * perro que leer.
 *
 * **El vacío no es un hueco.** El titular habla del cielo en vez de
 * disculparse por lo que falta, y la pantalla la ocupa la marca — que aquí es
 * legítima porque el Can Mayor *es* un perro del cielo, no un adorno
 * corporativo puesto a llenar.
 *
 * Sin barra de pestañas, y eso sí lo dice el artboard: sin mascota no hay
 * nada que navegar, así que la única salida es la acción.
 */
export function NoPetPrompt({ onAdd }: NoPetPromptProps) {
  return (
    <Screen
      deep
      stars="empty"
      gap={spacing[6]}
      footer={
        <View style={styles.action}>
          <PrimaryButton label="Añadir a tu perro" onPress={onAdd} />
          <Text style={styles.hint}>Dos datos, menos de un minuto</Text>
        </View>
      }
    >
      <View style={styles.block}>
        <CanisMajor size={MARK} />
        <View style={styles.text}>
          <Text style={styles.title}>El Can Mayor lleva ahí toda la noche</Text>
          <Text style={styles.body}>
            Con su nombre y su fecha de nacimiento se puede ver qué dice de tu perro.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    gap: spacing[6],
  },
  text: {
    alignItems: 'center',
    gap: spacing[4],
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: {
    gap: spacing[3],
  },
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
