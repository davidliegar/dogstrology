import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, icon, radii, spacing, typography } from '@/design/theme';
import { text } from '@/_ui/typography';
import type { Pet } from '../domain/Pet';
import { formatBreedAndSex } from './format';

/**
 * Dos medidas, y las dos salen del canvas.
 *
 * `hero` es el hub (artboard 25), donde **el retrato y el nombre son el
 * título de la pantalla**: no hay cabecera encima, así que el bloque tiene que
 * poder sostenerla. `compact` es el perfil editable (artboard A), donde el
 * sitio lo pide la lista de campos y el retrato deja de ser el protagonista.
 */
const AVATAR = { compact: 64, hero: 88 } as const;
const PLUS = 20;
/** El aspa va apagada: es una invitación, no un botón que reclame la pantalla. */
const PLUS_OPACITY = 0.55;

export interface PetIdentityProps {
  pet: Pet;
  /** URI absoluta ya resuelta, o `undefined` si no hay foto. */
  photoUri?: string;
  /** `hero` en el hub, `compact` en el perfil editable. Ver `AVATAR`. */
  size?: keyof typeof AVATAR;
  /**
   * Qué anuncia el retrato cuando se puede tocar y **no lleva a la foto
   * misma**. En el hub lleva a "Sus datos", que es donde se pone; prometer
   * ahí "añadir una foto" sería anunciar una pantalla que está un toque más
   * allá.
   */
  pressLabel?: string;
  onPressAvatar?: () => void;
}

/**
 * Bloque de identidad del perfil (artboard 9): retrato, nombre y la línea de
 * raza y sexo.
 *
 * La foto llega ya resuelta a URI absoluta desde fuera: convertir la
 * referencia relativa en una ruta del dispositivo es infraestructura (BRD
 * §12.2.5) y no puede vivir en un componente. Sin foto, el hueco con su aspa,
 * que es también la llamada a ponerla.
 */
export function PetIdentity({ pet, photoUri, size = 'compact', pressLabel, onPressAvatar }: PetIdentityProps) {
  const subtitle = formatBreedAndSex(pet);
  const side = AVATAR[size];

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPressAvatar}
        disabled={!onPressAvatar}
        accessibilityRole={onPressAvatar ? 'button' : 'image'}
        accessibilityLabel={
          pressLabel ?? (photoUri ? `Foto de ${pet.name()}` : `Añadir una foto de ${pet.name()}`)
        }
        style={[styles.avatar, { width: side, height: side }]}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : onPressAvatar ? (
          // El aspa del canvas, dibujada con dos barras: es el mismo trazo que
          // el resto de la iconografía y se recolorea con el tema.
          //
          // **Solo si el bloque lleva a alguna parte.** En el hub el retrato es
          // el título de la pantalla y no se toca (artboard 25): pintar ahí una
          // invitación que no responde es la mentira que el proyecto no pinta.
          <View style={styles.plus}>
            <View style={styles.plusBar} />
            <View style={[styles.plusBar, styles.plusBarVertical]} />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.names}>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name()}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : onPressAvatar && !photoUri ? (
          <Text style={styles.call}>Añadir una foto</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  plus: {
    width: PLUS,
    height: PLUS,
    opacity: PLUS_OPACITY,
  },
  plusBar: {
    position: 'absolute',
    top: (PLUS - icon.stroke) / 2,
    width: PLUS,
    height: icon.stroke,
    backgroundColor: colors.accent,
  },
  plusBarVertical: {
    top: 0,
    left: (PLUS - icon.stroke) / 2,
    width: icon.stroke,
    height: PLUS,
  },
  names: {
    flexShrink: 1,
    gap: spacing[1],
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
  call: {
    ...text('ephemeris'),
    color: colors.accent,
  },
});
