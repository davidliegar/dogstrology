import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApproximateBadge } from '@/_ui/components/ApproximateBadge';
import { NavRow } from '@/_ui/components/NavRow';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { ChartTrio } from '@/chart/ui/ChartTrio';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { MISSING_DATUM_NOTES, SIGN_LABELS } from '@/chart/ui/labels';
import { ADD_PET_NOTE } from '@/subscription/ui/labels';
import { useCanAddPet } from '@/subscription/ui/subscriptionQueries';
import type { Pet } from '../domain/Pet';
import { breedLabel, formatLongDate } from './format';
import { PetIdentity } from './PetIdentity';
import { PetSelectorSheet } from './PetSelectorSheet';
import { usePets, usePetPhotoUri } from './petQueries';
import { useSelectedPetStore } from './selectedPetStore';

import { colors, spacing } from '@/design/theme';

export interface PetHubProps {
  pet: Pet;
  /**
   * Volver, cuando el hub **no** es un destino raíz: con varias mascotas la
   * pestaña lista (artboard 32) y esto pasa a ser el detalle de una, así que
   * necesita cómo salir. Con una sola mascota el hub *es* la pestaña y no lo
   * lleva — un destino raíz no tiene de dónde volver.
   */
  onBack?: () => void;
}

/**
 * El hub de la mascota — artboard 25.
 *
 * **No es un editor** —no hay "Guardar" ni un solo campo— sino las tres
 * preguntas que se le hacen a un perro: cómo es su cielo, qué dice de él y con
 * qué datos se calculó.
 *
 * **Sin cabecera propia cuando es la pestaña**: el retrato y el nombre son el
 * título, que es lo que un destino raíz puede permitirse y una pantalla
 * apilada no.
 *
 * Falta a propósito la fila de "Compartir su carta" que el artboard pinta al
 * pie: es F9 (Bloque 5) y todavía no hay a dónde llevarla. Misma decisión que
 * dejó fuera el botón de compartir de la hoja de planeta — antes un hueco que
 * un control que miente.
 *
 * **El nombre abre el selector** (artboard 26), y sigue haciéndolo aunque la
 * lista exista — con otro trabajo: **saltar entre perfiles sin volver a la
 * lista**. Elegir otro perro sustituye esta pantalla en vez de apilar otra,
 * así que el atrás sigue devolviendo a la lista y no a una cadena de hubs.
 */
export function PetHub({ pet, onBack }: PetHubProps) {
  const { data: pets } = usePets();
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);
  const select = useSelectedPetStore((state) => state.select);
  const canAddPet = useCanAddPet();

  // Con varias mascotas el hub cuelga de la lista y saltar a otro perro es
  // sustituir esta pantalla. Con una sola no hay a dónde saltar —la hoja
  // enseña ese perro y la fila de añadir— y basta con dejarla marcada.
  const pickPet = (picked: string) => {
    if (onBack) router.replace({ pathname: '/pet/[id]/hub', params: { id: picked } });
    else select(picked);
  };
  const [selectorOpen, setSelectorOpen] = useState(false);

  const id = pet.id();
  const birth = pet.birth();
  const place = birth.placeName();
  // La nota de "Sus datos" es la fecha y, si lo hay, el lugar. Sin lugar se
  // queda en la fecha en vez de escribir "sin lugar": lo que falta ya lo dice
  // la insignia de debajo, y decirlo dos veces en la misma fila es regañar.
  const dataNote = [formatLongDate(birth.date()), place].filter(Boolean).join(' · ');
  const missing = chart ? MISSING_DATUM_NOTES[chart.confidence()] : undefined;

  // "Perro de agua español en Sagitario" — la raza y su Sol, que es de lo que
  // habla la pantalla de personalidad. Sin raza se queda el Sol solo, porque
  // el catálogo tiene los 32 fragmentos de `personality` sí o sí.
  const breed = breedLabel(pet.breedId());
  const sunSign = chart ? SIGN_LABELS[chart.sunSign()] : undefined;
  const identityNote = sunSign && (breed ? `${breed} en ${sunSign}` : `Su Sol en ${sunSign}`);

  return (
    <>
      <Screen
        insideTabs={!onBack}
        scroll
        align="flex-start"
        gap={spacing[5]}
        header={onBack ? <ScreenHeader title={pet.name()} onBack={onBack} /> : undefined}
      >
        {/* El retrato lleva a "Sus datos", que es donde se pone la foto. No es
            un cuarto destino que se cuele en la pantalla: es que **ahí es donde
            la gente toca**, instintivamente, y sin foto el hueco con su aspa es
            la invitación más clara que tiene el hub. */}
        <PetIdentity
          pet={pet}
          photoUri={photoUri ?? undefined}
          size="hero"
          pressLabel="Sus datos, donde se pone su foto"
          onPressAvatar={() => router.push({ pathname: '/pet/[id]', params: { id } })}
          onPressName={() => setSelectorOpen(true)}
        />

        {chart ? <ChartTrio chart={chart} /> : null}

        <View>
          <NavRow
            label="Su carta natal"
            note="La rueda entera, planeta a planeta"
            onPress={() => router.push({ pathname: '/pet/[id]/chart', params: { id } })}
          />
          <View style={styles.divider} />
          <NavRow
            label="Quién es"
            note={identityNote || undefined}
            onPress={() => router.push({ pathname: '/pet/[id]/personality', params: { id } })}
          />
          <View style={styles.divider} />
          <NavRow
            label="Sus datos"
            note={dataNote}
            // C.2b en su medida corta. Va **en esta fila y no en la tarjeta del
            // trío** porque esta es la que lleva al sitio donde se arregla: la
            // tarjeta ya dice qué falta con su trazo discontinuo.
            badge={missing ? <ApproximateBadge>{missing}</ApproximateBadge> : null}
            onPress={() => router.push({ pathname: '/pet/[id]', params: { id } })}
          />
        </View>
      </Screen>

      {/* Fuera del `Screen`, como la hoja de planeta: el velo tiene que tapar
          la pantalla entera, y dentro del cuerpo con scroll no la alcanzaría. */}
      {selectorOpen && pets ? (
        <PetSelectorSheet
          pets={pets}
          selectedId={id}
          onSelect={pickPet}
          // Sin plan, la fila de añadir lleva al 11 **sin candado**: es la
          // puerta caliente de las dos que tiene el paywall. Con el plan
          // activo pierde el subtítulo y lleva al alta (artboard 30) — que
          // hoy es el flujo de F1, el único que crea una mascota.
          addNote={canAddPet ? undefined : ADD_PET_NOTE}
          onAdd={() => {
            setSelectorOpen(false);
            router.push(canAddPet ? '/onboarding/name' : '/paywall');
          }}
          onClose={() => setSelectorOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
