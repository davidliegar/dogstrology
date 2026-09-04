import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { Sheet } from '@/_ui/components/Sheet';
import { useAscendantPersonality } from '@/content/ui/contentQueries';
import { elementOfSign } from '../domain/PlanetPosition';
import type { AnglePositionData } from '../domain/NatalChart';
import { formatDegree } from './format';
import { ASCENDANT_LABEL, ASCENDANT_NOTE, ELEMENT_LABELS, SIGN_LABELS } from './labels';

import { colors, elementColor, spacing, typography } from '@/design/theme';

/** El título es un grado y baila si las cifras no son de ancho fijo. */
const TABULAR = { fontVariant: ['tabular-nums'] } as TextStyle;

export interface AscendantSheetProps {
  ascendant: AnglePositionData;
  onClose: () => void;
}

/**
 * Hoja del Ascendente (D21) — la hermana pequeña de `PlanetSheet`.
 *
 * **Pequeña porque el Ascendente tiene menos que contar, no porque se le haya
 * recortado.** No es un cuerpo: no se mueve a una velocidad, no cae en una
 * casa —*es* la cúspide de la primera— y en este modelo no hace aspectos. Lo
 * que tiene es un signo, un grado y un texto propio, y eso es lo que enseña.
 * Fingir la maqueta de la hoja de un planeta habría dejado tres huecos donde
 * el usuario esperaría datos.
 *
 * El texto sale de `species=dog;ascendant=<signo>` y **no** del retrato del
 * signo solar: son dos lecturas distintas del mismo signo, y en un perro con
 * Sol y Ascendente en Escorpio se vería enseguida que es el mismo párrafo.
 */
export function AscendantSheet({ ascendant, onClose }: AscendantSheetProps) {
  const { data: fragment, isError } = useAscendantPersonality(ascendant.sign);
  const element = elementOfSign(ascendant.sign);

  return (
    <Sheet onClose={onClose}>
      <View style={styles.headline}>
        <View style={styles.identity}>
          <Text style={styles.overline}>{ASCENDANT_LABEL}</Text>
          <Text style={[styles.position, TABULAR]}>
            {formatDegree(ascendant.degree)} {SIGN_LABELS[ascendant.sign]}
          </Text>
        </View>
        <Chip label={ELEMENT_LABELS[element]} dotColor={elementColor(element)} />
      </View>

      {/* Qué es un Ascendente, en una línea. La lleva esta hoja y no la del
          planeta porque el Sol y la Luna se explican solos por el nombre, y
          este no: mucha gente llega sabiendo que "tiene uno" y poco más. */}
      <Text style={styles.note}>{ASCENDANT_NOTE}</Text>

      {fragment ? <Text style={styles.body}>{fragment.body()}</Text> : null}

      {/* Mismo trato que en la hoja de un planeta: el dato es correcto aunque
          el texto no esté. */}
      {isError ? <Text style={styles.body}>Su texto no se pudo abrir. El grado es correcto.</Text> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  headline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  identity: {
    gap: spacing[1],
    flexShrink: 1,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
  },
  position: {
    ...typography.title,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
});
