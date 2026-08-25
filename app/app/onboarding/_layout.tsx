import { Stack } from 'expo-router';

/**
 * Las tres pantallas de F1. `gestureEnabled: false` en la revelación se decide
 * en su propia pantalla: volver atrás desde ahí ya no tiene sentido, porque la
 * mascota está creada.
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
