import { Image, StyleSheet, Text, View } from 'react-native';

import { text } from '@/_ui/typography';
import type { NatalChart } from '@/chart/domain/NatalChart';
import { elementOfSign } from '@/chart/domain/PlanetPosition';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { formatDegree } from '@/chart/ui/format';
import { PLANET_GLYPHS } from '@/chart/ui/glyphs';
import { SIGN_LABELS } from '@/chart/ui/labels';
import type { Pet } from '@/pet/domain/Pet';
import { breedLabel } from '@/pet/ui/format';
import { usePetPhotoUri } from '@/pet/ui/petQueries';
import { useContentAccess } from '@/subscription/ui/subscriptionQueries';
import type { DailyEdition } from '../domain/DailyEdition';
import { DailyCard } from './DailyCard';
import { dailyAxisCards, lockedAxes } from './dailyCards';
import { EnergyDots } from './EnergyDots';
import { DailyUnlockRow } from './UnlockRow';
import { DAILY_AXIS_LABELS, ENERGY_LABEL, SKY_LABEL, readingOf } from './labels';

import {
  colors,
  elementColor,
  glyphSize,
  icon,
  radii,
  spacing,
  typography,
} from '@/design/theme';

/** Retrato de la tarjeta de identidad (artboard 33). */
const PORTRAIT = 72;
/** El hueco sin foto: el cuadrado de trazo del canvas, en el color del elemento. */
const PLACEHOLDER = 28;
/**
 * Caja del símbolo del eje, para que los tres rótulos empiecen alineados. Sale
 * del rótulo del Ascendente y no del tamaño de icono: «ASC» mide 24,5 px en
 * Karla Bold de 11 con el espaciado del overline, y en una caja de `icon.size.m`
 * se partía en dos líneas. La caja la manda lo más ancho que tiene que caber.
 */
const GLYPH_BOX = 26;

/**
 * **Lo compartido, una sola vez y arriba** (artboard 33). La fase lunar y el
 * cielo del día son del cielo, no de un perro: repetirlos por mascota sería
 * afirmar dos veces el mismo hecho.
 *
 * **Con cuerpo**, como en el día de una sola mascota: cuando debajo se lee el
 * día entero no hay razón para recortarlo. Lo que no lleva son los puntos de
 * energía, que se van a la tarjeta del Sol.
 *
 * **Y es el sitio donde entrará la dinámica de manada** cuando llegue (fase 2,
 * BRD §9): es el único bloque de la pantalla que ya habla de todos a la vez.
 */
export function SharedSkyCard({ headline, body }: { headline: string; body: string }) {
  return (
    <View style={styles.sky}>
      <Text style={styles.skyOverline}>{SKY_LABEL}</Text>
      <Text style={styles.skyHeadline}>{headline}</Text>
      <Text style={styles.skyBody}>{body}</Text>
    </View>
  );
}

/**
 * La tarjeta del carrusel (artboards 33 y 34): **quién**, y nada más.
 *
 * Adelgazó a identidad —retrato, nombre, raza y signo— cuando el detalle bajó
 * a las tres tarjetas de lectura: llevar allí el titular lo decía dos veces,
 * una encima de la otra.
 *
 * **No se toca.** No lleva punta y no lleva a ninguna parte: es la cabecera de
 * lo que hay debajo, no un enlace. Una zona que se pulsa sin decirlo es peor
 * que una que no se pulsa — y a la carta natal se llega desde el perfil.
 */
export function PetIdentityCard({ pet, width }: { pet: Pet; width: number }) {
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);
  const sign = chart?.sunSign();
  const tint = sign ? elementColor(elementOfSign(sign)) : colors.accent;
  const note = [breedLabel(pet.breedId()), sign && SIGN_LABELS[sign]].filter(Boolean).join(' · ');

  return (
    <View style={[styles.identity, { width }]}>
      <View style={[styles.portrait, { borderColor: tint }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { borderColor: tint }]} />
        )}
      </View>
      <View style={styles.names}>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name()}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * La lectura del perro que está delante (artboard 33): sus tres ejes, **las
 * mismas tarjetas que ve una casa de un solo perro**.
 *
 * Es lo que arregló el agujero que abrió el carrusel: el diario trae tres
 * lecturas por perro y el resumen enseñaba una. Deslizar cambia las tres.
 *
 * Cada tarjeta lleva su símbolo a la izquierda —el rótulo compite aquí con el
 * nombre del perro que está encima— y su grado a la derecha. Los puntos de
 * energía van al pie de la del Sol.
 */
