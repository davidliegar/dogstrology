import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, opacity, screenPadding, spacing, touchTarget, typography } from '@/design/theme';
import { Chevron } from './Chevron';

/** Alto de la barra. Sale del artboard A. */
const HEADER_HEIGHT = 64;
/** Lado del cuadrado del chevron de atrás, mayor que el de una fila. */
const BACK_CHEVRON = 11;

export interface ScreenHeaderProps {
  title: string;
  /** Rótulo pequeño encima del título: de quién es la pantalla (artboard 5). */
  overline?: string;
  onBack?: () => void;
  /** Acción de texto a la derecha, en oro. Apagada mientras no haya qué hacer. */
  action?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
  /** Filo de pelo debajo. El perfil lo lleva; el selector de raza, no. */
  divided?: boolean;
}

/**
 * Barra de cabecera de una pantalla apilada (artboards A y B): volver, título
 * y una acción de texto.
 *
 * El botón de volver ocupa `touchTarget` entero aunque la punta mida 11 px, y
 * se sale del margen con un margen negativo para que la punta quede alineada
 * con el texto de debajo — que es lo que hace el canvas. El área que se toca es
 * la de siempre; lo que se ve es más pequeño.
 */
export function ScreenHeader({ title, overline, onBack, action, divided = false }: ScreenHeaderProps) {
  return (
    <View style={[styles.header, divided && styles.divided]}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver" style={styles.back}>
          <Chevron direction="left" size={BACK_CHEVRON} color={colors.textMuted} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        {overline ? (
          <Text style={styles.overline} numberOfLines={1}>
            {overline}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(action.disabled) }}
          accessibilityLabel={action.label}
        >
          <Text style={[styles.action, action.disabled && styles.actionDisabled]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  divided: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  back: {
    width: touchTarget,
    height: touchTarget,
    marginLeft: -spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titles: {
    flex: 1,
    gap: spacing[1],
  },
  overline: {
    ...typography.overline,
    color: colors.textFaint,
  },
  title: {
    ...typography.section,
    color: colors.text,
  },
  action: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
  actionDisabled: {
    color: colors.textFaint,
    opacity: opacity.disabled,
  },
});
