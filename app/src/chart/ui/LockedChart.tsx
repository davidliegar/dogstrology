import { StyleSheet, Text, View } from 'react-native';

import { Lock } from '@/_ui/components/Lock';
import { Veil } from '@/_ui/components/Veil';
import { text } from '@/_ui/typography';
import type { NatalChart } from '../domain/NatalChart';
import { NatalWheel } from './NatalWheel';
import { formatPosition } from './format';
import {
  LOCKED_CHART_OVERLINE,
  LOCKED_CHART_ROWS,
  LOCKED_WHEEL_LABEL,
  SIGN_LABELS,
  lockedChartTitle,
} from './labels';

import { colors, radii, screenPadding, spacing, typography } from '@/design/theme';

/**
 * Lado de la rueda velada, del artboard 37. Menos que los 342 de la carta
 * abierta, y por una razón de sitio: debajo van tres filas y un botón que en
 * la carta de verdad no están.
 */
const WHEEL = 300;

/** Alto de cada una de las tres filas, el mismo del artboard 05. */
const ROW_HEIGHT = 56;

export interface LockedChartProps {
  chart: NatalChart;
  /** Ancho disponible del cuerpo de la pantalla. */
  width: number;
}

/**
 * La carta natal sin «Dogstrology Cósmico» — artboard 37 (D19).
 *
 * **Se bloquea, no se quita**: debajo del velo está su carta de verdad, la
 * calculada con sus efemérides, y no una rueda de adorno. Es lo que hace que
 * el borroso sea una promesa comprobable.
 *
 * Tres piezas, y cada una hace un trabajo distinto:
 *
 * - **El titular, en claro.** Los tres signos ya se dieron en la revelación
 *   del onboarding; taparlos sería mentir sobre lo que la app regaló.
 * - **La rueda entera difuminada**, con el candado en el centro y el rótulo
 *   que nombra lo que se está tapando.
 * - **Tres filas con palabras**, porque un borroso enseña que hay algo pero no
 *   explica qué se compra. La del Ascendente lleva su grado difuminado al
 *   lado: el dato existe y está calculado, solo está corrido.
 */
export function LockedChart({ chart, width }: LockedChartProps) {
  const ascendant = chart.ascendant();
  const size = Math.min(width, WHEEL);

  return (
    <>
      <View style={styles.head}>
        <View style={styles.headRow}>
          <Text style={styles.overline}>{LOCKED_CHART_OVERLINE}</Text>
          <Lock />
        </View>
        <Text style={styles.title}>
          {lockedChartTitle({
            sun: SIGN_LABELS[chart.sunSign()],
            moon: SIGN_LABELS[chart.moonSign()],
            ascendant: ascendant ? SIGN_LABELS[ascendant.sign] : undefined,
          })}
        </Text>
      </View>

      <View style={[styles.wheel, { height: size }]}>
        <NatalWheel chart={chart} size={size} veiled />
        <View style={styles.wheelLabel} pointerEvents="none">
          <Lock color={colors.accent} />
          <Text style={styles.wheelLabelText}>{LOCKED_WHEEL_LABEL}</Text>
        </View>
      </View>

      <View>
        <LockedRow label={LOCKED_CHART_ROWS.houses} />
        <LockedRow label={LOCKED_CHART_ROWS.aspects} />
        {/*
          La fila del Ascendente **no se cae sin hora**, igual que en la carta
          abierta: enseña qué se gana con el dato. Lo que se cae es su valor,
          porque sin hora no hay ninguno que difuminar.
        */}
        <LockedRow
          label={LOCKED_CHART_ROWS.ascendant}
          value={
            ascendant
              ? formatPosition({ degree: ascendant.degree, sign: SIGN_LABELS[ascendant.sign] })
              : undefined
          }
        />
      </View>
    </>
  );
}

function LockedRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        {value ? (
          <Veil background={colors.background} radius={radii.s}>
            <Text style={styles.value}>{value}</Text>
          </Veil>
        ) : null}
        <Lock />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: spacing[3],
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
    flexShrink: 1,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  wheel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingHorizontal: screenPadding,
  },
  wheelLabelText: {
    ...typography.bodyEmphasis,
    color: colors.text,
    textAlign: 'center',
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textMuted,
    flexShrink: 1,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flexShrink: 0,
  },
  value: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
});
