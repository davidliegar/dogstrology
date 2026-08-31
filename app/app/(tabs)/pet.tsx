import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { text } from '@/_ui/typography';
import { isHouseDay } from '@/content/ui/dailyCards';
import { AddPetRow, PetRow } from '@/pet/ui/PetList';
import { PetHub } from '@/pet/ui/PetHub';
import { usePets, useSelectedPet } from '@/pet/ui/petQueries';
import { useSelectedPetStore } from '@/pet/ui/selectedPetStore';
import { ADD_PET_NOTE, PETS_TAB_LABEL } from '@/subscription/ui/labels';
import { useCanAddPet } from '@/subscription/ui/subscriptionQueries';

import { colors, screenPadding, spacing, typography } from '@/design/theme';

/**
 * La segunda pestaña, y **cambia de destino con la segunda mascota**.
 *
 * Con una es su hub (artboard 25): el destino *es* ese perro, así que la
 * pestaña se llama por su nombre y lleva directamente a él. Llamarla
 * «Mascotas» sería enfriar la pantalla más personal de la app por una lista de
 * uno.
 *
 * Con dos o más es la lista (artboard 32): el nombre de uno no puede rotular a
 * todos, y el hub pasa a ser el detalle de una — con cabecera de vuelta,
 * porque deja de ser un destino raíz.
 *
 * Es la misma regla que ya rige el título de Hoy —«El día de Baloo» → «El día
 * de la casa»— aplicada a la barra.
 */
export default function PetTab() {
  const { data: pets, isPending, isError } = usePets();
  const { data: pet } = useSelectedPet();
  const select = useSelectedPetStore((state) => state.select);
  const canAddPet = useCanAddPet();

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !pet || !pets) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo abrir su ficha</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve a Hoy y entra otra vez.</Text>
      </View>
    );
  }

  if (!isHouseDay(pets.length)) return <PetHub pet={pet} />;

  // **Entrar en una mascota la selecciona.** Con eso desaparece el cruce entre
  // entrar y elegir: el punto de oro es siempre estado y nunca un control, y
  // no hay dos maneras de decir lo mismo.
  const open = (id: string) => {
    select(id);
    router.push({ pathname: '/pet/[id]/hub', params: { id } });
  };

  return (
    <Screen
      insideTabs
      scroll
      align="flex-start"
      gap={spacing[3]}
      header={
        <ScreenHeader
          divided
          title={PETS_TAB_LABEL}
          accessory={<Text style={styles.count}>{pets.length}</Text>}
        />
      }
    >
      {pets.map((each) => (
        <PetRow
          key={each.id()}
          pet={each}
          selected={each.id() === pet.id()}
          onPress={() => open(each.id())}
        />
      ))}
      <AddPetRow
        note={canAddPet ? undefined : ADD_PET_NOTE}
        onPress={() => router.push(canAddPet ? '/onboarding/name' : '/paywall')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    gap: spacing[3],
  },
  errorTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  count: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
});
