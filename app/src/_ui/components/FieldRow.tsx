import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, controlGap, radii, spacing, typography } from '@/design/theme';
import { text } from '../typography';
import { Chevron } from './Chevron';

/** Mismo alto que `TextField` y `DateFields`: el campo es el campo. */
const FIELD_HEIGHT = 56;

export interface FieldRowProps {
  label: string;
  /** El dato. `undefined` pinta `placeholder` en tono apagado. */
  value?: string;
  placeholder: string;
  /**
   * Dónde va el rótulo. `'above'` es el overline sobre la caja; `'inside'` lo
   * mete dentro, encima del valor — que es lo que hace el artboard A en las
   * filas de nacimiento **para que el campo lleno no crezca de alto**.
   */
  labelPlacement?: 'above' | 'inside';
  /** Llamada a la acción a la derecha, en oro: "Añadir". */
  action?: string;
  /** Punta a la derecha: la fila navega a su propio editor. */
  chevron?: boolean;
  /** Menos peso: el dato acompaña al de la fila de encima en vez de competir
   * con él. Hoy, el día de adopción bajo la fecha de nacimiento. */
  secondary?: boolean;
  /** Sin caja: la fila no es un campo del bloque, va suelta debajo. El canvas
   * lo usa para el día de adopción, que no entra en la carta. */
  boxless?: boolean;
  onPress?: () => void;
}

/**
 * Fila de dato del perfil (artboards 9 y A).
 *
 * Sin `onPress` la fila es de lectura y no anuncia rol de botón: un
 * `accessibilityRole="button"` que no hace nada es una mentira para quien
 * navega con lector de pantalla. Hoy las filas de fecha, hora y lugar están
 * así, porque sus editores aún no están diseñados.
 */
export function FieldRow({
  label,
  value,
  placeholder,
  labelPlacement = 'above',
  action,
  chevron = false,
  secondary = false,
  boxless = false,
  onPress,
}: FieldRowProps) {
  const inside = labelPlacement === 'inside';

  const body = (
    <>
      {inside ? null : <Text style={styles.labelAbove}>{label}</Text>}
      <View style={[styles.field, boxless && styles.fieldBoxless]}>
        <View style={styles.stack}>
          {inside ? <Text style={styles.labelInside}>{label}</Text> : null}
          <Text
            style={[styles.value, secondary && styles.valueSecondary, value === undefined && styles.empty]}
            numberOfLines={1}
          >
            {value ?? placeholder}
          </Text>
        </View>
        {action ? <Text style={styles.action}>{action}</Text> : null}
        {chevron ? <Chevron direction="right" /> : null}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      style={styles.row}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing[2],
  },
  labelAbove: {
    ...typography.overline,
    color: colors.textFaint,
  },
  labelInside: {
    ...typography.caption,
    color: colors.textFaint,
  },
  field: {
    height: FIELD_HEIGHT,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  fieldBoxless: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  stack: {
    flexShrink: 1,
    justifyContent: 'center',
    gap: controlGap,
  },
  value: {
    // Mismo tratamiento que el valor de `DateFields`: cuerpo medio y un pelo
    // de tracking, para que un dato no se lea como prosa.
    ...text('bodyEmphasis'),
    letterSpacing: 0.4,
    color: colors.text,
  },
  valueSecondary: {
    ...text('body'),
    color: colors.textMuted,
  },
  empty: {
    // El estado vacío es prosa ("No la sé"), no un dato: cuerpo normal y sin
    // el tracking de `value`, que si no se hereda del estilo de debajo.
    ...text('body'),
    letterSpacing: 0,
    color: colors.textFaint,
  },
  action: {
    ...text('bodyEmphasis'),
    color: colors.accent,
  },
});
