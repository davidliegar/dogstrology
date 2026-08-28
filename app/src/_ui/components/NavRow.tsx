import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/design/theme';
import { Chevron } from './Chevron';

/**
 * Alto de fila de destino del artboard 25. Es más que las 56 de un campo
 * porque aquí la fila lleva dos líneas **y es el cuerpo de la pantalla**, no
 * un control dentro de un formulario.
 *
 * `minHeight` y no `height`: con la insignia de C.2b debajo la fila crece, y
 * un alto fijo la recortaría justo cuando tiene algo más que decir.
 */
const ROW_HEIGHT = 72;

export interface NavRowProps {
  label: string;
  /** La segunda línea: dice a dónde lleva usando el dato de la mascota. */
  note?: string;
  /** Bajo la nota. Hoy, la insignia C.2b cuando a la carta le falta un dato. */
  badge?: React.ReactNode;
  onPress: () => void;
}

/**
 * Fila de destino (artboard 25): rótulo, la línea que lo concreta y la punta.
 *
 * No es `FieldRow` con otro traje. Una `FieldRow` enseña **un dato editable** y
 * su caja lo dice; esto es un enlace a otra pantalla, sin caja y sin valor a la
 * derecha. Compartirlas obligaría a un `boxless` más y a un modo sin dato, que
 * es la forma de acabar con un componente que hace de todo.
 */
export function NavRow({ label, note, badge, onPress }: NavRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={note ? `${label}. ${note}` : label}
      style={styles.row}
    >
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        {badge}
      </View>
      <Chevron direction="right" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
    paddingVertical: spacing[3],
  },
  texts: {
    flexShrink: 1,
    gap: spacing[1],
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
