import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { HOUSE_SYSTEM_LABELS } from '@/chart/ui/labels';
import { usePreferences } from '@/settings/ui/settingsQueries';
import { OFFER_CTA, OFFER_TITLE, PREMIUM_NAME } from '@/subscription/ui/labels';
import { useSubscription } from '@/subscription/ui/subscriptionQueries';

import { colors, radii, spacing, typography } from '@/design/theme';

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
 * **Está a medias a propósito.** El artboard dibuja cuatro grupos y aquí hay
 * dos, porque los que faltan serían controles muertos:
 *
 * - los dos interruptores de avisos prometerían una notificación que nadie
 *   envía todavía (F8);
 * - "Privacidad y datos" no tiene ni pantalla ni texto escrito.
 *
 * Es la misma decisión que dejó fuera el botón de compartir de la hoja de
 * planeta: antes un hueco que un control que miente.
 *
 * **La oferta de arriba es una de las dos puertas del paywall**, y la fría:
 * quien la toca ha ido a buscarla. Se pinta **una sola vez y solo mientras hay
 * algo que ofrecer** — con la suscripción activa desaparece, que es la regla
 * del artboard 11: la puerta se pinta donde el usuario topa con el límite, y
 * si no topa, no se pinta. El nombre del plan va antes que ningún precio, para
 * que el 11 no sea la primera vez que se lee.
 *
 * **La fila de Créditos no es cortesía**: la geodata de GeoNames es CC BY 4.0
 * y su atribución tiene que estar visible dentro de la app. Por eso el
 * artboard la coloca sin scroll, y por eso entra desde el primer día.
 */
export default function Settings() {
  const { data: preferences } = usePreferences();
  const { data: subscription } = useSubscription();
  const houseSystem = preferences?.houseSystem();

  return (
    <Screen
      insideTabs
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader divided title="Ajustes" />}
      footerDivider
      footer={<Text style={styles.disclaimer}>{DISCLAIMER}</Text>}
    >
      {subscription && !subscription.isPremium() ? (
        <View style={styles.offer}>
          <Text style={styles.offerName}>{PREMIUM_NAME}</Text>
          <Text style={styles.offerTitle}>{OFFER_TITLE}</Text>
          <PrimaryButton label={OFFER_CTA} onPress={() => router.push('/paywall')} />
        </View>
      ) : null}

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Carta</Text>
        <Row
          label="Sistema de casas"
          value={houseSystem ? HOUSE_SYSTEM_LABELS[houseSystem] : undefined}
          onPress={() => router.push('/settings/house-system')}
        />
        <View style={styles.divider} />
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
  offer: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[2],
  },
  offerName: {
    ...typography.overline,
    color: colors.accent,
  },
  offerTitle: {
    ...typography.section,
    color: colors.text,
  },
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
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
