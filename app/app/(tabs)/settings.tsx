import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';

import { colors, spacing, typography } from '@/design/theme';

/** Alto de fila del artboard 10. El mismo de la carta y de la Luna. */
const ROW_HEIGHT = 56;

/**
 * Obligatorio en la app y en la ficha de store (BRD §14 R1). Va en un pie
 * fijo y fuera del scroll a propósito, como pide la nota del artboard: es un
 * requisito, así que no puede depender de que el usuario baje. Texto plano,
 * sin caja de alerta — no es una advertencia, es lo que la app es.
 */
const DISCLAIMER =
  'Dogstrology es entretenimiento. No sustituye a tu veterinario: ante cualquier señal de salud, consúltale.';

/**
 * Ajustes — artboard 10, destino raíz de la cuarta pestaña.
 *
 * **Está a medias a propósito.** El artboard dibuja cuatro grupos y aquí solo
 * hay uno, porque los otros tres serían controles muertos:
 *
 * - la tarjeta de suscripción es F11 y no hay RevenueCat, así que "Ver los
 *   planes" no llevaría a ninguna parte;
 * - los dos interruptores de avisos prometerían una notificación que nadie
 *   envía todavía;
 * - "Privacidad y datos" no tiene ni pantalla ni texto escrito.
 *
 * Es la misma decisión que dejó fuera el botón de compartir de la hoja de
 * planeta: antes un hueco que un control que miente.
 *
 * **La fila de Créditos no es cortesía**: la geodata de GeoNames es CC BY 4.0
 * y su atribución tiene que estar visible dentro de la app. Por eso el
 * artboard la coloca sin scroll, y por eso entra desde el primer día.
 */
export default function Settings() {
  return (
    <Screen
      insideTabs
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader divided title="Ajustes" />}
      footerDivider
      footer={<Text style={styles.disclaimer}>{DISCLAIMER}</Text>}
    >
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Carta</Text>
        <Row label="Créditos" onPress={() => router.push('/credits')} />
      </View>
    </Screen>
  );
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <Chevron direction="right" color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[1],
  },
  groupLabel: {
    ...typography.overline,
    color: colors.textMuted,
    paddingBottom: spacing[2],
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  value: {
    ...typography.bodyEmphasis,
    color: colors.textMuted,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
