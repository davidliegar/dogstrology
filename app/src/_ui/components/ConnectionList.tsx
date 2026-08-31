import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { countWord, joinList } from '@/_ui/text';
import { colors, opacity, radii, spacing, typography } from '@/design/theme';

import { Chevron } from './Chevron';

/** Alto de fila del artboard 35, el mismo de una fila de Ajustes. */
const ROW_HEIGHT = 56;

/**
 * Cuántas filas se ven antes de plegar el resto. **Cinco filas serían un pie
 * más alto que la ficha**, y el pie es lo último de la pantalla, no su
 * contenido.
 */
const VISIBLE = 3;

export interface Connection {
  /** El nombre de la mascota, para la fila que pliega al resto. */
  name: string;
  title: string;
  detail: string;
  onPress: () => void;
}

/**
 * El pie de una ficha **con varias mascotas** (artboard 35): una fila por
 * perro, y cada una a su carta.
 *
 * **Una fila por perro y no una frase que los nombre a todos.** Enlazar solo
 * al primero es arbitrario, y una fila que los nombra sin enlazar rompe lo
 * único que este pie promete: que desde ahí se llega. Cada perro tiene su
 * carta, así que cada uno tiene su fila.
 *
 * A partir de la cuarta, la última fila pliega el resto y lo despliega **en el
 * sitio**, en el orden de la lista. No lleva punta porque no va a ninguna
 * parte: abre lo que ya está aquí.
 *
 * Con **una sola** mascota esto no se usa: ahí el pie sigue siendo la fila
 * suelta de `ConnectionFooter`, sin caja, como en los artboards 18 y 21.
 */
export function ConnectionList({ connections }: { connections: Connection[] }) {
  const [expanded, setExpanded] = useState(false);
  const folded = !expanded && connections.length > VISIBLE;
  const shown = folded ? connections.slice(0, VISIBLE) : connections;
  const rest = connections.slice(VISIBLE);

  return (
    <View style={styles.box}>
      {shown.map((connection) => (
        <Pressable
          key={connection.name}
          onPress={connection.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${connection.title}, ${connection.detail}`}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.texts}>
            <Text style={styles.title} numberOfLines={1}>
              {connection.title}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              {connection.detail}
            </Text>
          </View>
          <Chevron direction="right" />
        </Pressable>
      ))}

      {folded ? (
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel={`Ver ${joinList(rest.map((one) => one.name))}`}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.texts}>
            <Text style={styles.more}>y otras {countWord(rest.length)}</Text>
            <Text style={styles.detail} numberOfLines={1}>
              {joinList(rest.map((one) => one.name))}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.row,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.body,
    color: colors.text,
  },
  /** La fila que pliega no nombra a nadie: cuenta cuántos faltan. */
  more: {
    ...typography.body,
    color: colors.textFaint,
  },
  detail: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
