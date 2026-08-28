import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { text } from '@/_ui/typography';
import type { NatalChart } from '../domain/NatalChart';
import { PLANET_GLYPHS } from './glyphs';
import { CONFIDENCE_LABELS, SIGN_LABELS } from './labels';

import { colors, glyphSize, radii, spacing, typography } from '@/design/theme';

/** Alto de la banda del glifo. Fijo, para que las tres tarjetas alineen. */
const GLYPH_BAND = 20;

export interface ChartTrioProps {
  chart: NatalChart;
}

/**
 * Sol · Luna · Ascendente (artboard 25).
 *
 * Está en el hub porque **es lo que identifica a la mascota en una línea**, y
 * repetirlo aquí evita entrar en la carta para recordarlo. No navega: es un
 * resumen, y quien quiera el detalle tiene la fila de "Su carta natal" justo
 * debajo.
 *
 * **La degradación se hereda, no se decide.** Sin Ascendente la tercera
 * tarjeta pasa a trazo discontinuo y dice qué falta — es la misma gramática
 * que la rueda del artboard 14, donde el disco dudoso va a trazos. La insignia
 * de C.2b **no** se pinta aquí: el trazo ya lo dice, y la insignia le toca a
 * la fila de datos, que es a donde hay que ir a arreglarlo.
 */
export function ChartTrio({ chart }: ChartTrioProps) {
  const ascendant = chart.ascendant();

  return (
    <View style={styles.row}>
      <Card glyph={PLANET_GLYPHS.sun} value={SIGN_LABELS[chart.sunSign()]} caption="Sol" />
      <Card glyph={PLANET_GLYPHS.moon} value={SIGN_LABELS[chart.moonSign()]} caption="Luna" />
      {ascendant ? (
        <Card glyph="ASC" glyphStyle={styles.angleGlyph} value={SIGN_LABELS[ascendant.sign]} caption="Ascendente" />
      ) : (
        <Card
          glyph="ASC"
          glyphStyle={[styles.angleGlyph, styles.missingGlyph]}
          // "Sin hora" o "Sin lugar": la etiqueta nombra lo que falta, que es
          // lo accionable, y sale de la misma tabla que la barra de confianza.
          value={CONFIDENCE_LABELS[chart.confidence()]}
          valueStyle={styles.missingValue}
          caption="Ascendente"
          missing
        />
      )}
    </View>
  );
}

function Card({
  glyph,
  glyphStyle,
  value,
  valueStyle,
  caption,
  missing = false,
}: {
  glyph: string;
  glyphStyle?: StyleProp<TextStyle>;
  value: string;
  valueStyle?: StyleProp<TextStyle>;
  caption: string;
  missing?: boolean;
}) {
  return (
    <View style={[styles.card, missing && styles.cardMissing]}>
      <Text style={[styles.glyph, glyphStyle]}>{glyph}</Text>
      <Text style={[styles.value, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  card: {
    flex: 1,
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    alignItems: 'center',
    gap: spacing[2],
  },
  cardMissing: {
    // Sin relleno y a trazos: la tarjeta sigue ocupando su sitio —el
    // Ascendente existe, solo que no se puede calcular— pero no finge dato.
    backgroundColor: colors.transparent,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  glyph: {
    height: GLYPH_BAND,
    lineHeight: GLYPH_BAND,
    fontSize: glyphSize.compact,
    color: colors.accent,
  },
  angleGlyph: {
    ...typography.overline,
    lineHeight: GLYPH_BAND,
    color: colors.accent,
  },
  missingGlyph: {
    color: colors.textFaint,
  },
  value: {
    ...text('ephemeris'),
    color: colors.text,
    textAlign: 'center',
  },
  missingValue: {
    color: colors.textFaint,
  },
  caption: {
    ...typography.tabLabel,
    color: colors.textFaint,
  },
});
