import { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Sign } from '../domain/PlanetPosition';
import { CONSTELLATION_CANVAS, CONSTELLATIONS } from './constellations.generated';
import { SIGN_LABELS } from './labels';

import { colors, motion } from '@/design/theme';

/** El lienzo no se lee: lo que se lee es la etiqueta de la `View` de fuera. */
const DECORATIVE = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;

const TRACE_EASING = Easing.bezier(...motion.easing.standard);

/**
 * Anillos del halo de la estrella dominante, en coordenadas del lienzo de 512.
 * Salen del canvas de diseño: **dos círculos concéntricos**, no una sombra.
 * El diseño ya resolvió el halo con geometría — se replica tal cual, en vez de
 * cambiarlo por el desenfoque que Skia sí sabría hacer.
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
   * (`design/components.md`): aquí es el revelado de F1, no un adorno vivo.
   */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Las 12 constelaciones reales (BRD §11.2.0, regla de canon): coordenadas de
 * estrellas, no siluetas de perro. El vínculo canino se hace por texto.
 *
 * Dos ranuras de color, como manda el contrato del asset
 * (`design/constellations/README.md`): las líneas en `constellationLine`, los
 * nodos en `constellationNode`. Teñir la pieza entera con el acento del
 * elemento al 32 % deja las líneas casi invisibles — se verificó en el Bloque
 * 1, y por eso el color de elemento vive en el chip de al lado, no aquí.
 *
 * **Se dibuja con Skia** (F4). Antes era `react-native-svg` animando
 * `strokeDashoffset` con `useNativeDriver: false`, que es exactamente el
 * defecto por el que F4 trajo Skia: el trazado iba por el hilo de JS y se
 * atragantaba con cualquier consulta que resolviera a la vez. Skia recorta un
 * camino **por fracción** (`end`), así que de paso desaparece la longitud
 * precalculada de cada trazo: ya no hay un número derivado que pueda
 * desincronizarse del `d` al que describe.
 *
 * Los trazos siguen empezando y acabando a la vez aunque midan distinto —cada
 * uno se recorta con su propia fracción—, que es lo que hacía el dasharray por
 * path y lo que el revelado necesita.
 */
export function Constellation({ sign, size, animate = false, style }: ConstellationProps) {
  const art = CONSTELLATIONS[sign];
  const scale = size / CONSTELLATION_CANVAS;

  // Quien ha pedido menos movimiento ve el asterismo entero desde el primer
  // fotograma, igual que la rueda. No es una versión pobre: es lo mismo sin
  // el trayecto.
  const reduceMotion = useReducedMotion();
  const traced = animate && !reduceMotion;
  // 0 → sin trazar, 1 → trazado entero.
  const progress = useSharedValue(traced ? 0 : 1);

  useEffect(() => {
    if (!traced) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: motion.duration.trace, easing: TRACE_EASING });
  }, [traced, progress]);

  // `MakeFromSVGString` devuelve `null` con un `d` que no parsea. No puede
  // pasar —el generador solo emite polilíneas y hay un test que lo ata— pero
  // si pasara, se cae ese trazo y no la pantalla entera.
  const paths = useMemo(
    () =>
      art.paths.flatMap(({ d }) => {
        const path = Skia.Path.MakeFromSVGString(d);
        return path === null ? [] : [{ d, path }];
      }),
    [art],
  );

  const dominant = art.stars.find((star) => star.dominant);

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Constelación de ${SIGN_LABELS[sign]}`}
    >
      <Canvas style={StyleSheet.absoluteFill} {...DECORATIVE}>
        <Group transform={[{ scale }]}>
          {paths.map(({ d, path }) => (
            <Path
              key={d}
              path={path}
              end={progress}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
              strokeJoin="round"
              color={colors.constellationLine}
            />
          ))}

          {dominant
            ? HALO_RINGS.map((ring) => (
                <Circle
                  key={ring.r}
                  cx={dominant.cx}
                  cy={dominant.cy}
                  r={ring.r}
                  style="stroke"
                  strokeWidth={1}
                  color={colors.starGlow}
                  opacity={ring.opacity}
                />
              ))
            : null}

          {art.stars.map((star) => (
            <Circle
              key={`${star.cx},${star.cy}`}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              color={colors.constellationNode}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}
