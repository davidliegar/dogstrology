import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { text } from '@/_ui/typography';
import { MoonDisc } from '@/chart/ui/MoonDisc';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatPosition, formatSkyMoment } from '@/chart/ui/format';
import { MOON_PHASE_LABELS, SIGN_LABELS } from '@/chart/ui/labels';
import { moonTodayMeta } from '@/chart/ui/moonPhase';
import { useMoonPhaseSky } from '@/content/ui/contentQueries';
import { usePets } from '@/pet/ui/petQueries';

import { colors, screenPadding, spacing, typography } from '@/design/theme';

/** Lo que el disco ocupa del ancho útil. Del artboard: 220 de 342. */
const DISC_RATIO = 0.64;
/** Alto de cada fila de la ficha de abajo. Del artboard. */
const ROW_HEIGHT = 56;

/**
 * La Luna hoy (artboard 07) — F7.
 *
 * **Es del cielo, no de la mascota**, y por eso se sostiene sin ninguna: la
 * fase, la iluminación, el día del ciclo, el cambio de signo y la próxima
 * luna nueva son el mismo cielo para todos los perros. Lo único que la
 * mascota aporta es la última fila, que desaparece si no hay carta.
 *
 * Es la pantalla donde **la imagen manda sobre el texto** (nota del canvas), y
 * la única razón de que el fondo sea el azul profundo: el disco a 220 px con
 * su resplandor es el contenido, y todo lo demás lo acompaña.
 *
 * El disco lleva **el terminador de verdad**, calculado de la iluminación,
 * igual que en la ficha de una fase. El artboard lo resuelve con una sombra
 * interior de borde recto, que solo sería correcta en un cuarto: con 62 % la
 * sombra es media elipse, y el propio artboard 23 ya lo dice.
 */
export default function MoonToday() {
  const { data: pets } = usePets();
  const pet = pets?.[0];
  const { data: chart } = useNatalChart(pet);
  const { data: moon } = useMoonSky();
  const { data: fragment } = useMoonPhaseSky(moon?.phase.name);
  const { width } = useWindowDimensions();

  if (!moon) {
    return (
      <Screen deep stars="moonToday" header={<ScreenHeader title="La Luna hoy" onBack={() => router.back()} />}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  const { phase, ingress, nextNewMoon } = moon;
  const natalMoon = chart?.planet('moon');
  const disc = Math.round((width - screenPadding * 2) * DISC_RATIO);

  return (
    <Screen
      deep
      stars="moonToday"
      gap={spacing[6]}
      header={<ScreenHeader title="La Luna hoy" onBack={() => router.back()} />}
      footer={
        <View style={styles.rows}>
          {/* La Luna cruza de signo cada dos días y medio, así que siempre hay
              un próximo cruce: la fila solo falta si el motor no lo encuentra. */}
          {ingress ? (
            <Row label={`Entra en ${SIGN_LABELS[ingress.to]}`} value={formatSkyMoment(ingress.at)} divided={false} />
          ) : null}
          <Row label="Luna nueva" value={formatSkyMoment(nextNewMoon)} divided={Boolean(ingress)} />
          {/* Lo único de la pantalla que es suyo. Sin mascota, no hay fila. */}
          {natalMoon ? (
            <Row
              label="Su Luna natal"
              value={formatPosition({ degree: natalMoon.degree(), sign: SIGN_LABELS[natalMoon.sign()] })}
              divided
            />
          ) : null}
        </View>
      }
    >
      <View style={styles.moon}>
        <MoonDisc
          illumination={phase.illumination}
          // Del ángulo real y no del nombre de la fase: aquí hay instante, así
          // que la luz se retira exactamente cuando el ángulo pasa de 180.
          waning={phase.angle >= 180}
          size={disc}
          label={MOON_PHASE_LABELS[phase.name]}
          glow
        />
      </View>

      <View style={styles.identity}>
        <Text style={styles.title}>{MOON_PHASE_LABELS[phase.name]}</Text>
        <Text style={styles.meta}>{moonTodayMeta(phase)}</Text>
        {fragment ? <Text style={styles.body}>{fragment.body()}</Text> : null}
      </View>
    </Screen>
  );
}

function Row({ label, value, divided }: { label: string; value: string; divided: boolean }) {
  return (
    <>
      {divided ? <View style={styles.divider} /> : null}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  moon: {
    alignItems: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: spacing[3],
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  meta: {
    ...text('ephemeris'),
    color: colors.textFaint,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing[2],
  },
  rows: {
    gap: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rowLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  rowValue: {
    ...text('ephemeris'),
    color: colors.text,
  },
});
