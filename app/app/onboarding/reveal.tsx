import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { Chip } from '@/_ui/components/Chip';
import { useAnalytics } from '@/analytics/ui/useAnalytics';
import { Constellation } from '@/chart/ui/Constellation';
import { formatDegree } from '@/chart/ui/format';
import { ELEMENT_LABELS, MODALITY_LABELS, SIGN_LABELS } from '@/chart/ui/labels';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { useOnboardingStore } from '@/pet/ui/onboardingStore';
import { usePet } from '@/pet/ui/petQueries';

import { colors, elementColor, screenPadding, spacing, typography } from '@/design/theme';

export default function OnboardingReveal() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { width } = useWindowDimensions();
  const reset = useOnboardingStore((state) => state.reset);

  const { data: pet, isError: petFailed } = usePet(petId);
  const { data: chart, isError: chartFailed } = useNatalChart(pet);

  // **El primer valor** (BRD §13): su carta calculada y su signo en pantalla,
  // que es lo que el onboarding promete en menos de 60 segundos. Se mide
  // cuando la carta existe de verdad, no al entrar: entrar y quedarse mirando
  // una ruleta no es haber visto nada.
  const analytics = useAnalytics();
  const revealed = Boolean(chart);
  useEffect(() => {
    if (revealed) analytics.track('reveal_seen');
  }, [analytics, revealed]);

  const done = () => {
    // El wizard ha cumplido: a partir de aquí la verdad es el repositorio.
    reset();
    router.replace('/today');
  };

  // `usePet` lanza PET_NOT_FOUND si el `petId` de la ruta no existe; sin este
  // caso, la pantalla se quedaría girando para siempre.
  if (petFailed || chartFailed) {
    return (
      <Screen stars="reveal" footer={<PrimaryButton label="Seguir" onPress={done} />}>
        <Text style={styles.headline}>No se pudo calcular su carta</Text>
        <Text style={styles.body}>
          {pet?.name() ?? 'Tu perro'} está guardado. Puedes volver a intentarlo desde su perfil.
        </Text>
      </Screen>
    );
  }

  if (!chart) {
    return (
      <Screen stars="reveal">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  const sign = chart.sunSign();
  const sun = chart.planet('sun');

  return (
    <Screen
      stars="reveal"
      gap={spacing[5]}
      footer={<PrimaryButton label="Ver su día" onPress={done} />}
    >
      {/* Ocupa el ancho útil de la pantalla, como en el canvas. Se traza al
          entrar, una sola vez: es el momento de F1. */}
      <Constellation sign={sign} size={width - screenPadding * 2} animate />

      <View style={styles.reveal}>
        <Text style={styles.overline}>Su Sol está en</Text>
        <Text style={styles.sign}>{SIGN_LABELS[sign]}</Text>
        {sun ? (
          <View style={styles.chips}>
            <Chip label={ELEMENT_LABELS[sun.element()]} dotColor={elementColor(sun.element())} />
            <Chip label={MODALITY_LABELS[sun.modality()]} />
            <Chip label={formatDegree(sun.degree())} />
          </View>
        ) : null}
        {/* Hueco de la frase de personalidad del signo. Sale de la categoría
            `personalidad` del catálogo (BRD §7.3), que aún no está generada ni
            revisada — y el contenido no se escribe a mano en la app: es un
            pipeline de build, nunca una llamada en runtime (BRD §7.6). */}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reveal: {
    gap: spacing[3],
    alignItems: 'center',
  },
  overline: {
    ...typography.overline,
    color: colors.textFaint,
  },
  sign: {
    ...typography.hero,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headline: {
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
