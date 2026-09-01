import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import {
  CANIS_MAJOR_CANVAS,
  CANIS_MAJOR_HALO,
  CANIS_MAJOR_LINES,
  CANIS_MAJOR_LINE_OPACITY,
  CANIS_MAJOR_NODE_SCALE,
  CANIS_MAJOR_SIRIUS,
  CANIS_MAJOR_STARS,
  CANIS_MAJOR_STROKE,
} from '@/_ui/canisMajor';

import { colors } from '@/design/theme';

export interface CanisMajorProps {
  /** Lado en px. La pieza es cuadrada. */
  size: number;
}

/**
 * El Can Mayor: la marca de Dogstrology (D14). Es un perro **real** del cielo
 * y contiene a Sirio, que es lo que la idea de las constelaciones-perro
 * buscaba sin tener que inventar ninguna.
 *
 * La geometría vive en `_ui/canisMajor`, que es de donde la lee también la
 * marca de agua de lo que se comparte — esa la pinta Skia, no SVG.
 */
export function CanisMajor({ size }: CanisMajorProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="La constelación del Can Mayor">
      <Svg width={size} height={size} viewBox={`0 0 ${CANIS_MAJOR_CANVAS} ${CANIS_MAJOR_CANVAS}`}>
        <G
          stroke={colors.star}
          strokeWidth={CANIS_MAJOR_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={CANIS_MAJOR_LINE_OPACITY}
        >
          {CANIS_MAJOR_LINES.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>

        {CANIS_MAJOR_HALO.map((ring) => (
          <Circle
            key={ring.r}
            cx={CANIS_MAJOR_SIRIUS.cx}
            cy={CANIS_MAJOR_SIRIUS.cy}
            r={ring.r}
            fill={colors.starGlow}
            opacity={ring.opacity}
          />
        ))}

        <G fill={colors.constellationNode}>
          {CANIS_MAJOR_STARS.map((star) => (
            <Circle
              key={`${star.cx}-${star.cy}`}
              cx={star.cx}
              cy={star.cy}
              r={star.r * CANIS_MAJOR_NODE_SCALE}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
