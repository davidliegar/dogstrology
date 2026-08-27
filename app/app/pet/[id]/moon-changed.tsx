import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { useMoonSignChange, useNatalChart } from '@/chart/ui/chartQueries';
import { formatDegree } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import type { Sign } from '@/chart/domain/PlanetPosition';
import { usePet } from '@/pet/ui/petQueries';

import { colors, feedback, opacity, radii, spacing, typography } from '@/design/theme';

const ROW_HEIGHT = 64;

/** El grado nuevo es una cifra que se compara con la vieja: ancho fijo. */
const TABULAR = { fontVariant: ['tabular-nums'] } as TextStyle;

/**
 * F3 — "Su Luna cambió", artboard 19. Aparece **una sola vez**, justo después
 * de dar la hora, y solo cuando el signo lunar cambia de verdad.
 *
 * Existe porque callarlo sería lo más caro que puede hacer esta app: si
 * afirmamos un signo lunar y luego lo cambiamos en silencio, todo lo que
 * dijimos antes queda en duda. Así que se dice, con las dos versiones a la
 * vista y el tachado sobre la que ya no vale.
 *
 * **Solo cuando cambia el signo, no cuando se afina el grado.** Pasar de
 * 22°08′ a 25°36′ del mismo signo no cambia nada de lo que el usuario leyó, y
 * un aviso por eso sería ruido que enseña a ignorar los avisos de verdad.
 * Por eso el titular puede ser tan concreto como "no está en Cáncer".
 *
 * El punto del valor nuevo es **salvia y no oro**: es el mismo verde de "carta
 * completa". Llegar aquí es una mejora, no un error que se corrige.
 */
export default function MoonChanged() {
  const { id, previous } = useLocalSearchParams<{ id: string; previous: Sign }>();
  const { data: pet } = usePet(id);
  const { data: chart } = useNatalChart(pet);
  const { data: change } = useMoonSignChange(pet);

  const moon = chart?.planet('moon');
  const unchanged = Boolean(moon) && moon?.sign() === previous;

  // Si al final el signo no cambió, esta pantalla no tiene nada que decir y no
  // debe quedarse en la pila: se sustituye por la carta, sin parpadeo.
  useEffect(() => {
    if (unchanged) router.replace({ pathname: '/pet/[id]/chart', params: { id } });
  }, [unchanged, id]);

  if (!pet || !chart || !moon || unchanged) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const birthTime = pet.birth().time();
  // Sin lugar no hay Ascendente ni casas: entonces lo único que cambió fue la Luna.
  const alsoChanged = chart.hasAscendant() ? 'Su Luna, su Ascendente y sus doce casas' : 'Su Luna';

  return (
    <Screen
      stars="moonChange"
      gap={spacing[6]}
      footer={
        <PrimaryButton
          label="Ver su carta completa"
          onPress={() => router.replace({ pathname: '/pet/[id]/chart', params: { id } })}
        />
      }
    >
      <View style={styles.headline}>
        <Text style={styles.overline}>Con la hora ya se sabe</Text>
        <Text style={styles.hero}>Su Luna no está en {SIGN_LABELS[previous]}</Text>
      </View>

      <View>
        <View style={[styles.row, styles.before]}>
          <View style={styles.side}>
            <View style={styles.dot} />
            <Text style={styles.beforeLabel}>Antes, sin hora</Text>
          </View>
          <Text style={styles.struck}>{SIGN_LABELS[previous]} aprox.</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.side}>
            <View style={[styles.dot, styles.dotNow]} />
            <Text style={styles.nowLabel}>Ahora</Text>
          </View>
          <Text style={[styles.now, TABULAR]}>
            {formatDegree(moon.degree())} {SIGN_LABELS[moon.sign()]}
          </Text>
        </View>
      </View>

      {/* El porqué, y es un hecho comprobable del cielo, no una disculpa. */}
      {change && birthTime ? (
        <View style={styles.card}>
          <Text style={styles.body}>
            Nació a las {birthTime}, y ese día la Luna pasó a {SIGN_LABELS[change.to]} a las {change.localTime}. Con
            el mediodía como suposición caía justo al otro lado.
          </Text>
          <View>
            <Text style={styles.cardLabel}>Lo que cambia</Text>
            <Text style={styles.caption}>{alsoChanged}</Text>
          </View>
        </View>
      ) : null}

      {/* Lo que **no** cambió, que es lo que el usuario ya había leído. */}
      <Text style={styles.footnote}>
        Su Sol sigue en {SIGN_LABELS[chart.sunSign()]}: eso no dependía de la hora.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headline: {
    gap: spacing[4],
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
  },
  hero: {
    ...typography.hero,
    color: colors.text,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  before: {
    opacity: opacity.disabled,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: feedback.attention,
    flexShrink: 0,
  },
  dotNow: {
    backgroundColor: feedback.positive,
  },
  beforeLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  nowLabel: {
    ...typography.body,
    color: colors.text,
  },
  struck: {
    ...typography.bodyEmphasis,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  now: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  card: {
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  cardLabel: {
    ...typography.overline,
    color: colors.textFaint,
    paddingBottom: spacing[1],
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footnote: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
