import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { text } from '@/_ui/typography';
import type { NatalChart } from '@/chart/domain/NatalChart';
import { elementOfSign } from '@/chart/domain/PlanetPosition';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { formatDegree } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import type { Pet } from '@/pet/domain/Pet';
import { usePetPhotoUri } from '@/pet/ui/petQueries';
import type { DailyEdition } from '../domain/DailyEdition';
import { dailyAxisCards } from './dailyCards';
import { DAILY_AXIS_LABELS, NO_TIME, SKY_LABEL } from './labels';

import { colors, elementColor, icon, opacity, radii, spacing, typography } from '@/design/theme';

/** Retrato de la cabecera de una tarjeta (artboard 33). */
const BADGE = 44;
/** El hueco sin foto: el cuadrado de trazo del canvas, en el color del elemento. */
const PLACEHOLDER = 16;
/** Ancho del rótulo de un eje. Cabe «Su Ascendente» sin partirse. */
const AXIS_LABEL = 78;
/** Alto de una fila de eje. Tres caben bajo el texto sin pedir desplazamiento. */
const AXIS_ROW = 32;

/**
 * **Lo compartido, una sola vez y arriba** (artboard 30, y sigue en el 33). La
 * fase lunar y el cielo del día son del cielo, no de un perro: repetirlos por
 * mascota sería afirmar dos veces el mismo hecho.
 *
 * Sin cuerpo y sin puntos de energía, al contrario que en el Hoy de una sola
 * mascota: aquí esta tarjeta es el contexto de lo que viene debajo, y lo que
 * se lee entero es la tarjeta de cada perro.
 *
 * **Y es el sitio donde entrará la dinámica de manada** cuando llegue (fase 2,
 * BRD §9): es el único bloque de la pantalla que ya habla de todos a la vez.
 */
export function SharedSkyCard({ headline }: { headline: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sharedOverline}>{SKY_LABEL}</Text>
      <Text style={styles.headline}>{headline}</Text>
    </View>
  );
}

export interface PetDayCardProps {
  pet: Pet;
  edition: DailyEdition | null | undefined;
  width: number;
  onPress: () => void;
}

/**
 * La tarjeta de una mascota en el carrusel de Hoy (artboards 33 y 34).
 *
 * **Cabe entera, y eso no es un efecto secundario**: es la restricción que
 * impone el carrusel y de donde sale su altura. Si el contenido de un perro no
 * cupiera, la tarjeta pediría desplazamiento vertical dentro de un carrusel
 * horizontal, que es donde esto se rompe en un móvil de verdad.
 *
 * Lleva su lectura del día —titular y línea— y **sus tres ejes con grado**,
 * que es lo que compra el sitio del carrusel: con una tarjeta por pantalla
 * caben los tres, y con ellos la pantalla del día completo de un perro se
 * quedó sin trabajo. Por eso **la punta abre su carta natal**, que es el paso
 * siguiente de verdad.
 *
 * **El Ascendente que falta se dice, no se quita.** Con varias mascotas
 * conviven las que tienen hora y las que no; borrar la fila dejaría tarjetas
 * de distinta altura en un carrusel y, sobre todo, escondería que a ese perro
 * le falta un dato.
 */
export function PetDayCard({ pet, edition, width, onPress }: PetDayCardProps) {
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);
  const sun = dailyAxisCards(edition, chart).find((card) => card.axis === 'sun');
  const tint = chart ? elementColor(elementOfSign(chart.sunSign())) : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`La carta natal de ${pet.name()}`}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: tint }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholder, { borderColor: tint }]} />
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name()}
        </Text>
        <Chevron direction="right" />
      </View>

      {sun ? <Text style={styles.headline}>{sun.headline}</Text> : null}
      {sun ? <Text style={styles.body}>{sun.body}</Text> : null}

      {chart ? (
        <>
          <View style={styles.divider} />
          <View>
            <AxisRow axis="sun" chart={chart} />
            <AxisRow axis="moon" chart={chart} />
            <AxisRow axis="ascendant" chart={chart} />
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

/**
 * Una fila de eje: el rótulo, el signo y el grado.
 *
 * El grado se calla cuando la Luna es dudosa —dar 8°40′ de algo que puede caer
 * en otro signo es justo lo que la insignia de C.2b existe para evitar— y el
 * Ascendente sin hora dice «Sin hora» en gris, en el sitio del signo.
 */
function AxisRow({ axis, chart }: { axis: 'sun' | 'moon' | 'ascendant'; chart: NatalChart }) {
  const ascendant = chart.ascendant();
  const planet = axis === 'ascendant' ? undefined : chart.planet(axis);

  const sign = axis === 'ascendant' ? ascendant?.sign : planet?.sign();
  const degree =
    axis === 'ascendant'
      ? ascendant?.degree
      : axis === 'moon' && chart.isMoonUncertain()
        ? undefined
        : planet?.degree();

  return (
    <View style={styles.axis}>
      <Text style={styles.axisLabel}>{DAILY_AXIS_LABELS[axis]}</Text>
      <Text style={sign ? styles.axisSign : styles.axisMissing}>{sign ? SIGN_LABELS[sign] : NO_TIME}</Text>
      <Text style={styles.axisDegree}>{degree === undefined ? '' : formatDegree(degree)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing[4],
    gap: spacing[3],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  sharedOverline: {
    ...typography.overline,
    color: colors.textFaint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  badge: {
    width: BADGE,
    height: BADGE,
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
    borderRadius: icon.radius.m,
    borderWidth: icon.stroke,
    opacity: 0.6,
  },
  name: {
    ...typography.section,
    color: colors.text,
    flex: 1,
  },
  headline: {
    ...typography.section,
    color: colors.text,
  },
  /**
   * Interlineado apretado, como en las condiciones: la tarjeta tiene que caber
   * entera y el sitio se recupera de la columna, no recortando el texto.
   */
  body: {
    ...typography.bodyTight,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  axis: {
    height: AXIS_ROW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  axisLabel: {
    ...typography.overline,
    color: colors.textFaint,
    width: AXIS_LABEL,
    flexShrink: 0,
  },
  axisSign: {
    ...typography.bodyEmphasis,
    color: colors.text,
    flex: 1,
  },
  axisMissing: {
    ...typography.bodyEmphasis,
    color: colors.textFaint,
    flex: 1,
  },
  axisDegree: {
    ...text('ephemeris'),
    color: colors.textFaint,
    flexShrink: 0,
  },
});
