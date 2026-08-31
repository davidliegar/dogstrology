import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { elementOfSign } from '@/chart/domain/PlanetPosition';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { DAILY_AXIS_LABELS } from '@/content/ui/labels';
import { ADD_PET_LABEL } from '@/subscription/ui/labels';
import type { Pet } from '../domain/Pet';
import { formatBreedAndAge } from './format';
import { usePetPhotoUri } from './petQueries';

import { colors, elementColor, icon, opacity, radii, spacing, touchTarget, typography } from '@/design/theme';

/** Retrato de la fila y punto de marcado, los dos del artboard 32. */
const AVATAR = 56;
const MARK = 8;
/** El hueco sin foto: el cuadrado de trazo del canvas, en el color del elemento. */
const PLACEHOLDER = 20;
/** El disco del «+» de la última fila, y el brazo del aspa dentro. */
const PLUS_DISC = icon.size.l;
const PLUS_ARM = 11;

export interface PetRowProps {
  pet: Pet;
  selected: boolean;
  onPress: () => void;
}

/**
 * Una mascota en la lista (artboard 32): retrato, nombre, su Sol y la línea de
 * raza y edad.
 *
 * **El punto de oro es estado y nunca un control.** Entrar en una mascota la
 * selecciona, así que no hay dos maneras de decir lo mismo ni un cruce entre
 * entrar y elegir: se toca la fila, se entra, y de paso la app pasa a hablar
 * de ese perro.
 *
 * La segunda línea es **raza y edad**, que es lo que identifica a un perro
 * cuando son cinco y dos son mestizas medianas. El color del filo y del rótulo
 * es el del elemento de su Sol, el mismo que llevan sus bloques en Hoy.
 */
export function PetRow({ pet, selected, onPress }: PetRowProps) {
  const { data: photoUri } = usePetPhotoUri(pet);
  const { data: chart } = useNatalChart(pet);
  const sign = chart?.sunSign();
  const tint = sign ? elementColor(elementOfSign(sign)) : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={pet.name()}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.selected : styles.plain,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.avatar, { borderColor: tint }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { borderColor: tint }]} />
        )}
      </View>
      <View style={styles.texts}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name()}
          </Text>
          {selected ? <View style={styles.mark} /> : null}
        </View>
        {sign ? (
          <Text style={[styles.sun, { color: tint }]}>
            {DAILY_AXIS_LABELS.sun} · {SIGN_LABELS[sign]}
          </Text>
        ) : null}
        <Text style={styles.note} numberOfLines={1}>
          {formatBreedAndAge(pet)}
        </Text>
      </View>
      <Chevron direction="right" />
    </Pressable>
  );
}

/**
 * La última fila (artboard 32): **en la lista y no flotante**. Son cinco
 * mascotas, no doscientas, y un botón flotante taparía justo la de abajo.
 *
 * Va en trazo discontinuo porque es un hueco por rellenar y no un elemento de
 * la lista, y **sin candado**, igual que en la hoja del 26: con el plan activo
 * pierde el subtítulo y lleva al alta; sin él, al paywall.
 */
export function AddPetRow({ note, onPress }: { note?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={note ? `${ADD_PET_LABEL}. ${note}` : ADD_PET_LABEL}
      style={({ pressed }) => [styles.add, pressed && styles.pressed]}
    >
      <View style={styles.plusDisc}>
        <View style={styles.plusArm} />
        <View style={[styles.plusArm, styles.plusArmVertical]} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.addLabel}>{ADD_PET_LABEL}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radii.row,
    backgroundColor: colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
  },
  /** La marcada lleva filo de oro además del punto: se ve antes que el punto. */
  selected: {
    borderColor: colors.border,
  },
  plain: {
    borderColor: colors.divider,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
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
    borderRadius: icon.radius.l,
    borderWidth: icon.stroke,
    opacity: 0.6,
  },
  texts: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  name: {
    ...typography.section,
    color: colors.text,
    flexShrink: 1,
  },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  sun: {
    ...typography.overline,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  add: {
    minHeight: touchTarget + spacing[3],
    borderRadius: radii.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  addLabel: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
  plusDisc: {
    width: PLUS_DISC,
    height: PLUS_DISC,
    borderRadius: radii.pill,
    borderWidth: icon.stroke,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  plusArm: {
    position: 'absolute',
    width: PLUS_ARM,
    height: icon.stroke,
    backgroundColor: colors.accent,
  },
  plusArmVertical: {
    width: icon.stroke,
    height: PLUS_ARM,
  },
});
