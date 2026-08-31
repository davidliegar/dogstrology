import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { joinList } from '@/_ui/text';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { InitialBadge } from '@/_ui/components/InitialBadge';
import { MoonDisc } from '@/chart/ui/MoonDisc';
import { useMoonSky, useNatalCharts } from '@/chart/ui/chartQueries';
import { HOUSE_NUMERALS, SIGN_GLYPHS } from '@/chart/ui/glyphs';
import { HOUSE_LABELS, MOON_PHASE_LABELS, SIGN_LABELS } from '@/chart/ui/labels';
import { archetypalIllumination, isWaningPhase } from '@/chart/ui/moonPhase';
import { exploreCaption, type ExploreFilter, type PetHighlight } from '@/chart/ui/exploreCaptions';
import { HOUSES, elementOfHouse } from '@/chart/domain/House';
import { MOON_PHASE_NAMES, type MoonPhaseName } from '@/chart/domain/NatalChart';
import { SIGNS, elementOfSign, type Sign } from '@/chart/domain/PlanetPosition';
import { usePets } from '@/pet/ui/petQueries';

import {
  colors,
  elementColor,
  fonts,
  glyphSize,
  opacity,
  radii,
  screenPadding,
  spacing,
  typography,
} from '@/design/theme';

const COLUMNS = 3;
/** Punto de elemento de la tarjeta: más pequeño que el de un chip. */
const DOT = 6;
/** El aire de los discos de inicial en la esquina de la tarjeta (artboard 35). */
const BADGES_INSET = 6;
const BADGES_GAP = 3;
/** Disco lunar dentro de la tarjeta. Sale del artboard 22. */
const PHASE_DISC = 38;

/** Los tres filtros del artboard, con el título que le ponen a la pantalla. */
const FILTERS = [
  { id: 'signs', label: 'Signos', title: 'Los doce signos' },
  { id: 'houses', label: 'Casas', title: 'Las doce casas' },
  { id: 'phases', label: 'Fases lunares', title: 'Las ocho fases' },
] as const;

type Filter = ExploreFilter;

/**
 * Explorar (artboards 8, 20 y 22) — destino raíz.
 *
 * **Contenido de catálogo sin fecha**: es lo que la ficha de store puede
 * indexar y lo único de la app que se puede leer sin haber creado una
 * mascota. Los tres filtros reparten las tres rejillas y cada tarjeta abre su
 * ficha.
 *
 * Lo que resalta cada rejilla **no significa lo mismo en las tres**, y esa es
 * la diferencia que explican las leyendas del pie (`exploreCaptions.ts`).
 *
 * **Con varias mascotas se resaltan las de todas** (artboard 35): resaltar
 * solo una convertiría diez de doce tarjetas en falso negativo — dirían
 * «ninguno de tus perros» cuando sí. De quién es cada casilla no lo puede
 * decir el color, porque el color ya es el elemento; lo dice una inicial en un
 * disco, y dos discos cuando la comparten dos perros.
 *
 * El filtro vive en estado local y no en la ruta: la pantalla es una sola, y
 * al volver de una ficha el propio stack de Expo Router la devuelve montada
 * con el filtro donde estaba.
 */
export default function Explore() {
  const [filter, setFilter] = useState<Filter>('signs');
  const { data: pets } = usePets();
  const charts = useNatalCharts(pets);
  const { data: sky } = useMoonSky();
  const { width } = useWindowDimensions();

  // Se calcula el lado en vez de repartir con porcentajes: con `gap` de por
  // medio, un 33,33 % por tarjeta suma más del ancho y la tercera se cae de fila.
  const side = (width - screenPadding * 2 - spacing[3] * (COLUMNS - 1)) / COLUMNS;
  const active = FILTERS.find((one) => one.id === filter) as (typeof FILTERS)[number];

  // Quién resalta qué, alineado con la lista de mascotas. La rejilla de casas
  // puede dejar fuera a una que sí está en la de signos: sin hora y lugar no
  // hay casa que resaltar (BRD §12.3), y eso lo cuenta la leyenda.
  const owners = (pets ?? []).map((pet, index) => {
    const chart = charts[index]?.data;
    return {
      name: pet.name(),
      sign: chart?.sunSign(),
      house: chart?.planet('sun')?.house(),
    };
  });

  const highlights: Record<Filter, PetHighlight[]> = {
    signs: owners.map(({ name, sign }) => ({ name, cell: sign && SIGN_LABELS[sign] })),
    houses: owners.map(({ name, house }) => ({
      name,
      cell: house === undefined ? undefined : `La casa ${HOUSE_NUMERALS[house - 1]}`,
    })),
    phases: [],
  };

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

      {filter === 'signs' ? <SignGrid side={side} owners={owners} /> : null}
      {filter === 'houses' ? <HouseGrid side={side} owners={owners} /> : null}
      {filter === 'phases' ? <PhaseGrid side={side} today={sky?.phase.name} /> : null}

      <Text style={styles.caption}>{exploreCaption({ filter, pets: highlights[filter] })}</Text>
    </Screen>
  );
}

