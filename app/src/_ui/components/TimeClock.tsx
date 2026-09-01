import { Pressable, StyleSheet, Text, View } from 'react-native';

import { displayOf, focusField, type TimeEntry } from '@/_ui/timeEntry';

import { colors, controlGap, focusRing, radii, spacing, typography } from '@/design/theme';

export interface TimeClockProps {
  entry: TimeEntry;
  onChange: (entry: TimeEntry) => void;
}

/**
 * Las dos mitades de una hora, hora y minutos, con los dos puntos en medio
 * (artboard D). Lo que se teclea con `TimeKeypad`, que es su otra mitad.
 *
 * **La mitad que se está editando se ve.** Anillo de foco y color de acento en
 * una sola de las dos, como en cualquier campo de texto de la app; tocar la
 * otra la pone en edición y el próximo dígito la rehace.
 */
export function TimeClock({ entry, onChange }: TimeClockProps) {
  return (
    <View style={styles.clock}>
      <Slot
        label="hora"
        value={entry.hour}
        active={entry.field === 'hour'}
        onPress={() => onChange(focusField(entry, 'hour'))}
      />
      <Text style={styles.colon}>:</Text>
      <Slot
        label="minutos"
        value={entry.minute}
        active={entry.field === 'minute'}
        onPress={() => onChange(focusField(entry, 'minute'))}
      />
    </View>
  );
}

/**
 * Una de las dos mitades. La activa lleva el mismo anillo doble de `TextField`:
 * el foco de esta pantalla se pinta igual que el de un campo de texto, aunque
 * el teclado sea de la app y no del sistema.
 *
 * Es pulsable a propósito. Corregir solo los minutos de una hora ya escrita es
 * la mitad de las visitas, y sin poder tocarlos había que borrar cuatro cifras
 * para arreglar una.
 */
function Slot({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}: ${value === '' ? 'sin escribir' : value}`}
      style={[styles.ring, active && styles.ringVisible]}
    >
      <View style={[styles.slot, active && styles.slotActive]}>
        <Text style={[styles.slotValue, active && styles.slotValueActive]}>{displayOf(value)}</Text>
        <Text style={[styles.slotLabel, active && styles.slotLabelActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  ring: {
    borderRadius: radii.m + focusRing.gap + focusRing.width,
    borderWidth: focusRing.width,
    padding: focusRing.gap,
    // Ocupa sitio siempre: si apareciera al activarse, el reloj daría un salto.
    borderColor: colors.transparent,
  },
  ringVisible: {
    borderColor: focusRing.color,
  },
  slot: {
    minWidth: 96,
    height: 96,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: controlGap,
  },
  slotActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  slotValue: {
    ...typography.hero,
    color: colors.textMuted,
  },
  slotValueActive: {
    color: colors.text,
  },
  slotLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  slotLabelActive: {
    color: colors.accent,
  },
  colon: {
    ...typography.hero,
    color: colors.textFaint,
  },
});
