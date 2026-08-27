import { Link } from 'expo-router';
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
        {/* Entrada provisional al perfil de F2. El canvas sí maqueta la barra
            de navegación con la pestaña de la mascota (artboard 4), pero esa
            barra es el armazón de toda la app y no es de esta tarea: cuando
            exista, este enlace se cae. */}
        {pet ? (
          <Link href={{ pathname: '/pet/[id]', params: { id: pet.id() } }} style={styles.link}>
            Ver su perfil
          </Link>
        ) : null}
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
  link: {
    ...typography.bodyEmphasis,
    color: colors.accent,
    textAlign: 'center',
  },
});
