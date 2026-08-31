import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { MoonDisc } from '@/chart/ui/MoonDisc';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { HOUSE_NUMERALS, SIGN_GLYPHS } from '@/chart/ui/glyphs';
import { HOUSE_LABELS, MOON_PHASE_LABELS, SIGN_LABELS } from '@/chart/ui/labels';
import { archetypalIllumination, isWaningPhase } from '@/chart/ui/moonPhase';
import { HOUSES, elementOfHouse } from '@/chart/domain/House';
import { MOON_PHASE_NAMES, type MoonPhaseName } from '@/chart/domain/NatalChart';
import { SIGNS, elementOfSign, type Sign } from '@/chart/domain/PlanetPosition';
import { useSelectedPet } from '@/pet/ui/petQueries';

import {
  colors,
  elementColor,
  fonts,
  glyphSize,
  radii,
  screenPadding,
  spacing,
  typography,
} from '@/design/theme';

const COLUMNS = 3;
/** Punto de elemento de la tarjeta: más pequeño que el de un chip. */
const DOT = 6;
/** Disco lunar dentro de la tarjeta. Sale del artboard 22. */
const PHASE_DISC = 38;

/** Los tres filtros del artboard, con el título que le ponen a la pantalla. */
const FILTERS = [
  { id: 'signs', label: 'Signos', title: 'Los doce signos' },
  { id: 'houses', label: 'Casas', title: 'Las doce casas' },
  { id: 'phases', label: 'Fases lunares', title: 'Las ocho fases' },
] as const;

type Filter = (typeof FILTERS)[number]['id'];

/**
 * Explorar (artboards 8, 20 y 22) — destino raíz.
 *
 * **Contenido de catálogo sin fecha**: es lo que la ficha de store puede
 * indexar y lo único de la app que se puede leer sin haber creado una
 * mascota. Los tres filtros reparten las tres rejillas y cada tarjeta abre su
 * ficha.
 *
 * Lo que resalta cada rejilla **no significa lo mismo en las tres**, y es la
 * diferencia que las tres leyendas del pie explican:
 *
 * - **Signos**: el signo solar de la mascota. Basta la fecha de nacimiento.
 * - **Casas**: la casa donde cae su Sol, que solo existe con hora y lugar
 *   (BRD §12.3). Sin ellos las doce salen iguales, y así debe ser: fingir un
 *   resaltado sería inventar una casa que no se ha podido calcular.
 * - **Fases**: la de **hoy**, no la suya. Las fases son del cielo de este
 *   momento e iguales para todos los perros — es el único sitio de la app
 *   donde lo resaltado caduca solo.
 *
 * El filtro vive en estado local y no en la ruta: la pantalla es una sola, y
 * al volver de una ficha el propio stack de Expo Router la devuelve montada
 * con el filtro donde estaba.
 */
export default function Explore() {
  const [filter, setFilter] = useState<Filter>('signs');
  const { data: pet } = useSelectedPet();
  const { data: chart } = useNatalChart(pet);
  const { data: sky } = useMoonSky();
  const { width } = useWindowDimensions();

  // Se calcula el lado en vez de repartir con porcentajes: con `gap` de por
  // medio, un 33,33 % por tarjeta suma más del ancho y la tercera se cae de fila.
  const side = (width - screenPadding * 2 - spacing[3] * (COLUMNS - 1)) / COLUMNS;
  const active = FILTERS.find((one) => one.id === filter) as (typeof FILTERS)[number];

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader divided title={active.title} />}
    >
      <View style={styles.filters}>
        {FILTERS.map(({ id, label }) => (
          <Chip key={id} label={label} selected={id === filter} onPress={() => setFilter(id)} />
        ))}
      </View>

      {filter === 'signs' ? <SignGrid side={side} own={chart?.sunSign()} /> : null}
      {filter === 'houses' ? <HouseGrid side={side} own={chart?.planet('sun')?.house()} /> : null}
      {filter === 'phases' ? <PhaseGrid side={side} today={sky?.phase.name} /> : null}

      <Text style={styles.caption}>{caption({ filter, name: pet?.name(), hasChart: Boolean(chart) })}</Text>
    </Screen>
  );
}

