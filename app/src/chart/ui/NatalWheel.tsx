import { memo, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Path, Skia, vec } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { NatalChart } from '../domain/NatalChart';
import { SIGNS, type PlanetId } from '../domain/PlanetPosition';
import { HOUSE_NUMERALS, PLANET_GLYPHS, SIGN_GLYPHS } from './glyphs';
import { CONFIDENCE_LABELS, PLANET_LABELS, SIGN_LABELS } from './labels';
import { WHEEL_CUES, cascadeOrder, planetCue, type Cue } from './reveal';
import {
  ANGULAR_HOUSES,
  ASCENDANT_ANGLE,
  CANVAS,
  CENTER,
  HUB_DEGRADED,
  LEADER,
  MOON_UNCERTAINTY,
  arcPath,
  PLANET_DISC,
  RADII,
  arcMidpoint,
  polar,
  screenAngle,
  spreadAngles,
} from './wheel';

import { colors, fonts, motion, touchTarget } from '@/design/theme';

/**
 * Opacidades del artboard 5. Son tres y siempre las mismas: el filo de la
 * rueda y los ejes al 55, el anillo interior al 35, y todo lo estructural que
 * no debe competir con los planetas, al 18.
 */
const INK = {
  axis: 0.55,
  ring: 0.35,
  structure: 0.18,
  signGlyph: 0.75,
} as const;

/**
 * Tamaños de texto **en unidades del lienzo**, no en píxeles: la rueda entera
 * se escala al ancho que le den. Salen medidos del canvas.
 */
const TEXT = {
  signGlyph: 13,
  planetGlyph: 13,
  houseNumeral: 9,
  angleLabel: 10,
  hubLabel: 10,
} as const;

/** Trazos del ojo central sin casas y del disco de un planeta aproximado. */
const DASH = { hub: [3, 5], planet: [3, 3] } as const;

/**
 * Separación entre las dos líneas del rótulo central, que se reparten
 * alrededor del centro de la rueda.
 *
 * El artboard las da como dos líneas de base (174 y 192) y aquí el texto se
 * centra en un punto, no se apoya en él: convertidas a centros, las dos caen
 * simétricas respecto a 180, que es donde el rótulo tiene que estar — en el
 * eje del ojo que ocupa.
 */
const HUB_LINE_GAP = 18;

/** Anillo que marca el planeta abierto en la hoja (artboard 13). */
const SELECTED_RING = 19;

/**
 * El halo del planeta seleccionado. El artboard 13 lo escribe como
 * `drop-shadow(0 0 12px rgba(232,200,122,0.55))`, y esas dos cifras se
 * traducen: el radio de desenfoque de CSS son **dos sigmas** de la gaussiana
 * que Skia pide, así que 12 px de radio son 6 de `blur`.
 *
 * No es una sombra de React Native ni un `filter` de SVG: ninguno de los dos
 * existe aquí. Es un disco de acento desenfocado debajo del disco real, que
 * además es lo único que se puede animar — una sombra no se puede encender.
 */
const SELECTED_GLOW = { blur: 6, opacity: 0.55 } as const;

/**
 * Cuánto encoge un planeta antes de aterrizar. Lo justo para que el disco
 * llegue, no para que rebote: la rueda es un instrumento, no un juguete.
 */
const PLANET_ENTRY_SCALE = 0.88;

const SIGN_COUNT = 12;
const SIGN_ARC = 360 / SIGN_COUNT;

/**
 * Por dónde empieza a trazarse un anillo y hacia dónde va, en la convención
 * de arco del lienzo (grados, sentido horario, eje Y hacia abajo).
 *
 * Empieza en el Ascendente porque es el ancla de la rueda, y barre en
 * negativo porque en esa convención el sentido antihorario —el que sigue la
 * longitud creciente— es el de los grados decrecientes.
 */
const TRACE = { start: ASCENDANT_ANGLE, sweep: -360 } as const;

const REVEAL_EASING = Easing.bezier(...motion.easing.standard);

/**
 * Lo que no tiene nada que decirle a un lector de pantalla: el dibujo y los
 * glifos que lo rotulan. La rueda entera se leía antes como una sola imagen
 * sin nombre; ahora lo único que se anuncia son los diez planetas, cada uno
 * con el suyo, que es lo que de verdad se puede tocar.
 */
