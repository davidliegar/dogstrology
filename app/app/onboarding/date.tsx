import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CheckboxRow } from '@/_ui/components/CheckboxRow';
import { DateFields, EMPTY_DATE, toIsoDate, type DateParts } from '@/_ui/components/DateFields';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { ProgressSteps } from '@/_ui/components/ProgressSteps';
import { Screen } from '@/_ui/components/Screen';
import { accuracyFor, useOnboardingStore } from '@/pet/ui/onboardingStore';
import { useCreatePet } from '@/pet/ui/petQueries';

import { colors, feedback, spacing, typography } from '@/design/theme';

export default function OnboardingDate() {
  const name = useOnboardingStore((state) => state.name);
  const dateIsApproximate = useOnboardingStore((state) => state.dateIsApproximate);
  const setDateIsApproximate = useOnboardingStore((state) => state.setDateIsApproximate);
  const setBirthDate = useOnboardingStore((state) => state.setBirthDate);

  const [parts, setParts] = useState<DateParts>(EMPTY_DATE);
  const createPet = useCreatePet();

  const isoDate = toIsoDate(parts);
  // Una fecha futura pasa todas las validaciones de forma y produce una carta
  // perfectamente calculable de un perro que no ha nacido.
  const isFuture = isoDate !== null && isoDate > new Date().toISOString().slice(0, 10);

  const reveal = () => {
    if (!isoDate || isFuture) return;
    setBirthDate(isoDate);
    // La mascota se crea aquí, no en la revelación: si el guardado falla, el
    // error sale con el botón todavía en pantalla y se puede reintentar.
    createPet.mutate(
      {
        name,
        species: 'dog',
        // Hora y lugar se piden después, como mejora progresiva (BRD §11.3).
        birth: { date: isoDate, accuracy: accuracyFor(dateIsApproximate) },
      },
      { onSuccess: (pet) => router.replace({ pathname: '/onboarding/reveal', params: { petId: pet.id() } }) },
    );
  };

  return (
    <Screen
      stars="date"
      header={<ProgressSteps total={3} current={2} />}
      footer={
        <>
          <PrimaryButton
            label="Ver su signo"
            onPress={reveal}
            disabled={!isoDate || isFuture}
            loading={createPet.isPending}
          />
          <Text style={styles.note}>La hora y el lugar se piden después</Text>
        </>
      }
    >
      <View style={styles.block}>
        <Text style={styles.headline}>¿Cuándo nació {name}?</Text>
        <Text style={styles.body}>Con la fecha ya se puede calcular su Sol y, casi siempre, su Luna.</Text>
      </View>

      <DateFields value={parts} onChange={setParts} />

      <View style={styles.hint}>
        <CheckboxRow label="No sé la fecha exacta" checked={dateIsApproximate} onChange={setDateIsApproximate} />
        <Text style={styles.caption}>
          Si es adoptado, se puede partir de la fecha estimada del veterinario o de su día de adopción.
        </Text>
      </View>

      {isFuture ? <Text style={styles.error}>Esa fecha todavía no ha llegado.</Text> : null}
      {createPet.isError ? <Text style={styles.error}>No se pudo guardar. Inténtalo otra vez.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[4],
  },
  headline: {
    ...typography.hero,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  hint: {
    gap: spacing[3],
  },
  caption: {
    ...typography.caption,
    color: colors.textFaint,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  error: {
    ...typography.caption,
    color: feedback.critical,
    textAlign: 'center',
  },
});
