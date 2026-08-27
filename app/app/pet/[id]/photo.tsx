import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { usePet, usePetPhotoUri, useSetPetPhoto } from '@/pet/ui/petQueries';

import { colors, feedback, icon, radii, spacing, touchTarget, typography } from '@/design/theme';

const CIRCLE = 200;
const PLUS = 32;
const PLUS_OPACITY = 0.55;
const FRAME = { width: 20, height: 16 };

/** Recorte cuadrado: el retrato es un círculo en todas partes donde se pinta. */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

/**
 * F2 · selector de foto — artboard I.
 *
 * **La única de las nueve que no toca ningún cálculo**, y la única con dos
 * acciones al mismo peso: no hay una obvia entre elegir de la galería y hacer
 * una ahora.
 *
 * La foto se copia a `documentDirectory` y se guarda como **referencia
 * relativa** (BRD §12.2.5, irreversible). Esa copia la hace el caso de uso, no
 * esta pantalla: aquí solo llega la ruta temporal que devuelve el selector.
 */
export default function PhotoPicker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const { data: photoUri } = usePetPhotoUri(pet);
  const setPhoto = useSetPetPhoto();

  const commit = (sourceUri: string | null) =>
    setPhoto.mutate({ id, sourceUri }, { onSuccess: () => router.back() });

  const pick = async (from: 'library' | 'camera') => {
    // El permiso se pide **aquí**, cuando el usuario ya ha dicho que quiere una
    // foto, y no al arrancar: es la misma regla que BRD §14 R8 aplica al push.
    const permission =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled) return;
    commit(result.assets[0].uri);
  };

  return (
    <Screen
      footerDivider
      align="center"
      gap={spacing[6]}
      header={<ScreenHeader title="Su foto" onBack={() => router.back()} />}
      footer={
        <>
          <Text style={styles.privacy}>La foto se queda en este móvil. No se sube a ningún sitio.</Text>
          <Pressable
            onPress={() => (photoUri ? commit(null) : router.back())}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? 'Quitar la foto' : 'Seguir sin foto'}
          >
            <Text style={styles.skip}>{photoUri ? 'Quitar la foto' : 'Seguir sin foto'}</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.circle}>
        <View style={styles.plus}>
          <View style={styles.plusBar} />
          <View style={[styles.plusBar, styles.plusBarVertical]} />
        </View>
        <Text style={styles.hint}>Aparecerá en su perfil y en lo que compartas</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => pick('library')}
          disabled={setPhoto.isPending}
          accessibilityRole="button"
          accessibilityLabel="Elegir de la galería"
          style={[styles.action, styles.actionPrimary]}
        >
          <View style={[styles.frame, styles.frameOnAccent]} />
          <Text style={styles.actionPrimaryLabel}>Elegir de la galería</Text>
        </Pressable>
        <Pressable
          onPress={() => pick('camera')}
          disabled={setPhoto.isPending}
          accessibilityRole="button"
          accessibilityLabel="Hacer una ahora"
          style={[styles.action, styles.actionSecondary]}
        >
          <View style={styles.frame} />
          <Text style={styles.actionSecondaryLabel}>Hacer una ahora</Text>
        </Pressable>
      </View>

      {setPhoto.isError ? <Text style={styles.error}>No se pudo guardar la foto. Inténtalo otra vez.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
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
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    maxWidth: 130,
  },
  actions: {
    gap: spacing[3],
  },
  action: {
    height: touchTarget,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  actionPrimary: {
    backgroundColor: colors.accent,
  },
  actionSecondary: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionPrimaryLabel: {
    ...typography.bodyEmphasis,
    color: colors.onAccent,
  },
  actionSecondaryLabel: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
  frame: {
    width: FRAME.width,
    height: FRAME.height,
    borderWidth: icon.stroke,
    borderColor: colors.accent,
    borderRadius: icon.radius.s,
  },
  frameOnAccent: {
    borderColor: colors.onAccent,
  },
  privacy: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  skip: {
    ...typography.bodyEmphasis,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    ...typography.caption,
    color: feedback.critical,
    textAlign: 'center',
  },
});
