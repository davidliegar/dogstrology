import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { CloseMark } from '@/_ui/components/CloseMark';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { text } from '@/_ui/typography';
import type { Plan, PlanId } from '@/subscription/domain/Plan';
import { formatMonthlyBreakdown, formatSavings } from '@/subscription/ui/format';
import {
  PAYWALL_BENEFITS,
  PAYWALL_CTA,
  PAYWALL_TITLE,
  PLAN_LABELS,
  PREMIUM_NAME,
  PURCHASE_FAILED_NOTE,
  RESTORE_LABEL,
} from '@/subscription/ui/labels';
import {
  isPurchaseCancelled,
  usePlans,
  usePurchasePlan,
  useRestorePurchases,
} from '@/subscription/ui/subscriptionQueries';

import { colors, radii, spacing, touchTarget, typography } from '@/design/theme';

/** Altos de fila del artboard 11: el ancla es más alta porque lleva dos líneas. */
const ANCHOR_HEIGHT = 76;
const PLAN_HEIGHT = 64;
/** Punto que precede a cada ventaja. Mismo diámetro que el del `Chip`. */
const BULLET = 6;

/** Los precios van uno debajo de otro: sin cifras de ancho fijo, bailan. */
const TABULAR = { fontVariant: ['tabular-nums'] } as TextStyle;

/**
 * El paywall — artboard 11.
 *
 * **Oferta, no muro**: el aspa está arriba y a la vista desde el primer
 * momento, y no hay ni cuenta atrás ni contenido tapado detrás. Se llega por
 * dos puertas y solo dos (nota del artboard): la oferta de Ajustes, que es la
 * fría, y la fila de añadir mascota del 26, que es la caliente. En Hoy no hay
 * ninguna — el MVP no cobra por el día.
 *
 * **Tocar un plan lo compra.** El filo de oro del anual no es una selección
 * que se mueva al tocar otro: la nota dice «único plan con filo de oro», así
 * que es el tratamiento fijo del ancla, igual que su desglose mensual. El
 * botón de abajo compra el ancla, que es la que está resaltada. La hoja de
 * compra de la tienda sigue siendo la confirmación, así que nadie paga por
 * tocar de más.
 *
 * Falta «Condiciones», que el artboard pinta junto a «Restaurar compra»: no
 * hay ni pantalla ni URL de condiciones escritas todavía, y una fila que no
 * lleva a ninguna parte es justo el control que miente. Es un hueco anotado,
 * y hace falta cerrarlo **antes de publicar**: una suscripción sin condiciones
 * enlazadas no pasa la ficha.
 */
export default function Paywall() {
  const { data: plans } = usePlans();
  const purchase = usePurchasePlan();
  const restore = useRestorePurchases();

  const anchor = plans?.find((plan) => plan.isAnchor());
  const monthly = plans?.find((plan) => plan.id() === 'monthly');
  const busy = purchase.isPending || restore.isPending;

  // Cancelar no se cuenta como fallo: cerrar la hoja de la tienda es una
  // decisión, y contestarla con un aviso sería regañar a quien solo miraba.
  const failed = purchase.isError && !isPurchaseCancelled(purchase.error);

  // Comprado, la pantalla se va sola: el usuario venía de otro sitio con algo
  // que hacer, y quedarse en la oferta que acaba de aceptar no es un destino.
  const buy = (planId: PlanId) => {
    purchase.mutate(planId, { onSuccess: () => router.back() });
  };

  return (
    <Screen
      deep
      stars="paywall"
      scroll
      align="flex-start"
      gap={spacing[5]}
      header={
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            style={styles.close}
          >
            <CloseMark />
          </Pressable>
        </View>
      }
      footer={
        <>
          <PrimaryButton
            label={PAYWALL_CTA}
            loading={purchase.isPending}
            disabled={!anchor || busy}
            onPress={() => anchor && buy(anchor.id())}
          />
          <Pressable
            onPress={() => restore.mutate()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={RESTORE_LABEL}
            style={styles.restore}
          >
            <Text style={styles.restoreLabel}>{RESTORE_LABEL}</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.headline}>
        <Text style={styles.overline}>{PREMIUM_NAME}</Text>
        <Text style={styles.title}>{PAYWALL_TITLE}</Text>
      </View>

      <View style={styles.benefits}>
        {PAYWALL_BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <View style={styles.bullet} />
            <Text style={styles.benefitLabel}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        {plans ? (
          plans.map((plan) => (
            <PlanRow
              key={plan.id()}
              plan={plan}
              monthly={monthly}
              disabled={busy}
              onPress={() => buy(plan.id())}
            />
          ))
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>

      {failed ? <Text style={styles.failed}>{PURCHASE_FAILED_NOTE}</Text> : null}
    </Screen>
  );
}

/**
 * Una fila de plan. El ancla es la única con filo de oro, precio en Fraunces y
 * las dos líneas de más —el desglose mensual y el ahorro—: es lo que la
 * convierte en ancla, y si lo llevara otra dejaría de haberla.
 */
function PlanRow({
  plan,
  monthly,
  disabled,
  onPress,
}: {
  plan: Plan;
  monthly: Plan | undefined;
  disabled: boolean;
  onPress: () => void;
}) {
  const anchor = plan.isAnchor();
  const breakdown = anchor ? formatMonthlyBreakdown(plan) : undefined;
  const savings = anchor ? formatSavings(plan.savingsAgainst(monthly)) : undefined;
  const label = PLAN_LABELS[plan.id()];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${plan.priceLabel()}`}
      style={({ pressed }) => [
        styles.plan,
        anchor ? styles.anchor : styles.plain,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.planNames}>
        <Text style={anchor ? styles.anchorName : styles.planName}>{label}</Text>
        {breakdown ? <Text style={styles.breakdown}>{breakdown}</Text> : null}
      </View>
      <View style={styles.planPrices}>
        <Text style={[anchor ? styles.anchorPrice : styles.planPrice, TABULAR]}>{plan.priceLabel()}</Text>
        {savings ? <Text style={styles.savings}>{savings}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: touchTarget + spacing[3],
    paddingHorizontal: spacing[5],
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  close: {
    width: touchTarget,
    height: touchTarget,
    marginRight: -spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    gap: spacing[3],
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  benefits: {
    gap: spacing[1],
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  bullet: {
    width: BULLET,
    height: BULLET,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  benefitLabel: {
    ...typography.body,
    color: colors.textMuted,
    flexShrink: 1,
  },
  plans: {
    gap: spacing[3],
  },
  plan: {
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
    paddingHorizontal: spacing[5],
  },
  /**
   * Sin halo: `glow.accent` sobre una superficie opaca se puede, pero el
   * artboard lo pinta con `box-shadow`, que en React Native se dibuja bajo
   * **toda** la caja. El filo de oro y el relleno son lo que las dos
   * plataformas pintan igual (nota de `theme.glow`).
   */
  anchor: {
    height: ANCHOR_HEIGHT,
    borderColor: colors.accent,
  },
  plain: {
    height: PLAN_HEIGHT,
    borderColor: colors.divider,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
  planNames: {
    gap: spacing[1],
    flexShrink: 1,
  },
  planPrices: {
    gap: spacing[1],
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  planName: {
    ...typography.body,
    color: colors.textMuted,
  },
  anchorName: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  breakdown: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
  planPrice: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  anchorPrice: {
    ...typography.section,
    color: colors.text,
  },
  savings: {
    ...typography.overline,
    color: colors.accent,
  },
  failed: {
    ...typography.caption,
    color: colors.textMuted,
  },
  restore: {
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
