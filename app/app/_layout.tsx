import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DomainProvider } from '@/_ui/DomainProvider';
import { fontAssets } from '@/_ui/fonts';

import { colors, motion } from '@/design/theme';

// Se pide antes de montar nada: si el splash se ocultase solo, el primer
// fotograma saldría con la fuente de sistema (BRD §11.2.2 lo prohíbe).
SplashScreen.preventAutoHideAsync();
// `trace` y no `calm`: la nota del artboard 28 dice que **el único movimiento
// admisible del splash es cómo se sale**, un fundido de `duration.trace` hacia
// el 01 o hacia el día. Es el mismo tiempo que tarda en trazarse un asterismo,
// y el splash lleva uno dibujado.
SplashScreen.setOptions({ duration: motion.duration.trace, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    // `fontError` también oculta el splash: quedarse en el splash para
    // siempre es peor que una pantalla con la fuente equivocada.
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  // El dominio entra una sola vez, en la raíz: de aquí abajo, las pantallas
  // solo ven casos de uso (BRD §12.2.3).
  //
  // `GestureHandlerRootView` envuelve la app entera porque un gesto solo llega
  // a `GestureDetector` si tiene esta raíz por encima — y sin ella no falla,
  // simplemente el gesto no ocurre. Hoy la usa el arrastre de la hoja de
  // planeta; la pila nativa de `Stack` no la monta por su cuenta.
  return (
    <GestureHandlerRootView style={styles.root}>
      <DomainProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </DomainProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