const DECORATIVE = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;

interface Point {
  x: number;
  y: number;
}

/** Un tramo recto como `d`: es lo que se puede trazar con `start`/`end`. */
const segment = (from: Point, to: Point): string => `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

interface PlanetMarkData {
  id: PlanetId;
  disc: Point;
  /** La guía de dos tramos, en un solo trazo: se dibuja del anillo al disco. */
  leader: string;
  /** La franja donde la Luna puede estar de verdad, cuando no hay hora. */
  uncertainty?: string;
  approximate: boolean;
  cue: Cue;
  label: string;
}

/**
 * Todo el "dónde va cada cosa", resuelto de una vez a partir de la carta.
 *
 * Se calcula fuera del componente y se memoriza: dentro solo queda el
 * movimiento. Y se comparte entre las dos capas que dibujan la rueda —el
 * lienzo de Skia y el texto de React Native—, que es lo que garantiza que el
 * glifo caiga exactamente en su disco.
 */
function buildLayout(chart: NatalChart) {
  const ascendant = chart.ascendant();
  const midheaven = chart.midheaven();
  const reference = ascendant?.lon ?? 0;
  const cusps = chart.cusps();

  const signs = SIGNS.map((sign, index) => {
    const boundary = screenAngle(index * SIGN_ARC, reference);
    return {
      sign,
      // Del anillo interior al filo: la marca crece hacia fuera.
      tick: segment(polar(boundary, RADII.inner), polar(boundary, RADII.outer)),
      glyph: polar(screenAngle(index * SIGN_ARC + SIGN_ARC / 2, reference), RADII.signGlyph),
    };
  });

  const houses =
    cusps?.map((cusp, index) => {
      const angle = screenAngle(cusp, reference);
      const next = screenAngle(cusps[(index + 1) % cusps.length], reference);
      return {
        numeral: HOUSE_NUMERALS[index],
        // Del ojo hacia fuera, que es como se abre una casa desde el centro.
        spoke: segment(polar(angle, RADII.hub), polar(angle, RADII.inner)),
        angular: ANGULAR_HOUSES.includes(index + 1),
        at: polar(arcMidpoint(angle, next), RADII.houseNumeral),
      };
    }) ?? [];

  // Los dos ejes con nombre van donde caen, no en una esquina fija: con
  // Placidus el Medio Cielo no está a 90° del Ascendente.
  const angles = [
    ascendant ? { label: 'ASC', at: polar(screenAngle(ascendant.lon, reference), RADII.angleLabel) } : undefined,
    midheaven ? { label: 'MC', at: polar(screenAngle(midheaven.lon, reference), RADII.angleLabel) } : undefined,
  ].filter((angle) => angle !== undefined);

  const planets = chart.planets();
  const trueAngles = planets.map((planet) => screenAngle(planet.longitude(), reference));
  const shownAngles = spreadAngles(trueAngles);
  // La cascada se ordena por donde se **dibuja** cada disco, no por su grado
  // real: si no, un planeta apartado entraría fuera de turno y se vería.
  const ranks = cascadeOrder(shownAngles);

  const marks: PlanetMarkData[] = planets.map((planet, index) => {
    const id = planet.id();
    const shown = shownAngles[index];
    const disc = polar(shown, RADII.planet);
    const approximate = id === 'moon' && chart.isMoonUncertain();
    const bend = polar(trueAngles[index], LEADER.bend);
    return {
      id,
      disc,
      leader: `${segment(polar(trueAngles[index], LEADER.from), bend)} L ${disc.x} ${disc.y}`,
      uncertainty: approximate
        ? arcPath(shown - MOON_UNCERTAINTY, shown + MOON_UNCERTAINTY, RADII.planet)
        : undefined,
      approximate,
      cue: planetCue(ranks[index], planets.length),
      label: `${PLANET_LABELS[id]}, ${SIGN_LABELS[planet.sign()]}${approximate ? ', aproximado' : ''}`,
    };
  });

  return { hasHouses: Boolean(cusps), signs, houses, angles, marks };
}

/**
 * Una entrada del guion del revelado, como valor animado de 0 a 1.
 *
 * Cada capa lleva el suyo y se anima por separado, en vez de repartir un
 * único reloj con aritmética dentro de un worklet: así el guion —lo que se
 * puede equivocar— vive en `reveal.ts` con tests, y aquí solo queda encender
 * animaciones que corren enteras en el hilo de UI.
 */
function useCue(cue: Cue, animate: boolean): SharedValue<number> {
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(cue.delay, withTiming(1, { duration: cue.duration, easing: REVEAL_EASING }));
  }, [animate, cue.delay, cue.duration, progress]);

  return progress;
}

export interface NatalWheelProps {
  chart: NatalChart;
  /** Lado en px con el que se pinta. Manda el ancho disponible. */
  size: number;
  /** El planeta cuya hoja está abierta: se queda marcado detrás del velo. */
  selected?: PlanetId;
  onSelectPlanet?: (planet: PlanetId) => void;
}

/**
 * La rueda natal del artboard 5, dibujada con Skia y revelada al abrirse (F4).
 *
 * **Dos capas, y la frontera no es caprichosa**: el lienzo de Skia lleva la
 * geometría —anillos, radios, discos, halos— porque es lo que hay que animar
 * y lo que `react-native-svg` no sabe mover por el hilo nativo; el texto lo
 * pone React Native encima, porque los glifos de signo y de planeta son
 * caracteres Unicode que resuelve la fuente del sistema, y porque ahí es
 * donde un lector de pantalla puede leerlos y un dedo tocarlos. Las dos capas
 * comparten `buildLayout`, así que hablan de los mismos puntos.
 *
 * Lo que se degrada sin hora ni lugar se cae solo, porque sale del dato: sin
 * `cusps` no hay ni cúspides ni numerales, y sin Ascendente la rueda se
 * orienta por 0° Aries (`screenAngle`). No hay ninguna rama que decida "esto
 * es una carta pobre": hay datos que están y datos que no.
 */
export const NatalWheel = memo(function NatalWheel({
  chart,
  size,
  selected,
  onSelectPlanet,
}: NatalWheelProps) {
  // Quien ha pedido menos movimiento ve la rueda entera desde el primer
  // fotograma. No es una versión pobre: es la misma rueda sin el trayecto.
  const animate = !useReducedMotion();

  const layout = useMemo(() => buildLayout(chart), [chart]);
  const scale = size / CANVAS;

  const rings = useCue(WHEEL_CUES.rings, animate);
  const signs = useCue(WHEEL_CUES.signs, animate);
  const houses = useCue(WHEEL_CUES.houses, animate);

  // Los dos anillos se trazan y el ojo central se enciende con ellos: a 62 de
  // radio el trazado duraría un parpadeo y solo se leería como un tirón.
  const ringPaths = useMemo(() => {
    const ring = (radius: number) => {
      const path = Skia.Path.Make();
      path.addArc(
        { x: CENTER - radius, y: CENTER - radius, width: radius * 2, height: radius * 2 },
        TRACE.start,
        TRACE.sweep,
      );
      return path;
    };
    return { outer: ring(RADII.outer), inner: ring(RADII.inner) };
  }, []);

  // El ojo no se traza: se enciende. Su opacidad es la estructural, atenuada
  // por el mismo avance que trazan los anillos.
  const hubOpacity = useDerivedValue(() => rings.value * INK.structure);

  const signsStyle = useAnimatedStyle(() => ({ opacity: signs.value }));
  const housesStyle = useAnimatedStyle(() => ({ opacity: houses.value }));

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill} {...DECORATIVE}>
        <Group transform={[{ scale }]}>
          <Path
            path={ringPaths.outer}
            end={rings}
            style="stroke"
            strokeWidth={2}
            color={colors.accent}
            opacity={INK.axis}
          />
          <Path
            path={ringPaths.inner}
            end={rings}
            style="stroke"
            strokeWidth={1}
            color={colors.accent}
            opacity={INK.ring}
          />
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={layout.hasHouses ? RADII.hub : HUB_DEGRADED}
            style="stroke"
            strokeWidth={1}
            color={colors.accent}
            opacity={hubOpacity}
          >
            {layout.hasHouses ? null : <DashPathEffect intervals={[...DASH.hub]} />}
          </Circle>

          {/* Anillo de signos: una marca en cada frontera, creciendo hacia el filo. */}
          {layout.signs.map(({ sign, tick }) => (
            <Path
              key={sign}
              path={tick}
              end={signs}
              style="stroke"
              strokeWidth={1}
              color={colors.accent}
              opacity={INK.structure}
            />
          ))}

          {/* Casas. Sin hora y sin lugar no hay cúspides y este bloque entero no existe. */}
          {layout.houses.map(({ numeral, spoke, angular }) => (
            <Path
              key={numeral}
              path={spoke}
              end={houses}
              style="stroke"
              strokeWidth={angular ? 2 : 1}
              color={colors.accent}
              opacity={angular ? INK.axis : INK.structure}
            />
          ))}

          {layout.marks.map((mark) => (
            <PlanetMark key={mark.id} mark={mark} selected={selected === mark.id} animate={animate} />
          ))}
        </Group>
      </Canvas>

      {/* La capa de texto. No recibe toques salvo los discos de planeta, que
          son los únicos que llevan algo debajo. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, signsStyle]} pointerEvents="none" {...DECORATIVE}>
          {layout.signs.map(({ sign, glyph }) => (
            <Marker key={sign} at={glyph} scale={scale} fontSize={TEXT.signGlyph} style={styles.signGlyph}>
              {SIGN_GLYPHS[sign]}
            </Marker>
          ))}
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, housesStyle]} pointerEvents="none" {...DECORATIVE}>
          {layout.houses.map(({ numeral, at }) => (
            <Marker key={numeral} at={at} scale={scale} fontSize={TEXT.houseNumeral} style={styles.houseNumeral}>
              {numeral}
            </Marker>
          ))}
          {layout.angles.map(({ label, at }) => (
            <Marker key={label} at={at} scale={scale} fontSize={TEXT.angleLabel} style={styles.angleLabel}>
              {label}
            </Marker>
          ))}

          {/* Sin casas, el hueco del centro deja de ser el eje de una rueda y
              pasa a ser el sitio donde cabe decir qué falta. El rótulo nombra
              el dato que se echa en falta, no el defecto: es lo que lo vuelve
              accionable. Entra en el turno que habrían ocupado las casas. */}
          {layout.hasHouses ? null : (
            <>
              <HubLabel y={CENTER - HUB_LINE_GAP / 2} scale={scale}>
                {CONFIDENCE_LABELS[chart.confidence()].toUpperCase()}
              </HubLabel>
              <HubLabel y={CENTER + HUB_LINE_GAP / 2} scale={scale}>
                NO HAY CASAS
              </HubLabel>
            </>
          )}
        </Animated.View>

        {layout.marks.map((mark) => (
          <PlanetGlyph
            key={mark.id}
            mark={mark}
            scale={scale}
            animate={animate}
            onPress={onSelectPlanet ? () => onSelectPlanet(mark.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
});

/**
 * Un planeta en el lienzo: su guía, su disco y —cuando está abierto en la
 * hoja— el anillo y el halo que lo dejan localizado detrás del velo.
 */
function PlanetMark({
  mark,
  selected,
  animate,
}: {
  mark: PlanetMarkData;
  selected: boolean;
  animate: boolean;
}) {
  const appear = useCue(mark.cue, animate);
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, {
      duration: animate ? motion.duration.quick : 0,
      easing: REVEAL_EASING,
    });
  }, [animate, selected, selection]);

  const entry = useDerivedValue(() => [
    { scale: PLANET_ENTRY_SCALE + (1 - PLANET_ENTRY_SCALE) * appear.value },
  ]);
  const glowOpacity = useDerivedValue(() => selection.value * SELECTED_GLOW.opacity);
  const ringOpacity = useDerivedValue(() => selection.value * INK.ring);
  const discStroke = useDerivedValue(() => 1 + selection.value);
  const center = vec(mark.disc.x, mark.disc.y);

  return (
    <Group opacity={appear}>
      {/* La franja donde puede estar de verdad. Se pinta debajo de todo lo
          demás y con el ancho del disco: no es un adorno, es el mismo objeto
          ocupando el sitio que su duda le da. */}
      {mark.uncertainty ? (
        <Path
          path={mark.uncertainty}
          style="stroke"
          strokeWidth={PLANET_DISC * 2}
          strokeCap="round"
          color={colors.accent}
          opacity={INK.structure}
        />
      ) : null}
      {/* Guía de dos tramos hasta el grado real, trazándose hacia el disco.
          Cuando el disco no ha tenido que apartarse sale recta y no se nota,
          que es lo suyo. */}
      <Path path={mark.leader} end={appear} style="stroke" strokeWidth={1} color={colors.accent} opacity={INK.axis} />
      <Group origin={center} transform={entry}>
        <Circle c={center} r={PLANET_DISC} color={colors.accent} opacity={glowOpacity}>
          <BlurMask blur={SELECTED_GLOW.blur} style="normal" />
        </Circle>
        <Circle
          c={center}
          r={SELECTED_RING}
          style="stroke"
          strokeWidth={1}
          color={colors.accent}
          opacity={ringOpacity}
        />
        <Circle c={center} r={PLANET_DISC} color={colors.surface} />
        <Circle c={center} r={PLANET_DISC} style="stroke" strokeWidth={discStroke} color={colors.accent}>
          {mark.approximate ? <DashPathEffect intervals={[...DASH.planet]} /> : null}
        </Circle>
      </Group>
    </Group>
  );
}

/**
 * El glifo de un planeta y su objetivo táctil, que son la misma cosa: el
 * artboard pide 44 px de toque aunque el disco mida 26, así que el área es la
 * que manda y el símbolo va centrado en ella.
 */
function PlanetGlyph({
  mark,
  scale,
  animate,
  onPress,
}: {
  mark: PlanetMarkData;
  scale: number;
  animate: boolean;
  onPress?: () => void;
}) {
  const appear = useCue(mark.cue, animate);
  const style = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ scale: PLANET_ENTRY_SCALE + (1 - PLANET_ENTRY_SCALE) * appear.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.marker,
        style,
        {
          left: mark.disc.x * scale - touchTarget / 2,
          top: mark.disc.y * scale - touchTarget / 2,
          width: touchTarget,
          height: touchTarget,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={styles.touch}
        accessibilityRole="button"
        accessibilityLabel={mark.label}
      >
        <Text style={[styles.planetGlyph, { fontSize: TEXT.planetGlyph * scale }]}>{PLANET_GLYPHS[mark.id]}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Una etiqueta centrada en un punto del lienzo.
 *
 * La caja se mide en cuerpos de texto y es ancha a propósito: así el texto se
 * centra sobre su punto sin medirlo, que es lo que el SVG hacía con
 * `alignmentBaseline="central"`. `widthEm` sube donde hay más de un par de
 * letras — con la caja por defecto, "NO HAY CASAS" partiría en dos líneas.
 */
function Marker({
  at,
  scale,
  fontSize,
  widthEm = 6,
  style,
  children,
}: {
  at: Point;
  scale: number;
  fontSize: number;
  widthEm?: number;
  style: StyleProp<TextStyle>;
  children: string;
}) {
  const width = fontSize * scale * widthEm;
  const height = fontSize * scale * 2.2;
  return (
    <View
      style={[styles.marker, { left: at.x * scale - width / 2, top: at.y * scale - height / 2, width, height }]}
    >
      <Text numberOfLines={1} style={[style, { fontSize: fontSize * scale }]}>
        {children}
      </Text>
    </View>
  );
}

function HubLabel({ y, scale, children }: { y: number; scale: number; children: string }) {
  return (
    <Marker at={{ x: CENTER, y }} scale={scale} fontSize={TEXT.hubLabel} widthEm={14} style={styles.hubLabel}>
      {children}
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touch: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signGlyph: {
    color: colors.textMuted,
    opacity: INK.signGlyph,
  },
  planetGlyph: {
    color: colors.accent,
  },
  houseNumeral: {
    color: colors.textFaint,
  },
  angleLabel: {
    fontFamily: fonts.body,
    color: colors.accent,
  },
  hubLabel: {
    fontFamily: fonts.body,
    letterSpacing: 1.2,
    color: colors.textFaint,
  },
});
