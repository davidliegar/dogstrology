import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';
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

import { Chip } from '@/_ui/components/Chip';
import { text } from '@/_ui/typography';
import type { ChartAspect, AspectNature } from '../domain/ChartAspect';
import type { NatalChart } from '../domain/NatalChart';
import type { PlanetId, PlanetPosition } from '../domain/PlanetPosition';
import { usePlanetFragments } from './chartQueries';
import { formatDailySpeed, formatDegree } from './format';
import { HOUSE_NUMERALS } from './glyphs';
import { ASPECT_LABELS, ELEMENT_LABELS, PLANET_LABELS, SIGN_LABELS } from './labels';

import {
  colors,
  elementColor,
  feedback,
  motion,
  radii,
  screenPadding,
  spacing,
  touchTarget,
  typography,
} from '@/design/theme';

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

/** El título es un grado y baila si las cifras no son de ancho fijo. */
const TABULAR = { fontVariant: ['tabular-nums'] } as TextStyle;

/**
 * El orbe se colorea en vez de escribir "armónico" o "tenso": es la nota del
 * artboard 13. Los tres colores salen de `feedback`, que ya existe — la
 * conjunción no es ni lo uno ni lo otro y se queda en el oro de atención.
 */
const ASPECT_TONES: Record<AspectNature, string> = {
  ease: feedback.positive,
  harmony: feedback.positive,
  tension: feedback.critical,
  polarity: feedback.critical,
  fusion: feedback.attention,
};

export interface PlanetSheetProps {
  chart: NatalChart;
  planet: PlanetPosition;
  onClose: () => void;
}

/**
 * Hoja de planeta (artboard 13): se abre al tocar un disco de la rueda.
 *
 * El velo va por debajo de la hoja y por encima de la rueda, y la rueda deja
 * el planeta marcado: la nota del canvas pide no perder de dónde vienes.
 *
 * **La hoja se cierra sola antes de avisar.** Sube desde abajo al montarse y,
 * para cerrarse, baja y solo entonces llama a `onClose`; si avisara primero,
 * el padre la desmontaría a media animación y desaparecería de golpe. Por eso
 * `dismiss` es lo que se pasa a todo lo que cierra, y `onClose` no se llama
 * desde ningún otro sitio.
 *
 * El velo se apaga con el recorrido de la hoja, no con un tiempo propio:
 * arrastrándola hacia abajo el fondo se va aclarando bajo el dedo, y soltarla
 * a medias devuelve las dos cosas a su sitio a la vez.
 */
export function PlanetSheet({ chart, planet, onClose }: PlanetSheetProps) {
  const { data: fragments, isError } = usePlanetFragments(planet);
  const house = planet.house();
  const aspects = chart.aspectsOf(planet.id());
  const { height: windowHeight } = useWindowDimensions();

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headline}>
            <View style={styles.identity}>
              <Text style={styles.overline}>
                {PLANET_LABELS[planet.id()]}
                {house ? ` · casa ${HOUSE_NUMERALS[house - 1]}` : ''}
              </Text>
              <Text style={[styles.position, TABULAR]}>
                {formatDegree(planet.degree())} {SIGN_LABELS[planet.sign()]}
              </Text>
            </View>
            <View style={styles.meta}>
              <Chip label={ELEMENT_LABELS[planet.element()]} dotColor={elementColor(planet.element())} />
              <Text style={styles.speed}>{formatDailySpeed(planet.dailySpeed())}</Text>
            </View>
          </View>

          {/*
            Dos párrafos y no uno: el catálogo tiene el texto del signo y el de
            la casa por separado (`planet-sign-house`, 240 fragmentos), y la
            cabecera de arriba ya afirma las dos cosas. El artboard pinta uno
            solo porque su carta de ejemplo es de una hoja, no de las dos.
            Sin hora no hay casa y queda el del signo, que es la degradación
            que pide F3.
          */}
          {fragments?.map((fragment) => (
            <Text key={fragment.key()} style={styles.body}>
              {fragment.body()}
            </Text>
          ))}

          {/* Una clave mal formada llega aquí y no al error boundary: la
              construye el `queryFn`. La hoja sigue enseñando la posición. */}
          {isError ? (
            <Text style={styles.body}>Su texto no se pudo abrir. La posición es correcta.</Text>
          ) : null}

          {aspects.length > 0 ? (
            <>
              <View style={styles.divider} />
              <View>
                <Text style={styles.sectionLabel}>Aspectos</Text>
                {aspects.map((aspect, index) => (
                  <AspectRow
                    key={`${aspect.type()}-${aspect.planets().join('-')}`}
                    aspect={aspect}
                    from={planet.id()}
                    divided={index > 0}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function AspectRow({
  aspect,
  from,
  divided,
}: {
  aspect: ChartAspect;
  from: PlanetId;
  divided: boolean;
}) {
  const [a, b] = aspect.planets();
  const other = a === from ? b : a;

  return (
    <>
      {divided ? <View style={styles.divider} /> : null}
      <View style={styles.aspect}>
        <Text style={styles.aspectLabel}>
          {ASPECT_LABELS[aspect.type()]} a su {PLANET_LABELS[other]}
        </Text>
        <Text style={[styles.orb, { color: ASPECT_TONES[aspect.nature()] }]}>
          orbe {formatDegree(aspect.orb())}
        </Text>
      </View>
    </>
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
    // seguir viéndose el planeta marcado en la rueda.
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
  headline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  identity: {
    gap: spacing[1],
    flexShrink: 1,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
  },
  position: {
    ...typography.title,
    color: colors.text,
  },
  meta: {
    gap: spacing[2],
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  speed: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
    paddingBottom: spacing[2],
  },
  aspect: {
    height: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  aspectLabel: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  orb: {
    ...text('ephemeris'),
  },
});
