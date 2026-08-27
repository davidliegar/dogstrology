import { useRef, useState } from 'react';
import {
  InteractionManager,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { text } from '../typography';

import { colors, focusRing, radii, screenPadding, spacing, touchTarget } from '@/design/theme';

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
 * Si ya no cabe otra cifra en el día, que es cuando tiene sentido pasar al mes.
 *
 * Dos cifras lo cierran siempre, y una sola también cuando no puede empezar
 * ningún día de dos: escrito un 4, no hay días 40. Sin esta segunda regla, el
 * 70% de los días del mes obligarían a levantar el dedo y buscar el campo
 * siguiente a mano.
 */
export function isDayComplete(day: string): boolean {
  return day.length === 2 || (day.length === 1 && Number(day) > 3);
}

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
  /** Abre el teclado en el día al entrar. Solo en el alta, como el nombre. */
  autoFocus?: boolean;
}

/**
 * Día · Mes · Año en tres campos, con los pesos del canvas de diseño
 * (1 / 1,7 / 1,1 — el mes es más ancho porque lleva "septiembre").
 *
 * El mes no es un campo de texto: abre la lista de los doce. Escribir "12" es
 * más rápido, pero también es donde se cuela el mes equivocado, y F1 solo
 * tiene una oportunidad de acertar el signo.
 *
 * **El foco encadena los tres campos solo.** Completado el día se abre la
 * lista de meses; elegido el mes, el cursor cae en el año; con las cuatro
 * cifras del año el teclado se retira y deja ver el botón. El salto solo
 * ocurre hacia un campo que todavía está vacío: quien vuelve a corregir un
 * dato no se ve empujado fuera del que estaba tocando.
 */
export function DateFields({ value, onChange, autoFocus }: DateFieldsProps) {
  const [pickingMonth, setPickingMonth] = useState(false);
  const [focused, setFocused] = useState<'day' | 'year' | null>(null);
  const yearRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);

  /** A dónde va el dedo después de dar por cerrado `from`. */
  const advanceFrom = (from: 'day' | 'month', parts: DateParts) => {
    if (from === 'day' && parts.monthIndex === null) {
      Keyboard.dismiss();
      setPickingMonth(true);
      return;
    }
    if (from === 'month' && !isDayComplete(parts.day)) {
      dayRef.current?.focus();
      return;
    }
    if (parts.year.length < 4) {
      yearRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
  };

  const changeDay = (input: string) => {
    const day = input.replace(/\D/g, '').slice(0, 2);
    const parts = { ...value, day };
    onChange(parts);
    if (isDayComplete(day)) advanceFrom('day', parts);
  };

  const changeYear = (input: string) => {
    const year = input.replace(/\D/g, '').slice(0, 4);
    onChange({ ...value, year });
    // Cuatro cifras es el final del formulario: el teclado tapaba justo el
    // botón que toca pulsar a continuación.
    if (year.length === 4) Keyboard.dismiss();
  };

  const pickMonth = (monthIndex: number) => {
    const parts = { ...value, monthIndex };
    onChange(parts);
    setPickingMonth(false);
    // Enfocar mientras el modal se desvanece no prende el teclado: hay que
    // esperar a que la animación termine.
    InteractionManager.runAfterInteractions(() => advanceFrom('month', parts));
  };

  return (
    <View style={styles.row}>
      <View style={[styles.ring, styles.day, focused === 'day' && styles.ringVisible]}>
        <View style={[styles.field, focused === 'day' && styles.fieldFocused]}>
          <Text style={styles.label}>Día</Text>
          <TextInput
            ref={dayRef}
            autoFocus={autoFocus}
            value={value.day}
            onChangeText={changeDay}
            onFocus={() => setFocused('day')}
            onBlur={() => setFocused((current) => (current === 'day' ? null : current))}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="—"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
            accessibilityLabel="Día de nacimiento"
            style={styles.input}
          />
        </View>
      </View>

      <View style={[styles.ring, styles.month, pickingMonth && styles.ringVisible]}>
        <Pressable
          style={[styles.field, pickingMonth && styles.fieldFocused]}
          onPress={() => {
            Keyboard.dismiss();
            setPickingMonth(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Mes de nacimiento${value.monthIndex === null ? '' : `: ${MONTHS[value.monthIndex]}`}`}
        >
          <Text style={styles.label}>Mes</Text>
          <Text style={[styles.input, value.monthIndex === null && styles.placeholder]} numberOfLines={1}>
            {value.monthIndex === null ? '—' : MONTHS[value.monthIndex]}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.ring, styles.year, focused === 'year' && styles.ringVisible]}>
        <View style={[styles.field, focused === 'year' && styles.fieldFocused]}>
          <Text style={styles.label}>Año</Text>
          <TextInput
            ref={yearRef}
            value={value.year}
            onChangeText={changeYear}
            onFocus={() => setFocused('year')}
            onBlur={() => setFocused((current) => (current === 'year' ? null : current))}
            // Retroceder con el año vacío devuelve al campo anterior, que aquí
            // es la lista de meses. Sin esto, deshacer hacia atrás se acababa
            // en seco a mitad del formulario.
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && value.year === '' && value.monthIndex !== null) {
                Keyboard.dismiss();
                setPickingMonth(true);
              }
            }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="—"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
            accessibilityLabel="Año de nacimiento"
            style={styles.input}
          />
        </View>
      </View>

      <Modal visible={pickingMonth} transparent animationType="fade" onRequestClose={() => setPickingMonth(false)}>
        <Pressable style={styles.scrim} onPress={() => setPickingMonth(false)} accessibilityLabel="Cerrar">
          <View style={styles.sheet}>
            <ScrollView>
              {MONTHS.map((month, index) => (
                <Pressable
                  key={month}
                  onPress={() => pickMonth(index)}
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
  // El anillo de foco de `TextField`: una View envolvente con borde propio,
  // porque React Native no acepta dos `box-shadow`. Ocupa sitio siempre para
  // que enfocar no mueva la fila.
  ring: {
    borderRadius: radii.m + focusRing.gap + focusRing.width,
    borderWidth: focusRing.width,
    padding: focusRing.gap,
    borderColor: colors.transparent,
  },
  ringVisible: {
    borderColor: focusRing.color,
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
  fieldFocused: {
    borderColor: colors.accent,
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
