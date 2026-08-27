import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, opacity, spacing, typography } from '@/design/theme';
import { Chevron } from './Chevron';

export interface ConnectionFooterProps {
  /** La línea grande: qué tiene esto que ver con la mascota, o con hoy. */
  title: string;
  /** La línea pequeña de debajo. */
  detail: string;
  /**
   * A dónde lleva. **Sin esto no se pinta la flecha**, y esa es la única
   * regla de este componente: una punta a la derecha promete un destino, y
   * las fichas de Explorar la llevaban sin tener ninguno. El pie sin `onPress`
   * sigue siendo información, que es lo que es cuando no hay dónde ir.
   */
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * El pie que conecta una ficha de catálogo con la mascota (artboards 18 y 21)
 * o con hoy (artboard 23).
 *
 * Vive en `_ui` y no en `chart/ui` porque las tres fichas lo pintan idéntico y
 * ninguna es dueña de él — antes eran tres copias de los mismos estilos, y la
 * flecha muerta estaba en las tres a la vez.
 */
export function ConnectionFooter({ title, detail, onPress, accessibilityLabel }: ConnectionFooterProps) {
  const content = (
    <>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {onPress ? <Chevron direction="right" size={8} color={colors.textFaint} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}, ${detail}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  text: {
    gap: spacing[1],
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.text,
  },
  detail: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
