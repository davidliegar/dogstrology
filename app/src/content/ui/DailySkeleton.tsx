import { StyleSheet, View, type DimensionValue } from 'react-native';

import { colors, radii, screenPadding, spacing } from '@/design/theme';

/** El disco de la tira de la Luna, del artboard 04. */
const DISC = 36;

/**
 * La profundidad de cada tarjeta. Es la cascada de 70 ms **congelada**: la
 * primera llega, la segunda viene y la tercera se intuye. Sale del artboard 15
 * tal cual (1 · 0,55 · 0,25).
 */
const DEPTH = [1, 0.55, 0.25] as const;

/**
 * Las barras de prosa van más apagadas que las de titular, igual que el texto
 * de verdad va en `textMuted` bajo un titular en `text`. Es una opacidad de
 * dibujo y vive aquí, como las de `NatalWheel` y las del halo de una
 * constelación — `theme.opacity` es para estados de interacción.
 */
const BODY_INK = 0.6;

/**
 * La silueta de Hoy mientras se descarga el día (artboard 15).
 *
 * **Sin rueda giratoria**, y no por gusto: la silueta dice cuántas tarjetas
 * vienen y de qué tamaño, así que la pantalla no da un salto al llegar el
 * contenido. La regla que el artboard deja escrita vale para toda la app —
 * *solo se ausenta lo que se está calculando*: la cabecera y la barra de
 * pestañas están completas porque su contenido no depende de la descarga, y el
 * campo estelar sigue parpadeando porque es lo que distingue una espera de una
 * pantalla congelada.
 */
export function DailySkeleton() {
  return (
    <>
      <View style={styles.strip}>
        <View style={styles.disc} />
        <View style={styles.stripText}>
          <Bar height={12} width="70%" />
          <Bar height={10} width="45%" dim />
        </View>
      </View>

      <View style={[styles.card, styles.featured]}>
        <Bar height={11} width="38%" accent />
        <View style={styles.lines}>
          <Bar height={18} width="92%" />
          <Bar height={18} width="64%" />
        </View>
        <View style={styles.lines}>
          <Bar height={12} width="100%" dim />
          <Bar height={12} width="88%" dim />
          <Bar height={12} width="52%" dim />
        </View>
      </View>

      <View style={[styles.card, { opacity: DEPTH[1] }]}>
        <Bar height={11} width="44%" />
        <Bar height={18} width="80%" />
        <View style={styles.lines}>
          <Bar height={12} width="96%" dim />
          <Bar height={12} width="70%" dim />
        </View>
      </View>

      <View style={[styles.card, { opacity: DEPTH[2] }]}>
        <Bar height={11} width="40%" />
        <Bar height={18} width="72%" />
      </View>
    </>
  );
}

function Bar({
  height,
  width,
  dim = false,
  accent = false,
}: {
  height: number;
  width: DimensionValue;
  dim?: boolean;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.bar,
        { height, width, backgroundColor: accent ? colors.accentSoft : colors.surfaceRaised },
        dim && styles.dim,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    flexShrink: 0,
  },
  stripText: {
    flex: 1,
    gap: spacing[2],
  },
  card: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: screenPadding,
    gap: spacing[4],
  },
  featured: {
    borderColor: colors.border,
  },
  lines: {
    gap: spacing[2],
  },
  bar: {
    borderRadius: radii.pill,
  },
  dim: {
    opacity: BODY_INK,
  },
});
