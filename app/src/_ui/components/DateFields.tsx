import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { text } from '../typography';

import { colors, radii, screenPadding, spacing, touchTarget } from '@/design/theme';

const FIELD_HEIGHT = 56;

/** Nombres de mes en español: son vocabulario de producto, no identificadores. */
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

/** Partes sueltas mientras el usuario teclea: cualquiera puede estar a medias. */
export interface DateParts {
  day: string;
  /** Índice 0-11, o `null` si aún no ha elegido mes. */
  monthIndex: number | null;
  year: string;
}

export const EMPTY_DATE: DateParts = { day: '', monthIndex: null, year: '' };

/**
 * Compone `YYYY-MM-DD` con las tres partes, o `null` si todavía no forman una
 * fecha del calendario.
 *
 * Solo comprueba lo justo para decidir si el botón se activa; la validación
 * de verdad (incluido "este día no existe") vive en `Birth`, que es quien
 * puede negarse a construirse. Aquí no se duplica esa regla, solo se evita
 * llamar al dominio con algo obviamente incompleto.
 */
export function toIsoDate({ day, monthIndex, year }: DateParts): string | null {
  if (monthIndex === null || day === '' || year.length !== 4) return null;
  const d = Number(day);
  const y = Number(year);
  if (!Number.isInteger(d) || d < 1 || d > 31) return null;
  if (!Number.isInteger(y) || y < 1900) return null;
  const iso = `${String(y).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  // Días que no existen en ese mes concreto (31 de febrero, 31 de abril…).
  const parsed = new Date(`${iso}T00:00:00Z`);
  return parsed.getUTCDate() === d && parsed.getUTCMonth() === monthIndex ? iso : null;
}

export interface DateFieldsProps {
  value: DateParts;
  onChange: (value: DateParts) => void;
}

/**
 * Día · Mes · Año en tres campos, con los pesos del canvas de diseño
 * (1 / 1,7 / 1,1 — el mes es más ancho porque lleva "septiembre").
 *
 * El mes no es un campo de texto: abre la lista de los doce. Escribir "12" es
 * más rápido, pero también es donde se cuela el mes equivocado, y F1 solo
 * tiene una oportunidad de acertar el signo.
 */
export function DateFields({ value, onChange }: DateFieldsProps) {
  const [pickingMonth, setPickingMonth] = useState(false);

  return (
    <View style={styles.row}>
      <View style={[styles.field, styles.day]}>
        <Text style={styles.label}>Día</Text>
        <TextInput
          value={value.day}
          onChangeText={(day) => onChange({ ...value, day: day.replace(/\D/g, '').slice(0, 2) })}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="—"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          accessibilityLabel="Día de nacimiento"
          style={styles.input}
        />
      </View>

      <Pressable
        style={[styles.field, styles.month]}
        onPress={() => setPickingMonth(true)}
        accessibilityRole="button"
        accessibilityLabel={`Mes de nacimiento${value.monthIndex === null ? '' : `: ${MONTHS[value.monthIndex]}`}`}
      >
        <Text style={styles.label}>Mes</Text>
        <Text style={[styles.input, value.monthIndex === null && styles.placeholder]} numberOfLines={1}>
          {value.monthIndex === null ? '—' : MONTHS[value.monthIndex]}
        </Text>
      </Pressable>

      <View style={[styles.field, styles.year]}>
        <Text style={styles.label}>Año</Text>
        <TextInput
          value={value.year}
          onChangeText={(year) => onChange({ ...value, year: year.replace(/\D/g, '').slice(0, 4) })}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="—"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          accessibilityLabel="Año de nacimiento"
          style={styles.input}
        />
      </View>

      <Modal visible={pickingMonth} transparent animationType="fade" onRequestClose={() => setPickingMonth(false)}>
        <Pressable style={styles.scrim} onPress={() => setPickingMonth(false)} accessibilityLabel="Cerrar">
          <View style={styles.sheet}>
            <ScrollView>
              {MONTHS.map((month, index) => (
                <Pressable
                  key={month}
                  onPress={() => {
                    onChange({ ...value, monthIndex: index });
                    setPickingMonth(false);
                  }}
                  accessibilityRole="button"
                  style={styles.monthRow}
                >
                  <Text style={[styles.monthLabel, index === value.monthIndex && styles.monthSelected]}>{month}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  field: {
    height: FIELD_HEIGHT,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
  },
  // Los pesos vienen del canvas: el mes carga con "septiembre".
  day: { flex: 1 },
  month: { flex: 1.7 },
  year: { flex: 1.1 },
  label: {
    ...text('caption'),
    color: colors.textFaint,
  },
  input: {
    ...text('bodyEmphasis'),
    color: colors.text,
    letterSpacing: 0.4,
    padding: 0,
  },
  placeholder: {
    color: colors.textFaint,
  },
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
  },
  sheet: {
    maxHeight: '70%',
    borderRadius: radii.card,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[2],
  },
  monthRow: {
    height: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  monthLabel: {
    ...text('body'),
    color: colors.textMuted,
  },
  monthSelected: {
    color: colors.accent,
  },
});
