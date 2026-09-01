import { useMemo } from 'react';
import {
  Circle,
  Fill,
  Group,
  Paragraph,
  Skia,
  type SkParagraph,
} from '@shopify/react-native-skia';

import { Watermark } from './Watermark';
import type { ShareCanvas } from './canvases';
import { paragraphStyleOf, type TypographyScale } from './paragraphStyle';
import type { ShareTypefaces } from './shareFonts';

import { colors, spacing, typography } from '@/design/theme';

/**
 * El ancho de la composición en el artboard 12: los 390 de pantalla menos los
 * 24 de margen a cada lado. Todo lo de aquí son sus medidas divididas por este
 * número — la composición **escala con el ancho del lienzo**, así que el mismo
 * diseño sale igual en el 4:5, en el 9:16 y en el cuadrado.
 */
const ARTBOARD_WIDTH = 342;

/** El acolchado de la tarjeta del artboard: 32 arriba y abajo, 24 a los lados. */
const PAD_X = spacing[5];
const PAD_Y = spacing[6];

/** El aire entre los tres textos, y el que los separa de la marca de agua. */
const TEXT_GAP = spacing[4];
const MARK_GAP = spacing[5];

/**
 * Hasta dónde puede encoger el texto para caber. Con dos pasadas basta —la
 * altura converge rápido— y el suelo está para que un caso imprevisto salga
 * pequeño en vez de salir encima de la marca de agua.
 */
const FIT_PASSES = 2;
const MIN_FIT = 0.6;

/**
 * El campo estelar del artboard, en fracción de lienzo. Son estrellas fijas y
 * no aleatorias: la imagen tiene que salir igual dos veces seguidas, porque el
 * usuario puede compartirla, no gustarle y volver a intentarlo.
 */
const STARS = [
  { x: 0.13, y: 0.11, r: 1, opacity: 0.45 },
  { x: 0.37, y: 0.07, r: 0.5, opacity: 0.4 },
  { x: 0.83, y: 0.16, r: 1, opacity: 0.35 },
  { x: 0.22, y: 0.78, r: 0.5, opacity: 0.45 },
  { x: 0.71, y: 0.69, r: 1, opacity: 0.4 },
] as const;

export interface ShareImageProps {
  canvas: ShareCanvas;
  /** «Baloo · Sagitario · 25 de agosto». */
  overline: string;
  headline: string;
  body: string;
  typefaces: ShareTypefaces;
}

/**
 * La imagen que se comparte (F9 · artboard 12).
 *
 * **Es la creatividad de captación** (BRD §8.1), no una captura de pantalla:
 * por eso lleva el campo estelar, el titular a cuerpo de portada y la marca de
 * agua dentro de la composición. Lo que se reconoce al verla en un muro ajeno
 * es la app, y para eso tiene que parecerse a la app.
 *
 * **Los tres textos son los mismos tokens que en pantalla** —`overline`,
 * `title` y `body`—, multiplicados por la escala del lienzo. No hay una
 * tipografía «de compartir»: es la de la app, más grande.
 *
 * El bloque de texto va centrado en el hueco que deja la marca de agua, que sí
 * está anclada abajo. En el 4:5 del artboard las dos cosas casi coinciden; en
 * el 9:16 es lo que evita que la marca flote en mitad de la imagen.
 *
 * **Y si no cabe, el texto encoge hasta caber.** No es un adorno: el esquema
 * del pipeline admite titulares de 60 caracteres y textos de 320 —más del doble
 * que la lectura de ejemplo del artboard—, y con uno de esos ni el 4:5 tiene
 * sitio. La alternativa era recortar la lectura con puntos suspensivos, y el
 * texto **es** el producto: antes pequeño que cortado.
 */
export function ShareImage({ canvas, overline, headline, body, typefaces }: ShareImageProps) {
  const scale = canvas.width / ARTBOARD_WIDTH;
  const width = canvas.width - PAD_X * scale * 2;

  const markHeight = canvas.width * (44 / ARTBOARD_WIDTH);
  const markBottom = canvas.height - PAD_Y * scale;
  const ceiling = markBottom - markHeight - MARK_GAP * scale;
  const available = ceiling - PAD_Y * scale;

  const { paragraphs, gap, total } = useMemo(() => {
    const buildAt = (textScale: number) => {
      const items = [
        build(typefaces, overline.toUpperCase(), typography.overline, colors.accent, textScale),
        build(typefaces, headline, typography.title, colors.text, textScale),
        build(typefaces, body, typography.body, colors.textMuted, textScale),
      ];
      items.forEach((paragraph) => paragraph.layout(width));
      const itemGap = TEXT_GAP * textScale;
      return {
        paragraphs: items,
        gap: itemGap,
        total: items.reduce((sum, p) => sum + p.getHeight(), 0) + itemGap * (items.length - 1),
      };
    };

    // **La raíz cuadrada no es un truco: es la forma del problema.** Encoger el
    // cuerpo reduce a la vez el alto de cada línea y el número de líneas, así
    // que la altura del bloque crece aproximadamente con el cuadrado de la
    // escala. Repartir el ajuste entre las dos acierta casi a la primera;
    // hacerlo lineal encogería el texto casi el doble de lo necesario.
    let factor = 1;
    let fit = buildAt(scale);
    for (let pass = 0; pass < FIT_PASSES && fit.total > available; pass += 1) {
      factor = Math.max(MIN_FIT, factor * Math.sqrt(available / fit.total));
      fit = buildAt(scale * factor);
    }
    return fit;
  }, [typefaces, overline, headline, body, scale, width, available]);

  // Dónde empieza cada párrafo: el de arriba en `top` y cada siguiente debajo
  // del anterior. Se calcula de una vez y no acumulando en una variable — es la
  // misma suma, y así el componente no muta nada mientras pinta.
  const top = Math.max(PAD_Y * scale, (ceiling - total) / 2);
  const offsets = paragraphs.map((_, index) =>
    paragraphs.slice(0, index).reduce((sum, before) => sum + before.getHeight() + gap, top),
  );

  return (
    <Group>
      <Fill color={colors.backgroundDeep} />

      {STARS.map((star) => (
        <Circle
          key={`${star.x}-${star.y}`}
          cx={star.x * canvas.width}
          cy={star.y * canvas.height}
          r={star.r * scale}
          color={colors.star}
          opacity={star.opacity}
        />
      ))}

      {paragraphs.map((paragraph, index) => (
        <Paragraph
          key={index}
          paragraph={paragraph}
          x={PAD_X * scale}
          y={offsets[index]}
          width={width}
        />
      ))}

      <Watermark
        width={canvas.width}
        x={PAD_X * scale}
        y={markBottom}
        typeface={typefaces.logotype}
      />
    </Group>
  );
}

/**
 * Un token de `theme.typography` convertido en párrafo de Skia. La aritmética
 * —y la trampa de las claves indefinidas— vive en `paragraphStyleOf`, que es
 * pura y tiene test; aquí solo se le añade el color y el texto.
 */
function build(
  { provider }: ShareTypefaces,
  text: string,
  token: Omit<TypographyScale, 'scale'>,
  color: string,
  scale: number,
): SkParagraph {
  return Skia.ParagraphBuilder.Make({}, provider)
    .pushStyle({ ...paragraphStyleOf({ ...token, scale }), color: Skia.Color(color) })
    .addText(text)
    .build();
}
