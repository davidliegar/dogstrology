import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, icon, radii, spacing, typography } from '@/design/theme';
import { text } from '@/_ui/typography';
import type { Pet } from '../domain/Pet';
import { formatBreedAndSex } from './format';

/**
 * 64 y no 88: en el perfil editable el sitio lo pide la lista de campos, y el
 * retrato deja de ser el protagonista de la pantalla (artboard A).
 */
const AVATAR = 64;
const PLUS = 20;
/** El aspa va apagada: es una invitación, no un botón que reclame la pantalla. */
const PLUS_OPACITY = 0.55;

export interface PetIdentityProps {
  pet: Pet;
  /** URI absoluta ya resuelta, o `undefined` si no hay foto. */
  photoUri?: string;
  onPressPhoto?: () => void;
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
export function PetIdentity({ pet, photoUri, onPressPhoto }: PetIdentityProps) {
  const subtitle = formatBreedAndSex(pet);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPressPhoto}
        disabled={!onPressPhoto}
        accessibilityRole={onPressPhoto ? 'button' : 'image'}
        accessibilityLabel={photoUri ? `Foto de ${pet.name()}` : `Añadir una foto de ${pet.name()}`}
        style={styles.avatar}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          // El aspa del canvas, dibujada con dos barras: es el mismo trazo que
          // el resto de la iconografía y se recolorea con el tema.
          <View style={styles.plus}>
            <View style={styles.plusBar} />
            <View style={[styles.plusBar, styles.plusBarVertical]} />
          </View>
        )}
      </Pressable>
      <View style={styles.names}>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name()}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : onPressPhoto && !photoUri ? (
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
    width: AVATAR,
    height: AVATAR,
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
