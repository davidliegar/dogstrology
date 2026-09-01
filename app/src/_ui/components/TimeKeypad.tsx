import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isDigitAllowed, pressBackspace, pressDigit, type TimeEntry } from '@/_ui/timeEntry';

import { colors, spacing, touchTarget, typography } from '@/design/theme';

/** Tres columnas, con el hueco a la izquierda del cero. Artboard D. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

export interface TimeKeypadProps {
  entry: TimeEntry;
  onChange: (entry: TimeEntry) => void;
}

/**
 * El teclado numérico de la hora (artboard D). **Teclado y no rueda**: dos
 * campos de dos cifras se teclean en cuatro toques.
 *
 * Las teclas que no llevan a ninguna hora existente se apagan en vez de
 * ignorarse en silencio — apagadas, no invisibles: la tecla sigue ahí y se
 * entiende que ahora no lleva a ninguna hora que exista.
 */
export function TimeKeypad({ entry, onChange }: TimeKeypadProps) {
  return (
    <View style={styles.keypad}>
      {KEYS.map((key, index) => {
        const isDigit = key !== '' && key !== '⌫';
        const off = isDigit && !isDigitAllowed(entry, key);
        return (
          <Pressable
            key={index}
            onPress={() => onChange(key === '⌫' ? pressBackspace(entry) : pressDigit(entry, key))}
            disabled={key === '' || off}
            accessibilityRole="button"
            accessibilityState={{ disabled: off }}
            accessibilityLabel={key === '⌫' ? 'Borrar' : key}
            style={styles.key}
          >
            <Text style={[styles.keyLabel, off && styles.keyLabelOff]}>{key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
    width: '33.33%',
    height: touchTarget + spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    ...typography.title,
    color: colors.text,
  },
  keyLabelOff: {
    color: colors.textFaint,
    opacity: 0.4,
  },
});
