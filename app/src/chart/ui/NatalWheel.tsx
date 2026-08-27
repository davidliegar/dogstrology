import { memo } from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import type { NatalChart } from '../domain/NatalChart';
import { SIGNS, type PlanetId } from '../domain/PlanetPosition';
import { HOUSE_NUMERALS, PLANET_GLYPHS, SIGN_GLYPHS } from './glyphs';
import { CONFIDENCE_LABELS, PLANET_LABELS, SIGN_LABELS } from './labels';
import {
  ANGULAR_HOUSES,
  CANVAS,
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

import { colors, fonts, touchTarget } from '@/design/theme';

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
 * Tamaños de texto **en unidades del lienzo**, no en píxeles: el SVG entero se
 * escala al ancho que le den. Salen medidos del canvas.
 */
const TEXT = {
  signGlyph: 13,
  planetGlyph: 13,
  houseNumeral: 9,
  angleLabel: 10,
  hubLabel: 10,
} as const;

/** Trazos del ojo central sin casas y del disco de un planeta aproximado. */
const DASH = { hub: '3 5', planet: '3 3' } as const;

/** Las dos líneas del rótulo central, repartidas alrededor del centro. */
const HUB_LINES = { first: 174, second: 192 } as const;

/** Anillo que marca el planeta abierto en la hoja (artboard 13). */
const SELECTED_RING = 19;

const SIGN_COUNT = 12;
const SIGN_ARC = 360 / SIGN_COUNT;

export interface NatalWheelProps {
  chart: NatalChart;
  /** Lado en px con el que se pinta. Manda el ancho disponible. */
  size: number;
  /** El planeta cuya hoja está abierta: se queda marcado detrás del velo. */
  selected?: PlanetId;
  onSelectPlanet?: (planet: PlanetId) => void;
}

/**
 * La rueda natal del artboard 5, en SVG.
 *
 * **No es Skia y no está animada**: eso es F4. Aquí la rueda es un dibujo que
 * se puede tocar, que es lo que hace falta para que la carta se lea y para que
 * la hoja de planeta tenga desde dónde abrirse.
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
  const ascendant = chart.ascendant();
  const midheaven = chart.midheaven();
  const reference = ascendant?.lon ?? 0;
  const cusps = chart.cusps();

  const planets = chart.planets();
  const trueAngles = planets.map((planet) => screenAngle(planet.longitude(), reference));
  const shownAngles = spreadAngles(trueAngles);

  // El objetivo táctil es de 44 px reales (`touchTarget`), no de 44 unidades
  // del lienzo: cuanto más pequeña se pinte la rueda, más grande tiene que ser
  // el círculo invisible en coordenadas del SVG para seguir midiendo lo mismo
  // bajo el dedo.
  const touchRadius = (touchTarget / 2) * (CANVAS / size);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`} accessibilityRole="image">
      <Circle
        cx={CANVAS / 2}
        cy={CANVAS / 2}
        r={RADII.outer}
        fill="none"
        stroke={colors.accent}
        strokeWidth={2}
        opacity={INK.axis}
      />
      <Circle
        cx={CANVAS / 2}
        cy={CANVAS / 2}
        r={RADII.inner}
        fill="none"
        stroke={colors.accent}
        strokeWidth={1}
        opacity={INK.ring}
      />
      <Circle
        cx={CANVAS / 2}
        cy={CANVAS / 2}
        r={cusps ? RADII.hub : HUB_DEGRADED}
        fill="none"
        stroke={colors.accent}
        strokeWidth={1}
        opacity={INK.structure}
        strokeDasharray={cusps ? undefined : DASH.hub}
      />

      {/* Sin casas, el hueco del centro deja de ser el eje de una rueda y pasa
          a ser el sitio donde cabe decir qué falta. El rótulo nombra el dato
          que se echa en falta, no el defecto: es lo que lo vuelve accionable. */}
      {cusps ? null : (
        <>
          <HubLabel y={HUB_LINES.first}>{CONFIDENCE_LABELS[chart.confidence()].toUpperCase()}</HubLabel>
          <HubLabel y={HUB_LINES.second}>NO HAY CASAS</HubLabel>
        </>
      )}

      {/* Anillo de signos: una marca en cada frontera y el glifo en medio. */}
      {Array.from({ length: SIGN_COUNT }, (_, index) => {
        const boundary = screenAngle(index * SIGN_ARC, reference);
        const from = polar(boundary, RADII.inner);
        const to = polar(boundary, RADII.outer);
        const sign = SIGNS[index];
        const glyph = polar(screenAngle(index * SIGN_ARC + SIGN_ARC / 2, reference), RADII.signGlyph);
        return (
          <G key={sign}>
            <Line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={colors.accent}
              strokeWidth={1}
              opacity={INK.structure}
            />
            <SvgText
              x={glyph.x}
              y={glyph.y}
              textAnchor="middle"
              // `central` y no `middle`: es lo que centra de verdad un glifo
              // en `react-native-svg`, y el canvas usa el mismo.
              alignmentBaseline="central"
              fontSize={TEXT.signGlyph}
              fill={colors.textMuted}
              opacity={INK.signGlyph}
            >
              {SIGN_GLYPHS[sign]}
            </SvgText>
          </G>
        );
      })}

      {/* Casas. Sin hora y sin lugar no hay cúspides y este bloque entero no existe. */}
      {cusps?.map((cusp, index) => {
        const angle = screenAngle(cusp, reference);
        const from = polar(angle, RADII.hub);
        const to = polar(angle, RADII.inner);
        const angular = ANGULAR_HOUSES.includes(index + 1);
        const nextCusp = cusps[(index + 1) % cusps.length];
        const numeral = polar(arcMidpoint(angle, screenAngle(nextCusp, reference)), RADII.houseNumeral);
        return (
          <G key={`house-${index + 1}`}>
            <Line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={colors.accent}
              strokeWidth={angular ? 2 : 1}
              opacity={angular ? INK.axis : INK.structure}
            />
            <SvgText
              x={numeral.x}
              y={numeral.y}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={TEXT.houseNumeral}
              fill={colors.textFaint}
            >
              {HOUSE_NUMERALS[index]}
            </SvgText>
          </G>
        );
      })}

      {/* Los dos ejes con nombre. Van donde caen, no en una esquina fija: con
          Placidus el Medio Cielo no está a 90° del Ascendente. */}
      {ascendant ? <AngleLabel label="ASC" angle={screenAngle(ascendant.lon, reference)} /> : null}
      {midheaven ? <AngleLabel label="MC" angle={screenAngle(midheaven.lon, reference)} /> : null}

      {planets.map((planet, index) => {
        const id = planet.id();
        const shown = shownAngles[index];
        const disc = polar(shown, RADII.planet);
        const leaderFrom = polar(trueAngles[index], LEADER.from);
        const leaderBend = polar(trueAngles[index], LEADER.bend);
        const isSelected = selected === id;
        const approximate = id === 'moon' && chart.isMoonUncertain();
        const label = `${PLANET_LABELS[id]}, ${SIGN_LABELS[planet.sign()]}${approximate ? ', aproximado' : ''}`;

        return (
          <G key={id}>
            {/* La franja donde puede estar de verdad. Se pinta debajo de todo
                lo demás y con el ancho del disco: no es un adorno, es el
                mismo objeto ocupando el sitio que su duda le da. */}
            {approximate ? (
              <Path
                d={arcPath(shown - MOON_UNCERTAINTY, shown + MOON_UNCERTAINTY, RADII.planet)}
                fill="none"
                stroke={colors.accent}
                strokeWidth={PLANET_DISC * 2}
                strokeLinecap="round"
                opacity={INK.structure}
              />
            ) : null}
            {/* Guía de dos tramos hasta el grado real. Cuando el disco no ha
                tenido que apartarse sale recta y no se nota, que es lo suyo. */}
            <Line
              x1={leaderFrom.x}
              y1={leaderFrom.y}
              x2={leaderBend.x}
              y2={leaderBend.y}
              stroke={colors.accent}
              strokeWidth={1}
              opacity={INK.axis}
            />
            <Line
              x1={leaderBend.x}
              y1={leaderBend.y}
              x2={disc.x}
              y2={disc.y}
              stroke={colors.accent}
              strokeWidth={1}
              opacity={INK.ring}
            />
            {isSelected ? (
              <Circle
                cx={disc.x}
                cy={disc.y}
                r={SELECTED_RING}
                fill="none"
                stroke={colors.accent}
                strokeWidth={1}
                opacity={INK.ring}
              />
            ) : null}
            <Circle
              cx={disc.x}
              cy={disc.y}
              r={PLANET_DISC}
              fill={colors.surface}
              stroke={colors.accent}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={approximate ? DASH.planet : undefined}
            />
            <SvgText
              x={disc.x}
              y={disc.y}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={TEXT.planetGlyph}
              fill={colors.accent}
            >
              {PLANET_GLYPHS[id]}
            </SvgText>
            {/* El área que se toca, invisible y del tamaño que manda la guía.
                Va la última para quedar por encima de los discos vecinos. */}
            <Circle
              cx={disc.x}
              cy={disc.y}
              r={touchRadius}
              fill={colors.transparent}
              onPress={onSelectPlanet ? () => onSelectPlanet(id) : undefined}
              accessible
              accessibilityLabel={label}
            />
          </G>
        );
      })}
    </Svg>
  );
});

function HubLabel({ y, children }: { y: number; children: string }) {
  return (
    <SvgText
      x={CANVAS / 2}
      y={y}
      textAnchor="middle"
      fontFamily={fonts.body}
      fontSize={TEXT.hubLabel}
      letterSpacing={1.2}
      fill={colors.textFaint}
    >
      {children}
    </SvgText>
  );
}

function AngleLabel({ label, angle }: { label: string; angle: number }) {
  const point = polar(angle, RADII.angleLabel);
  return (
    <SvgText
      x={point.x}
      y={point.y}
      textAnchor="middle"
      alignmentBaseline="central"
      fontFamily={fonts.body}
      fontSize={TEXT.angleLabel}
      fill={colors.accent}
    >
      {label}
    </SvgText>
  );
}
