import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { CloseMark } from '@/_ui/components/CloseMark';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { text } from '@/_ui/typography';
import type { Plan, PlanId } from '@/subscription/domain/Plan';
import { formatMonthlyBreakdown, formatPurchaseCta, formatSavings } from '@/subscription/ui/format';
import {
  PAYWALL_BENEFITS,
  PAYWALL_TITLE,
  PLAN_LABELS,
  PREMIUM_NAME,
  PURCHASE_FAILED_NOTE,
  RESTORE_LABEL,
  TERMS_LINK,
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
 * **Tocar un plan lo selecciona; comprar lo hace el botón, y uno solo.** El
 * filo de oro marca el plan elegido y arranca en el anual porque es el
 * recomendado. Filas que compraran al tocarlas dejarían tres puntos de compra
 * en una pantalla que tiene un botón, y con «Para siempre» a 29,99 € el roce
 * cuesta caro. Por eso el rótulo del botón **dice qué compra** en vez de un
 * «Empezar» a secas: con tres precios arriba, el botón tiene que poder leerse
 * solo.
 *
 * El desglose mensual y el «Ahorras» siguen siendo del anual y no se mueven
 * con la selección: son propiedades del plan, no del estado de la pantalla.
 */
export default function Paywall() {
  const { data: plans } = usePlans();
  const purchase = usePurchasePlan();
  const restore = useRestorePurchases();

  // Mientras no se toque nada, el elegido es el ancla. Se guarda la elección
  // del usuario y no el ancla misma: los planes llegan después del primer
  // fotograma, y sembrar el estado con lo que todavía no ha cargado dejaría la
  // pantalla sin ninguna fila marcada.
  const [chosen, setChosen] = useState<PlanId>();

  const anchor = plans?.find((plan) => plan.isAnchor());
  const monthly = plans?.find((plan) => plan.id() === 'monthly');
  const selectedId = chosen ?? anchor?.id() ?? plans?.[0]?.id();
  const selected = plans?.find((plan) => plan.id() === selectedId);
  const busy = purchase.isPending || restore.isPending;

  // Cancelar no se cuenta como fallo: cerrar la hoja de la tienda es una
  // decisión, y contestarla con un aviso sería regañar a quien solo miraba.
  const failed = purchase.isError && !isPurchaseCancelled(purchase.error);

  // Comprado, la pantalla se va sola: el usuario venía de otro sitio con algo
  // que hacer, y quedarse en la oferta que acaba de aceptar no es un destino.
  const buy = () => {
    if (selectedId === undefined) return;
    purchase.mutate(selectedId, { onSuccess: () => router.back() });
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
            label={formatPurchaseCta(selected)}
            loading={purchase.isPending}
            disabled={!selected || busy}
            onPress={buy}
          />
          {/* Los dos enlaces del pie del artboard. «Condiciones» es pantalla y
              no enlace al navegador: sacar al usuario del móvil en medio de una
              compra es donde se abandona. */}
          <View style={styles.links}>
            <Pressable
              onPress={() => restore.mutate()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={RESTORE_LABEL}
              style={styles.link}
            >
              <Text style={styles.linkLabel}>{RESTORE_LABEL}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/terms')}
              accessibilityRole="button"
              accessibilityLabel={TERMS_LINK}
              style={styles.link}
            >
              <Text style={styles.linkLabel}>{TERMS_LINK}</Text>
            </Pressable>
          </View>
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
              selected={plan.id() === selectedId}
              disabled={busy}
              onPress={() => setChosen(plan.id())}
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
 * Una fila de plan, que **selecciona y no compra**. El filo de oro es la
 * marca de la selección y se mueve con ella; el desglose mensual y el ahorro
 * se quedan en el anual pase lo que pase, porque son suyos.
 *
 * El ancla es más alta aunque no esté elegida: sus dos líneas ocupan lo que
 * ocupan, y una fila que cambiara de alto al tocarla haría saltar la lista
 * bajo el dedo.
 */
function PlanRow({
  plan,
  monthly,
  selected,
  disabled,
  onPress,
}: {
  plan: Plan;
  monthly: Plan | undefined;
  selected: boolean;
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
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${label}, ${plan.priceLabel()}`}
      style={({ pressed }) => [
        styles.plan,
        anchor ? styles.anchorHeight : styles.plainHeight,
        selected ? styles.selected : styles.unselected,
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
  /** El alto es del plan, no de la selección: si cambiara al tocar, la lista
   * saltaría bajo el dedo. */
  anchorHeight: {
    height: ANCHOR_HEIGHT,
  },
  plainHeight: {
    height: PLAN_HEIGHT,
  },
  /**
   * Sin halo: `glow.accent` sobre una superficie opaca se puede, pero el
   * artboard lo pinta con `box-shadow`, que en React Native se dibuja bajo
   * **toda** la caja. El filo de oro y el relleno son lo que las dos
   * plataformas pintan igual (nota de `theme.glow`).
   */
  selected: {
    borderColor: colors.accent,
  },
  unselected: {
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
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[5],
  },
  link: {
    height: touchTarget,
    justifyContent: 'center',
  },
  linkLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
