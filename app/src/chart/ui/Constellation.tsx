import { useEffect, useState } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { Sign } from '../domain/PlanetPosition';
import { CONSTELLATION_CANVAS, CONSTELLATIONS } from './constellations.generated';
import { SIGN_LABELS } from './labels';

import { colors, motion } from '@/design/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Anillos del halo de la estrella dominante, en coordenadas del lienzo de 512.
 * Salen del canvas de diseño: **dos círculos concéntricos**, no una sombra.
 * `filter: drop-shadow` no existe en `react-native-svg`, y aunque existiera,
 * el diseño ya resolvió el halo con geometría — se replica tal cual.
 */
const HALO_RINGS = [
  { r: 46, opacity: 0.35 },
  { r: 72, opacity: 0.18 },
] as const;

export interface ConstellationProps {
  sign: Sign;
  /** Lado en px. El arte es cuadrado por contrato (512 × 512). */
  size: number;
  /**
   * Traza el asterismo al entrar, una sola vez, a `motion.duration.trace`.
   * El bucle de 9000 ms del canvas es ambiental y **no se replica**
   * (`design/componentes.md`): aquí es el revelado de F1, no un adorno vivo.
   */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Las 12 constelaciones reales (BRD §11.2.0, regla de canon): coordenadas de
 * estrellas, no siluetas de perro. El vínculo canino se hace por texto.
 *
 * Dos ranuras de color, como manda el contrato del asset
 * (`design/constelaciones/README.md`): las líneas en `constellationLine`, los
 * nodos en `constellationNode`. Teñir la pieza entera con el acento del
 * elemento al 32 % deja las líneas casi invisibles — se verificó en el Bloque
 * 1, y por eso el color de elemento vive en el chip de al lado, no aquí.
 */
export function Constellation({ sign, size, animate = false, style }: ConstellationProps) {
  const art = CONSTELLATIONS[sign];
  // 0 → sin trazar, 1 → trazado entero. Se interpola por path, porque cada uno
  // tiene su propia longitud y todos deben acabar a la vez.
  const [progress] = useState(() => new Animated.Value(animate ? 0 : 1));

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.trace,
      easing: Easing.bezier(...motion.easing.standard),
      // `strokeDashoffset` no es una prop que el hilo nativo sepa animar.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, progress]);

  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel={`Constelación de ${SIGN_LABELS[sign]}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${CONSTELLATION_CANVAS} ${CONSTELLATION_CANVAS}`}>
        <G stroke={colors.constellationLine} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {art.paths.map(({ d, length }) => (
            <AnimatedPath
              key={d}
              d={d}
              strokeDasharray={length}
              strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [length, 0] })}
            />
          ))}
        </G>

        {art.stars
          .filter((star) => star.dominant)
          .map((star) =>
            HALO_RINGS.map((ring) => (
              <Circle
                key={`halo-${ring.r}`}
                cx={star.cx}
                cy={star.cy}
                r={ring.r}
                fill="none"
                stroke={colors.starGlow}
                strokeWidth={1}
                opacity={ring.opacity}
              />
            )),
          )}

        <G fill={colors.constellationNode}>
          {art.stars.map((star) => (
            <Circle key={`${star.cx},${star.cy}`} cx={star.cx} cy={star.cy} r={star.r} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