interface Owner {
  name: string;
  sign?: Sign;
  house?: number;
}

/**
 * Si la rejilla tiene algo resaltado. **Decide si las demás tarjetas se
 * apagan**: sin nada resaltado todas van en oro (artboard 8), y en cuanto hay
 * alguna, el resto baja a hueso apagado para que el resaltado se lea
 * (artboard 35). Con cinco perros y cinco casillas encendidas, doce glifos de
 * oro no dirían nada.
 */
const anyOwned = (owners: Owner[], key: 'sign' | 'house'): boolean =>
  owners.some((owner) => owner[key] !== undefined);

function SignGrid({ side, owners }: { side: number; owners: Owner[] }) {
  return (
    <View style={styles.grid}>
      {SIGNS.map((sign) => {
        const mine = owners.filter((owner) => owner.sign === sign);
        return (
          <Card
            key={sign}
            side={side}
            owners={mine.map((owner) => owner.name)}
            dimmed={anyOwned(owners, 'sign') && mine.length === 0}
            label={SIGN_LABELS[sign]}
            dotColor={elementColor(elementOfSign(sign))}
            onPress={() => router.push({ pathname: '/sign/[sign]', params: { sign } })}
          >
            <Text style={styles.glyph}>{SIGN_GLYPHS[sign]}</Text>
          </Card>
        );
      })}
    </View>
  );
}

function HouseGrid({ side, owners }: { side: number; owners: Owner[] }) {
  return (
    <View style={styles.grid}>
      {HOUSES.map((house) => {
        const mine = owners.filter((owner) => owner.house === house);
        return (
          <Card
            key={house}
            side={side}
            owners={mine.map((owner) => owner.name)}
            dimmed={anyOwned(owners, 'house') && mine.length === 0}
            label={HOUSE_LABELS[house]}
            dotColor={elementColor(elementOfHouse(house))}
            onPress={() => router.push({ pathname: '/house/[house]', params: { house } })}
          >
            {/* El numeral romano hace de glifo: una casa no tiene símbolo. */}
            <Text style={styles.numeral}>{HOUSE_NUMERALS[house - 1]}</Text>
          </Card>
        );
      })}
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
  owners = [],
  highlighted,
  dimmed = false,
  label,
  dotColor,
  onPress,
  children,
}: {
  side: number;
  /** Las mascotas que resaltan esta casilla, para los discos de inicial. */
  owners?: string[];
  /** La casilla está resaltada. En signos y casas lo dice `owners`. */
  highlighted?: boolean;
  /** Hay resaltado en la rejilla y esta no lo tiene. */
  dimmed?: boolean;
  label: string;
  dotColor?: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const own = highlighted ?? owners.length > 0;

  return (
    <Pressable
      style={[styles.card, { width: side, height: side }, own && styles.cardOwn]}
      onPress={onPress}
      accessibilityRole="button"
      // Quién la resalta se dice aquí y no solo con los discos: una inicial no
      // se lee con un lector de pantalla, y el nombre sí.
      accessibilityLabel={owners.length > 0 ? `${label}. ${joinList(owners)}` : label}
      accessibilityState={{ selected: own }}
    >
      {owners.length > 0 ? (
        <View style={styles.badges}>
          {owners.map((name) => (
            <InitialBadge key={name} name={name} />
          ))}
        </View>
      ) : null}
      <View style={dimmed ? styles.dimmed : undefined}>{children}</View>
      <Text style={[styles.name, own && styles.nameOwn]}>{label}</Text>
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
  /** Los discos de inicial, arriba a la derecha (artboard 35). */
  badges: {
    position: 'absolute',
    top: BADGES_INSET,
    right: BADGES_INSET,
    flexDirection: 'row',
    gap: BADGES_GAP,
  },
  /**
   * El glifo de una casilla sin resaltar cuando sí hay resaltadas. Se apaga en
   * vez de cambiar de color: el oro sigue siendo el oro, solo que más lejos.
   */
  dimmed: {
    opacity: opacity.disabled,
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
