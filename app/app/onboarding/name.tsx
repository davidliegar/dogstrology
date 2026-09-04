import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAnalytics } from '@/analytics/ui/useAnalytics';
import { ProgressSteps } from '@/_ui/components/ProgressSteps';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { TextField } from '@/_ui/components/TextField';
import { useOnboardingStore } from '@/pet/ui/onboardingStore';

import { colors, spacing, typography } from '@/design/theme';

/** Un nombre de perro no llega a esto; el tope es para que la UI no reviente. */
const MAX_NAME = 40;

export default function OnboardingName() {
  // El primer escalón del embudo (BRD §13, activación). Sin él no se sabe
  // cuánta gente empieza, y una tasa de completado sin denominador no es nada.
  const analytics = useAnalytics();
  useEffect(() => {
    analytics.track('onboarding_started');
  }, [analytics]);

  const name = useOnboardingStore((state) => state.name);
  const setName = useOnboardingStore((state) => state.setName);

  const trimmed = name.trim();
  const advance = () => {
    if (!trimmed) return;
    setName(trimmed);
    router.push('/onboarding/date');
  };

  return (
    <Screen
      scroll
      stars="name"
      header={<ProgressSteps total={3} current={1} />}
      footer={
        <>
          <PrimaryButton label="Seguir" onPress={advance} disabled={!trimmed} />
          {/* La objeción de privacidad se desactiva antes de que aparezca: no
              hay cuenta que crear, y decirlo aquí evita el abandono. */}
          <Text style={styles.note}>Sin cuenta, sin correo. Todo se queda en el móvil.</Text>
        </>
      }
    >
      <View style={styles.block}>
        <Text style={styles.headline}>¿Cómo se llama tu mascota?</Text>
        <Text style={styles.body}>Su nombre aparece en todo lo que la app te cuente. Nada más se pide ahora.</Text>
      </View>
      <TextField
        value={name}
        onChangeText={setName}
        accessibilityLabel="Nombre de tu mascota"
        autoFocus
        autoCapitalize="words"
        maxLength={MAX_NAME}
        returnKeyType="next"
        onSubmitEditing={advance}
      />
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
  note: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
