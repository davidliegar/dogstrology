import Tabs from 'expo-router/tabs';

import { TabBar, type TabName } from '@/_ui/components/TabBar';
import { isHouseDay } from '@/content/ui/dailyCards';
import { usePets } from '@/pet/ui/petQueries';
import { PETS_TAB_LABEL } from '@/subscription/ui/labels';

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
 *
 * **La segunda pestaña cambia de rótulo con la segunda mascota**: de «Baloo» a
 * «Mascotas» (artboards 30, 31 y 32). Es la misma regla del título de Hoy
 * aplicada a la barra — con un perro el destino es ese perro; con dos, el
 * nombre de uno no puede rotular a todos. Y cambia de destino con él: el hub
 * pasa a ser la lista.
 */
export default function TabsLayout() {
  const { data: pets } = usePets();
  const petLabel = pets && isHouseDay(pets.length) ? PETS_TAB_LABEL : pets?.[0]?.name();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={({ state, navigation }) =>
        petLabel ? (
          <TabBar
            active={state.routes[state.index].name as TabName}
            onSelect={(tab) => navigation.navigate(tab)}
            petLabel={petLabel}
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
