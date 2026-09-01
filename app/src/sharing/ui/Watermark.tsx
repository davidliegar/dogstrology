import { useMemo } from 'react';
import { BlurMask, Circle, Group, Path, Skia, Text, type SkTypeface } from '@shopify/react-native-skia';

import {
  CANIS_MAJOR_CANVAS,
  CANIS_MAJOR_LINES,
  CANIS_MAJOR_NODE_SCALE,
  CANIS_MAJOR_SIRIUS,
  CANIS_MAJOR_STARS,
  CANIS_MAJOR_STROKE,
} from '@/_ui/canisMajor';
import { LOGOTYPE, logotypeTracking } from './logotype';

import { colors } from '@/design/theme';

/**
 * El ancho de la composición **tal y como la dibuja el artboard 12**: 390 de
 * pantalla menos los 24 de margen a cada lado. Todo lo demás de aquí son las
 * medidas de ese dibujo divididas por este número, que es lo que convierte
 * «44 px» en una proporción y cumple el «escala con el ancho del lienzo, no en
 * px fijos» de `design/brand/README.md`.
 */
const ARTBOARD_WIDTH = 342;

/** Lado del Can Mayor: 44 sobre 342. */
const MARK_RATIO = 44 / ARTBOARD_WIDTH;
/** Aire entre la marca y el logotipo: 12 sobre 342. */
const GAP_RATIO = 12 / ARTBOARD_WIDTH;
/** Cuerpo del logotipo: 13 sobre 342. */
const LOGOTYPE_RATIO = 13 / ARTBOARD_WIDTH;

/** Lo que el artboard baja el trazo del asterismo. La marca no es el asunto. */
const LINE_OPACITY = 0.55;

/** El halo de Sirio: `drop-shadow(0 0 18px …)` sobre el lienzo de 512. */
const SIRIUS_BLUR = 18;

export interface WatermarkProps {
  /** Ancho de la composición en píxeles del lienzo. De él sale todo lo demás. */
  width: number;
  /** Esquina **inferior izquierda** del conjunto (artboard 12). */
  x: number;
  y: number;
  /** Fraunces 600, ya cargada. La resuelve quien va a renderizar la imagen. */
  typeface: SkTypeface;
}

/**
 * La marca de agua de lo que se comparte (F9 — artboard 12, spec en
 * `design/brand/README.md`).
 *
 * **Es un componente y no un asset**: las imágenes se renderizan desde la app
 * real (BRD §11.2.4), así que esto se compone en el momento con los tokens y la
 * tipografía vivos. No hay PNG que generar.
 *
 * Es además **la creatividad de captación** (BRD §8.1), no un sello de
 * copyright: por eso el artboard la pone **dentro** de la composición, alineada
 * a la izquierda como un pie de autor, y por eso el `README` prohíbe el sello
 * diagonal repetido y cualquier opacidad por debajo del 60%.
 *
 * **Las proporciones salen del dibujo, no de la nota.** El `README` resume la
 * marca como «alto ≈ 3,5% del ancho», que es el cuerpo del logotipo y no el
 * lado del asterismo — el artboard los da concretos (44 y 13 sobre 342) y en un
 * desacuerdo gana el artboard.
 *
 * **El trazo va al 55%, no al 32% de `CanisMajor`.** Aquel es el asterismo a
 * 180 px, donde la línea solo une; este mide una décima parte y tiene que leer
 * sobre `surface` **y** sobre `backgroundDeep`.
 */
export function Watermark({ width, x, y, typeface }: WatermarkProps) {
  const mark = width * MARK_RATIO;
  const scale = mark / CANIS_MAJOR_CANVAS;

  const font = useMemo(
    () => Skia.Font(typeface, width * LOGOTYPE_RATIO),
    [typeface, width],
  );

  /** Cada letra por separado: Skia dibuja glifos y el tracking lo pone quien coloca. */
  const letters = useMemo(() => {
    const tracking = logotypeTracking(font.getSize());
    const widths = font.getGlyphWidths(font.getGlyphIDs(LOGOTYPE));
    let cursor = 0;
    return [...LOGOTYPE].map((letter, index) => {
      const at = cursor;
      cursor += widths[index] + tracking;
      return { letter, x: at };
    });
  }, [font]);

  const top = y - mark;
  // Centrados el uno con el otro, como el `align-items:center` del artboard: la
  // línea base baja media altura de caja desde el centro de la marca.
  const baseline = top + mark / 2 - font.measureText(LOGOTYPE).y / 2;

  return (
    <Group>
      <Group transform={[{ translateX: x }, { translateY: top }, { scale }]}>
        <Group
          style="stroke"
          strokeWidth={CANIS_MAJOR_STROKE}
          strokeCap="round"
          strokeJoin="round"
          color={colors.star}
          opacity={LINE_OPACITY}
        >
          {CANIS_MAJOR_LINES.map((d) => (
            <Path key={d} path={d} />
          ))}
        </Group>

        <Group color={colors.accent}>
          {/* Sirio con su halo, que es lo que la hace la estrella más brillante
              del cielo también aquí. Los demás nodos van limpios. */}
          <Circle
            cx={CANIS_MAJOR_SIRIUS.cx}
            cy={CANIS_MAJOR_SIRIUS.cy}
            r={CANIS_MAJOR_SIRIUS.r * CANIS_MAJOR_NODE_SCALE}
          >
            <BlurMask blur={SIRIUS_BLUR} style="solid" />
          </Circle>
          {CANIS_MAJOR_STARS.filter((star) => !star.dominant).map((star) => (
            <Circle
              key={`${star.cx}-${star.cy}`}
              cx={star.cx}
              cy={star.cy}
              r={star.r * CANIS_MAJOR_NODE_SCALE}
            />
          ))}
        </Group>
      </Group>

      <Group color={colors.accent}>
        {letters.map((letter, index) => (
          <Text
            key={`${letter.letter}-${index}`}
            font={font}
            text={letter.letter}
            x={x + mark + width * GAP_RATIO + letter.x}
            y={baseline}
          />
        ))}
      </Group>
    </Group>
  );
}
