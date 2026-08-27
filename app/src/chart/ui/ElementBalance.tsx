import { StyleSheet, Text, View } from 'react-native';

import { text } from '@/_ui/typography';
import { ELEMENTS, type Element } from '../domain/PlanetPosition';
import { ELEMENT_LABELS } from './labels';

import { colors, elementColor, radii, spacing } from '@/design/theme';

const BAR_HEIGHT = 8;

export interface ElementBalanceProps {
  balance: Record<Element, number>;
}

/**
 * El reparto de los diez planetas entre los cuatro elementos (artboard 6).
 *
 * Es el único gráfico del MVP, y es una barra apilada por una razón: lo que
 * importa no es cuántos hay de cada uno, es cuál domina. Una barra lo dice de
 * un vistazo y el número exacto queda debajo para quien lo quiera.
 *
 * Un elemento sin planetas no pinta tramo — ni uno de ancho cero, que dejaría
 * un hueco de separación sin nada dentro— pero sí sale en la cuenta de abajo:
 * "Agua 0" es información, un hueco no.
 */
export function ElementBalance({ balance }: ElementBalanceProps) {
  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        {ELEMENTS.filter((element) => balance[element] > 0).map((element) => (
          <View
            key={element}
            style={[styles.segment, { flex: balance[element], backgroundColor: elementColor(element) }]}
          />
        ))}
      </View>
      <View style={styles.counts}>
        {ELEMENTS.map((element) => (
          <Text key={element} style={styles.count}>
            {ELEMENT_LABELS[element]} {balance[element]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
  bar: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  segment: {
    height: BAR_HEIGHT,
    borderRadius: radii.pill,
  },
  counts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  count: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
});
