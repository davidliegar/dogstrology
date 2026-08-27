import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { ConnectionFooter } from '@/_ui/components/ConnectionFooter';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { HouseWheel } from '@/chart/ui/HouseWheel';
import { housePlacementNote } from '@/chart/ui/houseNote';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { HOUSE_NUMERALS, SIGN_GLYPHS } from '@/chart/ui/glyphs';
import {
  ELEMENT_LABELS,
  HOUSE_KIND_LABELS,
  HOUSE_LABELS,
  PLANET_LABELS,
  SIGN_LABELS,
  possessiveOfPlanet,
} from '@/chart/ui/labels';
import {
  elementOfHouse,
  isHouse,
  kindOfHouse,
  signRulingHouse,
  type House,
} from '@/chart/domain/House';
import type { PlanetId } from '@/chart/domain/PlanetPosition';
import { useHouseGlossary } from '@/content/ui/contentQueries';
import { usePets } from '@/pet/ui/petQueries';

import { colors, elementColor, radii, screenPadding, spacing, typography } from '@/design/theme';

/** Aire alrededor del arte dentro de la tarjeta, del artboard. */
const ART_PADDING = spacing[4];

/**
 * Detalle de una casa (artboard 21) — el destino que las tarjetas de la
 * rejilla de casas no tenían.
 *
 * El mismo molde que la ficha de un signo, con el pozo de cielo enseñando lo
 * que aquí hace de constelación: el **sector dentro de la rueda**, que es lo
 * único que una casa dibuja. Los tres chips cambian de significado —elemento,
 * papel respecto a los ejes y signo regente— y el pie enseña el planeta de la
 * mascota que cae dentro.
 *
 * Casi todo es catálogo sin fecha y por eso la pantalla se sostiene sin
 * mascota. Lo único que cambia entre un usuario y otro es el pie, que
 * desaparece entero cuando la mascota no tiene nada aquí — y también cuando
 * no tiene hora ni lugar de nacimiento, porque entonces no hay casas que
 * calcular (BRD §12.3) y ningún planeta sabe en cuál está.
 */
export default function HouseDetail() {
  const { house: raw } = useLocalSearchParams<{ house: string }>();
  const house = Number(raw);
  const valid = isHouse(house);
  const { data: pets } = usePets();
  const pet = pets?.[0];
  const { data: chart } = useNatalChart(pet);
  const { data: fragment } = useHouseGlossary(valid ? house : undefined);
  const { width } = useWindowDimensions();

  if (!valid) {
    return (
      <Screen>
        <Text style={styles.body}>Esa casa no existe.</Text>
      </Screen>
    );
  }

  const element = elementOfHouse(house);
  const ruler = signRulingHouse(house);
  const art = width - screenPadding * 2 - ART_PADDING * 2;
  const inside = chart?.planetsInHouse(house) ?? [];

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[5]}
      header={
        <ScreenHeader overline="Las doce casas" title={HOUSE_LABELS[house]} onBack={() => router.back()} />
      }
      footer={
        pet && inside.length > 0 ? (
          <Tenants house={house} petId={pet.id()} name={pet.name()} inside={inside.map((p) => p.id())} />
        ) : null
      }
      footerDivider={Boolean(pet && inside.length > 0)}
    >
      {/* El sector va sobre su propio pozo de cielo, igual que la
          constelación en la ficha de un signo: es lo que lo separa del texto
          sin necesidad de un marco. Aquí no lleva campo estelar — lo que se
          mira es una figura geométrica, no un trozo de cielo. */}
      <View style={styles.sky}>
        <HouseWheel house={house} size={art} />
        <Text style={styles.placement}>{housePlacementNote(house)}</Text>
      </View>

      <View style={styles.identity}>
        <View style={styles.title}>
          <Text style={styles.titleGlyph}>{HOUSE_NUMERALS[house - 1]}</Text>
          <Text style={styles.titleText}>{HOUSE_LABELS[house]}</Text>
        </View>
        <View style={styles.chips}>
          <Chip label={ELEMENT_LABELS[element]} dotColor={elementColor(element)} />
          <Chip label={HOUSE_KIND_LABELS[kindOfHouse(house)]} />
          <Chip label={`${SIGN_GLYPHS[ruler]}  ${SIGN_LABELS[ruler]}`} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>En un perro</Text>
        <Text style={styles.body}>{fragment?.body() ?? ''}</Text>
      </View>
    </Screen>
  );
}

/**
 * El pie: qué tiene la mascota dentro de esta casa.
 *
 * Se nombra uno y se cuentan los demás. Enumerar los cinco planetas de un
 * racimo llenaría el pie de una lista que nadie lee, y quedarse solo con el
 * primero callaría que hay más — que es justo lo interesante de una casa
 * cargada.
 */
function Tenants({
  house,
  petId,
  name,
  inside,
}: {
  house: House;
  petId: string;
  name: string;
  inside: PlanetId[];
}) {
  const [first, ...rest] = inside;
  const others = rest.map((planet) => PLANET_LABELS[planet]).join(', ');

  return (
    <ConnectionFooter
      title={`${possessiveOfPlanet(first)} de ${name}`}
      detail={`cae en la casa ${HOUSE_NUMERALS[house - 1]}${rest.length > 0 ? `, con ${others}` : ''}`}
      // Abre la hoja del planeta que se nombra, no la rueda entera: el pie
      // promete uno concreto.
      onPress={() => router.push({ pathname: '/pet/[id]/chart', params: { id: petId, planet: first } })}
    />
  );
}

const styles = StyleSheet.create({
  sky: {
    overflow: 'hidden',
    borderRadius: radii.card,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    padding: ART_PADDING,
    gap: spacing[2],
  },
  placement: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  identity: {
    gap: spacing[3],
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[3],
  },
  titleGlyph: {
    ...typography.title,
    color: colors.accent,
  },
  titleText: {
    ...typography.title,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  section: {
    gap: spacing[3],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
});
