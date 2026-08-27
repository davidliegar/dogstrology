import { StyleSheet, Text, View } from 'react-native';

import { colors, controlGap, feedback, spacing, radii, typography } from '@/design/theme';
import type { ChartConfidence } from '../domain/NatalChart';
import { confidenceSegments } from './format';
import { CONFIDENCE_LABELS } from './labels';

const SEGMENTS = 3;
const BAR_HEIGHT = 6;
const DOT = 8;

export interface ConfidenceMeterProps {
  confidence: ChartConfidence;
}

/**
 * Barra de confianza de la carta (artboard 9, pie de la pantalla).
 *
 * Es la tercera vez que la misma pantalla dice el estado del dato, y a
 * propósito: el aviso de arriba lo explica, el campo vacío lo enseña, y esto
 * lo cuantifica. La nota del canvas lo deja escrito.
 *
 * El primer segmento va en verde y el resto en oro, siguiendo el artboard: la
 * fecha —lo único que siempre hay— es un dato completo, y lo que se añade
 * encima es mejora. El segmento apagado usa `divider`, no un gris nuevo.
 */
export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const lit = confidenceSegments(confidence);
  const complete = confidence === 'full';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Confianza de la carta</Text>
        <View style={styles.level}>
          <View style={[styles.dot, complete && styles.dotComplete]} />
          <Text style={styles.levelLabel}>{CONFIDENCE_LABELS[confidence]}</Text>
        </View>
      </View>
      <View
        style={styles.bar}
        accessibilityRole="progressbar"
        accessibilityLabel={`Confianza de la carta: ${CONFIDENCE_LABELS[confidence]}`}
        accessibilityValue={{ min: 0, max: SEGMENTS, now: lit }}
      >
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < lit && (index === 0 ? styles.segmentFirst : styles.segmentLit),
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.body,
    color: colors.textMuted,
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: controlGap,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  dotComplete: {
    backgroundColor: feedback.positive,
  },
  levelLabel: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  bar: {
    flexDirection: 'row',
    gap: controlGap,
  },
  segment: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
  },
  segmentFirst: {
    backgroundColor: feedback.positive,
  },
  segmentLit: {
    backgroundColor: colors.accent,
  },
});