export function PetReading({
  pet,
  edition,
  chart,
}: {
  pet: Pet;
  edition: DailyEdition | null | undefined;
  chart: NatalChart | undefined;
}) {
  const cards = dailyAxisCards(edition, chart);
  // El candado es del plan, no de la pantalla: aquí se pregunta lo mismo que
  // en el día de un solo perro, y sale la misma fila de oro debajo.
  const access = useContentAccess();
  const locked = lockedAxes(cards, access);
  if (cards.length === 0) return null;

  return (
    <View style={styles.reading}>
      <Text style={styles.readingLabel}>{readingOf(pet.name())}</Text>
      {cards.map((card, position) => {
        const tint = elementColor(card.element);
        return (
          <DailyCard
            key={card.axis}
            index={position}
            glyph={<AxisGlyph axis={card.axis} tint={tint} />}
            overline={`${DAILY_AXIS_LABELS[card.axis]} · ${SIGN_LABELS[card.sign]}`}
            tint={tint}
            meta={card.degree === undefined ? undefined : <Text style={styles.degree}>{formatDegree(card.degree)}</Text>}
            headline={card.headline}
            body={card.body}
            locked={locked.includes(card.axis)}
            // Solo la del Sol: la energía del día es una y no tres, y es la
            // del eje que manda la lectura.
            footer={
              card.axis === 'sun' ? (
                <View style={styles.energy}>
                  <Text style={styles.energyLabel}>{ENERGY_LABEL}</Text>
                  <EnergyDots
                    score={card.energyScore}
                    color={tint}
                    label={`Energía ${card.energyScore} de 5`}
                  />
                </View>
              ) : undefined
            }
          />
        );
      })}

      {locked.length > 0 ? <DailyUnlockRow axes={locked} petId={pet.id()} /> : null}
    </View>
  );
}

/** El símbolo del eje. El Ascendente no tiene glifo heredado: lleva su rótulo. */
function AxisGlyph({ axis, tint }: { axis: 'sun' | 'moon' | 'ascendant'; tint: string }) {
  return (
    <View style={styles.glyphBox}>
      <Text
        style={[axis === 'ascendant' ? styles.angleGlyph : styles.glyph, { color: tint }]}
        numberOfLines={1}
      >
        {axis === 'ascendant' ? 'ASC' : PLANET_GLYPHS[axis]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing[4],
    gap: spacing[3],
  },
  skyOverline: {
    ...typography.overline,
    color: colors.textFaint,
  },
  skyHeadline: {
    ...typography.section,
    color: colors.text,
  },
  skyBody: {
    ...typography.body,
    color: colors.textMuted,
  },
  identity: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  portrait: {
    width: PORTRAIT,
    height: PORTRAIT,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: PLACEHOLDER,
    height: PLACEHOLDER,
    borderRadius: radii.s,
    borderWidth: icon.stroke,
    opacity: 0.6,
  },
  names: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  reading: {
    gap: spacing[3],
  },
  readingLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  degree: {
    ...text('ephemeris'),
    color: colors.textFaint,
    flexShrink: 0,
  },
  glyphBox: {
    // Ancho mínimo, no fijo: si el sistema sube el cuerpo de letra, la caja
    // crece con el rótulo en vez de partirlo.
    minWidth: GLYPH_BOX,
    alignItems: 'center',
    flexShrink: 0,
  },
  glyph: {
    fontSize: glyphSize.compact,
  },
  angleGlyph: {
    ...typography.overline,
  },
  energy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  energyLabel: {
    ...typography.tabLabel,
    letterSpacing: typography.overline.letterSpacing,
    textTransform: 'uppercase',
    color: colors.textFaint,
    flex: 1,
  },
});
