import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { SIGN_LABELS } from '@/chart/ui/labels';
import type { Pet } from '@/pet/domain/Pet';
import { usePetPhotoUri } from '@/pet/ui/petQueries';
import type { DailyEdition } from '../domain/DailyEdition';
import { dailyAxisCards } from './dailyCards';
import { DAILY_AXIS_LABELS, SKY_LABEL } from './labels';

import { colors, elementColor, icon, opacity, radii, spacing, typography } from '@/design/theme';

/** Retrato de la cabecera de un bloque (artboard 30) y punto de fila (31). */
const BADGE = 44;
const DOT = 8;
/** El hueco sin foto: el cuadrado de trazo del canvas, en el color del elemento. */
const PLACEHOLDER = 16;

/**
 * **Lo compartido, una sola vez y arriba** (artboard 30). La fase lunar y el
 * cielo del día son del cielo, no de un perro: repetirlos por mascota sería
 * afirmar dos veces el mismo hecho.
 *
 * Sin cuerpo y sin puntos de energía, al contrario que en el Hoy de una sola
 * mascota: aquí esta tarjeta es el contexto de lo que viene debajo, y lo que
 * se lee entero es el bloque de cada perro.
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

export interface PetDayProps {
  pet: Pet;
  edition: DailyEdition | null | undefined;
  onPress: () => void;
}

/**
 * El bloque de una mascota en el Hoy de la casa (artboard 30).
 *
 * Lleva **lo que sí es suyo**: su Sol, el titular de su lectura y su línea. El
 * color es el de su elemento y no es decoración — es lo que deja saber de
 * quién habla cada tarjeta sin leer el nombre.
 *
 * `detail="headline"` es el techo del artboard 31: **no es un límite de
 * mascotas** —el plan no pone ninguno— sino de cuánto se cuenta de cada una.
 * Con tres perros o más ninguna lleva cuerpo, porque lo que se viene a hacer
 * ahí es comparar, no leer.
 *
 * La punta lleva **al día completo de ese perro**, no a su perfil: quien toca
 * un bloque quiere más de esa lectura, no editar su fecha de nacimiento.
 */
export function PetDayCard({
  pet,
  edition,
  detail = 'full',
  onPress,
}: PetDayProps & { detail?: 'full' | 'headline' }) {
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);
  const sun = dailyAxisCards(edition, chart).find((card) => card.axis === 'sun');
  const tint = sun ? elementColor(sun.element) : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`El día de ${pet.name()}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: tint }]}>
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
          {sun ? (
            <Text style={[styles.sun, { color: tint }]}>
              {DAILY_AXIS_LABELS.sun} · {SIGN_LABELS[sun.sign]}
            </Text>
          ) : null}
        </View>
        <Chevron direction="right" />
      </View>
      {sun ? <Text style={styles.headline}>{sun.headline}</Text> : null}
      {sun && detail === 'full' ? <Text style={styles.body}>{sun.body}</Text> : null}
    </Pressable>
  );
}

/**
 * Una mascota en una línea (artboard 31): el punto de su elemento, su nombre y
 * el titular de su lectura. Cada fila abre el día de su perro completo.
 */
export function PetDayRow({ pet, edition, onPress }: PetDayProps) {
  const { data: chart } = useNatalChart(pet);
  const sun = dailyAxisCards(edition, chart).find((card) => card.axis === 'sun');
  const tint = sun ? elementColor(sun.element) : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`El día de ${pet.name()}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <View style={styles.names}>
        <Text style={styles.rowName} numberOfLines={1}>
          {pet.name()}
        </Text>
        {sun ? (
          <Text style={styles.rowNote} numberOfLines={2}>
            {sun.headline}
          </Text>
        ) : null}
      </View>
      <Chevron direction="right" />
    </Pressable>
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
  names: {
    flex: 1,
    gap: spacing[1],
  },
  name: {
    ...typography.section,
    color: colors.text,
  },
  sun: {
    ...typography.overline,
  },
  headline: {
    ...typography.section,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    flexShrink: 0,
  },
  rowName: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  rowNote: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
