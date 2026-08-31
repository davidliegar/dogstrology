import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Reanimated, {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, motion, opacity, radii } from '@/design/theme';

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
   * Artboard 07. Siete, y una a media altura: es la pantalla más vacía de
   * texto y el cielo puede ocuparla entera, que es lo que la nota del canvas
   * pide — aquí la imagen manda sobre el texto.
   */
  moonToday: [
    { left: '10%', top: '12%', size: 2, twinkleMs: 3000 },
    { left: '29%', top: '6%', size: 1 },
    { left: '74%', top: '9%', size: 2, twinkleMs: 2600 },
    { left: '88%', top: '34%', size: 1 },
    { left: '16%', top: '47%', size: 2, twinkleMs: 3500 },
    { left: '63%', top: '88%', size: 1 },
    { left: '34%', top: '92%', size: 2, twinkleMs: 2900 },
  ],
  /**
   * Artboard 16. Seis, repartidas por los cuatro bordes: aquí el cielo es el
   * fondo de una pantalla casi vacía y puede ocuparla entera sin estorbar a
   * nada — es lo contrario del caso de `moonChange`.
   */
  empty: [
    { left: '11%', top: '13%', size: 2, twinkleMs: 3000 },
    { left: '33%', top: '8%', size: 1 },
    { left: '71%', top: '11%', size: 2, twinkleMs: 2500 },
    { left: '87%', top: '31%', size: 1 },
    { left: '19%', top: '84%', size: 2, twinkleMs: 3400 },
    { left: '64%', top: '91%', size: 1 },
  ],
  /**
   * Artboards 04, 15 y 17. Tres, muy arriba y muy pequeñas: Hoy es una pila de
   * tarjetas con sombra, y una estrella detrás de una tarjeta no se ve — solo
   * queda cielo en la franja de la cabecera. Es también lo que hace que la
   * espera del artboard 15 no parezca una pantalla congelada: lo único que se
   * mueve mientras no hay contenido.
   */
  today: [
    { left: '14%', top: '7%', size: 2, twinkleMs: 3000 },
    { left: '52%', top: '4%', size: 1 },
    { left: '81%', top: '10%', size: 2, twinkleMs: 2700 },
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
  /**
   * Artboard 11. Cinco, en las dos esquinas de arriba y las dos de abajo: el
   * paywall es la tercera pantalla que se hunde al azul profundo, y el cielo
   * enmarca sin meterse en la lista de planes, que ocupa el centro.
   */
  paywall: [
    { left: '12%', top: '10%', size: 2, twinkleMs: 3000 },
    { left: '44%', top: '6%', size: 1 },
    { left: '79%', top: '13%', size: 2, twinkleMs: 2700 },
    { left: '24%', top: '86%', size: 1 },
    { left: '68%', top: '91%', size: 2, twinkleMs: 3400 },
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
 * Cuánto hay que inclinar el móvil para llevar el campo a su tope: medio
 * radián, unos 28°. Es el recorrido cómodo de una muñeca apoyada; a partir de
 * ahí el campo ya no se mueve más, que es lo que evita que un gesto brusco lo
 * mande de un lado a otro.
 */
const TILT_RANGE = 0.5;

/** La inclinación, convertida en píxeles y recortada a la amplitud del token. */
function shift(delta: number): number {
  'worklet';
  const clamped = Math.max(-1, Math.min(1, delta / TILT_RANGE));
  return clamped * motion.parallaxAmplitude;
}

/** Muelle blando: el cielo deriva, no persigue. */
const DRIFT = { damping: 30, stiffness: 40, mass: 1 } as const;

/**
 * Campo estelar de fondo (BRD §11.2). Decorativo: `pointerEvents="none"` y
 * fuera del árbol de accesibilidad — un lector de pantalla no tiene nada que
 * decir de seis puntos de dos píxeles.
 *
 * **Parallax con el giroscopio** (BRD §11.1): el campo se desplaza al
 * contrario que la inclinación, como si la pantalla fuera una ventana y el
 * cielo estuviera detrás. Va por `useAnimatedSensor`, así que la lectura del
 * sensor y el movimiento ocurren enteros en el hilo de UI: nada cruza a
 * JavaScript sesenta veces por segundo.
 *
 * Se apaga solo en los dos casos en los que no debe estar: cuando el
 * dispositivo no tiene el sensor —un simulador, sin ir más lejos— y cuando el
 * sistema pide menos movimiento.
 */
export function StarField({ field }: { field: StarFieldName }) {
  const { sensor, isAvailable } = useAnimatedSensor(SensorType.ROTATION, {
    interval: 'auto',
    adjustToInterfaceOrientation: true,
  });
  const reduceMotion = useReducedMotion();
  const enabled = isAvailable && !reduceMotion;

  // Un móvil en la mano no está plano: se sujeta inclinado hacia el pecho, y
  // medido contra el cero absoluto el campo nacería ya en su tope. La
  // referencia es la primera lectura — la postura en la que se abrió la
  // pantalla—, así que el cielo empieza siempre centrado.
  const rest = useSharedValue<{ roll: number; pitch: number } | null>(null);

  useAnimatedReaction(
    () => ({ roll: sensor.value.roll, pitch: sensor.value.pitch }),
    (current) => {
      if (rest.value === null) rest.value = current;
    },
  );

  const drift = useAnimatedStyle(() => {
    const origin = rest.value;
    if (!enabled || origin === null) return {};
    return {
      transform: [
        { translateX: withSpring(shift(origin.roll - sensor.value.roll), DRIFT) },
        { translateY: withSpring(shift(origin.pitch - sensor.value.pitch), DRIFT) },
      ],
    };
  });

  return (
    <Reanimated.View
      // El campo se dibuja un pelo más grande que la pantalla: así el
      // desplazamiento nunca llega a enseñar un borde vacío.
      style={[styles.field, drift]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {STAR_FIELDS[field].map((star) => (
        <TwinklingStar key={`${star.left}-${star.top}`} star={star} />
      ))}
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    top: -motion.parallaxAmplitude,
    left: -motion.parallaxAmplitude,
    right: -motion.parallaxAmplitude,
    bottom: -motion.parallaxAmplitude,
  },
  star: {
    position: 'absolute',
    borderRadius: radii.pill,
    backgroundColor: colors.star,
  },
});
