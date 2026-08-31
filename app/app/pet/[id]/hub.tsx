import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PetHub } from '@/pet/ui/PetHub';
import { usePet } from '@/pet/ui/petQueries';

import { colors, screenPadding, spacing, typography } from '@/design/theme';

/**
 * El hub de **una** mascota, apilado — a donde lleva cada fila de la lista
 * (artboard 32).
 *
 * Es el artboard 25 con cabecera de vuelta: con varias mascotas la pestaña
 * lista y el hub deja de ser un destino raíz, así que necesita cómo salir. Con
 * una sola mascota no se llega aquí — el hub *es* la pestaña.
 */
export default function PetHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet, isPending, isError } = usePet(id);

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !pet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo abrir su ficha</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve atrás y entra otra vez.</Text>
      </View>
    );
  }

  return <PetHub pet={pet} onBack={() => router.back()} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    gap: spacing[3],
  },
  errorTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
