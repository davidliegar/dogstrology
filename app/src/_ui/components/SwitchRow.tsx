import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { text } from '@/_ui/typography';

import { colors, glow, motion, radii, spacing, typography } from '@/design/theme';

/**
 * El carril y el pulsador, del sistema de diseño (C.3 · Interruptor). El carril
 * va en 52×32 con `padding` de 4 y el pulsador en 24, y **eso mismo es lo que
 * hace que encendido y apagado midan igual** aunque solo el apagado lleve
 * borde: en React Native el ancho ya incluye padding y borde, que es el
 * `border-box` que pide la nota del canvas.
 */
const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const KNOB = 24;
const TRAVEL = TRACK_WIDTH - KNOB - spacing[1] * 2;

const EASING = Easing.bezier(...motion.easing.standard);

export interface SwitchRowProps {
  label: string;
  /** La segunda línea: «a las 9:00». Cuenta el estado, no repite el rótulo. */
  note?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /**
   * Qué hace tocar el rótulo, si hace algo. Con esto la fila tiene **dos
   * destinos**: el carril conmuta y el texto abre lo que configura el estado
   * que el texto cuenta — la hora, en el aviso diario.
   */
  onPressText?: () => void;
  /** Qué se lee al tocar el texto, para quien no ve la pantalla. */
  textHint?: string;
  disabled?: boolean;
}

/**
 * Fila con interruptor (sistema de diseño, C.3). **Toda la fila conmuta**, como
 * en `CheckboxRow`: el carril mide 52 y una fila de 64 es el objetivo real.
 *
 * Encendido en oro con `glow.accent`, apagado en `surfaceRaised` con su filo.
 * **Sin rótulos de texto dentro del carril** —ni «SÍ» ni «NO»—: lo dice el
 * canvas, y lo que hay que leer está a la izquierda.
 */
export function SwitchRow({
  label,
  note,
  value,
  onChange,
  onPressText,
  textHint,
  disabled = false,
}: SwitchRowProps) {
  const reduceMotion = useReducedMotion();

  // El pulsador se desplaza; el carril cambia de color. Es la misma animación
  // que hace cualquier interruptor del sistema, y con «reducir movimiento»
  // salta al sitio en vez de deslizarse.
  const knob = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: reduceMotion
          ? value
            ? TRAVEL
            : 0
          : withTiming(value ? TRAVEL : 0, { duration: motion.duration.instant, easing: EASING }),
      },
    ],
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      accessibilityHint={note}
      style={styles.row}
    >
      {/* Anidado a propósito: se queda con su trozo de fila y el resto sigue
          conmutando, así que el objetivo grande no se pierde. */}
      <Pressable
        onPress={onPressText}
        disabled={disabled || !onPressText}
        accessibilityRole={onPressText ? 'button' : undefined}
        accessibilityLabel={onPressText ? label : undefined}
        accessibilityHint={onPressText ? textHint : undefined}
        style={styles.text}
      >
        <Text style={styles.label}>{label}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </Pressable>
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <Animated.View style={[styles.knob, value ? styles.knobOn : styles.knobOff, knob]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  text: {
    gap: spacing[1],
    flex: 1,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  note: {
    ...text('captionNumeric'),
    color: colors.textFaint,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    padding: spacing[1],
    justifyContent: 'center',
    flexShrink: 0,
  },
  trackOn: {
    backgroundColor: colors.accent,
    ...glow.accent,
  },
  trackOff: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: radii.pill,
  },
  knobOn: {
    backgroundColor: colors.onAccent,
  },
  knobOff: {
    backgroundColor: colors.textFaint,
  },
});
