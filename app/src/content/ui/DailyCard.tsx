import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { text } from '@/_ui/typography';
import { colors, glow, motion, radii, screenPadding, spacing, typography } from '@/design/theme';

/**
 * El retardo que se acumula por tarjeta. Sale de la nota del artboard 04:
 * "una tarjeta por fragmento, en cascada de 70 ms".
 */
export const CASCADE_STEP = 70;

/** Cuánto sube cada tarjeta al entrar. Lo justo para que se lea como llegada. */
const RISE = 12;

const ENTER_EASING = Easing.bezier(...motion.easing.enter);

export interface DailyCardProps {
  /** El rótulo pequeño de arriba, en el color de la tarjeta. */
  overline: string;
  /** El color que tiñe rótulo y filo: el del día, o el del elemento del eje. */
  tint: string;
  /** A la derecha del rótulo: el grado, la insignia de C.2b o los puntos. */
  meta?: React.ReactNode;
  headline: string;
  body: string;
  /**
   * La tarjeta del cielo lleva filo del color y sombra; las de eje van con el
   * separador de siempre. Es lo que hace que la primera se lea como la
   * principal sin necesidad de que sea más grande.
   */
  featured?: boolean;
  /** Su sitio en la cascada. 0 entra la primera. */
  index?: number;
}

/**
 * Una tarjeta del día (artboard 04) — **una por fragmento**, que es lo que
 * dice el canvas y lo que hace que un fragmento que el filtro bloqueó sea una
 * tarjeta de menos y no un hueco en medio de un texto.
 *
 * Entran en cascada de 70 ms. No es adorno: son cuatro bloques de texto
 * parecidos, y llegando a la vez el ojo no sabe por dónde empezar.
 */
export function DailyCard({
  overline,
  tint,
  meta,
  headline,
  body,
  featured = false,
  index = 0,
}: DailyCardProps) {
  const reduceMotion = useReducedMotion();
  const entrance = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      entrance.value = 1;
      return;
    }
    entrance.value = withDelay(
      index * CASCADE_STEP,
      withTiming(1, { duration: motion.duration.quick, easing: ENTER_EASING }),
    );
  }, [entrance, index, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * RISE }],
  }));

  return (
    <Animated.View
      style={[styles.card, featured && [styles.featured, { borderColor: tint }], style]}
    >
      <View style={styles.head}>
        <Text style={[styles.overline, { color: tint }]} numberOfLines={1}>
          {overline}
        </Text>
        {meta}
      </View>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>{body}</Text>
    </Animated.View>
  );
}

/** El grado de la posición, a la derecha del rótulo (artboard 04). */
export function CardDegree({ children }: { children: string }) {
  return <Text style={styles.degree}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: screenPadding,
    gap: spacing[4],
  },
  featured: {
    ...glow.card,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  overline: {
    ...typography.overline,
    flexShrink: 1,
  },
  headline: {
    ...typography.section,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  degree: {
    ...text('ephemeris'),
    color: colors.textFaint,
    flexShrink: 0,
  },
});
