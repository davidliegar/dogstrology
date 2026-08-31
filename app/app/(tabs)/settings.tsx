import { router } from 'expo-router';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { HOUSE_SYSTEM_LABELS } from '@/chart/ui/labels';
import { usePreferences } from '@/settings/ui/settingsQueries';
import { formatRenewal } from '@/subscription/ui/format';
import {
  MANAGE_LABEL,
  NO_EXPIRY,
  OFFER_CTA,
  OFFER_TITLE,
  PLAN_LABELS,
  PREMIUM_NAME,
  PREMIUM_SHORT_NAME,
} from '@/subscription/ui/labels';
import { useSubscription } from '@/subscription/ui/subscriptionQueries';
import type { Subscription } from '@/subscription/domain/Subscription';

import { colors, radii, spacing, typography } from '@/design/theme';

/** Diámetro del punto que marca que el plan está activo (artboard 30). */
const STATUS_DOT = 8;

/**
 * Dónde se gestiona una suscripción: en la tienda que la cobra, nunca aquí.
 * Es lo que dice el rótulo y es como funciona — la app no puede cancelar un
 * cobro que no hace.
 */
const STORE_SUBSCRIPTIONS = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  default: 'https://play.google.com/store/account/subscriptions',
});

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
 * **La tarjeta de arriba es una de las dos puertas del paywall**, y la fría:
 * quien la toca ha ido a buscarla. Se pinta una sola vez y **solo mientras hay
 * algo que ofrecer** — que es la regla del artboard 11: la puerta se pinta
 * donde el usuario topa con el límite, y si no topa, no se pinta. El nombre
 * del plan va antes que ningún precio, para que el 11 no sea la primera vez
 * que se lee.
 *
 * **Comprado el plan, la tarjeta no desaparece: cambia de trabajo**
 * (artboard 30). Deja de vender y pasa a decir qué tienes y hasta cuándo, que
 * es lo que se viene a mirar aquí. Con «Para siempre» la línea de renovación
 * dice «No caduca» y la fila de gestionar se va, porque no hay nada que
 * gestionar.
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
      {subscription?.isPremium() ? <PlanCard subscription={subscription} /> : null}

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

/**
 * La tarjeta con el plan ya contratado (artboard 30). Fondo más profundo que
 * el de la oferta a la que sustituye: esta no vende, informa.
 */
function PlanCard({ subscription }: { subscription: Subscription }) {
  const planId = subscription.planId();
  const renewal = formatRenewal(subscription.renewsAt());

  return (
    <View style={styles.plan}>
      <View style={styles.planHeadline}>
        <View style={styles.dot} />
        <Text style={styles.planName}>
          {PREMIUM_SHORT_NAME}
          {planId ? ` · ${PLAN_LABELS[planId].toLowerCase()}` : ''}
        </Text>
      </View>
      {/* Sin renovación no hay fecha que enseñar, y el plan que no renueva lo
          dice con todas las letras en vez de dejar el hueco. */}
      <Text style={styles.planNote}>{subscription.renews() ? renewal : NO_EXPIRY}</Text>
      {subscription.renews() ? (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={() => STORE_SUBSCRIPTIONS && Linking.openURL(STORE_SUBSCRIPTIONS)}
            accessibilityRole="button"
            accessibilityLabel={MANAGE_LABEL}
            style={styles.manage}
          >
            <Text style={styles.manageLabel}>{MANAGE_LABEL}</Text>
            <Chevron direction="right" />
          </Pressable>
        </>
      ) : null}
    </View>
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
  plan: {
    borderRadius: radii.card,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  planHeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dot: {
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  planName: {
    ...typography.bodyEmphasis,
    color: colors.text,
    flex: 1,
  },
  planNote: {
    ...typography.caption,
    color: colors.textFaint,
  },
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  manageLabel: {
    ...typography.body,
    color: colors.accent,
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