/**
 * La leyenda del pie. Es lo que evita que las tres rejillas se lean como la
 * misma cosa: dice qué está resaltado y por qué, y calla cuando no hay nada
 * resaltado que explicar.
 */
function caption({ filter, name, hasChart }: { filter: Filter; name?: string; hasChart: boolean }): string {
  if (filter === 'signs') {
    const own = name && hasChart ? `El de ${name} aparece resaltado. ` : '';
    return `${own}Cada signo abre su constelación, su elemento y qué significa en un perro.`;
  }
  if (filter === 'houses') {
    return 'Cada casa abre qué área de la vida gobierna y qué significa en un perro. La de su Sol sale resaltada en cuanto su carta tenga hora y lugar.';
  }
  return 'La resaltada es la de hoy, no la suya: las fases son del cielo de este momento, iguales para todos los perros.';
}

function SignGrid({ side, own }: { side: number; own?: Sign }) {
  return (
    <View style={styles.grid}>
      {SIGNS.map((sign) => (
        <Card
          key={sign}
          side={side}
          highlighted={sign === own}
          label={SIGN_LABELS[sign]}
          dotColor={elementColor(elementOfSign(sign))}
          onPress={() => router.push({ pathname: '/sign/[sign]', params: { sign } })}
        >
          <Text style={styles.glyph}>{SIGN_GLYPHS[sign]}</Text>
        </Card>
      ))}
    </View>
  );
}

function HouseGrid({ side, own }: { side: number; own?: number }) {
  return (
    <View style={styles.grid}>
      {HOUSES.map((house) => (
        <Card
          key={house}
          side={side}
          highlighted={house === own}
          label={HOUSE_LABELS[house]}
          dotColor={elementColor(elementOfHouse(house))}
          onPress={() => router.push({ pathname: '/house/[house]', params: { house } })}
        >
          {/* El numeral romano hace de glifo: una casa no tiene símbolo. */}
          <Text style={styles.numeral}>{HOUSE_NUMERALS[house - 1]}</Text>
        </Card>
      ))}
    </View>
  );
}

function PhaseGrid({ side, today }: { side: number; today?: MoonPhaseName }) {
  return (
    <View style={styles.grid}>
      {MOON_PHASE_NAMES.map((phase) => (
        // Ocho tarjetas en una rejilla de tres: la última fila va a dos. Se
        // deja así en vez de forzar cuatro columnas, porque el disco necesita
        // tamaño para que la fase se distinga.
        <Card
          key={phase}
          side={side}
          highlighted={phase === today}
          label={MOON_PHASE_LABELS[phase]}
          onPress={() => router.push({ pathname: '/phase/[phase]', params: { phase } })}
        >
          {/* Aquí no hay glifo ni punto de elemento: el propio disco es el
              identificador de la fase. */}
          <MoonDisc
            illumination={archetypalIllumination(phase)}
            waning={isWaningPhase(phase)}
            size={PHASE_DISC}
            label={MOON_PHASE_LABELS[phase]}
          />
        </Card>
      ))}
    </View>
  );
}

/** El molde de las tres rejillas: cuadrada, con su marca arriba y su nombre. */
function Card({
  side,
  highlighted,
  label,
  dotColor,
  onPress,
  children,
}: {
  side: number;
  highlighted: boolean;
  label: string;
  dotColor?: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      style={[styles.card, { width: side, height: side }, highlighted && styles.cardOwn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: highlighted }}
    >
      {children}
      <Text style={[styles.name, highlighted && styles.nameOwn]}>{label}</Text>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  card: {
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[1],
  },
  /**
   * El resaltado del artboard, tal cual: relleno de oro al 12 % y filo de oro
   * al 18 %. **Sin el `box-shadow`** — ver el porqué en `glow` de `theme.ts`:
   * una sombra de React Native bajo un relleno translúcido se transparenta y
   * deja un manchón en el centro de la tarjeta.
   */
  cardOwn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
  },
  glyph: {
    fontSize: glyphSize.standard,
    color: colors.accent,
  },
  numeral: {
    fontFamily: fonts.display,
    fontSize: glyphSize.standard,
    letterSpacing: 0.4,
    color: colors.accent,
  },
  name: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  nameOwn: {
    ...typography.caption,
    fontFamily: typography.bodyEmphasis.fontFamily,
    color: colors.text,
    textAlign: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
  },
  caption: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
