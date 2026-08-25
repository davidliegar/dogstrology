import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DomainProvider } from '@/_ui/DomainProvider';
import { colors } from '@/design/theme';

export default function RootLayout() {
  // El dominio entra una sola vez, en la raíz: de aquí abajo, las pantallas
  // solo ven casos de uso (BRD §12.2.3).
  return (
    <DomainProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </DomainProvider>
  );
}
