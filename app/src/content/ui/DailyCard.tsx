import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Chevron } from '@/_ui/components/Chevron';
import { Lock } from '@/_ui/components/Lock';
import { Veil } from '@/_ui/components/Veil';
import { text } from '@/_ui/typography';
import { colors, glow, motion, opacity, radii, screenPadding, spacing, typography } from '@/design/theme';

/**
 * El retardo que se acumula por tarjeta. Sale de la nota del artboard 04:
 * "una tarjeta por fragmento, en cascada de 70 ms".
 */
export const CASCADE_STEP = 70;

/** Cuánto sube cada tarjeta al entrar. Lo justo para que se lea como llegada. */
const RISE = 12;

const ENTER_EASING = Easing.bezier(...motion.easing.enter);

export interface DailyCardProps {
  /**
   * El símbolo del eje, a la izquierda del rótulo (artboard 33). Lo llevan las
   * tarjetas del día en la casa, donde el rótulo compite con el nombre del
   * perro que está encima; en el día de una sola mascota no hace falta.
   */
  glyph?: React.ReactNode;
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
  /**
   * Debajo del cuerpo: hoy, los puntos de energía de la tarjeta del Sol en el
   * día en la casa (artboard 33). Van al pie y no en el rótulo porque ahí
   * arriba ya está el grado, y dos cosas a la derecha del mismo rótulo se
   * estorban.
   */
  footer?: React.ReactNode;
  /**
   * La tarjeta es de pago y no está pagada (D19, artboard 36). **No es una
   * tarjeta distinta**: conserva su sitio, su radio y su rótulo con el color
   * de su elemento. Lo que se va bajo el velo es la lectura entera —titular y
   * cuerpo—, y el candado ocupa el hueco del grado.
   */
  locked?: boolean;
  /**
   * La tarjeta lleva a algún sitio. Las de eje llevan a su sitio en la carta;
   * bajo candado, al paywall — **quien la pone decide a dónde**, porque el
   * destino depende del plan y la tarjeta no pregunta por él.
   *
   * El cielo del día no lo lleva: no es de nadie, y en la carta no hay nada
   * que sea eso.
   */
  onPress?: () => void;
  /** Qué anuncia el toque. Obligatorio de hecho: sin él la punta es muda. */
  accessibilityLabel?: string;
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
  glyph,
  overline,
  tint,
  meta,
  headline,
  body,
  featured = false,
  index = 0,
  footer,
  locked = false,
  onPress,
  accessibilityLabel,
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

  // El rótulo y el candado. Bloqueada, **es lo único que se lee**, y va encima
  // del velo en vez de fuera de él: así el desenfoque llega de borde a borde de
  // la tarjeta y no arranca a media altura, con una raya donde empieza.
  const head = (
    <View style={styles.head}>
      {glyph}
      <Text style={[styles.overline, { color: tint }]} numberOfLines={1}>
        {overline}
      </Text>
      {/* El candado va donde iría el grado, y **se lo come**: es el mismo
          hueco, y con los dos a la vez el rótulo tendría dos cosas a la
          derecha peleándose por el sitio. */}
      {locked ? <Lock /> : meta}
      {/* La punta, **solo cuando se puede leer**: bajo candado el que anuncia
          el toque es el candado, y dos señales en la misma esquina se
          estorbarían. Una zona que se pulsa sin decirlo es peor que una que no
          se pulsa — la misma regla que la tira de la Luna. */}
      {onPress && !locked ? <Chevron direction="right" size={8} color={colors.textFaint} /> : null}
    </View>
  );

  const style = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * RISE }],
  }));

  // El aire vive dentro y no en la caja animada: la opacidad de pulsado y la
  // de entrada son la misma propiedad, y en la misma vista la de Reanimated
  // gana siempre. Separadas, la tarjeta se puede apagar al tocarla sin que la
  // cascada se entere. El velo sigue sangrando hasta el filo: sangra lo que
  // mide este relleno, que es el mismo de antes, solo que una vista más
  // adentro.
  const content = (
    <>
      {locked ? null : head}
      {/* **La lectura entera va bajo el velo, titular incluido** (visto en un
          móvil, 2026-09-02: con el titular en claro la tarjeta se entendía
          sola y no quedaba nada que comprar). Lo que queda legible es el
          rótulo —«Su Luna · Cáncer»—, que dice de quién y de qué es lo que no
          se puede leer: sigue siendo una falta concreta y no un hueco gris que
          parezca un fallo de carga. */}
      {locked ? (
        <Veil
          background={colors.surface}
          gap={spacing[4]}
          bleed={screenPadding}
          radius={radii.card}
          sharp={head}
        >
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.body}>{body}</Text>
        </Veil>
      ) : (
        <>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.body}>{body}</Text>
        </>
      )}
      {footer}
    </>
  );

  return (
    <Animated.View style={[styles.card, featured && [styles.featured, { borderColor: tint }], style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [styles.inner, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.inner}>{content}</View>
      )}
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
  },
  inner: {
    padding: screenPadding,
    gap: spacing[4],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  featured: {
    ...glow.card,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  overline: {
    ...typography.overline,
    flex: 1,
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
