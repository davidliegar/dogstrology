import { StyleSheet, Text, View } from 'react-native';

import { text } from '../typography';
import { colors, controlGap, feedback, radii, spacing, typography } from '@/design/theme';

const DOT = 8;
/** Baja el punto hasta la primera línea del párrafo en la medida larga. */
const DOT_BASELINE = 8;

export interface ApproximateBadgeProps {
  /**
   * `row` sustituye al dato en una fila ("Cáncer aprox."), `header` es la
   * palabra sola al lado de un eje, y `note` es el pie que explica el
   * mecanismo. Misma insignia, distinto sitio.
   */
  size?: 'row' | 'header' | 'note';
  children: React.ReactNode;
}

/**
 * C.2b del sistema de diseño — **una sola insignia para todo lo que el motor
 * marca como incierto**.
 *
 * Dos reglas del canvas que no son cosméticas:
 *
 * - El punto es siempre `attention`, **nunca `critical`**. Un dato aproximado
 *   no es un error: la incertidumbre es del cielo, no del usuario. Por lo
 *   mismo, ni icono de aviso ni interrogación.
 * - **Una sola vez por elemento.** Si la fila ya la lleva, la tarjeta de esa
 *   Luna no la repite; si la pantalla lleva el pie largo, las filas se quedan
 *   en la versión corta.
 *
 * La enciende un único booleano del dominio (`isMoonUncertain()`): o el dato es
 * firme, o lleva insignia. No hay grados de duda ni porcentajes en la interfaz.
 */
export function ApproximateBadge({ size = 'row', children }: ApproximateBadgeProps) {
  const isNote = size === 'note';
  return (
    <View style={[styles.root, isNote && styles.rootNote]}>
      <View style={[styles.dot, isNote && styles.dotNote]} />
      <Text style={[styles.label, styles[size]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: controlGap,
  },
  rootNote: {
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    backgroundColor: feedback.attention,
    flexShrink: 0,
  },
  dotNote: {
    marginTop: DOT_BASELINE,
  },
  label: {
    flexShrink: 1,
  },
  row: {
    ...text('ephemeris'),
    color: colors.textMuted,
  },
  header: {
    ...typography.caption,
    color: colors.textFaint,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
