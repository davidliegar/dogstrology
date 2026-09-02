import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { CloseMark } from '@/_ui/components/CloseMark';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { text } from '@/_ui/typography';
import type { NatalChart } from '@/chart/domain/NatalChart';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { formatPosition } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { dailyAxisCards } from '@/content/ui/dailyCards';
import { useDailyEdition } from '@/content/ui/dailyQueries';
import { DAILY_AXIS_LABELS } from '@/content/ui/labels';
import { useCalendarDay } from '@/content/ui/useCalendarDay';
import { usePet, usePets } from '@/pet/ui/petQueries';
import type { Plan, PlanId } from '@/subscription/domain/Plan';
import { formatMonthlyBreakdown, formatPurchaseCta, formatSavings } from '@/subscription/ui/format';
import {
  PAYWALL_CHART_BENEFIT,
  PAYWALL_CHART_OVERLINE,
  PAYWALL_DAILY_BENEFIT,
  PAYWALL_PETS_NOTE,
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

import { colors, elementColor, glow, radii, screenPadding, spacing, touchTarget, typography } from '@/design/theme';

/** Altos de fila del artboard 11: el ancla es más alta porque lleva dos líneas. */
const ANCHOR_HEIGHT = 76;
const PLAN_HEIGHT = 64;
/** Los precios van uno debajo de otro: sin cifras de ancho fijo, bailan. */
const TABULAR = { fontVariant: ['tabular-nums'] } as TextStyle;

/**
 * El paywall — artboard 11.
 *
 * **Oferta, no muro**: el aspa está arriba y a la vista desde el primer
 * momento, y no hay ni cuenta atrás ni contenido tapado detrás.
 *
 * **Se llega por tres puertas, cada una desde una falta distinta** (nota del
 * artboard, D19): tocar un fragmento bloqueado del día, entrar en la carta
 * natal, y añadir una segunda mascota. La oferta de Ajustes, arriba y una sola
 * vez, es la puerta fría: quien la toca ha ido a buscarla. Ninguna es un aviso
 * interpuesto — la puerta se pinta donde el usuario topa con el límite, y si no
 * topa, no se pinta: la pantalla que se abre cada mañana no pide nada.
 *
 * **Los dos beneficios van con el dato del perro**, no con una lista de
 * sustantivos: la misma tarjeta de la Luna que acaba de ver borrosa, con su
 * titular de hoy, y su Ascendente al grado. Una lista no se puede comprobar y
 * una tarjeta sí.
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
  // De qué perro se enseña el ejemplo. Lo dice la puerta que ha traído hasta
  // aquí —la tarjeta bloqueada sabe de quién era— y, si no lo dice (la oferta
  // fría de Ajustes, la fila de añadir), es el primero: con un perro por dueño
  // no hay ambigüedad, y con varios cualquiera de ellos enseña lo mismo.
  const { pet: petId } = useLocalSearchParams<{ pet?: string }>();
  const { data: pets } = usePets();
  const { data: named } = usePet(petId);
  const pet = named ?? pets?.[0];
  const { data: chart } = useNatalChart(pet);
  const today = useCalendarDay();
  const { data: edition } = useDailyEdition(today);

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
          {/* **El aviso va aquí y no al final del cuerpo**, que es donde
              estaba: con la tarjeta de beneficios y los tres planes por
              encima, quedaba fuera de pantalla y el usuario veía fallar la
              compra sin que nada se lo dijera. Visto en un móvil (2026-09-02).
              Un aviso sobre dinero se pone donde está el botón que lo
              provocó. */}
          {failed ? <Text style={styles.failed}>{PURCHASE_FAILED_NOTE}</Text> : null}
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

      <Benefits chart={chart} moon={dailyAxisCards(edition, chart).find((card) => card.axis === 'moon')} />

      <Text style={styles.petsNote}>{PAYWALL_PETS_NOTE}</Text>

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
    </Screen>
  );
}

/**
 * Los dos beneficios, en una tarjeta y con el dato del perro dentro (artboard
 * 11).
 *
 * **Es la misma tarjeta que estaba borrosa**, con el mismo rótulo teñido por
 * el elemento de su Luna y el mismo titular de hoy: quien llega desde el
 * candado reconoce lo que acaba de no poder leer, y esa continuidad es lo que
 * convierte la oferta en concreta.
 *
 * Lo que no hay, no se finge: sin lectura del día no se pinta titular, y sin
 * hora de nacimiento no hay grado que enseñar. La frase sigue siendo cierta
 * —el plan incluye el Ascendente al grado— y lo que desaparece es el ejemplo.
 */
function Benefits({
  chart,
  moon,
}: {
  chart: NatalChart | undefined;
  moon: ReturnType<typeof dailyAxisCards>[number] | undefined;
}) {
  const ascendant = chart?.ascendant();
  const moonSign = chart ? SIGN_LABELS[chart.moonSign()] : undefined;

  return (
    <View style={styles.benefits}>
      <View style={styles.benefit}>
        {moonSign ? (
          <Text style={[styles.benefitOverline, { color: elementColor(moon?.element ?? '') }]}>
            {`${DAILY_AXIS_LABELS.moon} · ${moonSign}`}
          </Text>
        ) : null}
        {moon ? <Text style={styles.benefitHeadline}>{moon.headline}</Text> : null}
        <Text style={styles.benefitBody}>{PAYWALL_DAILY_BENEFIT}</Text>
      </View>

      <View style={styles.benefitDivider} />

      <View style={styles.benefit}>
        <Text style={styles.benefitChartOverline}>{PAYWALL_CHART_OVERLINE}</Text>
        <Text style={styles.benefitBody}>
          {PAYWALL_CHART_BENEFIT}
          {ascendant ? (
            <Text style={[styles.benefitValue, TABULAR]}>
              {`: ${formatPosition({ degree: ascendant.degree, sign: SIGN_LABELS[ascendant.sign] })}`}
            </Text>
          ) : null}
          .
        </Text>
      </View>
    </View>
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
  /** La tarjeta de los dos beneficios: la misma caja que una del día. */
  benefits: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...glow.card,
    padding: screenPadding,
    gap: spacing[4],
  },
  benefit: {
    gap: spacing[3],
  },
  benefitDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  benefitOverline: {
    ...typography.overline,
  },
  benefitChartOverline: {
    ...typography.overline,
    color: colors.accent,
  },
  benefitHeadline: {
    ...typography.section,
    color: colors.text,
  },
  benefitBody: {
    ...typography.body,
    color: colors.textMuted,
  },
  /** Su grado, dentro de la frase: el dato es el que se destaca, no la frase. */
  benefitValue: {
    color: colors.text,
  },
  petsNote: {
    ...typography.caption,
    color: colors.textFaint,
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
    textAlign: 'center',
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
