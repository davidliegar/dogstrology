import { router } from 'expo-router';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { SwitchRow } from '@/_ui/components/SwitchRow';
import { HOUSE_SYSTEM_LABELS } from '@/chart/ui/labels';
import {
  REMINDER_DENIED,
  REMINDER_FAILED,
  REMINDER_GROUP,
  REMINDER_LABEL,
  REMINDER_TIME_HINT,
  reminderAt,
} from '@/notifications/ui/labels';
import { useDailyReminder, useSetDailyReminder } from '@/notifications/ui/notificationQueries';
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
  TERMS_TITLE,
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
 * **Sigue a medias a propósito, pero por menos.** De los cuatro grupos del
 * artboard falta uno entero —"Privacidad y datos", que no tiene ni pantalla ni
 * texto escrito— y **uno de los dos interruptores de avisos**: «Eventos del
 * cielo» (luna llena, retrógrados) no tiene detrás nada que avisar, así que
 * sería el mismo control muerto que fue «Aviso diario» hasta F8. Antes un hueco
 * que un control que miente.
 *
 * **El aviso diario sí está** (F8): el interruptor es el del sistema de diseño
 * (C.3) y la fila es la del artboard 10 — «Su día, cada mañana», con la hora en
 * la segunda línea.
 *
 * ⚠️ **Cómo se cambia esa hora no lo dibuja el artboard**, que solo pinta el
 * interruptor. Aquí la abre tocar el texto de la fila, que es lo que ya cuenta
 * la hora; el carril sigue conmutando. Una fila aparte habría dicho la hora dos
 * veces en cuatro centímetros.
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
 *
 * **Y por eso el cuerpo scrollea, aunque el artboard no lo pida.** El 10 cabe
 * en los 844 px de un artboard; un móvil de verdad tiene menos alto útil, y con
 * el grupo de avisos dentro el contenido pasaba por debajo del pie fijo — el
 * aviso del veterinario encima de «Condiciones». Con `scroll`, donde sobra
 * sitio no se desplaza nada y se sigue viendo entero como pide el artboard;
 * donde no, se alcanza. Lo que no puede pasar es que se solape.
 *
 * **«Condiciones» va justo debajo**, y no está en el artboard 10: el 29 solo
 * se alcanzaba desde el paywall, y el paywall desaparece al comprar — quien ya
 * ha pagado es justamente quien puede necesitar releerlas. Van juntas porque
 * son la misma pregunta hecha dos veces: de dónde sale esto y a qué me he
 * comprometido.
 */
export default function Settings() {
  const { data: preferences } = usePreferences();
  const { data: subscription } = useSubscription();
  const reminder = useDailyReminder();
  const setReminder = useSetDailyReminder();
  const houseSystem = preferences?.houseSystem();

  // Solo después de intentarlo, y solo si está **bloqueado**: el aviso de que
  // el sistema no deja avisar se enseña a quien acaba de tocar el interruptor,
  // no a quien nunca lo ha tocado — ahí sería una advertencia sobre algo que no
  // ha pedido. Si el usuario cerró el diálogo sin contestar, el permiso sigue
  // siendo `askable` y no hay nada que explicar: vuelve a tocar y sale otra vez.
  const blocked = setReminder.data?.permission === 'blocked';

  return (
    <Screen
      insideTabs
      scroll
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

      {reminder ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{REMINDER_GROUP}</Text>
          <SwitchRow
            label={REMINDER_LABEL}
            note={reminderAt(reminder.hour(), reminder.minute())}
            value={reminder.isEnabled()}
            onChange={(enabled) => setReminder.mutate(reminder.switched(enabled))}
            onPressText={() => router.push('/settings/reminder-time')}
            textHint={REMINDER_TIME_HINT}
            disabled={setReminder.isPending}
          />
          {blocked ? <Text style={styles.blocked}>{REMINDER_DENIED}</Text> : null}
          {/* Programar puede fallar sin que el permiso tenga nada que ver, y
              antes eso no se veía: el interruptor se quedaba encendido y no
              llegaba ningún aviso. */}
          {setReminder.isError ? <Text style={styles.blocked}>{REMINDER_FAILED}</Text> : null}
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
        <View style={styles.divider} />
        <Row label={TERMS_TITLE} onPress={() => router.push('/terms')} />
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
  blocked: {
    ...typography.caption,
    color: colors.textFaint,
    paddingTop: spacing[2],
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
