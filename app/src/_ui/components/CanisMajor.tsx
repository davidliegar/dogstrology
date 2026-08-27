import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { colors } from '@/design/theme';

/** El lienzo del asset, igual que el de las 12 del zodiaco. */
const CANVAS = 512;

/**
 * El recorte de **magnitud < 3,6** de `design/brand/canis-major.svg`: las ocho
 * estrellas que se ven a simple vista, sin la rama del cuello. Es el mismo
 * recorte que usan el icono de la app y la marca de agua
 * (`design/brand/README.md`), y por eso se copia en vez de plotear las once:
 * la pieza de marca es esta, no la constelación entera.
 *
 * Los radios son los del asset, que salen de la magnitud aparente real
 * (BRD §11.2.0, regla de canon): Sirio es el más gordo porque es la estrella
 * más brillante del cielo nocturno, no porque sea la protagonista del dibujo.
 */
const LINES = [
  'M402.7 190.1 L291.1 163.6 L202.2 315.3 L175.5 369.8 L208.7 402.7 L224.1 424.8 L414.5 448',
  'M97.5 431.8 L175.5 369.8',
];

const STARS = [
  { cx: 402.7, cy: 190.1, r: 7.2 }, // Mirzam
  { cx: 291.1, cy: 163.6, r: 10, dominant: true }, // Sirio
  { cx: 202.2, cy: 315.3, r: 5.8 }, // Al Zara
  { cx: 175.5, cy: 369.8, r: 7.4 }, // Wezen
  { cx: 208.7, cy: 402.7, r: 5.1 }, // Unurgunite
  { cx: 224.1, cy: 424.8, r: 7.9 }, // Adhara
  { cx: 414.5, cy: 448, r: 5.8 }, // Furud
  { cx: 97.5, cy: 431.8, r: 6.6 }, // Aludra
];

/**
 * A 180 px los puntos del asset se quedan en nada: el artboard 16 los engorda
 * a ojo y el trazo con ellos. Se guarda como factor y no con los radios ya
 * multiplicados para que se siga viendo **de dónde** sale cada tamaño — si el
 * asset se regenera con magnitudes nuevas, estos siguen su proporción.
 */
const NODE_SCALE = 1.45;
const STROKE = 8;

/**
 * Anillos del halo de Sirio, en unidades del lienzo. `filter: drop-shadow` no
 * existe en `react-native-svg`, así que el halo se hace con geometría — la
 * misma solución, y los mismos radios, que `Constellation`.
 */
const HALO_RINGS = [
  { r: 46, opacity: 0.35 },
  { r: 72, opacity: 0.18 },
] as const;

export interface CanisMajorProps {
  /** Lado en px. La pieza es cuadrada. */
  size: number;
}

/**
 * El Can Mayor: la marca de Dogstrology (D14). Es un perro **real** del cielo
 * y contiene a Sirio, que es lo que la idea de las constelaciones-perro
 * buscaba sin tener que inventar ninguna.
 */
export function CanisMajor({ size }: CanisMajorProps) {
  const sirius = STARS.find((star) => star.dominant) as (typeof STARS)[number];

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="La constelación del Can Mayor">
      <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        <G
          stroke={colors.star}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.32}
        >
          {LINES.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>

        {HALO_RINGS.map((ring) => (
          <Circle
            key={ring.r}
            cx={sirius.cx}
            cy={sirius.cy}
            r={ring.r}
            fill={colors.starGlow}
            opacity={ring.opacity}
          />
        ))}

        <G fill={colors.constellationNode}>
          {STARS.map((star) => (
            <Circle key={`${star.cx}-${star.cy}`} cx={star.cx} cy={star.cy} r={star.r * NODE_SCALE} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
