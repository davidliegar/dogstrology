import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { usePets } from '@/pet/ui/petQueries';

import { colors, spacing, typography } from '@/design/theme';

/**
 * Hoy — **hueco de F5** (Bloque 4). Existe porque F1 tiene que aterrizar en
 * algún sitio: es el destino de "Ver su día", no la pantalla definitiva.
 *
 * Lo único que hace de verdad es demostrar que la mascota creada en el
 * onboarding se lee del repositorio, no del store del wizard — que es lo que
 * cierra F1.
 */
export default function Home() {
  const { data: pets } = usePets();
  const pet = pets?.[0];

  return (
    <Screen align="center">
      <View style={styles.block}>
        <Text style={styles.title}>{pet ? `Hoy, con ${pet.name()}` : 'Hoy'}</Text>
        <Text style={styles.body}>La carta del día llega en F5 (Bloque 4).</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[3],
    alignItems: 'center',
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
