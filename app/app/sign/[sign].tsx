import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { ConnectionFooter } from '@/_ui/components/ConnectionFooter';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { StarField } from '@/_ui/components/StarField';
import { Constellation } from '@/chart/ui/Constellation';
import { constellationNote } from '@/chart/ui/constellationNote';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { PLANET_GLYPHS, SIGN_GLYPHS } from '@/chart/ui/glyphs';
import {
  ELEMENT_LABELS,
  MODALITY_LABELS,
  PLANET_LABELS,
  POSSESSIVE_LABELS,
  SIGN_LABELS,
  SIGN_RULERS,
} from '@/chart/ui/labels';
import { SIGNS, elementOfSign, modalityOfSign, type Sign } from '@/chart/domain/PlanetPosition';
import { useSignPersonality } from '@/content/ui/contentQueries';
import { usePets } from '@/pet/ui/petQueries';

import {
  colors,
  elementColor,
  fonts,
  radii,
  screenPadding,
  spacing,
  typography,
} from '@/design/theme';

/** Aire alrededor del arte dentro de la tarjeta, del artboard. */
const ART_PADDING = spacing[4];

/**
 * Detalle de un signo (artboard 18) — el destino que las tarjetas de la
 * rejilla no tenían.
 *
 * **Casi todo es catálogo sin fecha**: la constelación, el elemento, la
 * modalidad, el regente y el retrato en un perro son iguales para todo el
 * mundo. Lo único que cambia entre un usuario y otro es el pie, que conecta el
 * signo con su mascota — y por eso el pie desaparece sin romper nada cuando la
 * mascota no tiene nada en este signo.
 */
export default function SignDetail() {
  const { sign } = useLocalSearchParams<{ sign: Sign }>();
  const { data: pets } = usePets();
  const pet = pets?.[0];
  const { data: chart } = useNatalChart(pet);
  const { data: fragment } = useSignPersonality(SIGNS.includes(sign) ? sign : undefined);
  const { width } = useWindowDimensions();

  if (!SIGNS.includes(sign)) {
    return (
      <Screen>
        <Text style={styles.body}>Ese signo no existe.</Text>
      </Screen>
    );
  }

  const note = constellationNote(sign);
  const ruler = SIGN_RULERS[sign];
  const element = elementOfSign(sign);
  const art = width - screenPadding * 2 - ART_PADDING * 2;

  // Qué tiene la mascota en este signo. Solo Sol, Luna y Ascendente: son los
  // que el usuario reconoce y los únicos con los que la frase suena a español.
  const own = chart
    ? ([
        chart.sunSign() === sign && 'sun',
        chart.moonSign() === sign && 'moon',
        chart.ascendantSign() === sign && 'ascendant',
      ].find(Boolean) as 'sun' | 'moon' | 'ascendant' | undefined)
    : undefined;

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[5]}
      header={<ScreenHeader overline="Los doce signos" title={SIGN_LABELS[sign]} onBack={() => router.back()} />}
      footer={
        own && pet ? (
          <ConnectionFooter
            title={`${POSSESSIVE_LABELS[own]} de ${pet.name()}`}
            detail="está en este signo"
            // El Ascendente no es un planeta y no tiene hoja: se abre la rueda
            // sin enfocar nada, que es de donde el usuario lo lee.
            onPress={() =>
              router.push({
                pathname: '/pet/[id]/chart',
                params: own === 'ascendant' ? { id: pet.id() } : { id: pet.id(), planet: own },
              })
            }
          />
        ) : null
      }
      footerDivider={Boolean(own && pet)}
    >
      {/* El arte va sobre su propio pozo de cielo, no sobre el fondo de la
          pantalla: es lo que lo separa del texto sin necesidad de un marco. */}
      <View style={styles.sky}>
        <StarField field="reveal" />
        <Constellation sign={sign} size={art} animate />
      </View>

      <View style={styles.identity}>
        <View style={styles.title}>
          <Text style={styles.titleGlyph}>{SIGN_GLYPHS[sign]}</Text>
          <Text style={styles.titleText}>{SIGN_LABELS[sign]}</Text>
        </View>
        <View style={styles.chips}>
          <Chip label={ELEMENT_LABELS[element]} dotColor={elementColor(element)} />
          <Chip label={MODALITY_LABELS[modalityOfSign(sign)]} />
          <Chip label={`${PLANET_GLYPHS[ruler]}  ${PLANET_LABELS[ruler]}`} />
        </View>
      </View>

      <Section label="En un perro">{fragment?.body() ?? ''}</Section>

      {/* Ficha técnica, no prosa: sale de las coordenadas del asset. */}
      <Section label="La constelación">
        {note.stars} Su más brillante, <Text style={styles.star}>{note.brightest}</Text>, {note.magnitude} —{' '}
        {note.visibility}.
      </Section>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
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
    fontSize: typography.title.fontSize,
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
  star: {
    fontFamily: fonts.displayItalic,
    color: colors.text,
  },
});
