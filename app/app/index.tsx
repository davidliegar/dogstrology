import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAllPets } from '@/pet/ui/petQueries';

import { colors, screenPadding, spacing, typography } from '@/design/theme';

/**
 * Reparto de arranque: sin mascota se entra al onboarding, con mascota se va a
 * Hoy. No es una pantalla — no pinta nada propio salvo mientras SQLite abre.
 *
 * La consulta puede fallar de verdad (una migración rota deja la base
 * inservible, BRD §12.2.7), y `retry: 0` significa que ese fallo llega aquí
 * tal cual. Redirigir al onboarding en ese caso escondería el problema y
 * acabaría creando una mascota duplicada, así que se dice.
 */
export default function Index() {
  // **Todas, sin recortar por plan**: el reparto de arranque pregunta si hay
  // alguna mascota, no cuántas se pueden enseñar. Quien tiene tres y ha dejado
  // de pagar sigue teniendo app, no un onboarding.
  const { data: pets, isPending, isError } = useAllPets();

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudo abrir la app</Text>
        <Text style={styles.body}>
          Sus datos están en el móvil y no se han perdido. Cierra la app del todo y vuelve a abrirla.
        </Text>
      </View>
    );
  }

  return <Redirect href={pets.length === 0 ? '/onboarding/name' : '/today'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    gap: spacing[3],
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
