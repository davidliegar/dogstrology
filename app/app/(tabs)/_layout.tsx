import Tabs from 'expo-router/tabs';

import { TabBar, type TabName } from '@/_ui/components/TabBar';
import { usePets } from '@/pet/ui/petQueries';

import { colors } from '@/design/theme';

/**
 * El armazón de la app: los cuatro destinos raíz del canvas y la barra que los
 * enseña. Todo lo demás —la carta, la Luna, una ficha de signo, los editores
 * del perfil— se apila **encima** de este grupo, y por eso tapa la barra: es
 * lo que dicen los artboards, donde solo 04, 08, 10, 15 y 17 la llevan.
 *
 * **Sin mascota no hay barra** (artboard 16). No es un caso raro que se nos
 * escape: es que sin mascota la app no tiene todavía armazón que enseñar, y
 * Hoy se convierte entero en la invitación a crear una. El reparto de
 * `index.tsx` manda al onboarding en el primer arranque, así que aquí se llega
 * borrando la única que había.
 */
export default function TabsLayout() {
  const { data: pets } = usePets();
  const pet = pets?.[0];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={({ state, navigation }) =>
        pet ? (
          <TabBar
            active={state.routes[state.index].name as TabName}
            onSelect={(tab) => navigation.navigate(tab)}
            petName={pet.name()}
          />
        ) : null
      }
    >
      {/* El orden importa: es el de la barra, y el de la pestaña que abre la
          app. `Tabs` los ordena por el nombre del fichero si no se declaran. */}
      <Tabs.Screen name="today" />
      <Tabs.Screen name="pet" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
