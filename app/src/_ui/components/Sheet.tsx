import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, radii, screenPadding, spacing, touchTarget } from '@/design/theme';

/** Cubrir la pantalla entera, que es lo que hacen el velo y su contenedor. */
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Asa de la hoja: la barra que se ve, dentro de una zona táctil de 44. */
const GRABBER = { width: 36, height: 4 };

/**
 * La hoja sube con la curva que entra decidida y frena, y baja con la de
 * salida. No es simetría por gusto: al abrir hay algo que enseñar y conviene
 * que llegue pronto; al cerrar solo hay que quitarlo de en medio.
 */
const ENTER = { duration: motion.duration.calm, easing: Easing.bezier(...motion.easing.enter) };
const EXIT = { duration: motion.duration.quick, easing: Easing.bezier(...motion.easing.standard) };

/** Fracción de la hoja que hay que haberse llevado hacia abajo para cerrarla. */
const DISMISS_FRACTION = 0.25;
/** …o este impulso, en px/s, aunque el dedo haya recorrido poco. */
const DISMISS_VELOCITY = 800;

export interface SheetProps {
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * La hoja que sube desde abajo (artboard 13): velo, asa, arrastre y cierre.
 *
 * **Es el armazón y no el contenido.** Lo pidieron dos cosas distintas —la
 * hoja de un planeta y la del Ascendente (D21)— y son de verdad distintas: un
 * planeta tiene velocidad, casa y aspectos, y un ángulo no tiene ninguna de las
 * tres. Lo único que comparten es esto: cómo se abre, cómo se arrastra y cómo
 * se cierra. Copiarlo habría dejado dos gestos que se van separando solos.
 *
 * **La hoja se cierra sola antes de avisar.** Sube al montarse y, para
 * cerrarse, baja y solo entonces llama a `onClose`; si avisara primero, el
 * padre la desmontaría a media animación y desaparecería de golpe. Por eso
 * `dismiss` es lo que se pasa a todo lo que cierra.
 *
 * El velo se apaga con el recorrido de la hoja, no con un tiempo propio:
 * arrastrándola hacia abajo el fondo se va aclarando bajo el dedo, y soltarla
 * a medias devuelve las dos cosas a su sitio a la vez.
 */
export function Sheet({ children, onClose }: SheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  // La hoja sube desde el borde de la pantalla, no desde el borde de la zona
  // segura: sin esto, con la navegación de tres botones el final de su
  // contenido queda debajo de la barra del sistema.
  const insets = useSafeAreaInsets();

  // Cuánto está bajada la hoja: 0 es abierta del todo. Arranca en el alto de
  // la **ventana** y no en el suyo porque el suyo no se sabe hasta el primer
  // layout, y esperar a saberlo dejaría ver un fotograma con la hoja puesta.
  //
  // Los tres se leen y se escriben con `get()`/`set()` y no con `.value`, que
  // es lo que usa el resto de la app. No es capricho: aquí se escriben desde
  // un gesto y desde un `onLayout`, y a `.value` fuera de un hook de
  // Reanimated el compilador de React le ve una mutación de algo que considera
  // inmutable (`react-hooks/immutability`). Los accesores son la misma API
  // dicha de la forma que sí entiende.
  const offset = useSharedValue(windowHeight);
  const sheetHeight = useSharedValue(windowHeight);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    offset.set(withTiming(0, ENTER));
  }, [offset]);

  // Worklet: lo llaman el velo (hilo de JS) y el final del gesto (hilo de la
  // UI), y tiene que hacer lo mismo desde los dos.
  const dismiss = () => {
    'worklet';
    offset.set(
      withTiming(sheetHeight.get(), EXIT, (finished) => {
        if (finished) runOnJS(onClose)();
      }),
    );
  };

  /**
   * El arrastre vive **en el asa y no en la hoja entera**: el cuerpo scrollea,
   * y un gesto vertical en el mismo sitio tendría que negociar con el scroll
   * cada vez. El asa deja de ser decorativa y pasa a ser lo que dice ser.
   */
  const drag = Gesture.Pan()
    .onStart(() => {
      dragStart.set(offset.get());
    })
    .onUpdate((event) => {
      // Hacia arriba no se va: ya está donde tiene que estar, y subirla
      // descubriría el fondo por debajo.
      offset.set(Math.max(0, dragStart.get() + event.translationY));
    })
    .onEnd((event) => {
      const passedThreshold = offset.get() > sheetHeight.get() * DISMISS_FRACTION;
      if (passedThreshold || event.velocityY > DISMISS_VELOCITY) dismiss();
      else offset.set(withTiming(0, ENTER));
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable
          style={styles.fill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>
      <Animated.View
        style={[styles.sheet, sheetStyle]}
        onLayout={(event) => {
          sheetHeight.set(event.nativeEvent.layout.height);
        }}
      >
        <GestureDetector gesture={drag}>
          <View style={styles.handle}>
            <View style={styles.grabber} />
          </View>
        </GestureDetector>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: spacing[6] + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...FILL,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...FILL,
    backgroundColor: colors.scrim,
  },
  fill: {
    ...FILL,
  },
  sheet: {
    backgroundColor: colors.backgroundDeep,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radii.l,
    borderTopRightRadius: radii.l,
    // La hoja no puede comerse la pantalla entera: por encima tiene que
    // seguir viéndose de dónde vienes — el planeta marcado en la rueda, o el
    // ASC en el borde.
    maxHeight: '70%',
  },
  handle: {
    height: touchTarget,
    justifyContent: 'center',
  },
  grabber: {
    width: GRABBER.width,
    height: GRABBER.height,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
  },
  content: {
    padding: screenPadding,
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
});
