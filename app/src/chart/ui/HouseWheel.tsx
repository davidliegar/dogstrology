import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import { HOUSES, type House } from "../domain/House";
import { HOUSE_NUMERALS } from "./glyphs";
import { CANVAS, arcMidpoint, polar, screenAngle, sectorPath } from "./wheel";

import { colors, fonts } from "@/design/theme";

/**
 * Las doce casas repartidas por igual: 30° cada una. **Esto no es la carta de
 * nadie** —en una carta con Placidus las casas son desiguales—, es el esquema
 * que enseña dónde cae la casa V en la rueda, y ahí las doce miden lo mismo.
 */
const HOUSE_ARC = 360 / HOUSES.length;

/**
 * Radios en el mismo lienzo de 360 que la rueda natal, para poder usar su
 * `polar` sin tocarlo. Las proporciones son las del artboard 21: el sector
 * ocupa la mitad exterior del radio y el numeral va en medio de él.
 */
const RADII = { outer: 156, inner: 78, numeral: 117 } as const;

/** Las opacidades del artboard 5, que este diagrama hereda enteras. */
const INK = {
  ring: 0.35,
  structure: 0.18,
  sector: 0.12,
  edge: 0.55,
  numeral: 0.6,
} as const;

const STROKE = { ring: 1.5, sector: 2.6 } as const;

const NUMERAL_SIZE = 16.5;

/** Del número de casa a los dos ángulos de pantalla que la limitan. */
const bounds = (house: House): { from: number; to: number } => ({
  from: screenAngle((house - 1) * HOUSE_ARC, 0),
  to: screenAngle(house * HOUSE_ARC, 0),
});

export interface HouseWheelProps {
  /** La casa que se resalta: la de la ficha que se está leyendo. */
  house: House;
  /** Lado en px. El diagrama es cuadrado. */
  size: number;
}

/**
 * La rueda de las doce casas con una resaltada (artboard 21): lo que en la
 * ficha de un signo es la constelación, aquí es el sector — porque un sector
 * es todo lo que una casa dibuja.
 *
 * Se pinta con la geometría de la rueda natal y no con un gráfico aparte: el
 * mismo anclaje —la I en el Ascendente, a la izquierda— y el mismo sentido
 * antihorario. Si algún día se cambiara la convención, se cambiaría en
 * `wheel.ts` y las dos pantallas se moverían juntas.
 */
export function HouseWheel({ house, size }: HouseWheelProps) {
  const { from, to } = bounds(house);
  const sector = sectorPath(from, to, RADII.inner, RADII.outer);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`La casa ${HOUSE_NUMERALS[house - 1]} dentro de la rueda`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        {/* El relleno va debajo de todo para que los filos estructurales sigan
          leyéndose por encima de él. */}
        <Path d={sector} fill={colors.accent} opacity={INK.sector} />

        <Circle
          cx={CANVAS / 2}
          cy={CANVAS / 2}
          r={RADII.outer}
          fill="none"
          stroke={colors.accent}
          strokeWidth={STROKE.ring}
          opacity={INK.ring}
        />
        <Circle
          cx={CANVAS / 2}
          cy={CANVAS / 2}
          r={RADII.inner}
          fill="none"
          stroke={colors.accent}
          strokeWidth={STROKE.ring}
          opacity={INK.structure}
        />

        {HOUSES.map((current) => {
          const edge = bounds(current);
          const start = polar(edge.from, RADII.inner);
          const end = polar(edge.from, RADII.outer);
          const numeral = polar(arcMidpoint(edge.from, edge.to), RADII.numeral);
          const highlighted = current === house;
          return (
            <G key={current}>
              <Line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={colors.accent}
                strokeWidth={STROKE.ring}
                opacity={INK.structure}
              />
              <SvgText
                x={numeral.x}
                y={numeral.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fontFamily={fonts.display}
                fontSize={NUMERAL_SIZE}
                fill={highlighted ? colors.accent : colors.textFaint}
                opacity={highlighted ? 1 : INK.numeral}
              >
                {HOUSE_NUMERALS[current - 1]}
              </SvgText>
            </G>
          );
        })}

        {/* El filo del sector, encima de las líneas de cúspide: es lo que hace
          que la casa se lea como una pieza y no como dos radios sueltos. */}
        <Path
          d={sector}
          fill="none"
          stroke={colors.accent}
          strokeWidth={STROKE.sector}
          opacity={INK.edge}
        />
      </Svg>
    </View>
  );
}
