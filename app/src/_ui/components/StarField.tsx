import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors, opacity, radii } from '@/design/theme';

/**
 * Una estrella del campo: posición en % del contenedor, para que el fondo
 * funcione a cualquier tamaño de pantalla sin recalcular nada.
 */
interface Star {
  left: `${number}%`;
  top: `${number}%`;
  size: 1 | 2;
  /** `undefined` = fija. Las que parpadean lo hacen a distinto ritmo a propósito. */
  twinkleMs?: number;
}

/** Los repartos del canvas de diseño: uno por pantalla que lleva campo estelar. */
export const STAR_FIELDS = {
  name: [
    { left: '12%', top: '9%', size: 2, twinkleMs: 3000 },
    { left: '31%', top: '21%', size: 1 },
    { left: '62%', top: '14%', size: 2, twinkleMs: 2600 },
    { left: '84%', top: '27%', size: 1 },
    { left: '22%', top: '74%', size: 2, twinkleMs: 3400 },
    { left: '71%', top: '86%', size: 1 },
  ],
  date: [
    { left: '18%', top: '12%', size: 2, twinkleMs: 2800 },
    { left: '47%', top: '8%', size: 1 },
    { left: '78%', top: '19%', size: 2, twinkleMs: 3200 },
    { left: '29%', top: '81%', size: 1 },
    { left: '66%', top: '90%', size: 2, twinkleMs: 3600 },
  ],
  reveal: [
    { left: '9%', top: '11%', size: 2, twinkleMs: 3000 },
    { left: '37%', top: '6%', size: 1 },
    { left: '88%', top: '16%', size: 2, twinkleMs: 2500 },
    { left: '17%', top: '88%', size: 1 },
    { left: '59%', top: '93%', size: 2, twinkleMs: 3300 },
  ],
  /**
   * Artboard 19. Son tres y solo en la mitad de arriba: la pantalla ya tiene
   * mucho que leer y el campo aquí es atmósfera, no protagonista.
   */
  moonChange: [
    { left: '12%', top: '9%', size: 2, twinkleMs: 3000 },
    { left: '62%', top: '14%', size: 2, twinkleMs: 2600 },
    { left: '84%', top: '27%', size: 1 },
  ],
} satisfies Record<string, Star[]>;

export type StarFieldName = keyof typeof STAR_FIELDS;

function TwinklingStar({ star }: { star: Star }) {
  // Inicializador perezoso en vez de `useRef(...).current`: el mismo valor
  // estable, pero sin leer una ref durante el render (`react-hooks/refs`).
  const [value] = useState(() => new Animated.Value(opacity.starTwinkleMin));

  useEffect(() => {
    if (!star.twinkleMs) return;
    // Ida y vuelta: el ciclo del token es el completo, así que cada tramo dura
    // la mitad. `useNativeDriver` sí vale aquí — solo se anima la opacidad.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: opacity.starTwinkleMax,
          duration: star.twinkleMs / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: opacity.starTwinkleMin,
          duration: star.twinkleMs / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [star.twinkleMs, value]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.left,
          top: star.top,
          width: star.size,
          height: star.size,
          opacity: star.twinkleMs ? value : opacity.starTwinkleMin,
        },
      ]}
    />
  );
}

/**
 * Campo estelar de fondo (BRD §11.2). Decorativo: `pointerEvents="none"` y
 * fuera del árbol de accesibilidad — un lector de pantalla no tiene nada que
 * decir de seis puntos de dos píxeles.
 */
export function StarField({ field }: { field: StarFieldName }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {STAR_FIELDS[field].map((star) => (
        <TwinklingStar key={`${star.left}-${star.top}`} star={star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    borderRadius: radii.pill,
    backgroundColor: colors.star,
  },
});
