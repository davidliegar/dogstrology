import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { Chip } from '@/_ui/components/Chip';
import { Constellation } from '@/chart/ui/Constellation';
import { formatDegree } from '@/chart/ui/format';
import { ELEMENT_LABELS, MODALITY_LABELS, SIGN_LABELS } from '@/chart/ui/labels';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { useOnboardingStore } from '@/pet/ui/onboardingStore';
import { usePet } from '@/pet/ui/petQueries';
import { useSelectedPetStore } from '@/pet/ui/selectedPetStore';

import { colors, elementColor, screenPadding, spacing, typography } from '@/design/theme';

export default function OnboardingReveal() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { width } = useWindowDimensions();
  const reset = useOnboardingStore((state) => state.reset);
  const select = useSelectedPetStore((state) => state.select);

  const { data: pet, isError: petFailed } = usePet(petId);
  const { data: chart, isError: chartFailed } = useNatalChart(pet);

  const done = () => {
    // La recién creada pasa a ser de la que habla la app. Con una sola mascota
    // da igual —es la primera de la lista—, pero al añadir la segunda desde el
    // 26 no: sin esto se acabaría de dar de alta un perro y la app seguiría
    // enseñando el anterior.
    if (petId) select(petId);
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
