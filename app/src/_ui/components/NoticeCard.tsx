import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, feedback, radii, spacing, typography } from '@/design/theme';

const DOT = 8;
/** Baja el punto hasta la primera línea de texto: `caption` mide 19 de alto. */
const DOT_OFFSET = 8;

export interface NoticeCardProps {
  children: string;
  /**
   * `'prompt'` pide algo: relleno de oro suave, filo de oro, punto dorado.
   * `'settled'` no pide nada, así que no llama — superficie neutra y punto
   * verde. Es la diferencia que marca el canvas entre los dos avisos de carta
   * incompleta y el de carta completa.
   */
  tone?: 'prompt' | 'settled';
  /** Llamada a la acción bajo el texto: "Añadir la hora", "Elegir el lugar". */
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Aviso de mejora progresiva (artboards A y los tres estados del canvas).
 *
 * No es una alerta y no lleva icono de alerta: dice qué se gana completando un
 * dato, no que algo vaya mal. Por eso el tono que pide reutiliza `accentSoft`,
 * el mismo relleno del chip activo, y nunca `feedback.critical`.
 */
export function NoticeCard({ children, tone = 'prompt', action }: NoticeCardProps) {
  const settled = tone === 'settled';

  return (
    <View style={[styles.card, settled && styles.cardSettled]}>
      <View style={[styles.dot, settled && styles.dotSettled]} />
      <View style={styles.body}>
        <Text style={styles.text}>{children}</Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label}>
            <Text style={styles.action}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSettled: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    marginTop: DOT_OFFSET,
    flexShrink: 0,
  },
  dotSettled: {
    backgroundColor: feedback.positive,
  },
  body: {
    flexShrink: 1,
    gap: spacing[3],
  },
  text: {
    ...typography.caption,
    color: colors.textMuted,
  },
  action: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
});
